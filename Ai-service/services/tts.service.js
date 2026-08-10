import "dotenv/config";

async function speak(text) {
    const res = await fetch("https://users.rime.ai/v1/rime-tts", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RIME_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
        },
        body: JSON.stringify({
            speaker: "lyra",
            text,
            modelId: "coda",
            language: "en",
        }),
    });

    if (!res.ok) {
        const error = await res.text();

        throw new Error(
            `Rime TTS failed (${res.status}): ${error}`
        );
    }

    const audioBuffer = await res.arrayBuffer();

    return Buffer.from(audioBuffer).toString("base64");
}

export { speak };