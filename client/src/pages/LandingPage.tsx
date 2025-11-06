import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home } from 'lucide-react';
import EnergyCard from '../components/EnergyCard';
import ThemeToggle from '../components/ThemeToggle';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page overflow-hidden h-screen">
      {/* Global Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary/80 backdrop-blur-sm text-primary-foreground border-b border-primary-border/50">
        <div className="px-4 py-4 flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-20"></div>
          
          {/* Center: WEC Logo Image */}
          <div className="flex-1 flex justify-center">
            <img 
              src="/weclogotanwht.png" 
              alt="WEC Championships" 
              className="h-10 w-auto"
            />
          </div>
          
          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

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
      
      <main className="absolute top-16 bottom-0 left-0 right-0 flex items-center justify-center z-10">
        <div className="relative" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '10%' }}>
          {/* Text Above Clock */}
          <div className="absolute text-center text-primary-foreground" style={{ top: '-120px' }}>
            <div className="text-3xl font-bold tracking-widest">WEC</div>
            <div className="text-2xl font-bold tracking-widest">TOURNAMENT</div>
            <div className="text-2xl font-bold tracking-widest">HOST</div>
          </div>
          
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
    </div>
  );
};

export default LandingPage;
