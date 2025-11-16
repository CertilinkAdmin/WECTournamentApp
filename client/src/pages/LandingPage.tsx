import React from 'react';
import { NavLink } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page overflow-hidden h-screen">
      <AppHeader className="fixed top-0 left-0 right-0 z-50" logoSize="large" />

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
