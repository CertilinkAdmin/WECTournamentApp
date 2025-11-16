import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import CompetitorScorecard from '@/components/CompetitorScorecard';
import SensoryEvaluationCard from '@/components/SensoryEvaluationCard';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from '../../components/WEC25BracketData';

interface Tournament {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  totalRounds: number;
  currentRound: number;
}

interface Participant {
  id: number;
  seed: number;
  finalRank: number | null;
  userId: number;
  name: string;
  email: string;
}

interface Match {
  id: number;
  round: number;
  heatNumber: number;
  status: string;
  startTime: string;
  endTime: string;
  competitor1Id: number;
  competitor2Id: number;
  winnerId: number;
  competitor1Name: string;
  competitor2Name: string;
}

interface Score {
  matchId: number;
  judgeId: number;
  competitorId: number;
  segment: string;
  score: number;
  judgeName: string;
}

interface JudgeDetailedScore {
  matchId: number;
  judgeName: string;
  leftCupCode: string;
  rightCupCode: string;
  sensoryBeverage: string;
  visualLatteArt: "left" | "right";
  taste: "left" | "right";
  tactile: "left" | "right";
  flavour: "left" | "right";
  overall: "left" | "right";
}

interface TournamentData {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  scores: Score[];
  detailedScores: JudgeDetailedScore[];
}

