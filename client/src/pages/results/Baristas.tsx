import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
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

// Fallback list with tournament competitors
const FALLBACK_BARISTAS = [
  { id: 1, name: 'Aga', rank: 1 },
  { id: 2, name: 'Anja', rank: 2 },
  { id: 3, name: 'Artur', rank: 3 },
  { id: 4, name: 'Bill', rank: 4 },
  { id: 5, name: 'Carlos', rank: 5 },
  { id: 6, name: 'Christos', rank: 6 },
  { id: 7, name: 'Danielle', rank: 7 },
  { id: 8, name: 'Edwin', rank: 8 },
  { id: 9, name: 'Engi', rank: 9 },
  { id: 10, name: 'Erland', rank: 10 },
  { id: 11, name: 'Faiz', rank: 11 },
  { id: 12, name: 'Felix', rank: 12 },
  { id: 13, name: 'Hojat', rank: 13 },
  { id: 14, name: 'Jae', rank: 14 },
  { id: 15, name: 'Julian', rank: 15 },
  { id: 16, name: 'Kirill', rank: 16 },
  { id: 17, name: 'Penny', rank: 17 },
  { id: 18, name: 'Stevo', rank: 18 },
];

const Baristas: React.FC<BaristasProps> = () => {
  const navigate = useNavigate();
  const { tournamentSlug } = useParams<{ tournamentSlug: string }>();
  const [progress, setProgress] = useState(50);
  const [startX, setStartX] = useState(0);
  const [active, setActive] = useState(0);
  const [isDown, setIsDown] = useState(false);
  
  const speedWheel = 0.02;
  const speedDrag = -0.1;

  // Fetch participants for this tournament
  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: [`/api/tournaments/${tournamentId}/participants`],
    enabled: !!tournamentId,
  });

  // Always use the specified tournament baristas
  const baristas = useMemo(() => {
    // Always use the fallback baristas list for the tournament
    console.log('Using tournament baristas:', FALLBACK_BARISTAS.map(b => b.name));
    return FALLBACK_BARISTAS;
  }, []);

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

  const handleItemClick = (index: number, baristaName: string) => {
    // Navigate to barista detail page
    const encodedName = encodeURIComponent(baristaName);
    navigate(`/results/${tournamentSlug || 'WEC2025'}/baristas/${encodedName}`);
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
            className={`carousel-item ${index === active ? 'active' : ''}`}
            onClick={() => handleItemClick(index, barista.name)}
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

