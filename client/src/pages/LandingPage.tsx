import React from 'react';
import { Link } from 'react-router-dom';
import EnergyCard from '../components/EnergyCard';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Background Video */}
      <div className="landing-background">
        <video 
          className="background-video" 
          autoPlay 
          muted 
          loop 
          playsInline
          poster="/eespresso.png"
        >
          <source src="/freecompress-coffeetransition (3).mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <img src="/eespresso.png" alt="WEC 2025 Milano Background" className="background-image" />
        </video>
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
                    <EnergyCard
                      to="/admin"
                      icon="🏗️"
                      title="Admin/TournamentBuilder"
                      description="Create and manage tournaments, competitors, judges, and stations"
                      className="admin-button"
                      containerId="adminCardContainer"
                      canvasId="admin-energy-canvas"
                    />
                  </div>

          {/* Live Tournament - Center Column (Featured) */}
          <div className="column-section center-column">
            <EnergyCard
              to="/live"
              icon="📺"
              title="Live Tournament"
              description="Real-time tournament monitoring and live score updates"
              className="live-button featured"
              featured={true}
              liveBadge={true}
              containerId="liveCardContainer"
              canvasId="live-energy-canvas"
            />
          </div>

          {/* WEC 2025 Milano Results - Right Column */}
          <div className="column-section right-column">
            <EnergyCard
              to="/results"
              icon="🏆"
              title="WEC 2025 Milano Results"
              description="View complete tournament results, scores, and champion details"
              className="results-button"
              containerId="resultsCardContainer"
              canvasId="results-energy-canvas"
            />
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
