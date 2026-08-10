import React, { useState } from 'react';
import { BarChart3, Bell, BookOpen, Check, ChevronDown, CircleHelp, LayoutDashboard, LogOut, Mic2, Settings2 } from 'lucide-react';

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Simulator', icon: Mic2 },
  { label: 'Scenarios', icon: BookOpen },
  { label: 'Progress', icon: BarChart3 },
];

const initialNotifications = [
  { id: 1, title: 'New scenario unlocked', detail: 'ILS approach sequence is ready to practice.', time: '8 min ago', tone: 'coral', unread: true },
  { id: 2, title: 'Streak milestone', detail: 'You are one day away from a five-day streak.', time: '1 hour ago', tone: 'teal', unread: true },
  { id: 3, title: 'Session feedback available', detail: 'Your latest readback scored 91% accuracy.', time: 'Yesterday', tone: 'gold', unread: false },
];

export default function Layout({ children, activeNav, onNavigate }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Mic2 size={18} /></span><span>air<span>space</span></span></div>
        <p className="nav-label">Workspace</p>
        <nav>{navigation.map(({ label, icon: Icon }) => <button className={activeNav === label ? 'active' : ''} key={label} onClick={() => onNavigate(label)}><Icon size={18} /><span>{label}</span>{label === 'Simulator' && <i className="nav-live" />}</button>)}</nav>
        <div className="sidebar-bottom"><button onClick={() => onNavigate('Settings')}><Settings2 size={18} /> <span>Settings</span></button><button><CircleHelp size={18} /> <span>Help center</span></button><div className="profile"><span className="avatar">JM</span><span><strong>Jordan Miller</strong><small>Student pilot</small></span><ChevronDown size={15} /></div><button className="logout"><LogOut size={17} /> <span>Sign out</span></button></div>
      </aside>
      <div className="main-area">
        <header className="layout-header"><div><span className="breadcrumb">Workspace / </span><strong>{activeNav}</strong></div><div className="header-actions"><div className="notification-wrap"><button className={`icon-button notification ${notificationsOpen ? 'open' : ''}`} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={notificationsOpen} title="Notifications" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={18} />{unreadCount > 0 && <i />}</button>{notificationsOpen && <div className="notification-panel"><div className="notification-header"><div><strong>Notifications</strong><small>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</small></div>{unreadCount > 0 && <button onClick={markAllRead}><Check size={14} /> Mark all read</button>}</div><div className="notification-list">{notifications.map((notification) => <button className={`notification-item ${notification.unread ? 'unread' : ''}`} key={notification.id} onClick={markAllRead}><span className={`notification-icon ${notification.tone}`}><Bell size={14} /></span><span><strong>{notification.title}</strong><small>{notification.detail}</small><time>{notification.time}</time></span>{notification.unread && <i />}</button>)}</div></div>}</div><span className="header-date">UTC 09:41</span></div></header>
        <main className="layout-main">{children}</main>
      </div>
    </div>
  );
}
