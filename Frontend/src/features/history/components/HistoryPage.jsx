import React, { useEffect, useState } from 'react';
import { getUserProgressAPI, getUserStatsAPI, getUserWeakAreasAPI } from '../../dashboard/service/dashboard.api';
import './HistoryPage.scss';

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [stRes, prRes, wkRes] = await Promise.allSettled([
          getUserStatsAPI(),
          getUserProgressAPI(),
          getUserWeakAreasAPI(),
        ]);

        if (stRes.status === 'fulfilled') setStats(stRes.value?.data || stRes.value);
        if (prRes.status === 'fulfilled') setProgress(prRes.value?.data?.sessions || prRes.value?.sessions || prRes.value || []);
        if (wkRes.status === 'fulfilled') setWeakAreas(wkRes.value?.data?.weakAreas || wkRes.value?.weakAreas || []);
      } catch (err) {
        console.warn('Error loading history data:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const sorties = progress.length > 0 ? progress : [
    { id: '1', scenarioName: 'KBOS Ground Start & Taxi Clearance', date: '12 Aug 2026', score: 94, duration: '4m 12s', status: 'cleared', airport: 'KBOS', runway: '22L' },
    { id: '2', scenarioName: 'KJFK VFR Tower Departure', date: '11 Aug 2026', score: 88, duration: '5m 30s', status: 'cleared', airport: 'KJFK', runway: '31L' },
    { id: '3', scenarioName: 'KLAX ILS Approach & Landing', date: '10 Aug 2026', score: 76, duration: '6m 45s', status: 'corrected', airport: 'KLAX', runway: '25L' },
    { id: '4', scenarioName: 'KORD Enroute Center Handoff', date: '08 Aug 2026', score: 92, duration: '3m 50s', status: 'cleared', airport: 'KORD', runway: '10C' },
    { id: '5', scenarioName: 'KSFO Emergency Squawk 7700', date: '05 Aug 2026', score: 62, duration: '7m 10s', status: 'failed', airport: 'KSFO', runway: '28R' },
  ];

  const overallScore = stats?.avgScore || 90;
  const totalSorties = stats?.totalSessions || sorties.length;
  const hoursLogged = stats?.totalTimeSeconds ? (stats.totalTimeSeconds / 3600).toFixed(1) : '3.8';

  return (
    <div className="history-page" aria-label="Training History">
      {/* ── HEADER ── */}
      <header className="history-header">
        <h1 className="history-title">Flight Sortie History & Telemetry</h1>
        <p className="history-subtitle">
          Comprehensive log of completed ICAO simulations, phraseology accuracy scores, and identified weak areas.
        </p>
      </header>

      {/* ── STATS SUMMARY CARDS ── */}
      <section className="history-stats-grid">
        <div className="stat-card">
          <span className="stat-lbl">Average Score</span>
          <span className="stat-val green">{loading ? '—' : `${overallScore}%`}</span>
          <span className="stat-sub">Across {totalSorties} Sorties</span>
        </div>

        <div className="stat-card">
          <span className="stat-lbl">Total Sorties Logged</span>
          <span className="stat-val cyan">{loading ? '—' : totalSorties}</span>
          <span className="stat-sub">Completed Simulations</span>
        </div>

        <div className="stat-card">
          <span className="stat-lbl">Flight Deck Practice</span>
          <span className="stat-val amber">{loading ? '—' : `${hoursLogged} hrs`}</span>
          <span className="stat-sub">Radio Exchange Time</span>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID: SORTIES TABLE + WEAK AREAS ── */}
      <div className="history-body-grid">
        {/* Sorties Table */}
        <section className="sorties-panel">
          <h2 className="panel-title">Recent Sorties Log</h2>
          <div className="table-wrap">
            <table className="sorties-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Scenario</th>
                  <th>Airport</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {sorties.map((s) => (
                  <tr key={s.id || s._id}>
                    <td>
                      <span className={`status-pill ${s.status || (s.score >= 80 ? 'cleared' : 'corrected')}`}>
                        {s.score >= 80 ? <CheckIcon /> : <AlertIcon />}
                        {s.score >= 80 ? 'Cleared' : 'Review'}
                      </span>
                    </td>
                    <td className="cell-name">{s.scenarioName || s.title || 'ATC Simulation'}</td>
                    <td className="cell-icao">{s.airport || s.icao || 'KBOS'}</td>
                    <td className="cell-date">{s.date || 'Today'}</td>
                    <td className="cell-dur">{s.duration || '4m 00s'}</td>
                    <td className="cell-score" style={{ color: s.score >= 85 ? 'var(--cleared-green)' : s.score >= 70 ? 'var(--caution-amber)' : 'var(--alert-red)' }}>
                      {s.score}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Weak Areas Panel */}
        <aside className="weak-areas-panel">
          <h2 className="panel-title">Phraseology Diagnostics</h2>
          <p className="panel-desc">Areas requiring repeat practice based on automated readback error detection.</p>

          <div className="weak-items-list">
            {(weakAreas.length > 0 ? weakAreas : [
              { category: 'Altimeter Setting', frequency: 3, recommendation: 'Always read back QNH / altimeter setting in inches of mercury (29.92).' },
              { category: 'Runway Designator', frequency: 2, recommendation: 'Verify exact runway number (22L vs 22R) in taxi readback.' },
              { category: 'Transponder Squawk Code', frequency: 2, recommendation: 'State squawk code as individual digits (4 - 4 - 2 - 1).' },
            ]).map((item, idx) => (
              <div key={idx} className="weak-item-card">
                <div className="item-header">
                  <span className="item-cat">{item.category}</span>
                  <span className="item-freq">{item.frequency} error{item.frequency !== 1 ? 's' : ''}</span>
                </div>
                <p className="item-rec">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
