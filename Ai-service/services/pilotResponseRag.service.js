import crypto from 'crypto';
import { qdrantClient } from '../config/qdrant.js';
import { embedText } from './qdrant.service.js';

const COLLECTION = process.env.QDRANT_RESPONSES_COLLECTION || 'atc_pilot_responses';

let collectionInitialized = false;

/**
 * Initialize Qdrant collection for pilot responses if it doesn't exist.
 * Sets up payload indices for fast filtering by userId, templateId, scenarioId, and passed status.
 */
export async function initPilotResponsesCollection() {
    if (collectionInitialized) return;

    try {
        const { exists } = await qdrantClient.collectionExists(COLLECTION);
        if (!exists) {
            console.log(`[pilotResponseRag] Creating collection "${COLLECTION}"...`);
            await qdrantClient.createCollection(COLLECTION, {
                vectors: {
                    size: 1024,
                    distance: 'Cosine',
                },
            });

            // Create indices for payload filtering
            const indexFields = ['userId', 'templateId', 'scenarioId', 'passed', 'stepId'];
            for (const field of indexFields) {
                try {
                    await qdrantClient.createPayloadIndex(COLLECTION, {
                        field_name: field,
                        field_schema: 'keyword',
                    });
                } catch (idxErr) {
                    console.warn(`[pilotResponseRag] Payload index warning for "${field}":`, idxErr.message);
                }
            }
        }
        collectionInitialized = true;
    } catch (err) {
        console.error('[pilotResponseRag] Error initializing collection:', err.message);
    }
}

/**
 * Save each and every pilot answer into Qdrant RAG.
 * Stores userId as primary metadata identifier alongside question, answer, templateId, score, and situation context.
 *
 * @param {Object} params
 * @param {string} params.userId          - Pilot user ID
 * @param {string} params.sessionId       - Session ID
 * @param {string} params.question        - Controller instruction / question text
 * @param {string} params.answer          - Pilot speech transcript / answer
 * @param {string} params.templateId      - Scenario step template ID
 * @param {string} [params.stepId]        - Scenario step ID
 * @param {string} [params.scenarioId]    - Parent scenario ID
 * @param {string} [params.procedureType] - e.g. 'taxi', 'takeoff', 'approach'
 * @param {string} [params.phase]         - e.g. 'ground', 'tower'
 * @param {number} [params.score]         - Numerical score (0-100)
 * @param {boolean} [params.passed]       - Whether response passed validation
 * @param {Object} [params.slotReport]    - Detailed slot validation breakdown
 * @param {Object} [params.extracted]     - LLM-extracted slot key-values
 * @param {number} [params.retries]       - Number of attempts / retries
 * @param {boolean} [params.isGeneralQuery]- True if pilot asked a general question
 */
export async function savePilotResponseToRag(params) {
    const {
        userId,
        sessionId,
        question = '',
        answer = '',
        templateId = 'unknown_template',
        stepId = '',
        scenarioId = '',
        procedureType = '',
        phase = '',
        score = 0,
        passed = false,
        slotReport = {},
        extracted = {},
        retries = 0,
        isGeneralQuery = false,
    } = params;

    if (!userId || !answer) {
        console.warn('[pilotResponseRag] Skipping save: userId or answer is missing');
        return null;
    }

    try {
        await initPilotResponsesCollection();

        // Construct descriptive embedding text combining Q&A and situation context
        const embeddingText = `Question: "${question}" | Answer: "${answer}" | Situation: ${procedureType || 'general'} (${phase || 'n/a'}) | Template: ${templateId}`;
        const vector = await embedText(embeddingText, null, { sessionId, userId, stepId });

        const pointId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const payload = {
            userId,
            sessionId,
            question,
            answer,
            templateId,
            stepId,
            scenarioId,
            procedureType,
            phase,
            score,
            passed,
            slotReport,
            extracted,
            retries,
            isGeneralQuery,
            timestamp,
        };

        await qdrantClient.upsert(COLLECTION, {
            points: [
                {
                    id: pointId,
                    vector,
                    payload,
                },
            ],
        });

        console.log(`[pilotResponseRag] Saved response to RAG for user "${userId}" (Point ID: ${pointId}, Template: ${templateId}, Score: ${score})`);
        return pointId;
    } catch (err) {
        console.error('[pilotResponseRag] Failed to save pilot response to RAG:', err.message);
        return null;
    }
}