const WEC2025Results = () => {
  const { tournamentId } = useParams<{ tournamentId?: string }>();
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHeat, setSelectedHeat] = useState<Match | null>(null);
  const [currentRound, setCurrentRound] = useState(1);

  // Group matches by round - memoized to prevent hook order issues (MUST be before any returns)
  const matchesByRound = useMemo(() => {
    if (!tournamentData?.matches) return {};
    
    const grouped = tournamentData.matches.reduce((acc, match) => {
      const round = match.round || 1;
      if (!acc[round]) {
        acc[round] = [];
      }
      acc[round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    // Sort matches within each round by heat number
    Object.keys(grouped).forEach(round => {
      grouped[parseInt(round)].sort((a, b) => a.heatNumber - b.heatNumber);
    });

    return grouped;
  }, [tournamentData?.matches]);

  // Get available rounds - memoized (MUST be before any returns)
  const availableRounds = useMemo(() => {
    return Object.keys(matchesByRound)
      .map(Number)
      .sort((a, b) => a - b);
  }, [matchesByRound]);

  // Get current round matches - memoized (MUST be before any returns)
  const currentRoundMatches = useMemo(() => {
    return matchesByRound[currentRound] || [];
  }, [matchesByRound, currentRound]);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    } else {
      // Legacy support: if no tournamentId in URL, try to find WEC 2025 Milano
      fetchByName();
    }
  }, [tournamentId]);

  const fetchByName = async () => {
    try {
      setLoading(true);
      
      const tournamentsResponse = await fetch('/api/tournaments');
      if (!tournamentsResponse.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      
      const tournaments = await tournamentsResponse.json();
      const wec2025 = tournaments.find((t: any) => 
        t.name === 'World Espresso Championships 2025 Milano'
      );
      
      if (!wec2025) {
        throw new Error('WEC 2025 Milano tournament not found');
      }
      
      const response = await fetch(`/api/tournaments/${wec2025.id}`);
      await processResponse(response);
    } catch (err) {
      handleError(err);
    }
  };

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      
      // Fetch tournament data by ID from route params
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      
      await processResponse(response);
    } catch (err) {
      handleError(err);
    }
  };

  const processResponse = async (response: Response) => {
    if (!response.ok) {
      throw new Error('Failed to fetch tournament data');
    }
    
    const data = await response.json();
    
    // Transform the data to match our interface
    const transformedData: TournamentData = {
      tournament: {
        id: data.tournament.id,
        name: data.tournament.name,
        status: data.tournament.status,
        startDate: data.tournament.startDate,
        endDate: data.tournament.endDate,
        totalRounds: data.tournament.totalRounds,
        currentRound: data.tournament.currentRound
      },
      participants: data.participants.map((p: any) => ({
        id: p.id,
        seed: p.seed,
        finalRank: p.finalRank,
        userId: p.userId,
        name: p.name || '',
        email: p.email || ''
      })),
      matches: data.matches.map((m: any) => ({
        id: m.id,
        round: m.round,
        heatNumber: m.heatNumber,
        status: m.status,
        startTime: m.startTime,
        endTime: m.endTime,
        competitor1Id: m.competitor1Id,
        competitor2Id: m.competitor2Id,
        winnerId: m.winnerId,
        competitor1Name: m.competitor1Name || '',
        competitor2Name: m.competitor2Name || ''
      })),
      scores: data.scores || [],
      detailedScores: data.detailedScores || []
    };
    
    setTournamentData(transformedData);
    setError(null);
    setLoading(false);
  };

  const handleError = (err: any) => {
    console.error('Error fetching tournament data:', err);
    // Fallback to local static bracket data so the page remains interactive
    const fallback = buildFallbackData();
    if (fallback) {
      setTournamentData(fallback);
      setError(null);
    } else {
      setError('Failed to load tournament data');
    }
    setLoading(false);
  };

  // Build a minimal TournamentData from the local WEC25 data used elsewhere
  const buildFallbackData = (): TournamentData | null => {
    try {
      const heats = [
        ...WEC25_BRACKET_POSITIONS,
        ...WEC25_ROUND2_POSITIONS,
        ...WEC25_ROUND3_POSITIONS,
        ...WEC25_ROUND4_POSITIONS,
        ...WEC25_FINAL_POSITION,
      ];

      // Participants (unique names)
      const nameSet = new Set<string>();
      heats.forEach((h: any) => {
        if (h.competitor1) nameSet.add(h.competitor1);
        if (h.competitor2) nameSet.add(h.competitor2);
        if (h.winner) nameSet.add(h.winner);
      });
      const participants = Array.from(nameSet).map((name, idx) => ({
        id: idx + 1,
        seed: idx + 1,
        finalRank: null,
        userId: idx + 1,
        name,
        email: ''
      }));

      // Helper to map a competitor name to id
      const nameToId = new Map(participants.map(p => [p.name, p.id]));

      // Matches from heats
      const matches = heats.map((h: any, i: number) => ({
        id: i + 1,
        round: Math.ceil(h.heatNumber / 8) || 1,
        heatNumber: h.heatNumber,
        status: h.winner ? 'DONE' : 'PENDING',
        startTime: '',
        endTime: '',
        competitor1Id: nameToId.get(h.competitor1) || 0,
        competitor2Id: nameToId.get(h.competitor2) || 0,
        winnerId: nameToId.get(h.winner) || 0,
        competitor1Name: h.competitor1 || '',
        competitor2Name: h.competitor2 || ''
      }));

      // Detailed scores (judge decisions) for dialog cards
      const detailedScores = heats.flatMap((h: any) => {
        const match = matches.find(m => m.heatNumber === h.heatNumber);
        if (!match || !h.judges) return [] as JudgeDetailedScore[];
        return h.judges.map((j: any) => ({
          matchId: match.id,
          judgeName: j.judgeName,
          leftCupCode: j.leftCupCode,
          rightCupCode: j.rightCupCode,
          sensoryBeverage: j.sensoryBeverage,
          visualLatteArt: j.visualLatteArt,
          taste: j.taste,
          tactile: j.tactile,
          flavour: j.flavour,
          overall: j.overall,
        } as JudgeDetailedScore));
      });

      const data: TournamentData = {
        tournament: {
          id: 1,
          name: 'World Espresso Championships 2025 Milano',
          status: 'COMPLETED',
          startDate: '',
          endDate: '',
          totalRounds: 1,
          currentRound: 1,
        },
        participants,
        matches,
        scores: [],
        detailedScores,
      };
      return data;
    } catch (e) {
      console.error('Failed to build fallback results data', e);
      return null;
    }
  };


  const getHeatScores = (matchId: number) => {
    if (!tournamentData?.scores) return [];
    return tournamentData.scores.filter(score => score.matchId === matchId);
  };

  const getCompetitorScores = (matchId: number, competitorId: number) => {
    const scores = getHeatScores(matchId);
    return scores.filter(score => score.competitorId === competitorId);
  };

  const getTotalScore = (matchId: number, competitorId: number) => {
    const scores = getCompetitorScores(matchId, competitorId);
    return scores.reduce((total, score) => total + score.score, 0);
  };

  const getJudgesForHeat = (matchId: number) => {
    const scores = getHeatScores(matchId);
    const judgeIds = Array.from(new Set(scores.map(score => score.judgeId)));
    return judgeIds.map(judgeId => {
      const judgeScore = scores.find(s => s.judgeId === judgeId);
      return judgeScore?.judgeName || 'Unknown Judge';
    });
  };

  const getDetailedScoresForHeat = (matchId: number) => {
    if (!tournamentData?.detailedScores) return [];
    return tournamentData.detailedScores.filter(score => score.matchId === matchId);
  };

  const isByeMatch = (match: Match) => {
    return !match.competitor2Id || match.competitor2Name === null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4" data-testid="loading-results">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading WEC 2025 Milano Results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchTournamentData} data-testid="button-retry">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tournamentData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Tournament Data Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Unable to load tournament results.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get round display name
  const getRoundDisplayName = (round: number) => {
    const roundNames: Record<number, string> = {
      1: 'Round 1 - Preliminary Heats',
      2: 'Round 2 - Quarterfinals',
      3: 'Round 3 - Semifinals',
      4: 'Round 4 - Finals',
      5: 'Final - Championship'
    };
    return roundNames[round] || `Round ${round}`;
  };

  const handlePrevious = () => {
    const currentIndex = availableRounds.indexOf(currentRound);
    if (currentIndex > 0) {
      setCurrentRound(availableRounds[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = availableRounds.indexOf(currentRound);
    if (currentIndex < availableRounds.length - 1) {
      setCurrentRound(availableRounds[currentIndex + 1]);
    }
  };

  // Initialize to first available round when data loads
  useEffect(() => {
    if (availableRounds.length > 0 && !availableRounds.includes(currentRound)) {
      setCurrentRound(availableRounds[0]);
    }
  }, [availableRounds, currentRound]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-md mx-auto">
        {/* Carousel Navigation Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={availableRounds.indexOf(currentRound) === 0}
            aria-label="Previous"
            data-testid="button-previous-segment"
            className="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 p-0 bg-transparent border-0 rounded-lg transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img 
              src="/icons/arrow_l.png" 
              alt="Previous" 
              className="block w-full h-full object-contain"
            />
          </button>
          
          <div className="text-center flex-1 bg-gradient-to-br from-cinnamon-brown/20 to-cinnamon-brown/30 rounded-xl py-4 px-6 border-2 border-cinnamon-brown/40 shadow-lg backdrop-blur-sm">
            <p className="text-sm font-semibold text-cinnamon-brown/90 mb-1">
              {getRoundDisplayName(currentRound)}
            </p>
            <p className="text-base font-bold text-white drop-shadow-sm">
              {currentRoundMatches.length} Heat{currentRoundMatches.length !== 1 ? 's' : ''} • Round {availableRounds.indexOf(currentRound) + 1} of {availableRounds.length}
            </p>
          </div>
          
          <button
            onClick={handleNext}
            disabled={availableRounds.indexOf(currentRound) === availableRounds.length - 1}
            aria-label="Next"
            data-testid="button-next-segment"
            className="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 p-0 bg-transparent border-0 rounded-lg transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img 
              src="/icons/arrow_r.png" 
              alt="Next" 
              className="block w-full h-full object-contain"
            />
          </button>
        </div>

        {/* Tournament Heats - All heats in current round */}
        <div className="space-y-4">
          {currentRoundMatches && currentRoundMatches.length > 0 ? (
            currentRoundMatches.map(match => (
                <Card
                  key={match.id}
                  className="cursor-pointer hover-elevate active-elevate-2 transition-all"
                  onClick={() => setSelectedHeat(match)}
                  data-testid={`card-heat-${match.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-cinnamon-brown">
                        Heat {match.heatNumber}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Round {match.round}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div
                        className={`flex items-center justify-between p-2 rounded-md border ${
                          match.winnerId === match.competitor1Id
                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                            : 'bg-muted/50 border-border'
                        }`}
                        data-testid={`competitor-1-${match.id}`}
                      >
                        <span className="text-sm font-medium truncate">
                          {match.competitor1Name}
                        </span>
                        <span className="text-lg font-bold text-golden ml-2">
                          {getTotalScore(match.id, match.competitor1Id)}
                        </span>
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground font-medium">
                        VS
                      </div>
                      
                      <div
                        className={`flex items-center justify-between p-2 rounded-md border ${
                          match.winnerId === match.competitor2Id
                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                            : 'bg-muted/50 border-border'
                        }`}
                        data-testid={`competitor-2-${match.id}`}
                      >
                        <span className="text-sm font-medium truncate">
                          {match.competitor2Name}
                        </span>
                        <span className="text-lg font-bold text-golden ml-2">
                          {getTotalScore(match.id, match.competitor2Id)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center pt-2">
                      <Badge
                        className={
                          match.status === 'DONE'
                            ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                            : match.status === 'RUNNING'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {match.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No tournament matches found.
            </div>
          )}
        </div>
      </div>

      {/* Heat Details Dialog */}
      <Dialog open={!!selectedHeat} onOpenChange={(open) => { if (!open) setSelectedHeat(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-cinnamon-brown">
                Heat {selectedHeat?.heatNumber} - Round {selectedHeat?.round}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedHeat(null)}
                data-testid="button-close-heat-dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              View sensory evaluation scores and detailed judge-by-judge breakdowns for this heat.
            </DialogDescription>
          </DialogHeader>
          
          {selectedHeat && (
            <div className="space-y-6">
              {/* Sensory Evaluation Card - Overview */}
              <SensoryEvaluationCard
                judges={getDetailedScoresForHeat(selectedHeat.id).map(score => ({
                  judgeName: score.judgeName,
                  sensoryBeverage: score.sensoryBeverage,
                  leftCupCode: score.leftCupCode,
                  rightCupCode: score.rightCupCode,
                  taste: score.taste,
                  tactile: score.tactile,
                  flavour: score.flavour,
                  overall: score.overall
                }))}
                leftCompetitor={selectedHeat.competitor1Name}
                rightCompetitor={selectedHeat.competitor2Name || "—"}
              />
              
              {/* Individual Competitor Scorecards */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cinnamon-brown">Individual Competitor Scorecards</h3>
                
                <CompetitorScorecard
                  competitorName={selectedHeat.competitor1Name}
                  position="left"
                  judges={getDetailedScoresForHeat(selectedHeat.id)}
                  isWinner={selectedHeat.winnerId === selectedHeat.competitor1Id}
                  isBye={isByeMatch(selectedHeat)}
                />
                
                {!isByeMatch(selectedHeat) && (
                  <CompetitorScorecard
                    competitorName={selectedHeat.competitor2Name}
                    position="right"
                    judges={getDetailedScoresForHeat(selectedHeat.id)}
                    isWinner={selectedHeat.winnerId === selectedHeat.competitor2Id}
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WEC2025Results;
