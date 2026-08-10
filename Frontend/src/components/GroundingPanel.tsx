import { BookOpenText, ShieldAlert } from 'lucide-react';
import type { GroundingExcerpt, ScenarioStepTemplate } from '../api';

interface GroundingPanelProps {
  grounding: GroundingExcerpt | null;
  activeStep: ScenarioStepTemplate | null;
}

export function GroundingPanel({ grounding, activeStep }: GroundingPanelProps) {
  return (
    <section className="panel panel--stack panel--grounding">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Grounding</p>
          <h2>Why the controller is saying it</h2>
        </div>
        <BookOpenText size={18} />
      </div>

      {grounding ? (
        <div className="grounding-card">
          <div className="grounding-card__header">
            <span className="status-pill status-pill--active">Source match</span>
            <span>{grounding.sourceLabel}</span>
          </div>
          <h3>{grounding.title}</h3>
          <p>{grounding.excerpt}</p>
        </div>
      ) : (
        <div className="grounding-empty">
          <ShieldAlert size={24} />
          <div>
            <h3>No grounding match for this line</h3>
            <p>
              The controller still has a live instruction, but this turn does not map to a stored source excerpt.
            </p>
          </div>
        </div>
      )}

      <div className="grounding-hint">
        <span>Current focus</span>
        <p>{activeStep?.briefing ?? 'Waiting for the next instruction.'}</p>
      </div>
    </section>
  );
}
