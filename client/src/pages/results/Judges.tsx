import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
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

const Judges: React.FC<JudgesProps> = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [progress, setProgress] = useState(50);
  const [startX, setStartX] = useState(0);
  const [active, setActive] = useState(0);
  const [isDown, setIsDown] = useState(false);
  
  const speedWheel = 0.02;
  const speedDrag = -0.1;

  // Fetch all users to get judge details
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!tournamentId,
  });

  // Fetch tournament participants (including judges)
  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery<TournamentParticipant[]>({
    queryKey: [`/api/tournaments/${tournamentId}/participants`],
    queryFn: async () => {
      if (!tournamentId) return [];
      const response = await fetch(`/api/tournaments/${tournamentId}/participants?includeJudges=true`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch participants:', response.status, response.statusText);
        throw new Error('Failed to fetch participants');
      }
      return response.json();
    },
    enabled: !!tournamentId,
  });

  // Get judges from tournament participants
  const judges = useMemo(() => {
    if (isLoadingParticipants || !participants.length || !allUsers.length) {
      return [];
    }

    // Filter participants to only judges and map with user data
    const judgeParticipants = participants
      .map(participant => {
        const user = allUsers.find(u => u.id === participant.userId && u.role === 'JUDGE');
        if (!user) return null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          participantId: participant.id,
          seed: participant.seed,
          rank: participant.seed || participant.finalRank || 0
        } as JudgeWithData;
      })
      .filter((judge): judge is JudgeWithData => judge !== null)
      .sort((a, b) => {
        // Sort by seed if available, otherwise by finalRank, otherwise by name
        if (a.seed && b.seed) return a.seed - b.seed;
        if (a.rank && b.rank) return a.rank - b.rank;
        return a.name.localeCompare(b.name);
      })
      .map((judge, index) => ({
        ...judge,
        rank: judge.rank || index + 1
      }));

    console.log('Tournament judges:', judgeParticipants.map(j => j.name));
    return judgeParticipants;
  }, [participants, allUsers, isLoadingParticipants]);

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

  // Initialize carousel when judges first load
  useEffect(() => {
    if (judges.length > 0 && active === 0 && progress === 50) {
      setProgress(0);
      setActive(0);
    }
  }, [judges.length]);

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
        {isLoadingParticipants ? (
          <div className="carousel-item">
            <div className="carousel-box">
              <div className="title">Loading Judges...</div>
            </div>
          </div>
        ) : judges.length > 0 ? (
          judges.map((judge, index) => (
            <div
              key={`judge-${judge.id}-${index}`}
              className={`carousel-item ${index === active ? 'active' : ''}`}
              onClick={() => handleItemClick(index, judge.name)}
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
          ))
        ) : (
          <div className="carousel-item">
            <div className="carousel-box">
              <div className="title">No Judges Found</div>
              <div className="text-sm text-muted-foreground mt-2">No judges registered for this tournament</div>
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

