import "dotenv/config";

import {
    scheduleMistralRequest,
} from "./mistralRateLimiter.js";

const MISTRAL_URL =
    "https://api.mistral.ai/v1/chat/completions";

const MISTRAL_MODEL =
    "mistral-large-latest";

const MISTRAL_TIMEOUT_MS = 35000;

const MAX_RETRIES = 2;

function sleep(ms) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
}

function isRetryableStatus(status) {
    return [
        429,
        500,
        502,
        503,
        504,
    ].includes(status);
}

function getRetryDelay(response, attempt) {
    const retryAfter =
        response.headers.get("retry-after");

    if (retryAfter) {
        const seconds =
            Number(retryAfter);

        if (Number.isFinite(seconds)) {
            return Math.max(
                seconds * 1000,
                1000
            );
        }
    }

    return Math.min(
        1000 * 2 ** attempt,
        5000
    );
}

async function callMistral(body) {
    return scheduleMistralRequest(
        async () => {
            let lastError;

            for (
                let attempt = 0;
                attempt <= MAX_RETRIES;
                attempt++
            ) {
                const startedAt =
                    Date.now();

                console.log(
                    `[Mistral] Runtime request started at ${startedAt}` +
                    ` (attempt ${attempt + 1}/${MAX_RETRIES + 1})`
                );

                try {
                    const response =
                        await fetch(
                            MISTRAL_URL,
                            {
                                method: "POST",

                                headers: {
                                    Authorization:
                                        `Bearer ${process.env.MISTRAL_API_KEY}`,

                                    "Content-Type":
                                        "application/json",
                                },

                                body:
                                    JSON.stringify(body),

                                signal:
                                    AbortSignal.timeout(
                                        MISTRAL_TIMEOUT_MS
                                    ),
                            }
                        );

                    const elapsed =
                        Date.now() - startedAt;

                    console.log(
                        `[Mistral] Runtime request completed in ${elapsed}ms`
                    );

                    if (response.ok) {
                        return response.json();
                    }

                    const errorBody =
                        await response.text();

                    if (
                        !isRetryableStatus(
                            response.status
                        ) ||
                        attempt >= MAX_RETRIES
                    ) {
                        const error =
                            new Error(
                                `Mistral request failed (${response.status}): ${errorBody}`
                            );

                        error.status =
                            response.status;

                        error.provider =
                            "Mistral";

                        error.stage =
                            "chat-completion";

                        error.providerBody =
                            errorBody;

                        throw error;
                    }

                    const delay =
                        getRetryDelay(
                            response,
                            attempt
                        );

                    console.warn(
                        `[Mistral] Request failed with ` +
                        `${response.status}. ` +
                        `Retrying in ${delay}ms...`
                    );

                    await sleep(delay);
                } catch (error) {
                    lastError = error;

                    if (
                        error?.name ===
                        "TimeoutError"
                    ) {
                        console.warn(
                            `[Mistral] Request timed out after ` +
                            `${MISTRAL_TIMEOUT_MS}ms`
                        );
                    }

                    if (
                        attempt >= MAX_RETRIES
                    ) {
                        throw error;
                    }

                    if (
                        error?.status &&
                        !isRetryableStatus(
                            error.status
                        )
                    ) {
                        throw error;
                    }

                    const delay =
                        Math.min(
                            1000 *
                            2 ** attempt,
                            5000
                        );

                    console.warn(
                        `[Mistral] Retrying request in ${delay}ms...`
                    );

                    await sleep(delay);
                }
            }

            throw lastError;
        }
    );
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
                if (
                    typeof item ===
                    "string"
                ) {
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
        const err =
            new Error(
                "Mistral extractReadback returned invalid JSON"
            );

        err.cause = error;

        err.providerBody =
            content;

        throw err;
    }
}

export {
    composeLine,
    extractReadback,
};