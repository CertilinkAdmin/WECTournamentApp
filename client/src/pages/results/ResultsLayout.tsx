import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import './ResultsLayout.css';

const ResultsLayout: React.FC = () => {
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

      <main className="results-content-full">
        <Outlet />
      </main>
    </div>
  );
};

export default ResultsLayout;
