import React from 'react';
import { NavLink } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import PhotoCarousel from '../components/PhotoCarousel';
import { wecPhotoAlbum, carouselSettings } from '../config/photoAlbum';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page overflow-hidden h-screen">
      <AppHeader logoSize="large" />

      {/* Photo Carousel Background */}
      <div className="landing-background">
        <PhotoCarousel
          images={wecPhotoAlbum}
          autoPlayInterval={carouselSettings.autoPlayInterval}
          showControls={carouselSettings.showControls}
          className="w-full h-full"
        />
      </div>
      
      {/* Large WEC Logo */}
      <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none">
        <img 
          src="/wec_logo_orange.png" 
          alt="WEC Logo" 
          className="w-96 h-auto opacity-30 filter drop-shadow-lg"
        />
      </div>

      <main className="absolute top-[89px] bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-start pt-8">
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
