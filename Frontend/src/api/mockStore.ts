import { createControllerAudioUrl } from './mockAudio';
import type {
  ChatMessage,
  CompleteSessionInput,
  DebriefSummary,
  GroundingExcerpt,
  Scenario,
  ScenarioStepTemplate,
  Session,
  SessionStep,
  SessionTranscript,
  StepResult,
  TurnRequest,
  TurnResult,
} from './types';

interface MockRecord {
  session: Session;
  messages: ChatMessage[];
  grounding: GroundingExcerpt | null;
  currentStepId: string | null;
  debrief: DebriefSummary | null;
}

interface MockStore {
  sessions: Record<string, MockRecord>;
}

const STORAGE_KEY = 'atc-voice-mock-store';

const scenarioFixtures: Scenario[] = [
  {
    id: 'jfk-ilo',
    difficulty: 'medium',
    templateJson: {
      airport: 'KJFK',
      procedureType: 'IFR departure',
      notes: ['Use a crisp readback and keep the taxi segment short.'],
      steps: [
        {
          stepId: 'clearance',
          title: 'Request clearance',
          briefing: 'Read back the IFR clearance with the correct squawk and departure frequency.',
          groundingExcerpt: 'Cleared via the ILS runway 04L departure, maintain 3,000, expect radar vectors.',
          sourceLabel: 'JFK Clearance Strip 14B',
          requiredKeywords: ['squawk', 'departure', 'three thousand', '3000'],
          correctionHint: 'Include the squawk and the departure frequency before releasing the line.',
          controllerLine: 'N123AB, cleared to Boston via the ILS runway 04L departure, squawk 4231, departure 124.8.',
          clarificationLine: 'Grounding reminder: the readback needs the squawk, altitude, and departure frequency.',
          idealReadback: 'Cleared to Boston via the ILS runway 04L departure, squawk 4231, departure 124.8.',
        },
        {
          stepId: 'taxi',
          title: 'Taxi to hold short',
          briefing: 'Confirm taxi routing and hold short instructions for the active runway.',
          groundingExcerpt: 'Taxi via Alpha and hold short of runway 04L. Cross only when instructed.',
          sourceLabel: 'JFK Movement Map A1',
          requiredKeywords: ['alpha', 'hold short', '04l'],
          correctionHint: 'Hold short of the runway and keep the taxiway name in the readback.',
          controllerLine: 'Taxi via Alpha, hold short runway 04L.',
          clarificationLine: 'Make sure the runway hold short instruction is spoken back verbatim.',
          idealReadback: 'Taxi via Alpha, hold short runway 04L.',
        },
        {
          stepId: 'lineup',
          title: 'Line up and wait',
          briefing: 'Capture the runway assignment and line-up instruction exactly.',
          groundingExcerpt: 'Line up and wait runway 04L, traffic on final half mile.',
          sourceLabel: 'Tower Phraseology Card 3',
          requiredKeywords: ['line up', 'wait', '04l'],
          correctionHint: 'Use the runway number and the line-up phrase together.',
          controllerLine: 'N123AB, line up and wait runway 04L.',
          clarificationLine: 'This one is a phraseology check, not a clearance change.',
          idealReadback: 'Line up and wait runway 04L.',
        },
      ],
    },
  },
  {
    id: 'lhr-vfr',
    difficulty: 'easy',
    templateJson: {
      airport: 'EGLL',
      procedureType: 'VFR arrival',
      notes: ['This scenario focuses on concise reporting and runway awareness.'],
      steps: [
        {
          stepId: 'join',
          title: 'Join the circuit',
          briefing: 'Report the downwind leg and acknowledge the active runway.',
          groundingExcerpt: 'Circuit traffic joining left downwind runway 27R.',
          sourceLabel: 'Heathrow VFR Strip 2',
          requiredKeywords: ['downwind', '27r'],
          correctionHint: 'Say downwind and the runway together.',
          controllerLine: 'G-ATC, join left downwind runway 27R.',
          clarificationLine: 'Keep the traffic pattern leg and runway number in the same readback.',
          idealReadback: 'Join left downwind runway 27R.',
        },
        {
          stepId: 'base',
          title: 'Base turn',
          briefing: 'Call when established on base and confirm spacing.',
          groundingExcerpt: null,
          sourceLabel: 'Tower Advisory Note',
          requiredKeywords: ['base', 'spacing'],
          correctionHint: 'This line has no direct grounding match, so focus on the tower instruction.',
          controllerLine: 'Report base when established, number two behind the traffic ahead.',
          clarificationLine: 'No grounding match for this line; use the live controller instruction only.',
          idealReadback: 'Wilco, established base, number two behind traffic ahead.',
        },
        {
          stepId: 'final',
          title: 'Final approach',
          briefing: 'Acknowledge landing clearance and runway condition.',
          groundingExcerpt: 'Cleared to land runway 27R, wind 260 at 8.',
          sourceLabel: 'Heathrow Tower 27R',
          requiredKeywords: ['cleared to land', '27r'],
          correctionHint: 'Say the landing clearance and runway number back clearly.',
          controllerLine: 'G-ATC, cleared to land runway 27R.',
          clarificationLine: 'This is the final readback before touchdown.',
          idealReadback: 'Cleared to land runway 27R.',
        },
      ],
    },
  },
  {
    id: 'dub-charlie',
    difficulty: 'hard',
    templateJson: {
      airport: 'EIDW',
      procedureType: 'engine-out departure',
      notes: ['Expect a correction on the first step and a compact recovery.'],
      steps: [
        {
          stepId: 'emergency',
          title: 'Engine-out check-in',
          briefing: 'Declare the problem and state your immediate altitude intent.',
          groundingExcerpt: 'Maintain 2,500, turn left to heading 210.',
          sourceLabel: 'Dublin Tower Emergency Card',
          requiredKeywords: ['engine', '2500', 'heading 210'],
          correctionHint: 'Give the engine status, altitude, and heading in one readback.',
          controllerLine: 'D-ATC, roger engine out. Maintain 2,500, turn left heading 210.',
          clarificationLine: 'The immediate altitude restriction is the key item here.',
          idealReadback: 'Engine out, maintain 2,500, left heading 210.',
        },
        {
          stepId: 'vector',
          title: 'Vectors to rejoin',
          briefing: 'Read back the vector and any restriction exactly.',
          groundingExcerpt: 'Fly heading 170, descend via published procedure when able.',
          sourceLabel: 'Dublin Radar Strip 7',
          requiredKeywords: ['heading 170', 'descend'],
          correctionHint: 'Carry the heading and descent instruction together.',
          controllerLine: 'Fly heading 170, descend via the published procedure when able.',
          clarificationLine: 'Keep the vector and descent instruction tight.',
          idealReadback: 'Heading 170, descend via the published procedure when able.',
        },
        {
          stepId: 'handoff',
          title: 'Handoff to approach',
          briefing: 'Acknowledge the radar handoff and the next frequency.',
          groundingExcerpt: 'Contact approach on 119.1, good luck.',
          sourceLabel: 'Tower Handoff Note',
          requiredKeywords: ['119.1', 'approach'],
          correctionHint: 'The frequency matters most here.',
          controllerLine: 'Contact approach on 119.1.',
          clarificationLine: 'This is a clean handoff call, not a route change.',
          idealReadback: 'Contact approach on 119.1.',
        },
      ],
    },
  },
];

