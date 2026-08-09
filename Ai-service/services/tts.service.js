const env = require('../config/env');

async function speak(text) {
    const res = await fetch('https://users.rime.ai/v1/rime-tts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RIME_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker: 'atc-voice' }),
    });
    const audioBuffer = await res.arrayBuffer();
    return Buffer.from(audioBuffer).toString('base64');
}

module.exports = { speak };