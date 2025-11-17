import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { findTournamentBySlug } from '@/utils/tournamentUtils';
import './Judges.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface TournamentParticipant {
  id: number;
  userId: number;
  seed: number | null;
  finalRank: number | null;
}

interface JudgeWithData {
  id: number;
  name: string;
  email: string;
  participantId: number;
  seed: number | null;
  rank: number;
}

interface JudgesProps {}

// Fallback list with tournament judges
const FALLBACK_JUDGES = [
  { id: 1, name: 'Jasper', rank: 1 },
  { id: 2, name: 'Korn', rank: 2 },
  { id: 3, name: 'Michalis', rank: 3 },
  { id: 4, name: 'Shinsaku', rank: 4 },
  { id: 5, name: 'Ali', rank: 5 },
  { id: 6, name: 'Junior', rank: 6 },
  { id: 7, name: 'Tess', rank: 7 },
  { id: 8, name: 'Boss', rank: 8 },
];

const Judges: React.FC<JudgesProps> = () => {
  const navigate = useNavigate();
  const { tournamentSlug } = useParams<{ tournamentSlug: string }>();
  const [progress, setProgress] = useState(50);
  const [startX, setStartX] = useState(0);
  const [active, setActive] = useState(0);
  const [isDown, setIsDown] = useState(false);
  
  const speedWheel = 0.02;
  const speedDrag = -0.1;

  // Always use the specified tournament judges (fallback list)
  const judges = useMemo(() => {
    // Always use the fallback judges list for the tournament
    console.log('Using tournament judges:', FALLBACK_JUDGES.map(j => j.name));
    return FALLBACK_JUDGES;
  }, []);

  const getZindex = (array: any[], index: number) => {
    return array.map((_, i) => 
      (index === i) ? array.length : array.length - Math.abs(index - i)
    );
  };

  const displayItems = (item: HTMLElement, index: number, activeIndex: number) => {
    if (judges.length === 0) return;
    const zIndex = getZindex(judges, activeIndex)[index];
    item.style.setProperty('--zIndex', zIndex.toString());
    item.style.setProperty('--active', ((index - activeIndex) / judges.length).toString());
  };

  const animate = () => {
    if (judges.length === 0) return;
    const clampedProgress = Math.max(0, Math.min(progress, 100));
    const maxIndex = Math.max(0, judges.length - 1);
    const newActive = maxIndex > 0 ? Math.floor(clampedProgress / 100 * maxIndex) : 0;
    setActive(newActive);
    
    const items = document.querySelectorAll('.carousel-item');
    items.forEach((item, index) => {
      if (index < judges.length) {
        displayItems(item as HTMLElement, index, newActive);
      }
    });
  };


  useEffect(() => {
    if (judges.length > 0) {
      animate();
    }
  }, [progress, judges]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const wheelProgress = e.deltaY * speedWheel;
    setProgress(prev => prev + wheelProgress);
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    
    // Update cursor position
    const cursors = document.querySelectorAll('.cursor');
    cursors.forEach((cursor) => {
      (cursor as HTMLElement).style.transform = `translate(${clientX}px, ${(e as MouseEvent).clientY || e.touches[0]?.clientY || 0}px)`;
    });

    if (!isDown || !clientX) return;
    
    const mouseProgress = (clientX - startX) * speedDrag;
    setProgress(prev => prev + mouseProgress);
    setStartX(clientX);
  };

  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
    if (clientX) {
      setIsDown(true);
      setStartX(clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  useEffect(() => {
    document.addEventListener('wheel', handleWheel as any, { passive: false });
    document.addEventListener('mousedown', handleMouseDown as any);
    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleMouseDown as any);
    document.addEventListener('touchmove', handleMouseMove as any);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('wheel', handleWheel as any);
      document.removeEventListener('mousedown', handleMouseDown as any);
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchstart', handleMouseDown as any);
      document.removeEventListener('touchmove', handleMouseMove as any);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDown, startX, progress]);

  const handleItemClick = (index: number, judgeName: string) => {
    // Navigate to judge detail page using tournamentSlug
    const encodedName = encodeURIComponent(judgeName);
    navigate(`/results/${tournamentSlug}/judges/${encodedName}`);
  };

  // Get initials for display
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="judges-page">
      <div className="judges-logo-container">
        <img 
          src="/wec_logo_wht.png" 
          alt="WEC Logo"
          className="judges-logo"
        />
      </div>
      <div className="carousel">
        {judges.map((judge, index) => (
          <div
            key={judge.id}
            className={`carousel-item ${index === active ? 'active' : ''}`}
            onClick={() => handleItemClick(index, judge.name)}
          >
            <div className="carousel-box">
              <img 
                src="/icons/coffee tap.png" 
                alt="Coffee Tap"
                className="coffee-tap-icon"
              />
              <div className="title">{judge.name}</div>
              <div className="num">{String(judge.rank || index + 1).padStart(2, '0')}</div>
              <div className="judge-image">
                <img 
                  src="/thumbnail.jpg" 
                  alt={judge.name}
                  className="judge-img"
                />
                <div className="judge-initials">{getInitials(judge.name)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="layout">
        <div className="box">
          World Espresso Championships<br />
          2025 Milano Judges
        </div>
      </div>

      <div className="cursor"></div>
      <div className="cursor cursor2"></div>
    </div>
  );
};

export default Judges;