const createInitialStore = (): MockStore => ({
  sessions: {},
});

const loadStore = (): MockStore => {
  if (typeof window === 'undefined') {
    return createInitialStore();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return createInitialStore();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as MockStore;
    return parsedValue ?? createInitialStore();
  } catch {
    return createInitialStore();
  }
};

const saveStore = (store: MockStore) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getRecord = (sessionId: string) => {
  const store = loadStore();
  const record = store.sessions[sessionId];

  if (!record) {
    throw new Error(`Session ${sessionId} was not found.`);
  }

  return { store, record };
};

export const getScenarioFixtures = () => scenarioFixtures;

export const getScenarioFixtureById = (scenarioId: string) =>
  scenarioFixtures.find((scenario) => scenario.id === scenarioId) ?? null;

const findScenarioStep = (scenario: Scenario, stepId: string) =>
  scenario.templateJson.steps.find((step) => step.stepId === stepId) ?? null;

const createStepState = (scenario: Scenario): SessionStep[] =>
  scenario.templateJson.steps.map((stepTemplate, index) => ({
    stepId: stepTemplate.stepId,
    status: index === 0 ? 'active' : 'pending',
    attempts: 0,
    corrected: false,
  }));

const getGrounding = (scenario: Scenario, stepId: string): GroundingExcerpt | null => {
  const step = findScenarioStep(scenario, stepId);
  if (!step || !step.groundingExcerpt) {
    return null;
  }

  return {
    title: step.title,
    excerpt: step.groundingExcerpt,
    sourceLabel: step.sourceLabel,
    confidence: 'high',
  };
};

const containsRequiredKeyword = (spokenText: string, requiredKeywords: string[]) => {
  const normalizedText = spokenText.toLowerCase();
  return requiredKeywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
};

