/**
 * Fuzzy slot matching for ATC readback validation.
 *
 * Aviation readbacks have unique challenges:
 *  - Numbers spoken as individual digits: "two seven zero" = "270"
 *  - NATO phonetics: "november" = "N", "romeo" = "R"
 *  - Trailing words: "N172SP cleared for takeoff" still contains the callsign
 *  - Heading tolerance: pilot says "271" but clearance was "270" — within 10° is OK
 */

// ── NATO Phonetic Alphabet ─────────────────────────────────────────────────────

const NATO = {
    alpha: 'A', bravo: 'B', charlie: 'C', delta: 'D', echo: 'E',
    foxtrot: 'F', golf: 'G', hotel: 'H', india: 'I', juliet: 'J',
    kilo: 'K', lima: 'L', mike: 'M', november: 'N', oscar: 'O',
    papa: 'P', quebec: 'Q', romeo: 'R', sierra: 'S', tango: 'T',
    uniform: 'U', victor: 'V', whiskey: 'W', xray: 'X', yankee: 'Y',
    zulu: 'Z',
};

// ── Spoken Number Normalization ────────────────────────────────────────────────

const SPOKEN_DIGITS = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    niner: '9',
};

/**
 * Normalize spoken text for comparison:
 *   "two seven zero" → "270"
 *   "november one seven two sierra papa" → "N172SP"
 *   "two two left" → "22L"
 */
export function normalizeSpoken(text) {
    if (!text) return '';
    let result = text.toLowerCase().trim();

    // Replace NATO phonetics (must come before digit replacement)
    result = result.split(' ').map((word) => NATO[word] || word).join(' ');

    // Replace spoken digits
    result = result.split(' ').map((word) => SPOKEN_DIGITS[word] || word).join(' ');

    // Collapse spaces, uppercase, strip punctuation
    result = result.replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9.]/g, '');

    return result;
}

// ── Individual Slot Matchers ───────────────────────────────────────────────────

/**
 * Exact match (after normalization). Used for callsigns, runways, squawk codes.
 */
function matchExact(expected, extracted) {
    const e = normalizeSpoken(String(expected));
    const x = normalizeSpoken(String(extracted ?? ''));
    return x.includes(e) || e.includes(x);
}

/**
 * Approximate numeric match within a tolerance. Used for headings, altimeters, frequencies.
 */
function matchApproximate(expected, extracted, tolerance) {
    const e = parseFloat(normalizeSpoken(String(expected)));
    const x = parseFloat(normalizeSpoken(String(extracted ?? '')));
    if (isNaN(e) || isNaN(x)) return false;
    return Math.abs(e - x) <= tolerance;
}

/**
 * Phonetic match: compare after full NATO normalization.
 * Effective for callsigns mixed with phonetics.
 */
function matchPhonetic(expected, extracted) {
    return matchExact(expected, extracted);
}

// ── Master Slot Validator ──────────────────────────────────────────────────────

/**
 * Validate all readback-required slots from a step definition against extracted values.
 *
 * @param {Array}  stepSlots      — step.slots[] from scenario (SlotSchema objects)
 * @param {Object} resolvedSlots  — Expected values { callsign: 'N172SP', runway: '22L' }
 * @param {Object} extracted      — Extracted by LLM { callsign: 'N172SP', runway: null }
 * @returns {{ report: Object, allPassed: boolean, failedSlots: string[] }}
 *
 * report: { callsign: true, runway: false, windDir: true }
 */
export function validateSlots(stepSlots, resolvedSlots, extracted) {
    const report = {};
    const failedSlots = [];

    for (const slot of stepSlots) {
        if (!slot.readbackRequired) continue; // skip non-readback slots

        const { key, matchType = 'exact', tolerance = 0 } = slot;
        const expected  = resolvedSlots[key];
        const actual    = extracted?.[key];

        if (actual === null || actual === undefined) {
            report[key] = false;
            failedSlots.push(key);
            continue;
        }

        let passed = false;
        switch (matchType) {
            case 'approximate': passed = matchApproximate(expected, actual, tolerance); break;
            case 'phonetic':    passed = matchPhonetic(expected, actual);                break;
            default:            passed = matchExact(expected, actual);
        }

        report[key] = passed;
        if (!passed) failedSlots.push(key);
    }

    return { report, allPassed: failedSlots.length === 0, failedSlots };
}
