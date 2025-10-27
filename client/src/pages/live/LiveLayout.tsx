import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './LiveLayout.css';

const LiveLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/live', label: 'Live Overview', icon: '📺' },
    { path: '/live/bracket', label: 'Bracket', icon: '🏆' },
    { path: '/live/heats', label: 'Current Heats', icon: '⚡' },
    { path: '/live/leaderboard', label: 'Leaderboard', icon: '📊' },
    { path: '/live/stations', label: 'Stations', icon: '🏪' }
  ];

  return (
    <div className="live-layout">
      <header className="live-header">
        <div className="live-header-content">
          <Link to="/" className="live-logo">
            <span className="logo-icon">📺</span>
            <span className="logo-text">Live Tournament</span>
          </Link>
          <div className="live-status">
            <div className="status-indicator live"></div>
            <span className="status-text">LIVE</span>
          </div>
        </div>
      </header>

      <div className="live-main">
        <nav className="live-sidebar">
          <div className="sidebar-header">
            <h3>Live Monitoring</h3>
            <p>Real-time tournament updates</p>
          </div>
          
          <ul className="sidebar-nav">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="live-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LiveLayout;
