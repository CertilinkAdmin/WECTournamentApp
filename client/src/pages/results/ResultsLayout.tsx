import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import './ResultsLayout.css';

const ResultsLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/results', label: 'WEC 2025 Results', icon: '🏆' },
    { path: '/results/bracket', label: 'Tournament Bracket', icon: '📊' },
    { path: '/results/leaderboard', label: 'Final Standings', icon: '🥇' },
    { path: '/results/champion', label: 'Champion', icon: '👑' },
    { path: '/results/judges', label: 'Judge Scores', icon: '⚖️' }
  ];

  return (
    <div className="results-layout">
      <header className="results-header">
        <div className="results-header-content">
          <Link to="/" className="results-logo">
            <span className="logo-icon">🏆</span>
            <span className="logo-text">WEC 2025 Milano Results</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="results-status">
              <div className="status-indicator completed"></div>
              <span className="status-text">COMPLETED</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="results-main">
        <nav className="results-sidebar">
          <div className="sidebar-header">
            <h3>Tournament Results</h3>
            <p>WEC 2025 Milano Championship</p>
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

        <main className="results-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ResultsLayout;
