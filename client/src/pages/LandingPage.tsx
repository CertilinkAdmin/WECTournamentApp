import React from 'react';
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
        <div className="single-circle-container">
          {/* Live Tournament - Single Center Circle with Clock and WEC Logo */}
          <EnergyCard
            to="/live"
            icon="📺"
            title="Live Tour"
            description="Real-time tournament monitoring and live updates"
            className="live-button featured single-circle"
            featured={true}
            liveBadge={true}
            showWecLogo={true}
            containerId="liveCardContainer"
            canvasId="live-energy-canvas"
          />
        </div>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <p className="footer-text">World Espresso Championships 2025 Milano</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
