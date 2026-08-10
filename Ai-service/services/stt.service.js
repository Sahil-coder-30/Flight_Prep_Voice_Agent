import "dotenv/config";
import WebSocket from "ws";

/**
 * Batch STT
 * Used for already-recorded audio.
 */
async function transcribe(audioBase64, vocabHints = []) {
    const params = new URLSearchParams();

    for (const word of vocabHints) {
        params.append("keywords", word);
    }

    const query = params.toString();

    const url = `https://api.deepgram.com/v1/listen${query ? `?${query}` : ""
        }`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Token ${process.env.STT_API_KEY}`,
            "Content-Type": "audio/wav",
        },
        body: Buffer.from(audioBase64, "base64"),
    });

    if (!res.ok) {
        const error = await res.text();

        throw new Error(
            `Deepgram STT failed (${res.status}): ${error}`
        );
    }

    const data = await res.json();

    return data.results.channels[0].alternatives[0].transcript;
}


/**
 * Streaming STT
 *
 * Opens a persistent WebSocket connection with Deepgram.
 *
 * Audio chunks are sent using:
 *
 *     transcriber.sendAudio(chunk)
 *
 * Deepgram sends transcript events through:
 *
 *     onTranscript(...)
 */
function createStreamingTranscriber({
    vocabHints = [],
    onTranscript,
    onError,
    onClose,
}) {
    const params = new URLSearchParams({
        model: "nova-3",
        language: "en-US",

        // Incoming audio format
        encoding: "linear16",
        sample_rate: "16000",
        channels: "1",

        // Transcript behaviour
        smart_format: "true",
        interim_results: "true",
        endpointing: "300",
    });

    /*
     * Nova-3 uses `keyterm`, not `keywords`.
     *
     * Example:
     *
     * keyterm=taxi
     * keyterm=runway
     * keyterm=Alpha
     */
    for (const word of vocabHints) {
        params.append("keyterm", word);
    }

    const url =
        `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    console.log("Deepgram URL:");
    console.log(url);

    const ws = new WebSocket(url, {
        headers: {
            Authorization: `Token ${process.env.STT_API_KEY}`,
        },
    });


    /*
     * ----------------------------------------
     * CONNECTION OPENED
     * ----------------------------------------
     */
    ws.on("open", () => {
        console.log("Deepgram streaming connection opened");
    });


    /*
     * ----------------------------------------
     * HANDSHAKE ERROR
     * ----------------------------------------
     *
     * This is useful while developing because
     * Deepgram sends the actual reason for a
     * rejected WebSocket connection here.
     */
    ws.on("unexpected-response", (request, response) => {
        console.error(
            "\n========== DEEPGRAM HANDSHAKE ERROR =========="
        );

        console.error("Status:", response.statusCode);
        console.error("Status message:", response.statusMessage);

        console.error(
            "dg-error:",
            response.headers["dg-error"] || "not provided"
        );

        console.error(
            "dg-request-id:",
            response.headers["dg-request-id"] || "not provided"
        );

        let body = "";

        response.on("data", (chunk) => {
            body += chunk.toString();
        });

        response.on("end", () => {
            console.error("Body:", body);

            console.error(
                "===============================================\n"
            );
        });
    });


    /*
     * ----------------------------------------
     * TRANSCRIPT RESULTS
     * ----------------------------------------
     */
    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message.toString());

            /*
             * Deepgram sends different message
             * types. We only care about Results.
             */
            if (data.type !== "Results") {
                return;
            }

            const alternative =
                data.channel?.alternatives?.[0];

            const transcript =
                alternative?.transcript || "";

            if (!transcript) {
                return;
            }

            onTranscript?.({
                transcript,

                /*
                 * true = Deepgram considers this
                 * particular result finalized.
                 */
                isFinal: data.is_final,

                /*
                 * true = Deepgram detected the
                 * end of the speaker's utterance.
                 *
                 * This is especially important
                 * for Roger's agent.
                 */
                speechFinal: data.speech_final,
            });

        } catch (error) {
            onError?.(error);
        }
    });


    /*
     * ----------------------------------------
     * CONNECTION ERROR
     * ----------------------------------------
     */
    ws.on("error", (error) => {
        console.error(
            "Deepgram WebSocket error:",
            error
        );

        onError?.(error);
    });


    /*
     * ----------------------------------------
     * CONNECTION CLOSED
     * ----------------------------------------
     */
    ws.on("close", () => {
        console.log(
            "Deepgram streaming connection closed"
        );

        onClose?.();
    });


    /*
     * ----------------------------------------
     * PUBLIC API
     * ----------------------------------------
     */
    return {

        /*
         * Check whether Deepgram is connected.
         */
        isOpen() {
            return ws.readyState === WebSocket.OPEN;
        },


        /*
         * Send an audio chunk to Deepgram.
         *
         * chunk should be raw PCM16 audio.
         */
        sendAudio(chunk) {
            if (ws.readyState !== WebSocket.OPEN) {
                return;
            }

            ws.send(chunk);
        },


        /*
         * Tell Deepgram to finalize the current
         * audio stream.
         */
        finalize() {
            if (ws.readyState !== WebSocket.OPEN) {
                return;
            }

            ws.send(
                JSON.stringify({
                    type: "Finalize",
                })
            );
        },


        /*
         * Close the Deepgram stream.
         */
        close() {
            if (ws.readyState !== WebSocket.OPEN) {
                return;
            }

            ws.send(
                JSON.stringify({
                    type: "CloseStream",
                })
            );
        },
    };
}


export {
    transcribe,
    createStreamingTranscriber,
};