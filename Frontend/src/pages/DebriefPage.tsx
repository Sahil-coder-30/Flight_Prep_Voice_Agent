import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSession, getDebriefSummary } from '../api';
import type { DebriefSummary } from '../api';
import { ScoreBreakdown } from '../components/ScoreBreakdown';

export function DebriefPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DebriefSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/scenarios');
      return;
    }

    let active = true;

    const loadSummary = async () => {
      try {
        setLoading(true);
        const response = await getDebriefSummary(sessionId);
        if (active) {
          setSummary(response);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load the debrief.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      active = false;
    };
  }, [navigate, sessionId]);

  const handleRetry = async () => {
    if (!summary) {
      return;
    }

    setRestarting(true);
    try {
      const session = await createSession(summary.session.scenarioId);
      navigate(`/session/${session.id}`);
    } finally {
      setRestarting(false);
    }
  };

  if (loading) {
    return <div className="loading-card">Loading debrief...</div>;
  }

  if (error) {
    return <div className="error-card">{error}</div>;
  }

  if (!summary) {
    return <div className="error-card">No debrief summary was found.</div>;
  }

  return (
    <div className="page-shell">
      <header className="section-header">
        <div>
          <p className="eyebrow">Debrief</p>
          <h1>{summary.scenario.templateJson.airport} session review</h1>
        </div>
        <div className="session-hero__actions">
          <button type="button" className="ghost-button" onClick={() => navigate('/scenarios')}>
            <ArrowLeft size={16} />
            Back to scenarios
          </button>
          <button type="button" className="primary-button" onClick={() => void handleRetry()} disabled={restarting}>
            <RotateCcw size={16} />
            {restarting ? 'Starting...' : 'Retry scenario'}
          </button>
        </div>
      </header>

      <ScoreBreakdown summary={summary} />
    </div>
  );
}
