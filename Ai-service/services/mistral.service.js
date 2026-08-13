import TokenUsageLog from '../models/tokenUsage.model.js';

// ── Internal helper ────────────────────────────────────────────────────────────

async function callMistral(payload, ctx = {}, retries = 1) {
    const t0 = Date.now();
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.MISTRAL_API_KEY || process.env.MISTRALAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(1800),
            });

            if (res.status === 429 && i < retries) {
                console.warn(`[Mistral] 429 Rate limit hit. Retrying in 300ms...`);
                await new Promise((r) => setTimeout(r, 300));
                continue;
            }

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

            const content = data?.choices?.[0]?.message?.content || '';
            return { content, latencyMs };
        } catch (err) {
            if (i === retries) throw err;
            await new Promise((r) => setTimeout(r, 200));
        }
    }
}

// ── composeLine ────────────────────────────────────────────────────────────────

export async function composeLine({ grounding, slots, instruction, ctx = {} }) {
    try {
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
                    content: `Grounding:\n${(grounding || []).join('\n')}\n\nSlots: ${JSON.stringify(slots)}\n\nTask: ${instruction}`,
                },
            ],
        }, { ...ctx, operation: 'compose_line' });

        return content.trim();
    } catch (err) {
        console.warn('[Mistral] composeLine fallback active:', err.message);
        return `Boston Tower, ${slots?.callsign || 'aircraft'}, proceed as requested, hold short runway ${slots?.runway || '22L'}.`;
    }
}

// ── extractReadback ────────────────────────────────────────────────────────────

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

    try {
        return JSON.parse(content || '{}');
    } catch (e) {
        return {};
    }
}

// ── composeCorrection ──────────────────────────────────────────────────────────

export async function composeCorrection(failedSlots = [], callsign = 'N172SP', ctx = {}) {
    const slotList = (failedSlots || []).join(', ');
    try {
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
    } catch (e) {
        console.warn('[Mistral] composeCorrection error, using fallback:', e.message);
        return `${callsign}, negative, say again ${slotList || 'clearance'}.`;
    }
}

// ── composeDebrief ─────────────────────────────────────────────────────────────

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
                content: `Session score: ${score}/100. Weak areas: ${(weakAreas && weakAreas.length) ? weakAreas.join(', ') : 'none'}. Provide a brief spoken debrief.`,
            },
        ],
    }, { ...ctx, operation: 'debrief' });

    return content.trim();
}