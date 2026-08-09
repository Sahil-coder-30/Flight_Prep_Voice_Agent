import React from 'react';
import Layout from './components/Layout';

export default function App() {
  return (
    <Layout>
      <div className="dashboard-preview">
        <h2>Welcome to Air Traffic Control Voice Simulator</h2>
        <p>Select a scenario to begin radio phraseology training.</p>
      </div>
    </Layout>
  );
}
