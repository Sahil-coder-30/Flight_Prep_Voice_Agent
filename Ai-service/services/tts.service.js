/**
 * Convert controller line text to base64-encoded audio via Rime TTS or Google Translate TTS fallback.
 *
 * @param {string} text — The controller line to speak
 * @returns {Promise<{ audioBase64: string, cacheHit: boolean }>}
 */
export async function speak(text) {
    if (!text || !text.trim()) {
        return { audioBase64: null, cacheHit: false };
    }

    const cleanedText = text.trim();
    const rimeApiKey = process.env.RIME_API_KEY;

    // 1. Try Primary Rime TTS API with 8s timeout
    if (rimeApiKey) {
        try {
            const res = await fetch('https://users.rime.ai/v1/rime-tts', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${rimeApiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'audio/mpeg',
                },
                body: JSON.stringify({
                    speaker: 'grove',       // Male ATC voice — authoritative cadence
                    text: cleanedText,
                    modelId: 'mist',        // High-speed model
                    language: 'en',
                    speedAlpha: 1.0,        // ATC cadence
                }),
                signal: AbortSignal.timeout(8000), // 8s robust timeout
            });

            if (res.ok) {
                const audioBuffer = await res.arrayBuffer();
                const audioBase64 = Buffer.from(audioBuffer).toString('base64');
                console.log(`[tts.service] Rime TTS synthesized ${audioBuffer.byteLength} bytes`);
                return { audioBase64, cacheHit: false };
            } else {
                const error = await res.text();
                console.warn(`[tts.service] Rime TTS warning (${res.status}): ${error}`);
            }
        } catch (err) {
            console.warn('[tts.service] Rime TTS fetch error:', err.message);
        }
    }

    // 2. Secondary Fallback: Free Google Translate TTS API for clear audio Base64
    try {
        const encodedText = encodeURIComponent(cleanedText);
        const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;
        
        const gRes = await fetch(gttsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            },
            signal: AbortSignal.timeout(6000),
        });

        if (gRes.ok) {
            const buffer = await gRes.arrayBuffer();
            const audioBase64 = Buffer.from(buffer).toString('base64');
            console.log(`[tts.service] Fallback Google TTS synthesized ${buffer.byteLength} bytes`);
            return { audioBase64, cacheHit: false };
        }
    } catch (gErr) {
        console.warn('[tts.service] Fallback Google TTS error:', gErr.message);
    }

    return { audioBase64: null, cacheHit: false };
}

export function isCacheable() {
    return false;
}