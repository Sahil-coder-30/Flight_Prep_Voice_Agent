const env = require('../config/env');

async function composeLine({ grounding, slots, instruction }) {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [
                { role: 'system', content: 'You are an air traffic controller. Use ONLY the grounding text provided for phraseology. Do not invent procedures.' },
                { role: 'user', content: `Grounding:\n${grounding.join('\n')}\n\nSlots: ${JSON.stringify(slots)}\n\nTask: ${instruction}` },
            ],
            temperature: 0.2,
        }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

async function extractReadback(transcript, expectedShape) {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'mistral-large-latest',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: `Extract fields ${JSON.stringify(expectedShape)} from the pilot transcript. Return ONLY JSON matching those keys, null if absent.` },
                { role: 'user', content: transcript },
            ],
            temperature: 0,
        }),
    });
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
}

module.exports = { composeLine, extractReadback };