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
        <div className="px-4 py-6 flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-20"></div>
          
          {/* Center: WEC Logo Image */}
          <div className="flex-1 flex justify-center">
            <img 
              src="/wec_logo_wht.png" 
              alt="WEC Championships" 
              className="h-20 w-auto"
            />
          </div>
          
          {/* Right: Theme Toggle */}
          <div className="w-20 flex items-center justify-end gap-2">
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
      
      <main className="absolute top-28 bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-start pt-8">
        {/* Text Above Clock */}
        <div className="text-center text-primary-foreground mb-8">
          <div className="text-3xl font-bold tracking-widest">ESPRESSO</div>
          <div className="text-2xl font-bold tracking-widest">TOURNAMENT</div>
          <div className="text-2xl font-bold tracking-widest">HOST</div>
        </div>
        
        {/* Live Tournament - Single Center Circle with Clock and WEC Logo */}
        <div className="flex justify-center w-full">
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
