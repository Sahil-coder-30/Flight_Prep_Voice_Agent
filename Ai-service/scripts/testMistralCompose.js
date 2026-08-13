import "dotenv/config";

const started = Date.now();

const grounding = [
    "A departure clearance is not the same as a takeoff clearance. Receiving an IFR route, SID, runway, altitude, frequency or transponder assignment does not by itself authorize takeoff.",
    "An IFR departure clearance may contain the aircraft clearance limit or destination, assigned Standard Instrument Departure when applicable, departure runway, initial altitude or other departure instructions, departure frequency when applicable, and an SSR transponder code.",
    "When acknowledging a departure clearance, the pilot should correctly read back the assigned runway and other clearance elements that require readback. Aircraft identification should be included in the readback."
];

const slots = {
    callsign: "VTX123",
    runway: "27",
    departure: "NAGPUR",
    squawk: "4521"
};

const instruction =
    "Issue an IFR departure clearance to the aircraft.";

const groundingText =
    grounding.join("\n");

const body = {
    model: "mistral-large-latest",

    messages: [
        {
            role: "system",

            content:
                `You are an air traffic controller conducting a realistic pilot-ATC training session.

Use the provided ATC grounding as the authoritative source for phraseology and procedure.

Use the provided scenario slots to fill in the aircraft-specific details.

Do not invent ATC procedures, clearances, frequencies, runways, altitudes, routes, squawk codes, or other operational facts that are not supported by the grounding or scenario slots.

Return ONLY the controller's radio transmission.

Keep it concise and realistic. Do not explain what you are doing. Do not use quotation marks.`
        },

        {
            role: "user",

            content:
                `ATC grounding:

${groundingText}

Scenario slots:
${JSON.stringify(slots)}

Task:
${instruction}`
        }
    ],

    temperature: 0.2,
    max_tokens: 120
};

console.log("=================================");
console.log("MISTRAL COMPOSE DIRECT TEST");
console.log("=================================");
console.log("Model:", body.model);
console.log("Started:", new Date().toISOString());
console.log(
    "Payload size:",
    JSON.stringify(body).length,
    "bytes"
);

try {
    const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${process.env.MISTRAL_API_KEY}`,

                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(body),

            signal: AbortSignal.timeout(60000)
        }
    );

    const elapsed =
        Date.now() - started;

    const text =
        await response.text();

    console.log(
        "Response received in:",
        elapsed,
        "ms"
    );

    console.log(
        "HTTP:",
        response.status
    );

    console.log(
        "Body:"
    );

    console.log(text);

} catch (error) {
    const elapsed =
        Date.now() - started;

    console.error(
        "Failed after:",
        elapsed,
        "ms"
    );

    console.error(
        "Name:",
        error?.name
    );

    console.error(
        "Message:",
        error?.message
    );

    console.error(
        "Cause:",
        error?.cause
    );
}