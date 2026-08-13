import React, { useEffect, useState } from 'react';
import {
  getUserProgressAPI,
  getUserStatsAPI,
  getUserWeakAreasAPI,
  getUserSessionsAPI,
  getSessionTranscriptAPI,
  createSessionAPI,
  completeSessionAPI,
  updateSessionAPI,
  deleteSessionAPI,
  getScenariosAPI,
} from '../../dashboard/service/dashboard.api';
import './HistoryPage.scss';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [scenariosList, setScenariosList] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Selected session for viewing past chat transcript modal
  const [selectedSortie, setSelectedSortie] = useState(null);
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  // Edit Sortie Modal State (UPDATE)
  const [editSortie, setEditSortie] = useState(null);
  const [editScore, setEditScore] = useState(90);
  const [editStatus, setEditStatus] = useState('completed');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create New Sortie Entry Modal State (CREATE)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [newScore, setNewScore] = useState(95);
  const [creatingSortie, setCreatingSortie] = useState(false);

  // Deleting Sortie State (DELETE)
  const [deletingId, setDeletingId] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [stRes, sessRes, wkRes, scRes] = await Promise.allSettled([
        getUserStatsAPI(),
        getUserSessionsAPI(),
        getUserWeakAreasAPI(),
        getScenariosAPI(),
      ]);

      if (stRes.status === 'fulfilled') setStats(stRes.value?.data || stRes.value);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value?.data?.sessions || sessRes.value?.sessions || []);
      if (wkRes.status === 'fulfilled') setWeakAreas(wkRes.value?.data?.weakAreas || wkRes.value?.weakAreas || []);
      if (scRes.status === 'fulfilled') setScenariosList(scRes.value?.data?.scenarios || scRes.value?.scenarios || []);
    } catch (err) {
      console.warn('Error loading history data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── READ: Transcript Modal ──
  const openPastChat = async (sortie) => {
    setSelectedSortie(sortie);
    setLoadingTranscript(true);
    setTranscriptMessages([]);
    try {
      const sessionId = sortie._id || sortie.id;
      const res = await getSessionTranscriptAPI(sessionId);
      const msgs = res?.data?.messages || res?.messages || [];
      setTranscriptMessages(msgs);
    } catch (e) {
      console.warn('Error fetching session transcript:', e.message);
      setTranscriptMessages([]);
    } finally {
      setLoadingTranscript(false);
    }
  };

  // ── CREATE: Log New Manual Sortie ──
  const handleCreateSortie = async (e) => {
    e.preventDefault();
    if (!selectedScenarioId) {
      alert('Please select a training scenario');
      return;
    }

    try {
      setCreatingSortie(true);
      const createRes = await createSessionAPI(selectedScenarioId);
      const newSession = createRes?.data?.session || createRes?.session;
      const sessionId = newSession?._id || newSession?.id;

      if (sessionId) {
        await completeSessionAPI(sessionId, Number(newScore));
      }

      showToast('✓ Flight sortie entry logged successfully!');
      setShowCreateModal(false);
      setSelectedScenarioId('');
      setNewScore(95);
      await loadData();
    } catch (err) {
      alert('Error creating sortie: ' + err.message);
    } finally {
      setCreatingSortie(false);
    }
  };

  // ── UPDATE: Update Sortie Entry ──
  const handleOpenEdit = (sortie) => {
    setEditSortie(sortie);
    setEditScore(sortie.score || 90);
    setEditStatus(sortie.raw?.status || (sortie.score >= 80 ? 'completed' : 'abandoned'));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editSortie) return;

    try {
      setSavingEdit(true);
      const sessionId = editSortie._id || editSortie.id;
      await updateSessionAPI(sessionId, {
        score: Number(editScore),
        status: editStatus,
      });

      showToast('✓ Sortie details updated successfully!');
      setEditSortie(null);
      await loadData();
    } catch (err) {
      alert('Error updating session: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── DELETE: Delete Sortie Entry ──
  const handleDeleteSortie = async (sortie) => {
    const sessionId = sortie._id || sortie.id;
    if (!window.confirm(`Are you sure you want to delete sortie "${sortie.scenarioName}"?`)) return;

    try {
      setDeletingId(sessionId);
      await deleteSessionAPI(sessionId);
      showToast('✓ Sortie deleted from history');
      await loadData();
    } catch (err) {
      alert('Error deleting session: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Process sessions list
  const formattedSorties = sessions.length > 0 ? sessions.map(s => {
    const sc = s.scenarioId || {};
    const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today';
    return {
      _id: s._id,
      id: s._id,
      scenarioName: sc.title || sc.name || 'ATC Simulation Scenario',
      airport: sc.airport || sc.icao || 'KBOS',
      date: dateStr,
      duration: s.completedAt ? `${Math.round((new Date(s.completedAt) - new Date(s.startedAt || s.createdAt)) / 1000)}s` : 'Active',
      score: s.score !== undefined ? s.score : 95,
      status: s.status === 'completed' ? (s.score >= 80 ? 'cleared' : 'corrected') : 'active',
      raw: s,
    };
  }) : [
    { _id: 's_01', scenarioName: 'KBOS Ground Start & Taxi Clearance', date: '12 Aug 2026', score: 96, duration: '4m 12s', status: 'cleared', airport: 'KBOS', runway: '22L' },
    { _id: 's_02', scenarioName: 'KJFK VFR Tower Departure', date: '11 Aug 2026', score: 88, duration: '5m 30s', status: 'cleared', airport: 'KJFK', runway: '31L' },
    { _id: 's_03', scenarioName: 'KLAX ILS Approach & Landing', date: '10 Aug 2026', score: 76, duration: '6m 45s', status: 'corrected', airport: 'KLAX', runway: '25L' },
    { _id: 's_04', scenarioName: 'KORD Enroute Center Handoff', date: '08 Aug 2026', score: 92, duration: '3m 50s', status: 'cleared', airport: 'KORD', runway: '10C' },
    { _id: 's_05', scenarioName: 'KSFO Emergency Squawk 7700', date: '05 Aug 2026', score: 62, duration: '7m 10s', status: 'corrected', airport: 'KSFO', runway: '28R' },
  ];

  // Filtered list
  const filteredSorties = formattedSorties.filter((s) => {
    const matchesSearch = s.scenarioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.airport.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' ||
                          (filterStatus === 'CLEARED' && s.score >= 80) ||
                          (filterStatus === 'REVIEW' && s.score < 80);
    return matchesSearch && matchesStatus;
  });

  const overallScore = stats?.avgScore || 90;
  const totalSorties = stats?.totalSessions || formattedSorties.length;
  const hoursLogged = stats?.totalTimeSeconds ? (stats.totalTimeSeconds / 3600).toFixed(1) : '4.2';

  return (
    <div className="history-page" aria-label="Training History">
      {/* ── HEADER WITH ACTIONS ── */}
      <header className="history-header">
        <div className="header-text">
          <h1 className="history-title">Flight Sortie History & Telemetry</h1>
          <p className="history-subtitle">
            Manage your completed ICAO simulations, edit scores, inspect transmission logs, or purge past entries.
          </p>
        </div>

        <button
          className="btn btn-cyan btn-lg btn-add-sortie"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon /> Log Manual Sortie
        </button>
      </header>

      {toastMessage && (
        <div className="history-toast-success" role="alert">
          {toastMessage}
        </div>
      )}

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

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="history-controls-bar">
        <div className="search-input-box">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search airport, ICAO, or scenario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {['ALL', 'CLEARED', 'REVIEW'].map((st) => (
            <button
              key={st}
              className={`tab-btn ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT GRID: SORTIES TABLE + WEAK AREAS ── */}
      <div className="history-body-grid">
        {/* Sorties Table */}
        <section className="sorties-panel">
          <div className="panel-top-row">
            <h2 className="panel-title">Sorties Log ({filteredSorties.length})</h2>
          </div>

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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSorties.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--readout-dim)' }}>
                      No matching flight sorties found.
                    </td>
                  </tr>
                ) : (
                  filteredSorties.map((s) => (
                    <tr key={s._id || s.id}>
                      <td>
                        <span className={`status-pill ${s.score >= 80 ? 'cleared' : 'corrected'}`}>
                          {s.score >= 80 ? <CheckIcon /> : <AlertIcon />}
                          {s.score >= 80 ? 'Cleared' : 'Review'}
                        </span>
                      </td>
                      <td className="cell-name">{s.scenarioName}</td>
                      <td className="cell-icao">{s.airport}</td>
                      <td className="cell-date">{s.date}</td>
                      <td className="cell-dur">{s.duration}</td>
                      <td className="cell-score" style={{ color: s.score >= 85 ? 'var(--cleared-green)' : s.score >= 70 ? 'var(--caution-amber)' : 'var(--alert-red)' }}>
                        {s.score}%
                      </td>
                      <td className="cell-actions">
                        <button
                          className="btn-action-icon btn-chat"
                          onClick={() => openPastChat(s)}
                          title="View Radio Chat Log"
                        >
                          <ChatIcon />
                        </button>
                        <button
                          className="btn-action-icon btn-edit"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Sortie Details"
                        >
                          <EditIcon />
                        </button>
                        <button
                          className="btn-action-icon btn-delete"
                          onClick={() => handleDeleteSortie(s)}
                          disabled={deletingId === (s._id || s.id)}
                          title="Delete Sortie Entry"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Phraseology Weak Areas Diagnostics */}
        <aside className="weak-areas-panel">
          <h2 className="panel-title">Phraseology Diagnostics</h2>
          <p className="panel-desc">Automated readback feedback based on simulation logs.</p>

          <div className="weak-items-list">
            {(weakAreas.length > 0 ? weakAreas : [
              { category: 'Altimeter QNH Setting', frequency: 3, recommendation: 'Always read back altimeter setting in inches of mercury (e.g., 29.92).' },
              { category: 'Runway Designator', frequency: 2, recommendation: 'Verify exact runway number (22L vs 22R) in taxi readbacks.' },
              { category: 'Squawk Code Phonetics', frequency: 2, recommendation: 'State squawk code as individual digits (e.g., 4 - 4 - 2 - 1).' },
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

      {/* ── CREATE MODAL (LOG MANUAL SORTIE) ── */}
      {showCreateModal && (
        <div className="past-chat-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="past-chat-modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-info">
                <h3>Log Manual Sortie Entry</h3>
                <p className="modal-meta">Add a completed simulation entry into your flight deck telemetry.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </header>

            <form onSubmit={handleCreateSortie} className="crud-form">
              <div className="form-group">
                <label>Select Training Scenario</label>
                <select
                  className="crud-select"
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  required
                >
                  <option value="">-- Select Scenario --</option>
                  {(scenariosList.length > 0 ? scenariosList : [
                    { _id: 'scen_01', title: 'KBOS Ground Start & Taxi Clearance', airport: 'KBOS' },
                    { _id: 'scen_02', title: 'KJFK VFR Tower Departure', airport: 'KJFK' },
                    { _id: 'scen_03', title: 'KLAX ILS Approach & Landing', airport: 'KLAX' },
                    { _id: 'scen_04', title: 'KORD Enroute Center Handoff', airport: 'KORD' },
                    { _id: 'scen_05', title: 'KSFO Emergency Squawk 7700', airport: 'KSFO' },
                  ]).map((sc) => (
                    <option key={sc._id || sc.id} value={sc._id || sc.id}>
                      {sc.airport ? `[${sc.airport}] ` : ''}{sc.title || sc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phraseology Score (%): {newScore}%</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  className="crud-range"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-cyan" disabled={creatingSortie}>
                  {creatingSortie ? 'Logging...' : 'Save Sortie Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPDATE MODAL (EDIT SORTIE DETAILS) ── */}
      {editSortie && (
        <div className="past-chat-modal-overlay" onClick={() => setEditSortie(null)}>
          <div className="past-chat-modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-info">
                <span className="modal-badge">{editSortie.airport}</span>
                <h3>Edit Sortie — {editSortie.scenarioName}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditSortie(null)}>✕</button>
            </header>

            <form onSubmit={handleSaveEdit} className="crud-form">
              <div className="form-group">
                <label>Phraseology Score (%): {editScore}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="crud-range"
                  value={editScore}
                  onChange={(e) => setEditScore(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Session Status</label>
                <select
                  className="crud-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="completed">Completed (Cleared)</option>
                  <option value="active">Active (In Flight)</option>
                  <option value="abandoned">Abandoned (Needs Practice)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditSortie(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-cyan" disabled={savingEdit}>
                  {savingEdit ? 'Updating...' : 'Update Sortie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAST SORTIE CHAT TRANSCRIPT MODAL DRAWER ── */}
      {selectedSortie && (
        <div className="past-chat-modal-overlay" onClick={() => setSelectedSortie(null)}>
          <div className="past-chat-modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="modal-header">
              <div className="header-info">
                <span className="modal-badge">{selectedSortie.airport}</span>
                <h3>{selectedSortie.scenarioName}</h3>
                <p className="modal-meta">
                  Sortie Date: <strong>{selectedSortie.date}</strong> • Score: <strong style={{ color: selectedSortie.score >= 80 ? 'var(--cleared-green)' : 'var(--caution-amber)' }}>{selectedSortie.score}%</strong>
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedSortie(null)} aria-label="Close modal">
                ✕
              </button>
            </header>

            <div className="modal-body">
              {loadingTranscript ? (
                <div className="modal-loading-state">
                  <span className="loading-spinner" />
                  <p>Retrieving stored radio chat transcript…</p>
                </div>
              ) : transcriptMessages.length === 0 ? (
                <div className="modal-empty-state">
                  <p className="empty-msg">No stored radio transmission logs found for this simulation session.</p>
                  <p className="empty-hint">Transcripts are automatically recorded when radio callouts occur during active simulator runs.</p>
                </div>
              ) : (
                <div className="transcript-chat-list">
                  {transcriptMessages.map((msg, idx) => (
                    <div key={idx} className={`transcript-bubble ${msg.role === 'pilot' ? 'pilot-bubble' : 'atc-bubble'}`}>
                      <div className="bubble-header">
                        <span className="speaker-name">{msg.role === 'pilot' ? 'PILOT (N172SP)' : 'AI CONTROLLER (ATC TOWER)'}</span>
                        <span className="msg-time">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </span>
                      </div>
                      <p className="msg-text">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
