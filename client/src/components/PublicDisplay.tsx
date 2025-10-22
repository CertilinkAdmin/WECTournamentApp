import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Trophy, MapPin, Timer } from 'lucide-react';
import type { Match, User, Station, HeatSegment } from '@shared/schema';

interface CompetitorCardProps {
  competitor: User | null;
  isWinner?: boolean;
  stationName: string;
  isActive?: boolean;
}

function CompetitorCard({ competitor, isWinner, stationName, isActive }: CompetitorCardProps) {
  const cardId = stationName === 'A' ? '↖️' : stationName === 'B' ? '🎨' : '💡';
  
  return (
    <div className="card-container" data-card={cardId}>
      <div className="inner-container">
        <div className="border-outer">
          <div className="main-card"></div>
        </div>
        <div className="glow-layer-1"></div>
        <div className="glow-layer-2"></div>
      </div>

      <div className="overlay-1"></div>
      <div className="overlay-2"></div>
      <div className="background-glow"></div>

      <div className="content-container">
        <div className="content-top">
          <div className="scrollbar-glass">
            {isActive ? 'LIVE' : 'STANDBY'}
          </div>
          <p className="title">{competitor?.name || 'TBD'}</p>
        </div>

        <hr className="divider" />

        <div className="content-bottom">
          <p className="description">
            {isWinner ? 'Winner' : competitor ? 'Competitor' : 'Awaiting competitor'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StationDisplayProps {
  station: Station;
  currentMatch: Match | null;
  users: User[];
  segments: HeatSegment[];
}

function StationDisplay({ station, currentMatch, users, segments }: StationDisplayProps) {
  const competitor1 = currentMatch?.competitor1Id ? users.find(u => u.id === currentMatch.competitor1Id) : null;
  const competitor2 = currentMatch?.competitor2Id ? users.find(u => u.id === currentMatch.competitor2Id) : null;
  
  const currentSegment = segments.find(s => s.status === 'RUNNING');
  const isActive = currentMatch?.status === 'RUNNING';
  
  const getSegmentDisplay = () => {
    if (!currentSegment) return 'READY';
    return currentSegment.segment.replace('_', ' ');
  };

  const getTimeRemaining = () => {
    if (!currentSegment || !currentSegment.startTime) return '00:00';
    
    const startTime = new Date(currentSegment.startTime).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    const remaining = Math.max(0, currentSegment.plannedMinutes * 60 - elapsed);
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="station-display">
      <div className="station-header">
        <div className="station-title">
          <MapPin className="h-8 w-8" />
          <h2>Station {station.name}</h2>
          <Badge variant={isActive ? 'default' : 'secondary'} className="ml-2">
            {isActive ? 'LIVE' : 'STANDBY'}
          </Badge>
        </div>
        
        {isActive && (
          <div className="timer-display">
            <div className="current-segment">
              <Clock className="h-6 w-6" />
              <span>{getSegmentDisplay()}</span>
            </div>
            <div className="time-remaining">
              <Timer className="h-8 w-8" />
              <span className="time-text">{getTimeRemaining()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="competitors-container">
        <CompetitorCard
          competitor={competitor1}
          isWinner={currentMatch?.winnerId === currentMatch?.competitor1Id}
          stationName={station.name}
          isActive={isActive}
        />
        <CompetitorCard
          competitor={competitor2}
          isWinner={currentMatch?.winnerId === currentMatch?.competitor2Id}
          stationName={station.name}
          isActive={isActive}
        />
      </div>
    </div>
  );
}

export default function PublicDisplay() {
  // Fetch tournaments to get current one
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournamentId = tournaments[0]?.id || 1;

  // Fetch all matches for the tournament
  const { data: allMatches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${currentTournamentId}/matches`],
    enabled: !!currentTournamentId,
  });

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Get current matches for each station
  const getCurrentMatchForStation = (stationId: number) => {
    return allMatches.find(m => m.stationId === stationId && m.status === 'RUNNING') ||
           allMatches.find(m => m.stationId === stationId && m.status === 'READY');
  };

  // Fetch segments for current matches
  const currentMatches = stations.map(station => ({
    station,
    match: getCurrentMatchForStation(station.id)
  })).filter(item => item.match);

  const { data: allSegments = [] } = useQuery<HeatSegment[]>({
    queryKey: currentMatches.map(item => [`/api/matches/${item.match!.id}/segments`]),
    enabled: currentMatches.length > 0,
  });

  const getSegmentsForMatch = (matchId: number) => {
    return allSegments.filter(s => s.matchId === matchId);
  };

  return (
    <div className="public-display">
      <style>{`
        .public-display {
          min-height: 100vh;
          background: oklch(0.145 0 0);
          color: oklch(0.985 0 0);
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
        }

        .stations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
          gap: 2rem;
          padding: 2rem;
          min-height: 100vh;
        }

        .station-display {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .station-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }

        .station-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .timer-display {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .current-segment {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 500;
        }

        .time-remaining {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .time-text {
          font-size: 2rem;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #ff6b6b;
        }

        .competitors-container {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        /* Card Styles */
        .card-container {
          padding: 2px;
          border-radius: 1.5em;
          position: relative;
          background: linear-gradient(
              -30deg,
              var(--gradient-color),
              transparent,
              var(--gradient-color)
            ),
            linear-gradient(
              to bottom,
              var(--color-neutral-900),
              var(--color-neutral-900)
            );
        }

        .card-container[data-card="↖️"] {
          --f: url(#🌀↖️);
          --electric-border-color: #dd8448;
          --electric-light-color: oklch(from var(--electric-border-color) l c h);
          --gradient-color: oklch(
            from var(--electric-border-color) 0.3 calc(c / 2) h / 0.4
          );
        }

        .card-container[data-card="🎨"] {
          --f: url(#🌀🎨);
          --electric-border-color: DodgerBlue;
          --electric-light-color: oklch(from var(--electric-border-color) l c h);
          --gradient-color: oklch(
            from var(--electric-border-color) 0.3 calc(c / 2) h / 0.4
          );
        }

        .card-container[data-card="💡"] {
          --f: url(#🌀💡);
          --electric-border-color: #ff6b6b;
          --electric-light-color: oklch(from var(--electric-border-color) l c h);
          --gradient-color: oklch(
            from var(--electric-border-color) 0.3 calc(c / 2) h / 0.4
          );
        }

        .inner-container {
          position: relative;
        }

        .border-outer {
          border: 2px solid oklch(from var(--electric-border-color) l c h / 0.5);
          border-radius: 1.5em;
          padding-right: .15em;
          padding-bottom: .15em;
        }

        .main-card {
          width: 22rem;
          aspect-ratio: 7 / 10;
          border-radius: 1.5em;
          border: 2px solid var(--electric-border-color);
          margin-top: -4px;
          margin-left: -4px;
          filter: var(--f);
        }

        .glow-layer-1 {
          border: 2px solid oklch(from var(--electric-border-color) l c h / 0.6);
          border-radius: 24px;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          filter: blur(1px);
        }

        .glow-layer-2 {
          border: 2px solid var(--electric-light-color);
          border-radius: 24px;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          filter: blur(4px);
        }

        .overlay-1 {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          opacity: 1;
          mix-blend-mode: overlay;
          transform: scale(1.1);
          filter: blur(16px);
          background: linear-gradient(
            -30deg,
            white,
            transparent 30%,
            transparent 70%,
            white
          );
        }

        .overlay-2 {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          opacity: 0.5;
          mix-blend-mode: overlay;
          transform: scale(1.1);
          filter: blur(16px);
          background: linear-gradient(
            -30deg,
            white,
            transparent 30%,
            transparent 70%,
            white
          );
        }

        .background-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          filter: blur(32px);
          transform: scale(1.1);
          opacity: 0.3;
          z-index: -1;
          background: linear-gradient(
            -30deg,
            var(--electric-light-color),
            transparent,
            var(--electric-border-color)
          );
        }

        .content-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .content-top {
          display: flex;
          flex-direction: column;
          padding: 48px;
          padding-bottom: 16px;
          height: 100%;
        }

        .content-bottom {
          display: flex;
          flex-direction: column;
          padding: 48px;
          padding-top: 16px;
        }

        .scrollbar-glass {
          background: radial-gradient(
              47.2% 50% at 50.39% 88.37%,
              rgba(255, 255, 255, 0.12) 0%,
              rgba(255, 255, 255, 0) 100%
            ),
            rgba(255, 255, 255, 0.04);
          position: relative;
          transition: background 0.3s ease;
          border-radius: 14px;
          width: fit-content;
          height: fit-content;
          padding: .5em 1em;
          text-transform: uppercase;
          font-weight: bold;
          font-size: .85em;
          color: rgba(255, 255, 255, 0.8);
        }

        .scrollbar-glass:hover {
          background: radial-gradient(
              47.2% 50% at 50.39% 88.37%,
              rgba(255, 255, 255, 0.12) 0%,
              rgba(255, 255, 255, 0) 100%
            ),
            rgba(255, 255, 255, 0.08);
        }

        .scrollbar-glass::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 1px;
          background: linear-gradient(
            150deg,
            rgba(255, 255, 255, 0.48) 16.73%,
            rgba(255, 255, 255, 0.08) 30.2%,
            rgba(255, 255, 255, 0.08) 68.2%,
            rgba(255, 255, 255, 0.6) 81.89%
          );
          border-radius: inherit;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          -webkit-mask-composite: xor;
          pointer-events: none;
        }

        .title {
          font-size: 2.25em;
          font-weight: 500;
          margin-top: auto;
        }

        .description {
          opacity: 0.5;
        }

        .divider {
          margin-top: auto;
          border: none;
          height: 1px;
          background-color: currentColor;
          opacity: 0.1;
          mask-image: linear-gradient(to right, transparent, black, transparent);
          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            black,
            transparent
          );
        }
      `}</style>

      <svg className="svg-container">
        <defs>
          <filter id="🌀↖️" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
              <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
              <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
              <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
              <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

            <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
          </filter>
          <filter id="🌀🎨" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="7" />
            <feColorMatrix type="hueRotate" result="pt1" >
              <animate attributeName="values" values="0;360;" dur=".6s" repeatCount="indefinite" calcMode="paced" />
            </feColorMatrix>
            <feComposite />
            <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="7" seed="5" />
            <feColorMatrix type="hueRotate" result="pt2">
              <animate attributeName="values" values="0; 333; 199; 286; 64; 168; 256; 157; 360;" dur="5s" repeatCount="indefinite" calcMode="paced" />
            </feColorMatrix>
            <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
            <feDisplacementMap in="SourceGraphic" scale="30" xChannelSelector="R" yChannelSelector="B" />
          </filter>
          <filter id="🌀💡" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="7" />
            <feColorMatrix type="hueRotate" result="pt1" >
              <animate attributeName="values" values="0;360;" dur=".6s" repeatCount="indefinite" calcMode="paced" />
            </feColorMatrix>
            <feComposite />
            <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="7" seed="5" />
            <feColorMatrix type="hueRotate" result="pt2">
              <animate attributeName="values" values="0; 333; 199; 286; 64; 168; 256; 157; 360;" dur="5s" repeatCount="indefinite" calcMode="paced" />
            </feColorMatrix>
            <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
            <feDisplacementMap in="SourceGraphic" scale="30" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      <div className="stations-grid">
        {stations.map(station => {
          const currentMatch = getCurrentMatchForStation(station.id);
          const segments = currentMatch ? getSegmentsForMatch(currentMatch.id) : [];
          
          return (
            <StationDisplay
              key={station.id}
              station={station}
              currentMatch={currentMatch}
              users={users}
              segments={segments}
            />
          );
        })}
      </div>
    </div>
  );
}

