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
export function validateSlots(stepSlots = [], resolvedSlots = {}, extracted = {}) {
    const report = {};
    const failedSlots = [];

    // Determine target keys: explicit slots or active resolved keys
    const keysToCheck = new Set();
    
    for (const slot of stepSlots) {
        if (slot.readbackRequired !== false) {
            keysToCheck.add(slot.key);
        }
    }

    // If no explicit keys set, default to key slots present in resolvedSlots
    if (keysToCheck.size === 0) {
        for (const k of Object.keys(resolvedSlots)) {
            if (resolvedSlots[k] != null && k !== 'airport' && k !== 'atis') {
                keysToCheck.add(k);
            }
        }
    }

    for (const key of keysToCheck) {
        const slotObj = stepSlots.find((s) => s.key === key);
        const matchType = slotObj?.matchType || 'exact';
        const tolerance = slotObj?.tolerance || 0;
        const expected  = resolvedSlots[key];
        const actual    = extracted?.[key];

        if (expected == null) continue;

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

/**
 * Extract dynamic callsign spoken by the pilot in standard aviation format.
 * Examples:
 *   "NorCal Approach, Cessna 5678, request VFR flight following" -> "CESSNA 5678"
 *   "Boston Ground, N172SP ready for taxi" -> "N172SP"
 *   "United 456 climbing FL330" -> "UNITED 456"
 */
export function extractCallsignFromTranscript(transcript, fallback = 'N172SP') {
    if (!transcript || typeof transcript !== 'string') return fallback;

    const clean = transcript.trim();

    // Match type + number (e.g. Cessna 5678, Skyhawk 172SP, Cherokee 4321, United 456)
    const typeMatch = clean.match(/\b(cessna|piper|skyhawk|cherokee|bonanza|cirrus|beechcraft|boeing|airbus|citrus|united|delta|american|southwest|fedex|ups|november)\s+([a-z0-9\s]{2,10})\b/i);
    if (typeMatch) {
        const type = typeMatch[1].toUpperCase();
        const num = typeMatch[2].replace(/[^a-z0-9]/gi, '').toUpperCase();
        return `${type} ${num}`.trim();
    }

    // Match tail number (e.g. N172SP, C5678, N5678, N12345)
    const tailMatch = clean.match(/\b([a-z]{1,2}[0-9]{2,5}[a-z]{0,2})\b/i);
    if (tailMatch) {
        return tailMatch[1].toUpperCase();
    }

    return fallback;
}

/**
 * Extract dynamic ATC facility spoken by the pilot.
 * Examples:
 *   "Boston Center, Delta 421, flight level 340" -> "Boston Center"
 *   "NorCal Approach, Cessna 5678..." -> "NorCal Approach"
 *   "Seattle Tower, N172SP..." -> "Seattle Tower"
 */
export function extractFacilityFromTranscript(transcript, fallback = 'Boston Center') {
    if (!transcript || typeof transcript !== 'string') return fallback;

    const match = transcript.match(/\b([a-z0-9\s]{2,20})\s+(center|approach|departure|tower|ground|delivery|clearance)\b/i);
    if (match) {
        const words = match[1].trim().split(/\s+/);
        const rawName = words[words.length - 1];
        const facilityType = match[2].trim();
        const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
        const cleanType = facilityType.charAt(0).toUpperCase() + facilityType.slice(1).toLowerCase();
        return `${cleanName} ${cleanType}`;
    }

    return fallback;
}

/**
 * Fast-path rule-based slot extractor (< 0.1ms).
 * Extracts callsign, runway, taxiway, altitude, heading, squawk from spoken transcript.
 */
export function extractSlotsRuleBased(transcript, requiredKeys = [], resolvedSlots = {}) {
    if (!transcript) return {};
    const extracted = {};

    for (const key of requiredKeys) {
        if (key === 'callsign') {
            const cs = extractCallsignFromTranscript(transcript, resolvedSlots.callsign || 'N172SP');
            if (cs) extracted.callsign = cs;
        } else if (key === 'runway') {
            const rwyMatch = transcript.match(/\b(runway\s*)?([0-3]?[0-9]\s*[lrc]?)\b/i);
            if (rwyMatch) {
                const rwy = normalizeSpoken(rwyMatch[2]);
                if (rwy) extracted.runway = rwy;
            }
        } else if (key === 'taxiway') {
            const twyMatch = transcript.match(/\b(via|taxiway)\s+([a-z0-9]+)\b/i);
            if (twyMatch) {
                extracted.taxiway = twyMatch[2].toUpperCase();
            }
        } else if (key === 'heading') {
            const hdgMatch = transcript.match(/\b(heading\s*)?([0-3]?[0-9]{2})\b/i);
            if (hdgMatch) {
                extracted.heading = hdgMatch[2];
            }
        } else if (key === 'altitude') {
            const altMatch = transcript.match(/\b(climb|descend|maintain)?\s*([0-9]{3,5})\b/i);
            if (altMatch) {
                extracted.altitude = altMatch[2];
            }
        } else if (key === 'squawk') {
            const sqMatch = transcript.match(/\b(squawk\s*)?([0-7]{4})\b/i);
            if (sqMatch) {
                extracted.squawk = sqMatch[2];
            }
        } else if (resolvedSlots[key] != null) {
            const normExpected = normalizeSpoken(String(resolvedSlots[key]));
            const normText = normalizeSpoken(transcript);
            if (normExpected && normText.includes(normExpected)) {
                extracted[key] = resolvedSlots[key];
            }
        }
    }

    return extracted;
}
