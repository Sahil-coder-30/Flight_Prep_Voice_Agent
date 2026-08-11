import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import SpaceCanvas     from './components/SpaceCanvas/SpaceCanvas';
import Layout          from './components/Layout/Layout';
import InstrumentStrip from './components/InstrumentStrip/InstrumentStrip';
import LoginPage       from './features/auth/components/LoginPage';
import Dashboard       from './features/dashboard/components/Dashboard';
import SimulatorPage   from './features/simulator/components/SimulatorPage';
import { useAuth }     from './features/auth/Hooks/auth.hooks';

// ── Demo user for offline / unauthenticated preview ──────────────────────────
const DEMO_USER = {
  name:     'Demo Pilot',
  role:     'Student',
  callsign: 'N5CD',
  avatar:   null,
};

export default function App() {
  // Read initial route from URL ?route= param
  const initParams   = new URLSearchParams(window.location.search);
  const [route,      setRoute]      = useState(initParams.get('route') || 'login');
  const [scenario,   setScenario]   = useState(null);
  const [demoMode,   setDemoMode]   = useState(false);
  const [steps]      = useState([
    { label: 'Clearance', status: 'cleared' },
    { label: 'Pushback',  status: 'cleared' },
    { label: 'Taxi',      status: 'active'  },
    { label: 'Lineup',    status: 'idle'    },
    { label: 'Takeoff',   status: 'idle'    },
  ]);

  const { user, isAuthenticated, loading, initAuth, logout } = useAuth();
  const session = useSelector(s => s.simulator.currentSession);
  const isLive  = !!session;

  // On mount: silent token refresh → determine route
  useEffect(() => {
    initAuth();
  }, []); // eslint-disable-line

  // Keep URL synced
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set('route', route);
    window.history.replaceState({}, '', `${window.location.pathname}?${p}`);
  }, [route]);

  // After auth, redirect away from login
  useEffect(() => {
    if ((isAuthenticated || demoMode) && route === 'login') {
      setRoute('dashboard');
    }
  }, [isAuthenticated, demoMode, route]);

  function handleNavigate(r) { setRoute(r); }

  function handleStartScenario(sc) {
    setScenario(sc);
    setRoute('simulator');
  }

  function handleBack() {
    setRoute('dashboard');
    setScenario(null);
  }

  function handleLogout() {
    logout();
    setDemoMode(false);
    setRoute('login');
  }

  function handleDemoAccess() {
    setDemoMode(true);
    setRoute('dashboard');
  }

  const activeUser    = user || DEMO_USER;
  const activeSession = isLive ? session : null;

  const strip = (
    <InstrumentStrip
      user={activeUser}
      session={isLive ? { frequency: '118.300' } : null}
      steps={route === 'simulator' ? steps : []}
    />
  );

  return (
    <>
      {/* Universal Space Background */}
      <SpaceCanvas />

      {/* ── Loading splash ── */}
      {loading && !demoMode ? (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 10, gap: 16,
        }} aria-label="Loading">
          <div style={{
            width: 44, height: 44,
            border: '2px solid rgba(56,198,224,0.2)',
            borderTopColor: 'var(--nav-cyan)',
            borderRightColor: 'var(--nav-cyan)',
            borderRadius: '50%',
            animation: 'orb-spin 0.8s linear infinite',
          }} aria-hidden="true" />
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--readout-dim)',
          }}>
            INITIALISING FLIGHT DECK…
          </p>
        </div>
      ) : !isAuthenticated && !demoMode ? (
        <LoginPage onDemoAccess={handleDemoAccess} />
      ) : (
        <Layout
          activeRoute={route}
          onNavigate={handleNavigate}
          user={activeUser}
          session={activeSession}
          onLogout={handleLogout}
          instrumentStrip={strip}
        >
          {route === 'dashboard' && (
            <Dashboard
              onStartScenario={handleStartScenario}
              onResumeSession={() => setRoute('simulator')}
              activeSession={activeSession}
            />
          )}

          {route === 'simulator' && (
            <SimulatorPage scenario={scenario} onBack={handleBack} />
          )}

          {route === 'scenarios' && (
            <Dashboard
              onStartScenario={handleStartScenario}
              activeSession={null}
            />
          )}

          {route === 'history' && (
            <div style={{
              flex: 1, overflow: 'auto',
              padding: '40px clamp(24px, 4vw, 64px)',
              position: 'relative', zIndex: 1,
              animation: 'page-enter 0.3s ease',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 8, color: 'var(--readout)' }}>
                Training History
              </p>
              <p style={{ color: 'var(--readout-dim)', fontSize: 14 }}>
                Your past flight sorties will appear here. Complete your first flight to begin recording telemetry.
              </p>
            </div>
          )}

          {route === 'settings' && (
            <div style={{
              flex: 1, overflow: 'auto',
              padding: '40px clamp(24px, 4vw, 64px)',
              position: 'relative', zIndex: 1,
              animation: 'page-enter 0.3s ease',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 8, color: 'var(--readout)' }}>
                Flight Deck Settings
              </p>
              <p style={{ color: 'var(--readout-dim)', fontSize: 14 }}>
                Configure callsign preferences, audio input devices, and phraseology validation tolerance.
              </p>
            </div>
          )}
        </Layout>
      )}
    </>
  );
}