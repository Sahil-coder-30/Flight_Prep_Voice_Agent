export type Difficulty = 'easy' | 'medium' | 'hard';

export type SessionStatus = 'active' | 'completed';

export type StepStatus = 'pending' | 'active' | 'complete' | 'corrected';

export type ChatRole = 'pilot' | 'controller';

export type MessageTone = 'normal' | 'clarification' | 'correction';

export interface ScenarioStepTemplate {
  stepId: string;
  title: string;
  briefing: string;
  groundingExcerpt: string | null;
  sourceLabel: string;
  requiredKeywords: string[];
  correctionHint: string;
  controllerLine: string;
  clarificationLine: string;
  idealReadback: string;
}

export interface ScenarioTemplateJson {
  airport: string;
  procedureType: string;
  notes: string[];
  steps: ScenarioStepTemplate[];
}

export interface Scenario {
  id: string;
  templateJson: ScenarioTemplateJson;
  difficulty: Difficulty;
}

export interface SessionStep {
  stepId: string;
  status: StepStatus;
  attempts: number;
  corrected: boolean;
}

export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  steps: SessionStep[];
}

export interface ChatMessage {
  sessionId: string;
  role: ChatRole;
  text: string;
  audioRef: string | null;
  stepId: string;
  timestamp: string;
  tone: MessageTone;
}

export interface GroundingExcerpt {
  title: string;
  excerpt: string;
  sourceLabel: string;
  confidence: 'high' | 'medium' | 'none';
}

export interface SessionBundle {
  session: Session;
  scenario: Scenario;
  messages: ChatMessage[];
  currentStepId: string | null;
  grounding: GroundingExcerpt | null;
}

export interface TurnRequest {
  sessionId: string;
  sttTranscript: string;
  stepId: string;
  currentStepData: ScenarioStepTemplate | null;
  audioBlob?: Blob | null;
}

export interface TurnResult {
  sessionId: string;
  stepId: string;
  session: Session;
  controllerLine: string;
  audioUrl: string;
  validationResult: 'correct' | 'incorrect' | 'initial_prompt' | 'clarification';
  groundingUsed: string[];
  pilotMessage: ChatMessage;
  controllerMessage: ChatMessage;
  grounding: GroundingExcerpt | null;
  currentStepId: string | null;
}

export interface CompleteSessionInput {
  score?: number;
}

export interface SessionTranscript {
  transcript: ChatMessage[];
}

export interface StepResult {
  stepId: string;
  title: string;
  result: 'pass' | 'corrected' | 'fail';
  missedElement: string | null;
  attempts: number;
}

export interface DebriefSummary {
  session: Session;
  scenario: Scenario;
  score: number;
  stepResults: StepResult[];
  overallFeedback: string;
}