/**
 * Retrieve saved pilot responses from Qdrant RAG by userId.
 * Supports optional filtering by templateId or semantic search query.
 */
export async function getPilotResponsesFromRag(userId, { templateId, query, limit = 20 } = {}) {
    try {
        await initPilotResponsesCollection();

        const mustFilters = [{ key: 'userId', match: { value: userId } }];
        if (templateId) {
            mustFilters.push({ key: 'templateId', match: { value: templateId } });
        }

        if (query) {
            // Semantic similarity search for pilot answers
            const vector = await embedText(query);
            const searchRes = await qdrantClient.search(COLLECTION, {
                vector,
                limit,
                filter: { must: mustFilters },
            });
            return searchRes.map((r) => ({ id: r.id, score: r.score, ...r.payload }));
        } else {
            // Scroll payload list
            const scrollRes = await qdrantClient.scroll(COLLECTION, {
                filter: { must: mustFilters },
                limit,
                with_payload: true,
            });
            return scrollRes.points.map((p) => ({ id: p.id, ...p.payload }));
        }
    } catch (err) {
        console.error('[pilotResponseRag] Error retrieving responses from RAG:', err.message);
        return [];
    }
}

/**
 * Calculate template-wise performance scores and improvement areas for a pilot based on RAG history.
 */
export async function getTemplateWiseScoresFromRag(userId) {
    try {
        await initPilotResponsesCollection();

        const responses = await getPilotResponsesFromRag(userId, { limit: 200 });

        if (responses.length === 0) {
            return {
                userId,
                totalResponses: 0,
                overallAverageScore: 0,
                templates: [],
                improvementAreas: ['No practice history found yet. Complete a simulator scenario to see template analysis!'],
            };
        }

        // Group responses by templateId
        const templateMap = {};
        for (const resp of responses) {
            const tmpl = resp.templateId || 'general';
            if (!templateMap[tmpl]) {
                templateMap[tmpl] = {
                    templateId: tmpl,
                    procedureType: resp.procedureType || 'General',
                    phase: resp.phase || 'N/A',
                    responses: [],
                };
            }
            templateMap[tmpl].responses.push(resp);
        }

        const templateScores = [];
        const weakTemplates = [];

        for (const [tmpl, data] of Object.entries(templateMap)) {
            const count = data.responses.length;
            const totalScore = data.responses.reduce((sum, r) => sum + (r.score || 0), 0);
            const passedCount = data.responses.filter((r) => r.passed).length;
            const avgScore = Math.round(totalScore / count);
            const passRate = Math.round((passedCount / count) * 100);

            // Collect failed slots across responses to identify pattern mistakes
            const failedSlotCounts = {};
            for (const r of data.responses) {
                if (r.slotReport) {
                    for (const [slotKey, val] of Object.entries(r.slotReport)) {
                        if (val === false) {
                            failedSlotCounts[slotKey] = (failedSlotCounts[slotKey] || 0) + 1;
                        }
                    }
                }
            }

            const frequentMissedSlots = Object.entries(failedSlotCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([slotKey]) => slotKey);

            templateScores.push({
                templateId: tmpl,
                procedureType: data.procedureType,
                phase: data.phase,
                totalAttempts: count,
                averageScore: avgScore,
                passRate,
                frequentMissedSlots,
            });

            if (avgScore < 75 || passRate < 70) {
                weakTemplates.push({
                    templateId: tmpl,
                    avgScore,
                    missedSlots: frequentMissedSlots,
                });
            }
        }

        const overallAverageScore = Math.round(
            responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length
        );

        // Generate actionable improvement suggestions
        const improvementAreas = [];
        if (weakTemplates.length > 0) {
            for (const wt of weakTemplates) {
                const slotsText = wt.missedSlots.length > 0 ? ` (frequently missed: ${wt.missedSlots.join(', ')})` : '';
                improvementAreas.push(`Practice "${wt.templateId}" template: average score is ${wt.avgScore}%${slotsText}.`);
            }
        } else {
            improvementAreas.push('Great job! You have strong readback accuracy across all attempted phraseology templates.');
        }

        return {
            userId,
            totalResponses: responses.length,
            overallAverageScore,
            templates: templateScores,
            improvementAreas,
        };
    } catch (err) {
        console.error('[pilotResponseRag] Error computing template scores from RAG:', err.message);
        throw err;
    }
}
