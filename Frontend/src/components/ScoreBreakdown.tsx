import { Award } from 'lucide-react';
import type { DebriefSummary } from '../api';

interface ScoreBreakdownProps {
  summary: DebriefSummary;
}

const resultCopy = {
  pass: 'Pass',
  corrected: 'Corrected',
  fail: 'Fail',
} as const;

export function ScoreBreakdown({ summary }: ScoreBreakdownProps) {
  return (
    <section className="panel panel--stack">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Debrief</p>
          <h2>Score and missed items</h2>
        </div>
        <Award size={18} />
      </div>

      <div className="score-card">
        <div>
          <p className="score-card__label">Overall score</p>
          <h3>{summary.score}</h3>
        </div>
        <p>{summary.overallFeedback}</p>
      </div>

      <div className="result-list">
        {summary.stepResults.map((stepResult) => (
          <article key={stepResult.stepId} className={`result-card result-card--${stepResult.result}`}>
            <div className="result-card__header">
              <h3>{stepResult.title}</h3>
              <span>{resultCopy[stepResult.result]}</span>
            </div>
            <p>Attempts: {stepResult.attempts}</p>
            <p>{stepResult.missedElement ?? 'No miss logged.'}</p>
          </article>
        ))}
      </div>

    </section>
  );
}
