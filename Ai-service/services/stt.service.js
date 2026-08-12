/**
 * STT Service — Deepgram REST transcription with aviation vocabulary biasing.
 *
 * Phase 1: Batch REST upload (send full buffer after recording stops)
 * Phase 4: Upgrade to Deepgram Live WebSocket streaming
 */

/**
 * Transcribe a base64-encoded WAV audio buffer using Deepgram Nova-3.
 * Aviation terms are boosted using keyword biasing (5x weight).
 *
 * @param {string}   audioBase64  — Base64-encoded WAV audio
 * @param {string[]} [vocabHints] — Aviation vocabulary hints (callsigns, runways, etc.)
 * @returns {Promise<string>}     — Transcribed text
 */
export async function transcribe(audioBase64, vocabHints = []) {
    // Build keyword boost query param — aviation terms get 5x weight
    const keywordParams = vocabHints
        .map((w) => `keywords=${encodeURIComponent(w)}:5`)
        .join('&');

    const url = `https://api.deepgram.com/v1/listen?model=nova-3&language=en-US&smart_format=true&filler_words=false${keywordParams ? '&' + keywordParams : ''}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Token ${process.env.STT_API_KEY || process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': 'audio/wav',
        },
        body: Buffer.from(audioBase64, 'base64'),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Deepgram STT failed (${res.status}): ${err}`);
    }

    const data = await res.json();

    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) throw new Error('Deepgram returned empty transcript');

    console.log(`[STT] Transcribed: "${transcript}"`);
    return transcript;
}

/**
 * Build vocabulary hints from a scenario step for Deepgram keyword biasing.
 * Extracts callsigns, runways, headings, frequencies from resolved slots.
 *
 * @param {Object} resolvedSlots — { callsign: 'N172SP', runway: '22L', ... }
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

    // Always boost common ATC terms
    hints.push('roger', 'wilco', 'affirmative', 'negative', 'cleared', 'contact', 'squawk', 'ident');

    return hints;
}
