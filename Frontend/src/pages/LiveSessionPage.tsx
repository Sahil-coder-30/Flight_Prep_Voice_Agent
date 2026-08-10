import { ChevronLeft, CheckCircle2, Radio, TimerReset } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchScenarioById, fetchSession, fetchSessionTranscript, submitSessionTurn } from '../api';
import type { ChatMessage, Scenario, Session } from '../api';
import { GroundingPanel } from '../components/GroundingPanel';
import { StepChecklist } from '../components/StepChecklist';
import { TranscriptPanel } from '../components/TranscriptPanel';
import { VoiceControl } from '../components/VoiceControl';

export function LiveSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const lastDraftSourceRef = useRef<string>('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/scenarios');
      return;
    }

    let active = true;

    const loadBundle = async () => {
      try {
        setLoading(true);
        const currentSession = await fetchSession(sessionId);
        const currentScenario = await fetchScenarioById(currentSession.scenarioId);
        const transcript = await fetchSessionTranscript(sessionId);
        if (!active) {
          return;
        }

        setSession(currentSession);
        setScenario(currentScenario);
        setMessages(transcript.transcript);

        const activeStep = currentScenario.templateJson.steps.find((step) => step.stepId === currentSession.steps.find((currentStep) => currentStep.status === 'active')?.stepId) ?? currentScenario.templateJson.steps[0];
        setDraftText(activeStep?.idealReadback ?? '');
        lastDraftSourceRef.current = activeStep?.idealReadback ?? '';
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load the session.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadBundle();

    return () => {
      active = false;
    };
  }, [navigate, sessionId]);

  useEffect(() => {
    if (!lastAudioUrl) {
      return;
    }

    const controllerAudio = new Audio(lastAudioUrl);
    void controllerAudio.play().catch(() => undefined);

    return () => {
      URL.revokeObjectURL(lastAudioUrl);
    };
  }, [lastAudioUrl]);

  const activeStep = useMemo(() => {
    if (!session || !scenario) {
      return null;
    }

    return scenario.templateJson.steps.find((step) => step.stepId === session.steps.find((currentStep) => currentStep.status === 'active')?.stepId) ?? null;
  }, [scenario, session]);

  useEffect(() => {
    if (!activeStep) {
      return;
    }

    if (draftText.trim().length === 0 || draftText === lastDraftSourceRef.current) {
      setDraftText(activeStep.idealReadback);
      lastDraftSourceRef.current = activeStep.idealReadback;
    }
  }, [activeStep, draftText]);

  const handleSubmitTurn = async (spokenText: string, audioBlob: Blob | null) => {
    if (!session || !scenario || !sessionId || !activeStep) {
      return;
    }

    setIsSending(true);
    try {
      const response = await submitSessionTurn({
        sessionId,
        sttTranscript: spokenText,
        stepId: activeStep.stepId,
        currentStepData: activeStep,
        audioBlob,
      });

      setLastAudioUrl(response.audioUrl);
      setSession(response.session);
      setMessages((currentMessages) => [...currentMessages, response.pilotMessage, response.controllerMessage]);

      const nextStep = scenario.templateJson.steps.find((step) => step.stepId === response.currentStepId) ?? scenario.templateJson.steps[0] ?? null;
      if (nextStep) {
        setDraftText(nextStep.idealReadback);
        lastDraftSourceRef.current = nextStep.idealReadback;
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) {
      return;
    }

    navigate(`/debrief/${sessionId}`);
  };

  if (loading) {
    return <div className="loading-card">Loading live session...</div>;
  }

  if (error) {
    return <div className="error-card">{error}</div>;
  }

  if (!session || !scenario) {
    return <div className="error-card">No session bundle was found.</div>;
  }

  return (
    <div className="page-shell page-shell--session">
      <header className="session-hero">
        <div>
          <p className="eyebrow">Live session</p>
          <h1>{scenario.templateJson.airport} {scenario.templateJson.procedureType}</h1>
          <p>Session {session.id}</p>
        </div>

        <div className="session-hero__actions">
          <span className="section-header__badge">
            <Radio size={16} />
            Radio live
          </span>
          <button type="button" className="ghost-button" onClick={() => navigate('/scenarios')}>
            <ChevronLeft size={16} />
            Scenarios
          </button>
          <button type="button" className="primary-button" onClick={() => void handleComplete()}>
            <CheckCircle2 size={16} />
            End session
          </button>
        </div>
      </header>

      <div className="session-layout">
        <div className="session-layout__main">
          <StepChecklist
            steps={scenario.templateJson.steps}
            sessionSteps={session.steps}
            currentStepId={session.steps.find((currentStep) => currentStep.status === 'active')?.stepId ?? null}
          />

          <TranscriptPanel messages={messages} isBusy={isSending} />
        </div>

        <div className="session-layout__rail">
          <GroundingPanel grounding={activeStep?.groundingExcerpt ? { title: activeStep.title, excerpt: activeStep.groundingExcerpt, sourceLabel: activeStep.sourceLabel, confidence: 'high' } : null} activeStep={activeStep} />

          <VoiceControl
            value={draftText}
            onChange={setDraftText}
            onSubmitTurn={handleSubmitTurn}
            suggestedText={activeStep?.idealReadback ?? 'Wait for the next controller line.'}
            disabled={!activeStep || isSending}
              currentStepLabel={activeStep?.title ?? 'the next step'}
          />

          <div className="session-tip panel panel--stack">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Tip</p>
                <h2>Keep the readback tight</h2>
              </div>
              <TimerReset size={18} />
            </div>
            <p>Use the grounding excerpt to anchor the response, then hold spacebar or the microphone button to send the turn.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
