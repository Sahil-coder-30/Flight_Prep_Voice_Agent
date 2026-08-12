/**
 * STT Service — Deepgram REST transcription with aviation vocabulary biasing.
 *
 * Nova-3 API notes:
 *   - `keywords` query param was removed — use `keyterm` instead
 *   - keyterm format: keyterm=<word> (no weight suffix)
 *   - Content-Type should be omitted to let Deepgram auto-detect audio format
 */

/**
 * Transcribe a base64-encoded audio buffer using Deepgram Nova-3.
 *
 * @param {string}   audioBase64  — Base64-encoded audio (webm, wav, ogg, mp4)
 * @param {string[]} [vocabHints] — Aviation vocabulary hints for keyterm boosting
 * @returns {Promise<string>}     — Transcribed text
 */
export async function transcribe(audioBase64, vocabHints = []) {
    const apiKey = process.env.STT_API_KEY || process.env.DEEPGRAM_API_KEY;
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Build base params — no keyterm to keep it clean and compatible
    const baseParams = new URLSearchParams({
        model: 'nova-3',
        language: 'en-US',
        smart_format: 'true',
        filler_words: 'false',
        punctuate: 'true',
    });

    // Only add keyterms if we have them — each as a separate param entry
    if (vocabHints && vocabHints.length > 0) {
        vocabHints.forEach((hint) => {
            if (hint && hint.trim()) {
                baseParams.append('keyterm', hint.trim());
            }
        });
    }

    const url = `https://api.deepgram.com/v1/listen?${baseParams.toString()}`;

    console.log(`[STT] Transcribing ${(audioBuffer.length / 1024).toFixed(1)}KB audio via Deepgram Nova-3`);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Token ${apiKey}`,
            // Omit Content-Type: Deepgram auto-detects audio/webm, audio/wav, audio/ogg etc.
        },
        body: audioBuffer,
    });

    if (!res.ok) {
        const errText = await res.text();
        // If keyterms caused a 400, retry without any keyterms
        if (res.status === 400 && vocabHints.length > 0) {
            console.warn('[STT] Keyterm param caused 400 — retrying without keytherms');
            return transcribe(audioBase64, []); // Retry without hints
        }
        throw new Error(`Deepgram STT failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript || transcript.trim() === '') {
        throw new Error('Deepgram returned empty transcript — check audio quality or duration');
    }

    console.log(`[STT] Transcribed: "${transcript}"`);
    return transcript;
}

/**
 * Build aviation vocabulary hints from resolved session slots.
 * Used to guide Deepgram keyterm boosting for pilot callsigns, runways etc.
 *
 * @param {Object} resolvedSlots — { callsign, runway, frequency, squawk, waypoint }
 * @returns {string[]}
 */
export function buildVocabHints(resolvedSlots = {}) {
    const hints = [];
    const { callsign, runway, frequency, squawk, waypoint, fix } = resolvedSlots;

    if (callsign) hints.push(callsign);
    if (runway)   hints.push(`runway ${runway}`);
    if (frequency) hints.push(frequency);
    if (squawk)   hints.push(squawk);
    if (waypoint) hints.push(waypoint);
    if (fix)      hints.push(fix);

    // Always boost common ATC phraseology terms
    hints.push('roger', 'wilco', 'cleared', 'contact', 'squawk', 'ident', 'affirmative', 'negative');

    return hints;
}
