import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Coffee, Zap, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from './WEC25BracketData';

interface TrueTournamentBracketProps {
  mode?: 'live' | 'results';
}

interface BracketMatch {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner: string;
  score1: number;
  score2: number;
  leftCupCode: string;
  rightCupCode: string;
}

interface BracketRound {
  title: string;
  matches: BracketMatch[];
}

const TrueTournamentBracket = ({ mode = 'results' }: TrueTournamentBracketProps) => {
  const [animatedMatches, setAnimatedMatches] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedHeat, setSelectedHeat] = useState<BracketMatch | null>(null);

  // WEC25 Milano historical data
  const wec25Rounds: BracketRound[] = [
    { title: "Round 1", matches: WEC25_BRACKET_POSITIONS },
    { title: "Round 2", matches: WEC25_ROUND2_POSITIONS },
    { title: "Round 3", matches: WEC25_ROUND3_POSITIONS },
    { title: "Semi-Finals", matches: WEC25_ROUND4_POSITIONS },
    { title: "Final", matches: [WEC25_FINAL_POSITION] },
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
  }, [rounds]);

  const getMedalIcon = (roundTitle: string, isWinner: boolean) => {
    if (!isWinner) return null;
    
    if (roundTitle === "Final") {
      return <Trophy className="h-3 w-3 text-yellow-500" />;
    } else if (roundTitle === "Semi-Finals") {
      return <Medal className="h-3 w-3 text-gray-400" />;
    }
    return null;
  };

  const getSpecialIcon = (roundTitle: string) => {
    switch (roundTitle) {
      case "Round 1": return <Coffee className="h-4 w-4 text-amber-600" />;
      case "Round 2": return <Zap className="h-4 w-4 text-blue-600" />;
      case "Round 3": return <Star className="h-4 w-4 text-purple-600" />;
      case "Semi-Finals": return <Award className="h-4 w-4 text-orange-600" />;
      case "Final": return <Trophy className="h-5 w-5 text-yellow-500" />;
      default: return null;
    }
  };

  const getInitials = (name: string) => {
    if (!name || name === 'BYE' || name === 'Unknown' || name === 'TBD') return name;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
  };

  return (
    <>
      <div className="tournament-bracket-container-compact">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent" 
              style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '2px' }}>
            WEC 2025 MILANO
          </h1>
          <h2 className="text-lg md:text-xl font-semibold mb-3 text-amber-100" 
              style={{ fontFamily: 'Exo 2, sans-serif', letterSpacing: '1px' }}>
            TOURNAMENT BRACKET
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm text-amber-200">
            <div className="flex items-center gap-2 px-2 py-1 bg-amber-900/20 rounded-lg border border-amber-600/30">
              <Coffee className="h-3 w-3 text-amber-400" />
              <span className="font-semibold">{totalHeats} HEATS</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-amber-900/20 rounded-lg border border-yellow-400/30">
              <Trophy className="h-3 w-3 text-yellow-400" />
              <span className="font-semibold">{finalWinner.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-amber-900/20 rounded-lg border border-amber-500/30">
              <Star className="h-3 w-3 text-amber-400" />
              <span className="font-semibold">RESULTS</span>
            </div>
          </div>
          <p className="text-xs text-amber-300 mt-2">Click any heat to expand details</p>
        </div>
        
        <div className="tournament-bracket-compact">
          {rounds.map((round) => (
            <div key={round.title} className="bracket-round-compact">
              <h3 className="bracket-round-title-compact flex items-center justify-center gap-1.5">
                {getSpecialIcon(round.title)}
                <span className="text-xs md:text-sm">{round.title}</span>
              </h3>
              <div className="bracket-matches-compact">
                {round.matches.map((match) => (
                  <div 
                    key={`${round.title}-${match.heatNumber}`} 
                    className={`bracket-match-compact ${animatedMatches.has(match.heatNumber) ? 'animate-fade-in' : 'opacity-0'} ${round.title === 'Final' ? 'championship-compact' : ''}`}
                    onClick={() => setSelectedHeat(match)}
                    data-testid={`heat-${match.heatNumber}`}
                  >
                    <div className="match-header-compact">
                      <span className="heat-number-compact">H{match.heatNumber}</span>
                      <Badge variant="outline" className="station-badge-compact text-[10px] h-4 px-1">{match.station}</Badge>
                      <Maximize2 className="h-3 w-3 text-amber-400 opacity-50" />
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

      {/* Expanded Heat Dialog */}
      <Dialog open={!!selectedHeat} onOpenChange={() => setSelectedHeat(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Heat {selectedHeat?.heatNumber} - Station {selectedHeat?.station}
            </DialogTitle>
          </DialogHeader>
          
          {selectedHeat && (
            <div className="space-y-6 py-4">
              {/* Competitor 1 */}
              <Card className={`p-6 ${selectedHeat.winner === selectedHeat.competitor1 ? 'border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{selectedHeat.competitor1}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{selectedHeat.leftCupCode}</Badge>
                      {selectedHeat.winner === selectedHeat.competitor1 && (
                        <Badge className="bg-yellow-500 text-black">Winner</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-black ${selectedHeat.winner === selectedHeat.competitor1 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {selectedHeat.score1}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Points</div>
                  </div>
                </div>
              </Card>

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold">
                  VS
                </div>
              </div>

              {/* Competitor 2 */}
              <Card className={`p-6 ${selectedHeat.winner === selectedHeat.competitor2 ? 'border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{selectedHeat.competitor2}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{selectedHeat.rightCupCode}</Badge>
                      {selectedHeat.winner === selectedHeat.competitor2 && (
                        <Badge className="bg-yellow-500 text-black">Winner</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-black ${selectedHeat.winner === selectedHeat.competitor2 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {selectedHeat.score2}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Points</div>
                  </div>
                </div>
              </Card>

              {/* Match Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Heat Number</div>
                    <div className="font-semibold">{selectedHeat.heatNumber}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Station</div>
                    <div className="font-semibold">{selectedHeat.station}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Final Score</div>
                    <div className="font-semibold">{selectedHeat.score1} - {selectedHeat.score2}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Winner</div>
                    <div className="font-semibold text-yellow-600">{selectedHeat.winner}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrueTournamentBracket;
