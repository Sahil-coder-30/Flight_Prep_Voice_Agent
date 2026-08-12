import crypto from 'crypto';
import { getRedisClient } from '../config/redis.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function hashText(text) {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

// ── speak ──────────────────────────────────────────────────────────────────────

/**
 * Convert controller line text to base64-encoded audio via Rime TTS.
 * Uses Redis L7 audio cache — cached lines return in ~5ms.
 *
 * Only cacheable if the text contains NO dynamic slot values (wind, altimeter, squawk).
 * Callers pass `cacheable: false` for dynamic lines.
 *
 * @param {string}  text        — The controller line to speak
 * @param {boolean} [cacheable] — Whether this line can be cached (default: true)
 * @returns {Promise<{ audioBase64: string, cacheHit: boolean }>}
 */
export async function speak(text, cacheable = true) {
    const redis = getRedisClient();
    const cacheKey = `tts:${hashText(text)}`;

    // L7 Cache check
    if (cacheable) {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[TTS] Cache hit for: "${text.slice(0, 40)}..."`);
            return { audioBase64: cached, cacheHit: true };
        }
    }

    const res = await fetch('https://users.rime.ai/v1/rime-tts', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RIME_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
            speaker: 'grove',       // Male ATC voice — authoritative cadence
            text,
            modelId: 'mist',        // Faster model vs 'coda'
            language: 'en',
            speedAlpha: 0.9,        // Slightly faster than default (ATC cadence)
        }),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`Rime TTS failed (${res.status}): ${error}`);
    }

    const audioBuffer = await res.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // L7 Cache store — 7 day TTL for static lines
    if (cacheable) {
        await redis.setex(cacheKey, 60 * 60 * 24 * 7, audioBase64);
    }

    return { audioBase64, cacheHit: false };
}

/**
 * Determines if a controller line contains dynamic slot values that change per session.
 * Dynamic lines (with wind/altimeter/squawk) should NOT be cached.
 *
 * @param {Object} resolvedSlots — The slots used to render this line
 * @returns {boolean}
 */
export function isCacheable(resolvedSlots = {}) {
    const dynamicKeys = ['windDir', 'windSpeed', 'altimeter', 'squawk', 'frequency'];
    return !dynamicKeys.some((k) => resolvedSlots[k] !== undefined);
}