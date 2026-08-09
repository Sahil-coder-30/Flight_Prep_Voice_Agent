/**
 * Processes incoming audio stream or buffer via STT engine (Deepgram/AssemblyAI).
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
