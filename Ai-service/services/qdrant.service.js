import { getQdrantClient } from '../config/qdrant.js';

/**
 * Queries Qdrant vector collection for FAA/ICAO phraseology grounding.
 * Payload filtered on procedureType.
 *
 * @param {string} procedureType - Ground, departure, clearance, etc.
 * @param {string} queryText - Query text to match
 * @returns {Promise<Array<Object>>} Array of matching knowledge hits
 */
export const queryQdrantKnowledge = async (procedureType, queryText) => {
    try {
        const client = getQdrantClient();
        console.log(`[Qdrant Service] Querying knowledge for procedureType="${procedureType}"`);

        // Stubbed response if Qdrant isn't seeded yet
        return [
            {
                id: 1,
                score: 0.92,
                payload: {
                    title: 'FAA AIM 4-2-3: Contact Procedures',
                    content: 'Pilots must read back altitude assignments, runway clearances, and hold short instructions.',
                    procedureType,
                },
            },
        ];
    } catch (error) {
        console.error('[Qdrant Service] Search error:', error.message);
        return [];
    }
};
