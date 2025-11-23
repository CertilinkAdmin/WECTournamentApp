import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Award, Star, Coffee, Zap, Maximize2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from './WEC25BracketData';

interface TrueTournamentBracketProps {
  mode?: 'live' | 'results';
  tournamentId?: number;
}

interface Judge {
  judgeName: string;
  visualLatteArt: 'left' | 'right';
  sensoryBeverage: 'Espresso' | 'Cappuccino';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
  leftCupCode: string;
  rightCupCode: string;
}

interface BracketMatch {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner: string;
  score1: number;
  score2: number;
  leftCupCode?: string;
  rightCupCode?: string;
  judges?: Judge[];
}

interface BracketRound {
  title: string;
  matches: BracketMatch[];
}

const TrueTournamentBracket = ({ mode = 'results', tournamentId }: TrueTournamentBracketProps) => {
  const [animatedMatches, setAnimatedMatches] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedHeat, setSelectedHeat] = useState<BracketMatch | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);
  const bracketRef = useRef<HTMLDivElement>(null);

  // WEC25 Milano historical data
  const wec25Rounds: BracketRound[] = [
    { title: "Round 1", matches: WEC25_BRACKET_POSITIONS },
    { title: "Round 2", matches: WEC25_ROUND2_POSITIONS },
    { title: "Round 3", matches: WEC25_ROUND3_POSITIONS },
    { title: "Semi-Finals", matches: WEC25_ROUND4_POSITIONS },
    { title: "Finals", matches: WEC25_FINAL_POSITION },
  ];

  const rounds = wec25Rounds;
  const totalHeats = rounds.flatMap(r => r.matches).length;
  const finalWinner = rounds[rounds.length - 1]?.matches[0]?.winner || 'AGA MUHAMMED';

  // Animate matches on load
  useEffect(() => {
    setIsLoaded(true);
    setAnimatedMatches(new Set());
    
    const allMatches = rounds.flatMap(round => round.matches);
    
    allMatches.forEach((match, index) => {
      setTimeout(() => {
        setAnimatedMatches(prev => new Set([...Array.from(prev), match.heatNumber]));
      }, index * 50);
    });
  }, []); // Run only on mount - rounds is static demo data

  const getMedalIcon = (roundTitle: string, isWinner: boolean) => {
    if (!isWinner) return null;
    
    if (roundTitle === "Finals") {
      return <Trophy className="h-3 w-3 text-accent" />;
    } else if (roundTitle === "Semi-Finals") {
      return <Medal className="h-3 w-3 text-primary" />;
    }
    return null;
  };

  const getSpecialIcon = (roundTitle: string) => {
    switch (roundTitle) {
      case "Round 1": return <Coffee className="h-4 w-4 text-primary" />;
      case "Round 2": return <Zap className="h-4 w-4 text-accent" />;
      case "Round 3": return <Star className="h-4 w-4 text-primary" />;
      case "Semi-Finals": return <Award className="h-4 w-4 text-accent" />;
      case "Finals": return <img src="/trophy.png" alt="Trophy" className="h-5 w-5" />;
      default: return null;
    }
  };

  const getInitials = (name: string) => {
    if (!name || name === 'BYE' || name === 'Unknown' || name === 'TBD') return name;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
  };

  // Calculate distance between two touch points
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Handle touch start for pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    }
  };

  // Handle touch move for pinch zoom and pan
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistance !== null && lastTouchCenter !== null) {
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      
      // Calculate scale change
      const scaleChange = distance / lastTouchDistance;
      const newScale = Math.max(0.5, Math.min(3, scale * scaleChange));
      
      // Calculate position adjustment based on center movement
      const deltaX = center.x - lastTouchCenter.x;
      const deltaY = center.y - lastTouchCenter.y;
      
      setScale(newScale);
      setPosition(prev => ({
        x: prev.x + deltaX / newScale,
        y: prev.y + deltaY / newScale,
      }));
      
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed in
      const touch = e.touches[0];
      if (lastTouchCenter) {
        const deltaX = touch.clientX - lastTouchCenter.x;
        const deltaY = touch.clientY - lastTouchCenter.y;
        setPosition(prev => ({
          x: prev.x + deltaX / scale,
          y: prev.y + deltaY / scale,
        }));
        setLastTouchCenter({ x: touch.clientX, y: touch.clientY });
      } else {
        setLastTouchCenter({ x: touch.clientX, y: touch.clientY });
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setLastTouchDistance(null);
    setLastTouchCenter(null);
  };

  // Reset zoom on double tap
  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <>
      <div className="tournament-bracket-container-compact px-2 sm:px-4 md:px-6 bg-[#dbc494]">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 sm:mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent" 
              style={{ fontFamily: 'Lexend, sans-serif', letterSpacing: '1px' }}>
            WEC 2025 MILANO
          </h1>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-accent" 
              style={{ fontFamily: 'Lexend, sans-serif', letterSpacing: '0.5px' }}>
            TOURNAMENT BRACKET
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-accent px-2">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-primary/30 touch-target bg-[#bd490fb8]">
              <Coffee className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap">{totalHeats} HEATS</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-accent/40 touch-target bg-[#c66e38]">
              <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{finalWinner.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-primary/30 touch-target bg-[#c66e38]">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap">RESULTS</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm mt-2 px-2 text-[#c66e38]">Tap any heat to view details</p>
        </div>
        
        <div 
          ref={bracketRef}
          className="tournament-bracket-compact bracket-zoom-container pb-4"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {rounds.map((round) => (
            <div key={round.title} className="bracket-round-compact min-w-[140px] sm:min-w-[160px]">
              <h3 className="bracket-round-title-compact flex items-center justify-center gap-1 sm:gap-1.5 px-2">
                {getSpecialIcon(round.title)}
                <span className="text-xs sm:text-sm whitespace-nowrap">{round.title}</span>
              </h3>
              <div className="bracket-matches-compact">
                {round.matches.map((match) => (
                  <div 
                    key={`${round.title}-${match.heatNumber}`} 
                    className={`bracket-match-compact ${animatedMatches.has(match.heatNumber) ? 'animate-fade-in' : 'opacity-0'} ${round.title === 'Finals' ? 'championship-compact' : ''}`}
                    onClick={() => setSelectedHeat(match)}
                    data-testid={`heat-${match.heatNumber}`}
                  >
                    <div className="match-header-compact">
                      <span className="heat-number-compact">H{match.heatNumber}</span>
                      <Badge variant="outline" className="station-badge-compact text-[10px] h-4 px-1">{match.station}</Badge>
                      <Maximize2 className="h-3 w-3 text-accent opacity-50" />
                    </div>
                    <div className="match-competitors-compact">
                      <div className={`competitor-compact ${match.winner === match.competitor1 ? 'winner-compact' : ''}`}>
                        <span className="initials-compact">{getInitials(match.competitor1)}</span>
                        <span className="score-compact">{match.score1}</span>
                        {getMedalIcon(round.title, match.winner === match.competitor1)}
                      </div>
                      <div className="vs-compact">vs</div>
                      <div className={`competitor-compact ${match.winner === match.competitor2 ? 'winner-compact' : ''}`}>
                        <span className="initials-compact">{getInitials(match.competitor2)}</span>
                        <span className="score-compact">{match.score2}</span>
                        {getMedalIcon(round.title, match.winner === match.competitor2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Expanded Heat Dialog - Mobile Optimized */}
      <Dialog open={!!selectedHeat} onOpenChange={() => setSelectedHeat(null)}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0" />
              <span className="truncate">Heat {selectedHeat?.heatNumber} - Station {selectedHeat?.station}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedHeat && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Competitor 1 */}
              <Card className={`p-4 sm:p-6 ${selectedHeat.winner === selectedHeat.competitor1 ? 'border-2 border-accent bg-accent/10 dark:bg-accent/5' : ''}`} data-testid={`competitor-${selectedHeat.competitor1}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 truncate">{selectedHeat.competitor1}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{selectedHeat.leftCupCode}</Badge>
                      {selectedHeat.winner === selectedHeat.competitor1 && (
                        <Badge className="bg-accent text-primary text-xs">Winner</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-3xl sm:text-4xl font-black ${selectedHeat.winner === selectedHeat.competitor1 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {selectedHeat.score1}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Points</div>
                  </div>
                </div>
              </Card>

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="bg-primary text-primary-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-sm sm:text-base">
                  VS
                </div>
              </div>

              {/* Competitor 2 */}
              <Card className={`p-4 sm:p-6 ${selectedHeat.winner === selectedHeat.competitor2 ? 'border-2 border-accent bg-accent/10 dark:bg-accent/5' : ''}`} data-testid={`competitor-${selectedHeat.competitor2}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 truncate">{selectedHeat.competitor2}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{selectedHeat.rightCupCode}</Badge>
                      {selectedHeat.winner === selectedHeat.competitor2 && (
                        <Badge className="bg-accent text-primary text-xs">Winner</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-3xl sm:text-4xl font-black ${selectedHeat.winner === selectedHeat.competitor2 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {selectedHeat.score2}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Points</div>
                  </div>
                </div>
              </Card>

              {/* Match Info */}
              <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Heat Number</div>
                    <div className="font-semibold text-sm sm:text-base">{selectedHeat.heatNumber}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Station</div>
                    <div className="font-semibold text-sm sm:text-base">{selectedHeat.station}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Final Score</div>
                    <div className="font-semibold text-sm sm:text-base">{selectedHeat.score1} - {selectedHeat.score2}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Winner</div>
                    <div className="font-semibold text-accent text-sm sm:text-base truncate">{selectedHeat.winner}</div>
                  </div>
                </div>
              </div>

              {/* Judges Section */}
              <div className="border-t pt-4">
                {selectedHeat.judges && selectedHeat.judges.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" />
                      Judges
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedHeat.judges.map((judge, idx) => (
                        <Badge 
                          key={idx} 
                          className="bg-primary text-primary-foreground px-3 py-1.5 text-xs sm:text-sm"
                          data-testid={`judge-${judge.judgeName}`}
                        >
                          {judge.judgeName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center" data-testid="text-no-judge-scorecards">
                    <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No judge scorecards available for this heat</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrueTournamentBracket;
