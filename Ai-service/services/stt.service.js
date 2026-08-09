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