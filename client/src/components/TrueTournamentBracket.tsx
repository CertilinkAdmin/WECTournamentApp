import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Award, Star, Coffee, Zap, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DEMO_ROUND1, DEMO_ROUND2, DEMO_ROUND3, DEMO_SEMIFINALS, DEMO_FINAL } from './Demo24BracketData';

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

interface Tournament {
  id: number;
  name: string;
  status: string;
}

interface Match {
  id: number;
  tournamentId: number;
  round: number;
  heatNumber: number;
  stationId: number;
  status: string;
  competitor1Id: number | null;
  competitor2Id: number | null;
  winnerId: number | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface HeatScore {
  id: number;
  matchId: number;
  judgeId: number;
  competitorId: number;
  totalScore: number;
}

const TrueTournamentBracket = ({ mode = 'results' }: TrueTournamentBracketProps) => {
  const [animatedMatches, setAnimatedMatches] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedHeat, setSelectedHeat] = useState<BracketMatch | null>(null);

  // Only fetch tournament data in live mode
  const shouldFetchLiveData = mode === 'live';

  // Fetch active tournaments
  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    enabled: shouldFetchLiveData,
  });

  // Find the most recent active tournament (only in live mode)
  const activeTournament = shouldFetchLiveData 
    ? tournaments?.find(t => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS') || tournaments?.[0]
    : null;

  // Fetch matches for active tournament (only in live mode)
  const { data: matches } = useQuery<Match[]>({
    queryKey: activeTournament ? ['/api/tournaments', activeTournament.id, 'matches'] : ['no-tournament'],
    enabled: shouldFetchLiveData && !!activeTournament,
  });

  // Fetch users to map IDs to names (only in live mode)
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: shouldFetchLiveData,
  });

  const getUserName = (userId: number | null): string => {
    if (!userId) return 'BYE';
    const user = users?.find(u => u.id === userId);
    return user?.username || 'Unknown';
  };

  const transformMatchToBracket = (match: Match): BracketMatch => {
    const competitor1 = getUserName(match.competitor1Id);
    const competitor2 = getUserName(match.competitor2Id);
    const winner = match.winnerId ? getUserName(match.winnerId) : (competitor1 !== 'BYE' ? competitor1 : competitor2);

    return {
      heatNumber: match.heatNumber,
      station: match.stationId ? String.fromCharCode(64 + match.stationId) : 'A',
      competitor1,
      competitor2,
      winner,
      score1: 0,
      score2: 0,
      leftCupCode: `H${match.heatNumber}-L`,
      rightCupCode: `H${match.heatNumber}-R`,
    };
  };

  const getRoundTitle = (roundNum: number, totalRounds: number): string => {
    if (roundNum === totalRounds) return 'Final';
    if (roundNum === totalRounds - 1) return 'Semi-Finals';
    return `Round ${roundNum}`;
  };

  // Organize matches into rounds
  const buildRoundsFromMatches = (): BracketRound[] => {
    if (!matches || matches.length === 0) {
      return [];
    }

    const roundGroups = new Map<number, Match[]>();
    matches.forEach(match => {
      if (!roundGroups.has(match.round)) {
        roundGroups.set(match.round, []);
      }
      roundGroups.get(match.round)!.push(match);
    });

    const sortedRounds = Array.from(roundGroups.keys()).sort((a, b) => a - b);
    const totalRounds = sortedRounds.length;

    return sortedRounds.map(roundNum => ({
      title: getRoundTitle(roundNum, totalRounds),
      matches: roundGroups.get(roundNum)!
        .sort((a, b) => a.heatNumber - b.heatNumber)
        .map(transformMatchToBracket),
    }));
  };

  // Historical WEC25 Milano data (for results mode)
  const wec25HistoricalRounds: BracketRound[] = [
    { title: "Round 1", matches: DEMO_ROUND1 },
    { title: "Round 2", matches: DEMO_ROUND2 },
    { title: "Round 3", matches: DEMO_ROUND3 },
    { title: "Semi-Finals", matches: DEMO_SEMIFINALS },
    { title: "Final", matches: [DEMO_FINAL] },
  ];

  // Determine which data to show
  const rounds = mode === 'live' && activeTournament && matches && matches.length > 0
    ? buildRoundsFromMatches()
    : wec25HistoricalRounds;

  const totalHeats = rounds.flatMap(r => r.matches).length;
  const finalWinner = rounds[rounds.length - 1]?.matches[0]?.winner || 'TBD';

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
            {mode === 'live' && activeTournament ? activeTournament.name.toUpperCase() : 'WEC 2025 MILANO'}
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
              <span className="font-semibold">{mode === 'live' && activeTournament ? 'LIVE' : mode === 'live' ? 'NO TOURNAMENT' : 'RESULTS'}</span>
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
