import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ScenarioSelectPage } from './pages/ScenarioSelectPage';
import { LiveSessionPage } from './pages/LiveSessionPage';
import { DebriefPage } from './pages/DebriefPage';

const routeTitles: Record<string, string> = {
  '/login': 'Login',
  '/scenarios': 'Scenarios',
};

function Shell() {
  const location = useLocation();
  const routeTitle = routeTitles[location.pathname] ?? 'Simulator';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="topbar__eyebrow">ATC Voice Simulator</p>
          <h1>{routeTitle}</h1>
        </div>
        <div className="topbar__accent">Frontend only • Mock-first</div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/scenarios" element={<ScenarioSelectPage />} />
          <Route path="/session/:sessionId" element={<LiveSessionPage />} />
          <Route path="/debrief/:sessionId" element={<DebriefPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <Shell />;
}
