import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import './LiveLayout.css';

const LiveLayout: React.FC = () => {
  return (
    <div className="live-layout">
      <header className="live-header">
        <div className="live-header-content">
          <Link to="/" className="live-logo">
            <span className="logo-icon">📺</span>
            <span className="logo-text">Live Tournament</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="live-status">
              <div className="status-indicator live"></div>
              <span className="status-text">LIVE</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="live-content-full">
        <Outlet />
      </main>
    </div>
  );
};

export default LiveLayout;