const appendTurn = (record: MockRecord, scenario: Scenario, stepIndex: number, transcript: string, audioBlob: Blob | null) => {
  const templateStep = scenario.templateJson.steps[stepIndex];
  const sessionStep = record.session.steps[stepIndex];

  if (!templateStep || !sessionStep) {
    throw new Error('Step data is not available.');
  }

  const pilotMessage: ChatMessage = {
    sessionId: record.session.id,
    role: 'pilot',
    text: transcript,
    audioRef: audioBlob ? `mock-audio://${record.session.id}/${templateStep.stepId}/pilot` : null,
    stepId: templateStep.stepId,
    timestamp: new Date().toISOString(),
    tone: 'normal',
  };

  const isCorrect = containsRequiredKeyword(transcript, templateStep.requiredKeywords);
  sessionStep.attempts += 1;
  sessionStep.corrected = sessionStep.corrected || !isCorrect;
  sessionStep.status = isCorrect ? (sessionStep.corrected ? 'corrected' : 'complete') : 'corrected';

  const controllerLine = isCorrect ? templateStep.controllerLine : templateStep.clarificationLine;
  const controllerTone: ChatMessage['tone'] = isCorrect ? (sessionStep.corrected ? 'clarification' : 'normal') : 'correction';
  const controllerMessage: ChatMessage = {
    sessionId: record.session.id,
    role: 'controller',
    text: controllerLine,
    audioRef: createControllerAudioUrl(controllerLine),
    stepId: templateStep.stepId,
    timestamp: new Date().toISOString(),
    tone: controllerTone,
  };

  record.messages.push(pilotMessage, controllerMessage);
  record.grounding = getGrounding(scenario, templateStep.stepId);

  if (isCorrect) {
    const nextTemplateStep = scenario.templateJson.steps[stepIndex + 1];
    record.currentStepId = nextTemplateStep?.stepId ?? null;
    if (nextTemplateStep) {
      record.session.steps[stepIndex + 1].status = 'active';
    }
  } else {
    record.currentStepId = templateStep.stepId;
    record.session.steps[stepIndex].status = 'corrected';
  }

  return {
    pilotMessage,
    controllerMessage,
    isCorrect,
    templateStep,
  };
};

const buildDebriefSummary = (record: MockRecord, scenario: Scenario): DebriefSummary => {
  const stepResults: StepResult[] = record.session.steps.map((step, index) => {
    const templateStep = scenario.templateJson.steps[index];

    if (step.status === 'complete') {
      return {
        stepId: step.stepId,
        title: templateStep.title,
        result: 'pass',
        missedElement: null,
        attempts: step.attempts,
      };
    }

    if (step.status === 'corrected') {
      return {
        stepId: step.stepId,
        title: templateStep.title,
        result: 'corrected',
        missedElement: templateStep.correctionHint,
        attempts: step.attempts,
      };
    }

    return {
      stepId: step.stepId,
      title: templateStep.title,
      result: 'fail',
      missedElement: templateStep.correctionHint,
      attempts: step.attempts,
    };
  });

  const earnedPoints = stepResults.reduce((total, stepResult) => {
    if (stepResult.result === 'pass') {
      return total + 100;
    }

    if (stepResult.result === 'corrected') {
      return total + 70;
    }

    return total;
  }, 0);

  const score = Math.round(earnedPoints / Math.max(1, stepResults.length));
  const overallFeedback =
    score >= 90
      ? 'Clean run. Phraseology stayed tight and the readbacks were sharp.'
      : score >= 70
        ? 'Solid run with one or two correction moments. Focus on the missed grounding details.'
        : 'The session needs another pass. Slow the readbacks down and anchor them to the grounding panel.';

  return {
    session: record.session,
    scenario,
    score,
    stepResults,
    overallFeedback,
  };
};

