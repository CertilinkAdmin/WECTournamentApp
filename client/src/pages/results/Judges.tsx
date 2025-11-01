import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import './Judges.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface JudgesProps {}

// Fallback list with real judge names
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
  const [progress, setProgress] = useState(50);
  const [startX, setStartX] = useState(0);
  const [active, setActive] = useState(0);
  const [isDown, setIsDown] = useState(false);
  
  const speedWheel = 0.02;
  const speedDrag = -0.1;

  // Fetch users and filter for judges
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch users:', response.status, response.statusText);
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      console.log('Fetched users:', data);
      return data;
    },
  });

  // Always use the specified tournament judges
  const judges = useMemo(() => {
    // Wait for loading to complete before showing judges
    if (isLoading) {
      console.log('Still loading users...');
      return [];
    }
    
    // Always use the fallback judges list for the tournament
    console.log('Using tournament judges:', FALLBACK_JUDGES.map(j => j.name));
    return FALLBACK_JUDGES;
  }, [isLoading]);

  const getZindex = (array: any[], index: number) => {
    return array.map((_, i) => 
      (index === i) ? array.length : array.length - Math.abs(index - i)
    );
  };

  const displayItems = (item: HTMLElement, index: number, activeIndex: number) => {
    if (judges.length === 0) return;
    const zIndex = getZindex(judges, activeIndex)[index];
    item.style.setProperty('--zIndex', zIndex.toString());
    item.style.setProperty('--active', ((index - activeIndex) / Math.max(1, judges.length)).toString());
  };

  const animate = () => {
    if (judges.length === 0) return;
    
    const clampedProgress = Math.max(0, Math.min(progress, 100));
    const newActive = Math.floor(clampedProgress / 100 * Math.max(0, judges.length - 1));
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
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(() => {
        animate();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [progress, judges]);

  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const wheelProgress = e.deltaY * speedWheel;
      setProgress(prev => prev + wheelProgress);
    };

    const mouseMoveHandler = (e: MouseEvent | TouchEvent) => {
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

    const mouseDownHandler = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
      if (clientX) {
        setIsDown(true);
        setStartX(clientX);
      }
    };

    const mouseUpHandler = () => {
      setIsDown(false);
    };

    document.addEventListener('wheel', wheelHandler, { passive: false });
    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('touchstart', mouseDownHandler);
    document.addEventListener('touchmove', mouseMoveHandler);
    document.addEventListener('touchend', mouseUpHandler);

    return () => {
      document.removeEventListener('wheel', wheelHandler);
      document.removeEventListener('mousedown', mouseDownHandler);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('touchstart', mouseDownHandler);
      document.removeEventListener('touchmove', mouseMoveHandler);
      document.removeEventListener('touchend', mouseUpHandler);
    };
  }, [isDown, startX, speedWheel, speedDrag]);

  const handleItemClick = (index: number) => {
    if (judges.length === 0) return;
    const newProgress = (index / judges.length) * 100 + 10;
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
    <div className="judges-page">
      <div className="judges-logo-container">
        <img 
          src="/wec_logo_wht.png" 
          alt="WEC Logo"
          className="judges-logo"
        />
      </div>
      <div className="carousel">
        {judges.length > 0 ? judges.map((judge, index) => (
          <div
            key={`judge-${judge.id}-${index}`}
            className="carousel-item"
            onClick={() => handleItemClick(index)}
          >
            <div className="carousel-box">
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
        )) : (
          <div className="carousel-item">
            <div className="carousel-box">
              <div className="title">Loading Judges...</div>
            </div>
          </div>
        )}
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

