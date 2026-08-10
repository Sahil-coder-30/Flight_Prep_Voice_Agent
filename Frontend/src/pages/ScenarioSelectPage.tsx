import { ArrowRight, Building2, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchScenarios, startSession } from '../api';
import type { Scenario } from '../api';

export function ScenarioSelectPage() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadScenarios = async () => {
      try {
        setLoading(true);
        const response = await fetchScenarios();
        if (active) {
          setScenarios(response);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load scenarios.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadScenarios();

    return () => {
      active = false;
    };
  }, []);

  const handleStartScenario = async (scenarioId: string) => {
    setStartingId(scenarioId);
    try {
      const session = await startSession(scenarioId);
      navigate(`/session/${session.id}`);
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="page-shell">
      <header className="section-header">
        <div>
          <p className="eyebrow">Scenario select</p>
          <h1>Pick a run and launch the session.</h1>
        </div>
        <div className="section-header__badge">
          <Building2 size={16} />
          Mock data ready
        </div>
      </header>

      {loading ? <div className="loading-card">Loading scenarios...</div> : null}
      {error ? <div className="error-card">{error}</div> : null}

      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="scenario-card">
            <div className="scenario-card__top">
              <div>
                <span className="scenario-card__airport">{scenario.templateJson.airport}</span>
                <h2>{scenario.templateJson.procedureType}</h2>
              </div>
              <span className={`difficulty difficulty--${scenario.difficulty}`}>{scenario.difficulty}</span>
            </div>

            <p>{scenario.templateJson.notes[0]}</p>

            <ul className="scenario-card__steps">
              {scenario.templateJson.steps.map((step) => (
                <li key={step.stepId}>
                  <span>
                    <Star size={14} />
                    {step.title}
                  </span>
                  <small>{step.briefing}</small>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="primary-button primary-button--block"
              onClick={() => void handleStartScenario(scenario.id)}
              disabled={startingId === scenario.id}
            >
              {startingId === scenario.id ? 'Starting...' : 'Start session'}
              <ArrowRight size={18} />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
