import "dotenv/config";

const MISTRAL_URL =
    "https://api.mistral.ai/v1/chat/completions";

const MISTRAL_MODEL =
    "mistral-large-latest";

async function callMistral(body) {
    const startedAt = Date.now();

    console.log(
        `[Mistral] Runtime request started at ${startedAt}`
    );

    const res = await fetch(
        MISTRAL_URL,
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${process.env.MISTRAL_API_KEY}`,

                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify(body),

            signal: AbortSignal.timeout(20000),
        }
    );

    const elapsed =
        Date.now() - startedAt;

    console.log(
        `[Mistral] Runtime request completed in ${elapsed}ms`
    );

    if (!res.ok) {
        const error =
            await res.text();

        const err = new Error(
            `Mistral request failed (${res.status}): ${error}`
        );

        err.status = res.status;

        throw err;
    }

    return res.json();
}

async function composeLine({
    grounding,
    slots,
    instruction,
}) {
    if (!grounding?.length) {
        throw new Error(
            "No grounding available for Mistral composition"
        );
    }

    const groundingText =
        grounding
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                return item?.text ?? "";
            })
            .filter(Boolean)
            .join("\n");

    if (!groundingText.trim()) {
        throw new Error(
            "Grounding contains no usable text"
        );
    }

    const data =
        await callMistral({
            model:
                MISTRAL_MODEL,

            messages: [
                {
                    role: "system",

                    content:
                        `You are an air traffic controller conducting a realistic pilot-ATC training session.

Use the provided ATC grounding as the authoritative source for phraseology and procedure.

Use the provided scenario slots to fill in the aircraft-specific details.

Do not invent ATC procedures, clearances, frequencies, runways, altitudes, routes, squawk codes, or other operational facts that are not supported by the grounding or scenario slots.

Return ONLY the controller's radio transmission.

Keep it concise and realistic. Do not explain what you are doing. Do not use quotation marks.`,
                },

                {
                    role: "user",

                    content:
                        `ATC grounding:
${groundingText}

Scenario slots:
${JSON.stringify(slots ?? {})}

Task:
${instruction}`,
                },
            ],

            temperature: 0.2,

            max_tokens: 120,
        });

    const line =
        data
            ?.choices?.[0]
            ?.message
            ?.content
            ?.trim();

    if (!line) {
        throw new Error(
            "Mistral composeLine returned empty content"
        );
    }

    return line;
}

async function extractReadback(
    transcript,
    expectedShape
) {
    const data =
        await callMistral({
            model:
                MISTRAL_MODEL,

            response_format: {
                type: "json_object",
            },

            messages: [
                {
                    role: "system",

                    content:
                        `Extract the requested fields from the pilot transcript.

Return ONLY valid JSON matching exactly these keys:
${JSON.stringify(expectedShape)}

Use null when a field is not present or cannot be determined.

Do not infer information that the pilot did not communicate.`,
                },

                {
                    role: "user",

                    content:
                        transcript,
                },
            ],

            temperature: 0,

            max_tokens: 120,
        });

    const content =
        data
            ?.choices?.[0]
            ?.message
            ?.content;

    if (!content) {
        throw new Error(
            "Mistral extractReadback returned empty content"
        );
    }

    try {
        return JSON.parse(content);
    } catch (error) {
        const err = new Error(
            "Mistral extractReadback returned invalid JSON"
        );

        err.cause = error;
        err.providerBody = content;

        throw err;
    }
}

export {
    composeLine,
    extractReadback,
};