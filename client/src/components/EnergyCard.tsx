import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AnalogClock from './AnalogClock';
import WEC3DImage from '../public/WEC3D.png';

interface EnergyCardProps {
  to: string;
  icon: string;
  title: string;
  description: string;
  className?: string;
  featured?: boolean;
  liveBadge?: boolean;
  showWecLogo?: boolean;
  containerId: string;
  canvasId: string;
}

const EnergyCard: React.FC<EnergyCardProps> = ({
  to,
  icon,
  title,
  description,
  className = '',
  featured = false,
  liveBadge = false,
  showWecLogo = false,
  containerId,
  canvasId
}) => {
  // Determine if this is the live tournament card (center)
  const isLiveCard = liveBadge && featured;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load VanillaTilt script
    const loadVanillaTilt = () => {
      if (typeof (window as any).VanillaTilt === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/vanilla-tilt@1.7.2/dist/vanilla-tilt.min.js';
        script.onload = () => {
          initializeTilt();
        };
        document.head.appendChild(script);
      } else {
        initializeTilt();
      }
    };

    const initializeTilt = () => {
      if (containerRef.current && typeof (window as any).VanillaTilt !== 'undefined') {
        const card = containerRef.current.querySelector('.card');
        if (card) {
          (window as any).VanillaTilt.init(card, {
            max: 10,
            speed: 400,
            glare: true,
            'max-glare': 0.2
          });
        }
      }
    };

    const initializeEnergyEffect = () => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas || !containerRef.current) return;

      // Simple CSS-based energy effect instead of Three.js
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 300;

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const time = Date.now() * 0.001;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Enable smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Create circular clipping path for perfect round energy effect
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
        ctx.clip();
        
        // Make all overlays completely transparent (invisible)
        for (let i = 0; i < 3; i++) {
          const baseRadius = 100 + i * 20;
          const pulseRadius = baseRadius + Math.sin(time * 1.2 + i * 0.3) * 3;
          const alpha = -0.05; // Completely transparent
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
          
          // Create completely transparent gradient
          const gradient = ctx.createRadialGradient(
            centerX, centerY, pulseRadius - 20, 
            centerX, centerY, pulseRadius + 20
          );
          gradient.addColorStop(0, `rgba(255, 100, 0, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(255, 150, 50, ${alpha})`);
          gradient.addColorStop(1, `rgba(255, 200, 100, ${alpha})`);
          
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        // Restore the clipping path
        ctx.restore();
        
        requestAnimationFrame(animate);
      };
      
      animate();
    };

    loadVanillaTilt();
    initializeEnergyEffect();
  }, [canvasId]);

  return (
    <div className="card-container" id={containerId} ref={containerRef}>
      <canvas id={canvasId}></canvas>
      <Link 
        to={to} 
        className={`landing-button card ${className}`}
        data-tilt 
        data-tilt-max="15" 
        data-tilt-speed="400" 
        data-tilt-perspective="1050" 
        data-tilt-glare 
        data-tilt-max-glare="0.1"
      >
        {/* For outer cards, show WEC3D.png image instead of icon */}
        {!isLiveCard && (
          <div className="wec3d-image">
            <img 
              src={WEC3DImage} 
              alt="WEC 3D Logo" 
            />
          </div>
        )}
        
        {/* For live card, show larger clock */}
        {isLiveCard && (
          <>
            <div className="live-badge">LIVE</div>
            <div className="analog-clock-large">
              <AnalogClock />
              {/* Overlay WEC logo on clock when showWecLogo is true */}
              {showWecLogo && (
                <div className="wec-logo-overlay">
                  <img 
                    src="/weclogotanwht.png" 
                    alt="WEC Logo" 
                    className="wec-logo-image"
                  />
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="button-content">
          <h2 className="button-title">{title}</h2>
          <p className="button-description">{description}</p>
        </div>
        <div className="button-arrow">→</div>
      </Link>
    </div>
  );
};

export default EnergyCard;
