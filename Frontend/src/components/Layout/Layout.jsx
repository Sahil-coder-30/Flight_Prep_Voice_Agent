import React, { useState, useEffect } from 'react';
import './Layout.scss';

function HomeIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function PlayIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function BookIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function ClockIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function LogoutIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function LayersIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>; }
function ChevronIcon({ collapsed }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}><polyline points="15 18 9 12 15 6"/></svg>; }
function MenuIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  Icon: HomeIcon,   badge: null },
  { id: 'simulator',  label: 'Simulator',  Icon: PlayIcon,   badge: 'LIVE' },
  { id: 'scenarios',  label: 'Scenarios',  Icon: BookIcon,   badge: null },
  { id: 'history',    label: 'History',    Icon: ClockIcon,  badge: null },
];

const BOTTOM_NAV = [
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Layout({ children, activeRoute, onNavigate, user, session, onLogout, instrumentStrip }) {
  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('atc_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('atc_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  const handleNavClick = (id) => {
    onNavigate(id);
    setIsMobileOpen(false);
  };

  return (
    <div className={`app-shell${isCollapsed ? ' sidebar-collapsed' : ''}`} role="application">
      {/* Mobile Bar */}
      <div className="mobile-header">
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileOpen(s => !s)}
          aria-label="Toggle navigation menu"
        >
          <MenuIcon />
        </button>
        <div className="mobile-brand">
          <LayersIcon />
          <span>ATC Simulator</span>
        </div>
      </div>

      {/* Persistent instrument strip */}
      {instrumentStrip}

      <div className="app-body">
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <nav
          className={`app-sidebar${isCollapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}
          aria-label="Main navigation"
        >
          {/* Brand */}
          <div className="app-sidebar__brand">
            <div className="brand-main">
              <div className="brand-icon" aria-hidden="true">
                <LayersIcon />
              </div>
              <div className="brand-text">
                <strong>ATC Simulator</strong>
                <small>v1.0 · Cockpit</small>
              </div>
            </div>
            <button
              className="sidebar-collapse-btn"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronIcon collapsed={isCollapsed} />
            </button>
          </div>

          {/* Primary nav */}
          <div className="app-sidebar__nav">
            <p className="nav-section-label">Training</p>
            {NAV_ITEMS.map(({ id, label, Icon, badge }) => {
              const isActive = activeRoute === id;
              return (
                <button
                  key={id}
                  id={`nav-${id}`}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  onClick={() => handleNavClick(id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={label}
                  data-tooltip={label}
                >
                  <Icon />
                  <span className="nav-label">{label}</span>
                  {badge && (
                    <span className="nav-badge chip chip-cyan">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom nav */}
          <div className="app-sidebar__bottom">
            {BOTTOM_NAV.map(({ id, label, Icon }) => {
              const isActive = activeRoute === id;
              return (
                <button
                  key={id}
                  id={`nav-${id}`}
                  className={`nav-item${isActive ? ' active' : ''}`}
                  onClick={() => handleNavClick(id)}
                  aria-label={label}
                  data-tooltip={label}
                >
                  <Icon />
                  <span className="nav-label">{label}</span>
                </button>
              );
            })}

            {/* User profile */}
            {user && (
              <div className="sidebar-user-block">
                <div
                  className="sidebar-profile"
                  role="group"
                  aria-label="User profile"
                  data-tooltip={`${user.name || 'Trainee'} (${user.role || 'Student'})`}
                >
                  <div className="profile-avatar">
                    {user.avatar ? <img src={user.avatar} alt={user.name} /> : initial}
                  </div>
                  <div className="profile-info">
                    <strong>{user.name || 'Trainee'}</strong>
                    <small>{user.role || 'Student'}</small>
                  </div>
                </div>
                <button
                  id="btn-logout"
                  className="nav-item logout-item"
                  onClick={onLogout}
                  aria-label="Log out"
                  data-tooltip="Log out"
                >
                  <LogoutIcon />
                  <span className="nav-label">Log out</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Page content */}
        <div className="app-content" role="main">
          {children}
        </div>
      </div>
    </div>
  );
}

