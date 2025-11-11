import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home } from 'lucide-react';
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

      {/* Background Image */}
      <div className="landing-background">
        <img 
          src="/baristaPlaceHolder.png" 
          alt="WEC 2025 Milano Background" 
          className="background-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            transform: 'scale(1.5)',
            transformOrigin: 'center center',
            zIndex: 1
          }}
        />
        <div className="background-overlay"></div>
      </div>
      
      {/* Large WEC Logo Overlay */}
      <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none">
        <img 
          src="/wec_logo_wht.png" 
          alt="WEC Logo" 
          className="w-96 h-auto opacity-20 filter drop-shadow-lg"
        />
      </div>

      <main className="absolute top-28 bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-start pt-8">
        {/* Text Overlay */}
        <div className="text-center text-primary-foreground">
          <div className="text-4xl font-bold tracking-widest mb-2">ESPRESSO</div>
          <div className="text-3xl font-bold tracking-widest mb-2">TOURNAMENT</div>
          <div className="text-3xl font-bold tracking-widest">HOST</div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
