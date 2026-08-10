import { mockStore } from './mockStore';
import type {
	CompleteSessionInput,
	DebriefSummary,
	Session,
	SessionTranscript,
	TurnRequest,
	TurnResult,
} from './types';

const unwrapSession = <T>(payload: unknown): T => {
	if (payload && typeof payload === 'object' && 'data' in payload) {
		const data = (payload as { data?: unknown }).data;
		if (data && typeof data === 'object' && 'session' in (data as Record<string, unknown>)) {
			return (data as Record<string, unknown>).session as T;
		}
		return data as T;
	}

	return payload as T;
};

export const startSession = async (scenarioId: string): Promise<Session> => {
	const payload = await mockStore.startSession(scenarioId);
	return unwrapSession<Session>(payload);
};

export const fetchSession = async (sessionId: string): Promise<Session> => {
	const payload = await mockStore.fetchSession(sessionId);
	return unwrapSession<Session>(payload);
};

export const completeSession = async (sessionId: string, payload?: CompleteSessionInput): Promise<Session> => {
	const response = await mockStore.completeSession(sessionId, payload);
	return unwrapSession<Session>(response);
};

export const submitSessionTurn = async (input: TurnRequest): Promise<TurnResult> => mockStore.submitSessionTurn(input);

export const fetchSessionTranscript = async (sessionId: string): Promise<SessionTranscript> => {
	const payload = await mockStore.fetchSessionTranscript(sessionId);
	return unwrapSession<SessionTranscript>(payload);
};

export const getDebriefSummary = async (sessionId: string): Promise<DebriefSummary> => mockStore.getDebriefSummary(sessionId);

export const createSession = startSession;

export const getSessionBundle = async (sessionId: string) => {
	const [session, transcript] = await Promise.all([
		fetchSession(sessionId),
		fetchSessionTranscript(sessionId),
	]);

	return { session, transcript };
};

export const advanceSessionTurn = submitSessionTurn;
