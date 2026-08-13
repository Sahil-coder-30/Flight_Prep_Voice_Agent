import { getRedisClient } from '../../config/redis.js';

// ── Dynamic Value Generators ───────────────────────────────────────────────────

const DYNAMIC_GENERATORS = {
    wind_dir:   () => String(Math.round((Math.random() * 36)) * 10).padStart(3, '0'),
    windDir:    () => String(Math.round((Math.random() * 36)) * 10).padStart(3, '0'),
    wind_speed: () => String(Math.floor(Math.random() * 20) + 3),
    windSpeed:  () => String(Math.floor(Math.random() * 20) + 3),
    altimeter:  () => (29.70 + Math.random() * 0.60).toFixed(2),
    squawk:     () => String(Math.floor(1000 + Math.random() * 6999)).padStart(4, '0'),
    frequency:  () => (118.0 + Math.random() * 18.0).toFixed(1),
    atis:       () => String.fromCharCode(65 + Math.floor(Math.random() * 26)), // A-Z
    runway:     () => '22L',
    callsign:   () => 'N172SP',
};

// ── Session Slot Cache ─────────────────────────────────────────────────────────

export async function generateAndCacheSessionSlots(sessionId, steps) {
    const redis = getRedisClient();
    const cacheKey = `sess:slots:${sessionId}`;

    const existing = await redis.get(cacheKey);
    if (existing) return JSON.parse(existing);

    const dynamicValues = {};
    for (const step of (steps || [])) {
        for (const slot of (step.slots || [])) {
            const key = slot.dynamicType || slot.key;
            if ((slot.source === 'dynamic' || !slot.staticValue) && key && !dynamicValues[key]) {
                const generator = DYNAMIC_GENERATORS[key] || DYNAMIC_GENERATORS[slot.key];
                if (generator) dynamicValues[key] = generator();
            }
        }
    }

    await redis.setex(cacheKey, 60 * 60 * 24, JSON.stringify(dynamicValues)); // 24h TTL
    return dynamicValues;
}

// ── Slot Resolution ────────────────────────────────────────────────────────────

export async function resolveSlots(step, sessionId, scenarioMeta = {}) {
    const redis = getRedisClient();

    const sessionSlotsRaw = await redis.get(`sess:slots:${sessionId}`);
    const sessionDynamic = sessionSlotsRaw ? JSON.parse(sessionSlotsRaw) : {};

    const resolved = {};

    for (const slot of (step.slots || [])) {
        const { key, source, staticValue, dynamicType } = slot;
        const lookupKey = dynamicType || key;

        if (source === 'static' && staticValue != null) {
            resolved[key] = staticValue;
        } else if (source === 'dynamic' && sessionDynamic[lookupKey] != null) {
            resolved[key] = sessionDynamic[lookupKey];
        } else if (source === 'session') {
            if (key === 'callsign') resolved[key] = scenarioMeta.aircraftCallsign ?? 'N172SP';
            if (key === 'airport')  resolved[key] = scenarioMeta.airport ?? 'KBOS';
        } else {
            // Auto-fallback generation for unmapped slots
            const generator = DYNAMIC_GENERATORS[lookupKey] || DYNAMIC_GENERATORS[key];
            if (generator) {
                resolved[key] = generator();
            } else if (staticValue != null) {
                resolved[key] = staticValue;
            }
        }
    }

    // Always ensure callsign and airport are present
    if (!resolved.callsign) resolved.callsign = scenarioMeta.aircraftCallsign || 'N172SP';
    if (!resolved.airport)  resolved.airport  = scenarioMeta.airport || 'KBOS';

    return resolved;
}

// ── Template Rendering ─────────────────────────────────────────────────────────

export function renderTemplate(template, resolvedSlots) {
    const unresolvedKeys = [];

    const line = template.replace(/{(\w+)}/g, (_, key) => {
        if (resolvedSlots[key] != null) return resolvedSlots[key];
        unresolvedKeys.push(key);
        return `[${key}]`;
    });

    return { line, allResolved: unresolvedKeys.length === 0, unresolvedKeys };
}
