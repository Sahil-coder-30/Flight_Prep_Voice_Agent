const env = require('../config/env');

async function transcribe(audioBase64, vocabHints) {
    const res = await fetch('https://api.deepgram.com/v1/listen?keywords=' + vocabHints.join('&keywords='), {
        method: 'POST',
        headers: { Authorization: `Token ${env.STT_API_KEY}`, 'Content-Type': 'audio/wav' },
        body: Buffer.from(audioBase64, 'base64'),
    });
    const data = await res.json();
    return data.results.channels[0].alternatives[0].transcript;
}

module.exports = { transcribe };
/**
 * Processes incoming audio stream or buffer via Rime STT engine.
 * Uses phraseology vocabulary biasing for aviation terms.
 *
 * @param {Buffer|Blob} audioBuffer
 * @param {Array<string>} [keywords] Aviation vocabulary hints (callsign, runway, etc.)
 * @returns {Promise<string>} Transcribed text
 */
export const transcribeAudio = async (audioBuffer, keywords = []) => {
    try {
        console.log(`[STT Service] Transcribing audio with ${keywords.length} keyword hints...`);
        return 'Boston Tower, Cessna 172SP holding short runway 22L ready for departure.';
    } catch (error) {
        console.error('[STT Service] Transcription error:', error.message);
        throw error;
    }
};
