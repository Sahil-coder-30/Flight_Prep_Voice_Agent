/**
 * Convert controller line text to base64-encoded audio via Rime TTS.
 * Direct synthesis on every request — no audio caching.
 *
 * @param {string} text — The controller line to speak
 * @returns {Promise<{ audioBase64: string, cacheHit: boolean }>}
 */
export async function speak(text) {
    if (!text || !text.trim()) {
        return { audioBase64: null, cacheHit: false };
    }

    try {
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
                speedAlpha: 1.0,        // ATC cadence
            }),
            signal: AbortSignal.timeout(1200),
        });

        if (!res.ok) {
            const error = await res.text();
            console.warn(`[tts.service] Rime TTS warning (${res.status}): ${error}`);
            return { audioBase64: null, cacheHit: false };
        }

        const audioBuffer = await res.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        return { audioBase64, cacheHit: false };
    } catch (err) {
        console.warn('[tts.service] Rime TTS fetch warning:', err.message);
        return { audioBase64: null, cacheHit: false };
    }
}

export function isCacheable() {
    return false;
}