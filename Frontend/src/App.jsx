import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import SpaceCanvas from './components/SpaceCanvas/SpaceCanvas';
import Layout from './components/Layout/Layout';
import InstrumentStrip from './components/InstrumentStrip/InstrumentStrip';
import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/components/LoginPage';
import Dashboard from './features/dashboard/components/Dashboard';
import SimulatorPage from './features/simulator/components/SimulatorPage';
import ScenariosPage from './features/scenarios/components/ScenariosPage';
import HistoryPage from './features/history/components/HistoryPage';
import SettingsPage from './features/settings/components/SettingsPage';
import { useAuth } from './features/auth/Hooks/auth.hooks';

export default function App() {
  const initParams = new URLSearchParams(window.location.search);
  const [route, setRoute] = useState(initParams.get('route') || 'landing');
  const [scenario, setScenario] = useState(null);

  const { user, isAuthenticated, loading, initAuth, logout } = useAuth();
  const session = useSelector((s) => s.simulator.currentSession);
  const isLive = !!session;

  // On mount: silent token refresh
  useEffect(() => {
    initAuth();
  }, []); // eslint-disable-line

  // Keep URL synced
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set('route', route);
    window.history.replaceState({}, '', `${window.location.pathname}?${p}`);
  }, [route]);

  // After auth resolves, enforce route protection:
  // 1. Authenticated users on public routes (landing/login) -> auto-redirect to dashboard
  // 2. Unauthenticated users on internal routes -> auto-redirect to landing
  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      if (route === 'landing' || route === 'login') {
        setRoute('dashboard');
      }
    } else {
      if (route !== 'landing' && route !== 'login') {
        setRoute('landing');
      }
    }
  }, [isAuthenticated, loading, route]);

  function handleNavigate(r) { setRoute(r); }

  function handleStartScenario(sc) {
    setScenario(sc);
    setRoute('simulator');
  }

  function handleBackToDashboard() {
    setRoute('dashboard');
    setScenario(null);
  }

  function handleLogout() {
    logout();
    setRoute('landing');
  }

  const activeUser = user || { name: 'Student Pilot', role: 'Cadet', callsign: 'N172SP' };
  const activeSession = isLive ? session : null;

  const strip = (
    <InstrumentStrip
      user={activeUser}
      session={isLive ? { frequency: '118.300' } : null}
      steps={route === 'simulator' ? [
        { label: 'Clearance', status: 'cleared' },
        { label: 'Taxi', status: 'active' },
        { label: 'Takeoff', status: 'idle' },
      ] : []}
    />
  );

  return (
    <>
      {/* Universal Space Background */}
      <SpaceCanvas />

      {/* ── Loading Splash ── */}
      {loading ? (
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
      ) : !isAuthenticated ? (
        route === 'login' ? (
          <LoginPage onBackToLanding={() => setRoute('landing')} />
        ) : (
          <LandingPage
            onLoginClick={() => setRoute('login')}
            onDirectTalkClick={() => setRoute('login')}
          />
        )
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
            <SimulatorPage scenario={scenario} onBack={handleBackToDashboard} />
          )}

          {route === 'scenarios' && (
            <ScenariosPage onStartScenario={handleStartScenario} />
          )}

          {route === 'history' && (
            <HistoryPage />
          )}

          {route === 'settings' && (
            <SettingsPage user={activeUser} />
          )}
        </Layout>
      )}
    </>
  );
}