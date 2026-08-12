import TokenUsageLog from '../models/tokenUsage.model.js';

// ── Internal helper ────────────────────────────────────────────────────────────

async function callMistral(payload, ctx = {}) {
    const t0 = Date.now();
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY || process.env.MISTRALAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Mistral API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const latencyMs = Date.now() - t0;

    // Fire-and-forget token log
    if (ctx.sessionId) {
        TokenUsageLog.create({
            sessionId:        ctx.sessionId,
            userId:           ctx.userId,
            stepId:           ctx.stepId,
            templateId:       ctx.templateId,
            operation:        ctx.operation,
            model:            payload.model,
            promptTokens:     data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens:      data.usage?.total_tokens ?? 0,
            latencyMs,
            cacheHit:         false,
        }).catch(() => {});
    }

    return { content: data.choices[0].message.content, latencyMs };
}

// ── composeLine ────────────────────────────────────────────────────────────────

/**
 * SLOW PATH: Called only when template slots cannot be fully resolved.
 * Uses mistral-large for maximum phraseology accuracy.
 *
 * @param {Object} params — { grounding, slots, instruction, ctx }
 * @returns {Promise<string>} — Controller line text
 */
export async function composeLine({ grounding, slots, instruction, ctx = {} }) {
    const { content } = await callMistral({
        model: 'mistral-large-latest',
        temperature: 0.2,
        messages: [
            {
                role: 'system',
                content: 'You are an air traffic controller. Use ONLY the grounding text provided for phraseology. Do not invent procedures. Respond with ONLY the spoken controller line — no labels, no explanations.',
            },
            {
                role: 'user',
                content: `Grounding:\n${grounding.join('\n')}\n\nSlots: ${JSON.stringify(slots)}\n\nTask: ${instruction}`,
            },
        ],
    }, { ...ctx, operation: 'compose_line' });

    return content.trim();
}

// ── extractReadback ────────────────────────────────────────────────────────────

/**
 * Extracts slot values from pilot transcript.
 * Uses mistral-small for speed — this is pure JSON extraction, no creativity needed.
 *
 * @param {string} transcript   — Raw pilot speech transcript
 * @param {string[]} slotKeys   — Array of slot names to extract
 * @param {Object}  ctx         — { sessionId, userId, stepId, templateId }
 * @returns {Promise<Object>}   — { callsign: 'N172SP', runway: '22L', ... } null if absent
 */
export async function extractReadback(transcript, slotKeys, ctx = {}) {
    const { content } = await callMistral({
        model: 'mistral-small-latest',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `Extract the following fields from the pilot readback: ${JSON.stringify(slotKeys)}.
Return ONLY valid JSON with those keys. Use null for absent values.
Normalize: numbers as strings (e.g. "270" not 270), callsigns uppercase (e.g. "N172SP").
Aviation phonetics: "niner" → "9", "november" → "N".`,
            },
            { role: 'user', content: transcript },
        ],
    }, { ...ctx, operation: 'extract_readback' });

    return JSON.parse(content);
}

// ── composeCorrection ──────────────────────────────────────────────────────────

/**
 * Composes a short correction line when the pilot's readback fails.
 * Prefer using the step's correctionLine template first — only call this as fallback.
 *
 * @param {string[]} failedSlots — Slot keys that did not match
 * @param {string}   callsign    — Aircraft callsign
 * @param {Object}   ctx         — Token logging context
 * @returns {Promise<string>}    — Short correction phrase
 */
export async function composeCorrection(failedSlots, callsign, ctx = {}) {
    const slotList = failedSlots.join(', ');
    const { content } = await callMistral({
        model: 'mistral-small-latest',
        temperature: 0.1,
        messages: [
            {
                role: 'system',
                content: 'You are an air traffic controller issuing a brief readback correction. Keep it under 15 words. Use standard ICAO correction phraseology.',
            },
            {
                role: 'user',
                content: `${callsign} did not correctly read back: ${slotList}. Issue the correction.`,
            },
        ],
    }, { ...ctx, operation: 'issue_correction' });

    return content.trim();
}

// ── composeDebrief ─────────────────────────────────────────────────────────────

/**
 * Composes a short session debrief spoken by the controller.
 *
 * @param {number}   score      — 0–100 session score
 * @param {string[]} weakAreas  — Procedure types the student struggled with
 * @param {Object}   ctx
 * @returns {Promise<string>}
 */
export async function composeDebrief(score, weakAreas, ctx = {}) {
    const { content } = await callMistral({
        model: 'mistral-small-latest',
        temperature: 0.3,
        messages: [
            {
                role: 'system',
                content: 'You are an ATC instructor giving a brief debrief after a training session. Keep it under 40 words. Be encouraging but specific about weak areas.',
            },
            {
                role: 'user',
                content: `Session score: ${score}/100. Weak areas: ${weakAreas.length ? weakAreas.join(', ') : 'none'}. Provide a brief spoken debrief.`,
            },
        ],
    }, { ...ctx, operation: 'debrief' });

    return content.trim();
}