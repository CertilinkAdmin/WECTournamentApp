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
          className="w-96 h-auto opacity-30 filter drop-shadow-lg pointer-events-none"
        />
      </div>

      <main className="absolute top-[89px] bottom-0 left-0 right-0 z-10 flex flex-col items-center justify-start pt-8 pointer-events-none">
        {/* Text Overlay - Removed */}
      </main>
    </div>
  );
};

export default LandingPage;
