import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import './Baristas.css';

interface Participant {
  id: number;
  userId: number;
  name: string;
  email: string;
  seed?: number;
  finalRank?: number | null;
}

interface BaristasProps {}

// Fallback list with real names
const FALLBACK_BARISTAS = [
  { id: 1, name: 'Aga Muhammed', rank: 1 },
  { id: 2, name: 'Jae Kim', rank: 2 },
  { id: 3, name: 'Stevo Kühn', rank: 3 },
  { id: 4, name: 'Felix Irmer', rank: 4 },
  { id: 5, name: 'Kirill Yudin', rank: 5 },
  { id: 6, name: 'Penny Rodriguez', rank: 6 },
  { id: 7, name: 'Christos Sotiros', rank: 7 },
  { id: 8, name: 'Engi Pan', rank: 8 },
  { id: 9, name: 'Artur Ciuro', rank: 9 },
  { id: 10, name: 'Bill Nguyen', rank: 10 },
];

const Baristas: React.FC<BaristasProps> = () => {
  const [progress, setProgress] = useState(50);
  const [startX, setStartX] = useState(0);
  const [active, setActive] = useState(0);
  const [isDown, setIsDown] = useState(false);
  
  const speedWheel = 0.02;
  const speedDrag = -0.1;

  // Fetch tournament and participants
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });

  const currentTournament = tournaments.find((t: any) => 
    t.name === 'World Espresso Championships 2025 Milano'
  );

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ['/api/tournaments', currentTournament?.id, 'participants'],
    enabled: !!currentTournament?.id,
  });

  // Use participants data or fallback to WEC25 competitors
  // Only use participants if they have names, otherwise use fallback
  const baristas = useMemo(() => {
    if (participants.length > 0 && participants.every(p => p.name && p.name.trim())) {
      return participants.map((p, i) => ({
        id: p.id || i + 1,
        name: p.name,
        rank: p.finalRank || i + 1,
      }));
    }
    return FALLBACK_BARISTAS;
  }, [participants]);

  const getZindex = (array: any[], index: number) => {
    return array.map((_, i) => 
      (index === i) ? array.length : array.length - Math.abs(index - i)
    );
  };

  const displayItems = (item: HTMLElement, index: number, activeIndex: number) => {
    const zIndex = getZindex(baristas, activeIndex)[index];
    item.style.setProperty('--zIndex', zIndex.toString());
    item.style.setProperty('--active', ((index - activeIndex) / baristas.length).toString());
  };

  const animate = () => {
    const clampedProgress = Math.max(0, Math.min(progress, 100));
    const newActive = Math.floor(clampedProgress / 100 * (baristas.length - 1));
    setActive(newActive);
    
    const items = document.querySelectorAll('.carousel-item');
    items.forEach((item, index) => {
      displayItems(item as HTMLElement, index, newActive);
    });
  };

  useEffect(() => {
    animate();
  }, [progress, baristas]);

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

  const handleItemClick = (index: number) => {
    const newProgress = (index / baristas.length) * 100 + 10;
    setProgress(newProgress);
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
    <div className="baristas-page">
      <div className="baristas-logo-container">
        <img 
          src="/wec_logo_wht.png" 
          alt="WEC Logo"
          className="baristas-logo"
        />
      </div>
      <div className="carousel">
        {baristas.map((barista, index) => (
          <div
            key={barista.id}
            className="carousel-item"
            onClick={() => handleItemClick(index)}
          >
            <div className="carousel-box">
              <div className="title">{barista.name}</div>
              <div className="num">{String(barista.rank || index + 1).padStart(2, '0')}</div>
              <div className="barista-image">
                <img 
                  src="/barista_placeholder.jpeg" 
                  alt={barista.name}
                  className="barista-img"
                />
                <div className="barista-initials">{getInitials(barista.name)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="layout">
        <div className="box">
          World Espresso Championships<br />
          2025 Milano Baristas
        </div>
      </div>

      <div className="cursor"></div>
      <div className="cursor cursor2"></div>
    </div>
  );
};

export default Baristas;

