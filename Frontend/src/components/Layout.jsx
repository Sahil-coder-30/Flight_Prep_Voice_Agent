import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="layout-container">
      <header className="layout-header">
        <h1>ATC Voice Simulator</h1>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
}
