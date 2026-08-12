function normalize(text) {
    return String(text ?? "")
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeCallsign(value) {
    if (!value) return null;

    return String(value)
        .toUpperCase()
        .replace(/\s+/g, "");
}

function normalizeRunway(value) {
    if (!value) return null;

    const match = String(value)
        .toUpperCase()
        .match(/\b(?:RUNWAY\s*)?(\d{1,2}[LRC]?)\b/);

    return match ? match[1] : null;
}

function normalizeFrequency(value) {
    if (!value) return null;

    const match = String(value)
        .match(/\b\d{3}\.\d{1,3}\b/);

    return match ? match[0] : null;
}

function normalizeDeparture(value) {
    if (!value) return null;

    return String(value)
        .toUpperCase()
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeTaxiway(value) {
    if (!value) return null;

    return String(value)
        .trim()
        .replace(/^taxiway\s+/i, "")
        .replace(/^via\s+/i, "")
        .split(/\s+/)[0]
        .replace(
            /^./,
            (c) => c.toUpperCase()
        );
}

function normalizeHoldShort(value) {
    if (!value) return null;

    return normalize(value)
        .replace(/^hold\s+short\s+(?:of\s+)?/, "")
        .trim();
}

function normalizeExpectedValue(key, value) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    switch (key) {
        case "callsign":
            return normalizeCallsign(value);

        case "runway":
            return normalizeRunway(value);

        case "frequency":
            return normalizeFrequency(value);

        case "departure":
            return normalizeDeparture(value);

        case "taxiway":
            return normalizeTaxiway(value);

        case "hold_short":
            return normalizeHoldShort(value);

        case "squawk":
            return String(value)
                .replace(/\s+/g, "")
                .trim();

        default:
            return String(value)
                .trim();
    }
}

function extractCallsign(text) {
    const match = text.match(
        /\b([A-Z]{2,4}\d{2,4})\b/i
    );

    return match
        ? normalizeCallsign(match[1])
        : null;
}

function extractRunway(text) {
    const patterns = [
        /\brunway\s+(\d{1,2}[LRC]?)\b/i,
        /\brwy\s+(\d{1,2}[LRC]?)\b/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match) {
            return normalizeRunway(
                match[1]
            );
        }
    }

    return null;
}

function extractFrequency(text) {
    const match = text.match(
        /\b(\d{3}\.\d{1,3})\b/
    );

    return match
        ? normalizeFrequency(match[1])
        : null;
}

function extractSquawk(text) {
    const match = text.match(
        /\b(?:squawk|squak)\s+(\d{4})\b/i
    );

    return match
        ? match[1]
        : null;
}

function extractTaxiway(text) {
    const match = text.match(
        /\b(?:via|taxiway|taxi)\s+([a-z0-9]+)\b/i
    );

    return match
        ? normalizeTaxiway(match[1])
        : null;
}

function extractHoldShort(text) {
    const match = text.match(
        /\bhold\s+short\s+(?:of\s+)?runway\s+(\d{1,2}[LRC]?)\b/i
    );

    if (!match) {
        return null;
    }

    return `runway ${normalizeRunway(
        match[1]
    )}`;
}

function extractDeparture(text) {
    const normalizedText =
        String(text ?? "")
            .replace(/[.,!?]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const patterns = [
        /\bcleared\s+to\s+([a-z][a-z\s-]*?)(?=\s+runway\b)/i,

        /\bcleared\s+for\s+departure\s+via\s+([a-z][a-z\s-]*?)(?=\s+runway\b)/i,

        /\bdeparture\s+via\s+([a-z][a-z\s-]*?)(?=\s+runway\b)/i,

        /\bdeparture\s+(?:for|to)\s+([a-z][a-z\s-]*?)(?=\s+runway\b)/i,
    ];

    for (const pattern of patterns) {
        const match =
            normalizedText.match(pattern);

        if (match) {
            return normalizeDeparture(
                match[1]
            );
        }
    }

    return null;
}

function parseReadback(
    transcript,
    expected = {}
) {
    const text =
        String(transcript ?? "").trim();

    const extracted = {};

    for (const key of Object.keys(expected)) {
        extracted[key] = null;
    }

    if (
        Object.hasOwn(
            expected,
            "callsign"
        )
    ) {
        extracted.callsign =
            extractCallsign(text);
    }

    if (
        Object.hasOwn(
            expected,
            "runway"
        )
    ) {
        extracted.runway =
            extractRunway(text);
    }

    if (
        Object.hasOwn(
            expected,
            "departure"
        )
    ) {
        extracted.departure =
            extractDeparture(text);
    }

    if (
        Object.hasOwn(
            expected,
            "squawk"
        )
    ) {
        extracted.squawk =
            extractSquawk(text);
    }

    if (
        Object.hasOwn(
            expected,
            "frequency"
        )
    ) {
        extracted.frequency =
            extractFrequency(text);
    }

    if (
        Object.hasOwn(
            expected,
            "taxiway"
        )
    ) {
        extracted.taxiway =
            extractTaxiway(text);
    }

    if (
        Object.hasOwn(
            expected,
            "hold_short"
        )
    ) {
        extracted.hold_short =
            extractHoldShort(text);
    }

    const expectedKeys =
        Object.keys(expected);

    const found =
        expectedKeys.filter(
            (key) =>
                extracted[key] !== null
        ).length;

    let confidence = "unknown";

    if (
        expectedKeys.length > 0 &&
        found === expectedKeys.length
    ) {
        confidence = "high";
    } else if (found > 0) {
        confidence = "ambiguous";
    }

    return {
        ...extracted,
        confidence,
    };
}

function validateAgainstExpected(
    extracted,
    expected
) {
    for (const key of Object.keys(expected)) {
        const actual =
            normalizeExpectedValue(
                key,
                extracted?.[key]
            );

        const required =
            normalizeExpectedValue(
                key,
                expected[key]
            );

        if (
            actual === null ||
            required === null
        ) {
            if (actual !== required) {
                return false;
            }

            continue;
        }

        if (actual !== required) {
            return false;
        }
    }

    return true;
}

export {
    parseReadback,
    validateAgainstExpected,
    normalizeCallsign,
    normalizeRunway,
    normalizeFrequency,
    normalizeDeparture,
};