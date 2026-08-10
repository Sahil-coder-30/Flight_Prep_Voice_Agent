import { CheckCircle2, Circle, PencilLine, Sparkles } from 'lucide-react';
import type { ScenarioStepTemplate, SessionStep } from '../api';

interface StepChecklistProps {
  steps: ScenarioStepTemplate[];
  sessionSteps: SessionStep[];
  currentStepId: string | null;
}

const statusCopy = {
  pending: 'Pending',
  active: 'Active',
  complete: 'Complete',
  corrected: 'Corrected',
} as const;

export function StepChecklist({ steps, sessionSteps, currentStepId }: StepChecklistProps) {
  return (
    <section className="panel panel--stack">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Step checklist</p>
          <h2>Run the flow in order</h2>
        </div>
        <Sparkles size={18} />
      </div>

      <div className="step-list">
        {steps.map((step) => {
          const sessionStep = sessionSteps.find((candidate) => candidate.stepId === step.stepId);
          const status = sessionStep?.status ?? 'pending';
          const isCurrent = currentStepId === step.stepId;

          return (
            <article key={step.stepId} className={`step-card step-card--${status} ${isCurrent ? 'step-card--current' : ''}`}>
              <div className="step-card__header">
                <div className="step-card__title-row">
                  <span className="step-card__icon">
                    {status === 'complete' ? <CheckCircle2 size={16} /> : status === 'corrected' ? <PencilLine size={16} /> : <Circle size={16} />}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.briefing}</p>
                  </div>
                </div>
                <span className={`status-pill status-pill--${status}`}>{statusCopy[status]}</span>
              </div>

              <div className="step-card__meta">
                <span>{step.sourceLabel}</span>
                <span>{sessionStep?.attempts ?? 0} attempt{sessionStep?.attempts === 1 ? '' : 's'}</span>
              </div>

              <div className="step-card__hint">
                <p>{step.idealReadback}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
