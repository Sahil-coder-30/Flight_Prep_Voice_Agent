import React, { useEffect } from 'react';
import { useScenarios } from '../Hooks/scenarios.hooks';
import './ScenariosPage.scss';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-.9.1-1.2.5l-.9.9c-.3.3-.3.8 0 1.1l5.1 4-3.1 3.1-2.4-.6c-.3-.1-.6 0-.8.2l-.6.6c-.2.2-.2.6 0 .8l3.2 3.2 3.2 3.2c.2.2.6.2.8 0l.6-.6c.2-.2.3-.5.2-.8l-.6-2.4 3.1-3.1 4 5.1c.3.3.8.3 1.1 0l.9-.9c.4-.3.6-.7.5-1.2z"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

const FALLBACK_CATALOG = [
  {
    id: 'scen_01',
    _id: 'scen_01',
    name: 'KBOS Ground Start & Taxi Clearance',
    title: 'KBOS Ground Start & Taxi Clearance',
    airport: 'Boston Logan International (KBOS)',
    icao: 'KBOS',
    runway: '22L',
    difficulty: 'Beginner',
    tag: 'GND',
    color: 'cyan',
    description: 'Practice pushback, engine start, taxi routing via Taxiway Alpha, and holding short instructions with Boston Ground.',
    aircraftCallsign: 'N172SP',
    steps: [
      { stepId: 's1', phase: 'ground', procedureType: 'clearance_delivery' },
      { stepId: 's2', phase: 'ground', procedureType: 'pushback' },
      { stepId: 's3', phase: 'ground', procedureType: 'taxi' },
    ],
  },
  {
    id: 'scen_02',
    _id: 'scen_02',
    name: 'KJFK VFR Tower Departure',
    title: 'KJFK VFR Tower Departure',
    airport: 'John F. Kennedy Intl (KJFK)',
    icao: 'KJFK',
    runway: '31L',
    difficulty: 'Beginner',
    tag: 'DEP',
    color: 'green',
    description: 'Request VFR departure clearance, acknowledge line up & wait instructions, and receive takeoff roll clearance.',
    aircraftCallsign: 'N5CD',
    steps: [
      { stepId: 's1', phase: 'tower', procedureType: 'line_up_and_wait' },
      { stepId: 's2', phase: 'tower', procedureType: 'takeoff' },
    ],
  },
  {
    id: 'scen_03',
    _id: 'scen_03',
    name: 'KLAX ILS Approach & Landing',
    title: 'KLAX ILS Approach & Landing',
    airport: 'Los Angeles Intl (KLAX)',
    icao: 'KLAX',
    runway: '25L',
    difficulty: 'Intermediate',
    tag: 'APP',
    color: 'amber',
    description: 'Interlock with SoCal Approach for vectors onto the ILS 25L localizer, execute glide slope intercept, and receive landing clearance.',
    aircraftCallsign: 'N9028',
    steps: [
      { stepId: 's1', phase: 'approach', procedureType: 'vector' },
      { stepId: 's2', phase: 'approach', procedureType: 'landing_clearance' },
    ],
  },
  {
    id: 'scen_04',
    _id: 'scen_04',
    name: 'KORD Enroute Center Handoff',
    title: 'KORD Enroute Center Handoff',
    airport: 'Chicago O\'Hare Intl (KORD)',
    icao: 'KORD',
    runway: '10C',
    difficulty: 'Intermediate',
    tag: 'ENR',
    color: 'cyan',
    description: 'Manage high-altitude radar handoffs, altimeter reset calls, and speed restriction compliance with Chicago Center.',
    aircraftCallsign: 'AAL104',
    steps: [
      { stepId: 's1', phase: 'center', procedureType: 'frequency_change' },
      { stepId: 's2', phase: 'center', procedureType: 'altitude_restriction' },
    ],
  },
  {
    id: 'scen_05',
    _id: 'scen_05',
    name: 'KSFO Emergency Squawk 7700',
    title: 'KSFO Emergency Squawk 7700',
    airport: 'San Francisco Intl (KSFO)',
    icao: 'KSFO',
    runway: '28R',
    difficulty: 'Advanced',
    tag: 'EMG',
    color: 'red',
    description: 'Declare MAYDAY emergency due to engine failure, coordinate priority vectors, and request emergency equipment on arrival.',
    aircraftCallsign: 'N770EM',
    steps: [
      { stepId: 's1', phase: 'approach', procedureType: 'emergency_declaration' },
      { stepId: 's2', phase: 'approach', procedureType: 'priority_landing' },
    ],
  },
];

export default function ScenariosPage({ onStartScenario }) {
  const {
    filteredScenarios,
    filterDifficulty,
    setFilterDifficulty,
    searchQuery,
    setSearchQuery,
    loading,
    loadScenarios,
  } = useScenarios();

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const displayList = filteredScenarios.length > 0 ? filteredScenarios : FALLBACK_CATALOG;

  return (
    <div className="scenarios-page" aria-label="Scenario Catalog">
      {/* ── HEADER & SEARCH FILTER BAR ── */}
      <div className="scenarios-header">
        <div className="header-titles">
          <h1 className="scenarios-title">ICAO Flight Scenario Catalog</h1>
          <p className="scenarios-subtitle">
            Select a targeted airspace scenario to practice phraseology with AI Air Traffic Controllers.
          </p>
        </div>

        <div className="scenarios-controls">
          <div className="search-bar">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search airport, ICAO, or scenario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search scenarios"
            />
          </div>

          <div className="difficulty-tabs" role="tablist" aria-label="Filter by difficulty">
            {['ALL', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
              <button
                key={lvl}
                role="tab"
                aria-selected={filterDifficulty === lvl}
                className={`tab-btn ${filterDifficulty === lvl ? 'active' : ''}`}
                onClick={() => setFilterDifficulty(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SCENARIO GRID ── */}
      {loading ? (
        <div className="scenarios-loading">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading flight scenarios catalog…</p>
        </div>
      ) : (
        <div className="scenarios-grid">
          {displayList.map((sc) => {
            const diffClass = (sc.difficulty || 'Beginner').toLowerCase();
            const tagColor = sc.color || (diffClass === 'advanced' ? 'red' : diffClass === 'intermediate' ? 'amber' : 'green');
            return (
              <article key={sc.id || sc._id} className="scenario-card">
                <div className="card-badge-row">
                  <span className={`tag-chip tag-${tagColor}`}>
                    {sc.tag || sc.icao || 'ATC'}
                  </span>
                  <span className={`diff-chip diff-${diffClass}`}>
                    {sc.difficulty || 'Standard'}
                  </span>
                </div>

                <h3 className="card-title">{sc.name || sc.title}</h3>
                <p className="card-airport">{sc.airport || sc.icao || 'KBOS'}</p>

                <p className="card-desc">
                  {sc.description || 'Master standard ICAO radio check and ATC clearances with instant phraseology feedback.'}
                </p>

                <div className="card-meta">
                  <span className="meta-item">
                    <PlaneIcon /> RWY {sc.runway || '22L'}
                  </span>
                  <span className="meta-item">
                    {sc.steps?.length || 3} Procedure Step{(sc.steps?.length || 3) > 1 ? 's' : ''}
                  </span>
                </div>

                <button
                  className="btn btn-cyan btn-block card-launch-btn"
                  onClick={() => onStartScenario?.(sc)}
                >
                  Launch Sortie <ChevronRight />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