export const mockStore = {
  fetchScenarios: async () => {
    await delay(280);
    return scenarioFixtures;
  },
  fetchScenarioById: async (scenarioId: string) => {
    await delay(120);
    const scenario = getScenarioFixtureById(scenarioId);

    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} was not found.`);
    }

    return scenario;
  },
  startSession: async (scenarioId: string) => {
    const scenario = getScenarioFixtureById(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} was not found.`);
    }

    const store = loadStore();
    const sessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `session-${Date.now()}`;
    const session: Session = {
      id: sessionId,
      userId: 'demo-pilot',
      scenarioId,
      status: 'active',
      startedAt: new Date().toISOString(),
      completedAt: null,
      steps: createStepState(scenario),
    };

    const firstTemplateStep = scenario.templateJson.steps[0];
    const openingMessage: ChatMessage = {
      sessionId,
      role: 'controller',
      text: `ATC ready. ${firstTemplateStep.controllerLine}`,
      audioRef: createControllerAudioUrl(firstTemplateStep.controllerLine),
      stepId: firstTemplateStep.stepId,
      timestamp: new Date().toISOString(),
      tone: 'normal',
    };

    store.sessions[sessionId] = {
      session,
      messages: [openingMessage],
      currentStepId: firstTemplateStep.stepId,
      grounding: getGrounding(scenario, firstTemplateStep.stepId),
      debrief: null,
    };

    saveStore(store);
    await delay(320);
    return session;
  },
  fetchSession: async (sessionId: string): Promise<Session> => {
    const { record } = getRecord(sessionId);
    await delay(160);
    return record.session;
  },
  fetchSessionTranscript: async (sessionId: string): Promise<SessionTranscript> => {
    const { record } = getRecord(sessionId);
    await delay(140);
    return { transcript: record.messages };
  },
  submitSessionTurn: async ({ sessionId, sttTranscript, stepId, currentStepData, audioBlob }: TurnRequest): Promise<TurnResult> => {
    const { store, record } = getRecord(sessionId);
    const scenario = getScenarioFixtureById(record.session.scenarioId);

    if (!scenario) {
      throw new Error(`Scenario ${record.session.scenarioId} was not found.`);
    }

    const currentStep = currentStepData ?? findScenarioStep(scenario, stepId);
    if (!currentStep) {
      throw new Error(`Step ${stepId} was not found.`);
    }

    const stepIndex = scenario.templateJson.steps.findIndex((step) => step.stepId === stepId);
    const result = appendTurn(record, scenario, stepIndex, sttTranscript, audioBlob ?? null);

    saveStore(store);
    await delay(420);

    return {
      sessionId,
      stepId,
      session: record.session,
      controllerLine: result.controllerMessage.text,
      audioUrl: result.controllerMessage.audioRef ?? '',
      validationResult: result.isCorrect ? (record.session.steps[stepIndex].corrected ? 'clarification' : 'correct') : 'incorrect',
      groundingUsed: record.grounding ? [record.grounding.sourceLabel] : [],
      pilotMessage: result.pilotMessage,
      controllerMessage: result.controllerMessage,
      grounding: record.grounding,
      currentStepId: record.currentStepId,
    };
  },
  completeSession: async (sessionId: string, payload?: CompleteSessionInput): Promise<Session> => {
    const { store, record } = getRecord(sessionId);
    const scenario = getScenarioFixtureById(record.session.scenarioId);

    if (!scenario) {
      throw new Error(`Scenario ${record.session.scenarioId} was not found.`);
    }

    record.session.status = 'completed';
    record.session.completedAt = new Date().toISOString();
    record.currentStepId = null;

    if (payload?.score !== undefined) {
      (record.session as Session & { score?: number }).score = payload.score;
    }

    saveStore(store);
    await delay(220);
    return record.session;
  },
  getDebriefSummary: async (sessionId: string): Promise<DebriefSummary> => {
    const { record } = getRecord(sessionId);
    if (record.debrief) {
      return record.debrief;
    }

    return mockStore.completeAndBuildDebrief(sessionId);
  },
  completeAndBuildDebrief: async (sessionId: string): Promise<DebriefSummary> => {
    const { store, record } = getRecord(sessionId);
    const scenario = getScenarioFixtureById(record.session.scenarioId);

    if (!scenario) {
      throw new Error(`Scenario ${record.session.scenarioId} was not found.`);
    }

    record.session.status = 'completed';
    record.session.completedAt = new Date().toISOString();
    record.currentStepId = null;

    const summary = buildDebriefSummary(record, scenario);
    record.debrief = summary;
    saveStore(store);
    await delay(220);
    return summary;
  },
  getSessionBundle: async (sessionId: string) => {
    const { record } = getRecord(sessionId);
    const scenario = getScenarioFixtureById(record.session.scenarioId);

    if (!scenario) {
      throw new Error(`Scenario ${record.session.scenarioId} was not found.`);
    }

    return {
      session: record.session,
      scenario,
      messages: record.messages,
      currentStepId: record.currentStepId,
      grounding: record.grounding,
    };
  },
};

export const fetchScenarios = mockStore.fetchScenarios;
export const fetchScenarioById = mockStore.fetchScenarioById;
export const startSession = mockStore.startSession;
export const fetchSession = mockStore.fetchSession;
export const fetchSessionTranscript = mockStore.fetchSessionTranscript;
export const submitSessionTurn = mockStore.submitSessionTurn;
export const completeSession = mockStore.completeSession;
export const getDebriefSummary = mockStore.getDebriefSummary;
