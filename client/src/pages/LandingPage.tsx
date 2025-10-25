import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Background Image */}
      <div className="landing-background">
        <img src="/eespresso.png" alt="WEC 2025 Milano Background" className="background-image" />
        <div className="background-overlay"></div>
      </div>
      
      <header className="landing-header">
        <div className="logo-section">
          <h1 className="main-title">World Espresso Championships</h1>
          <p className="subtitle">Tournament Management System</p>
          <div className="year-badge">WEC 2025 Milano</div>
        </div>
      </header>
      
      <main className="main-options">
        <div className="options-grid three-columns">
          {/* Admin/TournamentBuilder - Left Column */}
          <div className="column-section left-column">
            <Link to="/admin" className="landing-button admin-button">
              <div className="button-icon">🏗️</div>
              <div className="button-content">
                <h2 className="button-title">Admin/TournamentBuilder</h2>
                <p className="button-description">
                  Create and manage tournaments, competitors, judges, and stations
                </p>
              </div>
              <div className="button-arrow">→</div>
            </Link>
          </div>

          {/* Live Tournament - Center Column (Featured) */}
          <div className="column-section center-column">
            <Link to="/live" className="landing-button live-button featured">
              <div className="button-icon">📺</div>
              <div className="live-badge">LIVE</div>
              <div className="button-content">
                <h2 className="button-title">Live Tournament</h2>
                <p className="button-description">
                  Real-time tournament monitoring and live score updates
                </p>
              </div>
              <div className="button-arrow">→</div>
            </Link>
          </div>

          {/* WEC 2025 Milano Results - Right Column */}
          <div className="column-section right-column">
            <Link to="/results" className="landing-button results-button">
              <div className="button-icon">🏆</div>
              <div className="button-content">
                <h2 className="button-title">WEC 2025 Milano Results</h2>
                <p className="button-description">
                  View complete tournament results, scores, and champion details
                </p>
              </div>
              <div className="button-arrow">→</div>
            </Link>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <p className="footer-text">World Espresso Championships 2025 Milano</p>
          <div className="footer-links">
            <a href="/results" className="footer-link">Results</a>
            <a href="/live" className="footer-link">Live</a>
            <a href="/admin" className="footer-link">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
