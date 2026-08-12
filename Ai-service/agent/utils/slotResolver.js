import { getRedisClient } from '../../config/redis.js';

// ── Dynamic Value Generators ───────────────────────────────────────────────────

const DYNAMIC_GENERATORS = {
    wind_dir:   () => String(Math.round((Math.random() * 36)) * 10).padStart(3, '0'),
    wind_speed: () => String(Math.floor(Math.random() * 20) + 3),
    altimeter:  () => (29.70 + Math.random() * 0.60).toFixed(2),
    squawk:     () => String(Math.floor(1000 + Math.random() * 6999)).padStart(4, '0'),
    frequency:  () => (118.0 + Math.random() * 18.0).toFixed(1),
    atis:       () => String.fromCharCode(65 + Math.floor(Math.random() * 26)), // A-Z
};

// ── Session Slot Cache ─────────────────────────────────────────────────────────

/**
 * Generate and cache all dynamic slot values for a session.
 * Called once when the session is created; values persist in Redis for 24h.
 *
 * @param {string} sessionId
 * @param {Array}  steps        — Scenario step array (each with step.slots[])
 * @returns {Promise<Object>}   — { wind_dir: '270', squawk: '4521', ... }
 */
export async function generateAndCacheSessionSlots(sessionId, steps) {
    const redis = getRedisClient();
    const cacheKey = `sess:slots:${sessionId}`;

    // Check if already generated (idempotent)
    const existing = await redis.get(cacheKey);
    if (existing) return JSON.parse(existing);

    const dynamicValues = {};
    for (const step of steps) {
        for (const slot of (step.slots || [])) {
            if (slot.source === 'dynamic' && slot.dynamicType && !dynamicValues[slot.dynamicType]) {
                const generator = DYNAMIC_GENERATORS[slot.dynamicType];
                if (generator) dynamicValues[slot.dynamicType] = generator();
            }
        }
    }

    await redis.setex(cacheKey, 60 * 60 * 24, JSON.stringify(dynamicValues)); // 24h TTL
    return dynamicValues;
}

// ── Slot Resolution ────────────────────────────────────────────────────────────

/**
 * Build the fully-resolved slot map for a single step.
 * Merges: static (from scenario) + dynamic (from Redis session cache) + session (callsign etc.)
 *
 * @param {Object} step          — Scenario step object (with step.slots[])
 * @param {string} sessionId     — For Redis lookup
 * @param {Object} scenarioMeta  — { aircraftCallsign, airport }
 * @returns {Promise<Object>}    — { callsign: 'N172SP', runway: '22L', windDir: '270', ... }
 */
export async function resolveSlots(step, sessionId, scenarioMeta = {}) {
    const redis = getRedisClient();

    // Load dynamic values generated at session creation
    const sessionSlotsRaw = await redis.get(`sess:slots:${sessionId}`);
    const sessionDynamic = sessionSlotsRaw ? JSON.parse(sessionSlotsRaw) : {};

    const resolved = {};

    for (const slot of (step.slots || [])) {
        const { key, source, staticValue, dynamicType } = slot;
        if (source === 'static') {
            resolved[key] = staticValue ?? null;
        } else if (source === 'dynamic') {
            resolved[key] = sessionDynamic[dynamicType] ?? null;
        } else if (source === 'session') {
            // 'session' source: pull from scenario meta
            if (key === 'callsign') resolved[key] = scenarioMeta.aircraftCallsign ?? null;
            if (key === 'airport')  resolved[key] = scenarioMeta.airport ?? null;
        }
    }

    return resolved;
}

// ── Template Rendering ─────────────────────────────────────────────────────────

/**
 * Render a controller line template with resolved slot values.
 * Replaces {slotKey} placeholders.
 *
 * @param {string} template       — e.g. "{callsign}, runway {runway}, cleared for takeoff."
 * @param {Object} resolvedSlots  — { callsign: 'N172SP', runway: '22L' }
 * @returns {{ line: string, allResolved: boolean, unresolvedKeys: string[] }}
 */
export function renderTemplate(template, resolvedSlots) {
    const unresolvedKeys = [];

    const line = template.replace(/{(\w+)}/g, (_, key) => {
        if (resolvedSlots[key] != null) return resolvedSlots[key];
        unresolvedKeys.push(key);
        return `[${key}]`; // visible placeholder so TTS skips gracefully
    });

    return { line, allResolved: unresolvedKeys.length === 0, unresolvedKeys };
}
