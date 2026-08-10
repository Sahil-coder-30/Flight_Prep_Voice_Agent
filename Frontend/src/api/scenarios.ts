import { mockStore } from './mockStore';
import type { Scenario } from './types';

const unwrapData = <T>(payload: { data?: { [key: string]: T } | T } | T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const maybeData = (payload as { data?: unknown }).data;
    if (maybeData && typeof maybeData === 'object' && !Array.isArray(maybeData)) {
      const values = Object.values(maybeData as Record<string, unknown>);
      if (values.length === 1) {
        return values[0] as T;
      }
    }
    return maybeData as T;
  }

  return payload as T;
};

export const fetchScenarios = async (): Promise<Scenario[]> => {
  const payload = await mockStore.fetchScenarios();
  return unwrapData<Scenario[]>(payload);
};

export const fetchScenarioById = async (scenarioId: string): Promise<Scenario> => {
  const payload = await mockStore.fetchScenarioById(scenarioId);
  return unwrapData<Scenario>(payload);
};

export const listScenarios = fetchScenarios;
