import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { findTournamentBySlug } from '@/utils/tournamentUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trophy, Coffee, ArrowLeft } from 'lucide-react';
import CompetitorScorecard from '@/components/CompetitorScorecard';
import SensoryEvaluationCard from '@/components/SensoryEvaluationCard';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from '../../components/WEC25BracketData';
import './WEC2025Results.css';

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
  const { tournamentSlug } = useParams<{ tournamentSlug?: string }>();
  const navigate = useNavigate();
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(false); // Start as false to avoid initial spinner
  const [error, setError] = useState<string | null>(null);
  const [selectedHeat, setSelectedHeat] = useState<Match | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

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
  // Always show 5 rounds (1-5) for WEC 2025
  const availableRounds = useMemo(() => {
    // Always return rounds 1-5 for WEC tournaments
    return [1, 2, 3, 4, 5];
  }, []);

  // Get selected round matches - memoized (MUST be before any returns)
  const selectedRoundMatches = useMemo(() => {
    if (!selectedRound) return [];
    return matchesByRound[selectedRound] || [];
  }, [matchesByRound, selectedRound]);

  // Define all functions used by hooks BEFORE early returns
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
        round: getRoundFromHeatNumber(h.heatNumber),
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
          totalRounds: 5,  // Round 1-4 + Final
          currentRound: 5, // Tournament is completed
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

  // Helper function to determine round from heat number (used in both API and fallback)
  const getRoundFromHeatNumber = (heatNumber: number): number => {
    if (heatNumber >= 1 && heatNumber <= 16) return 1;  // Round 1: Heats 1-16
    if (heatNumber >= 17 && heatNumber <= 24) return 2; // Round 2: Heats 17-24
    if (heatNumber >= 25 && heatNumber <= 28) return 3; // Round 3: Heats 25-28
    if (heatNumber >= 29 && heatNumber <= 30) return 4; // Round 4: Heats 29-30
    if (heatNumber === 31) return 5;                    // Final: Heat 31
    return 1; // Default fallback
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
        totalRounds: data.tournament.totalRounds || 5,
        currentRound: data.tournament.currentRound || 5
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
        round: getRoundFromHeatNumber(m.heatNumber), // Correct round based on heat number
        heatNumber: m.heatNumber,
        status: m.status,
        startTime: m.startTime,
        endTime: m.endTime,
        competitor1Id: m.competitor1Id,
        competitor2Id: m.competitor2Id,
        winnerId: m.winnerId,
        competitor1Name: m.competitor1Name || 'Unknown',
        competitor2Name: m.competitor2Name || null
      })),
      scores: data.scores.map((s: any) => ({
        matchId: s.matchId,
        judgeId: s.judgeId,
        competitorId: s.competitorId,
        segment: s.segment,
        score: s.score,
        judgeName: s.judgeName
      })),
      detailedScores: data.detailedScores.map((ds: any) => ({
        matchId: ds.matchId,
        judgeName: ds.judgeName,
        leftCupCode: ds.leftCupCode,
        rightCupCode: ds.rightCupCode,
        sensoryBeverage: ds.sensoryBeverage,
        visualLatteArt: ds.visualLatteArt,
        taste: ds.taste,
        tactile: ds.tactile,
        flavour: ds.flavour,
        overall: ds.overall
      }))
    };
    
    setTournamentData(transformedData);
    setLoading(false);
    setError(null);
  };

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
      
      // First, get all tournaments to find by location/year
      const tournamentsResponse = await fetch('/api/tournaments');
      if (!tournamentsResponse.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      
      const tournaments = await tournamentsResponse.json();
      
      // Find tournament by slug
      let tournamentId: number | null = null;
      if (tournamentSlug) {
        const tournament = findTournamentBySlug(tournaments, tournamentSlug);
        tournamentId = tournament?.id || null;
      }
      
      // Fallback: try to find WEC 2025 Milano if no slug provided
      if (!tournamentId) {
        const wec2025 = tournaments.find((t: any) => 
          t.name === 'World Espresso Championships 2025 Milano'
        );
        tournamentId = wec2025?.id || null;
      }
      
      if (!tournamentId) {
        throw new Error('Tournament not found');
      }
      
      // Fetch tournament data by ID
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      
      await processResponse(response);
    } catch (err) {
      handleError(err);
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

  // Get round display name - must be before early returns
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

  // Fetch tournament data on mount or when slug changes
  useEffect(() => {
    if (!tournamentData) {
      fetchTournamentData();
    }
  }, [tournamentSlug]);

  // Always show round cards first - show them even while loading or if no data
  // Only show error state if there's an actual error
  if (error && !tournamentData) {
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

  const handlePreviousRound = () => {
    if (!selectedRound) return;
    const currentIndex = availableRounds.indexOf(selectedRound);
    if (currentIndex > 0) {
      setSelectedRound(availableRounds[currentIndex - 1]);
    }
  };

  const handleNextRound = () => {
    if (!selectedRound) return;
    const currentIndex = availableRounds.indexOf(selectedRound);
    if (currentIndex < availableRounds.length - 1) {
      setSelectedRound(availableRounds[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Round Selection Cards */}
        {!selectedRound ? (
          <div className="round-cards-container">
            {availableRounds.map((round) => {
              const roundMatches = matchesByRound[round] || [];
              const heatCount = roundMatches.length;
              const progress = heatCount > 0 ? 100 : 0; // Full progress if heats exist
              
              return (
                <div
                  key={round}
                  className="round-card"
                  onClick={() => setSelectedRound(round)}
                >
                  <h3 className="round-card-title">{getRoundDisplayName(round)}</h3>
                  <div className="round-card-heat-count">
                    {heatCount > 0 ? `${heatCount} Heat${heatCount !== 1 ? 's' : ''}` : 'No heats'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Back to Round Selection Button */}
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedRound(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Round Selection
              </Button>
            </div>

            {/* Round Navigation Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <button
                onClick={handlePreviousRound}
                disabled={availableRounds.indexOf(selectedRound) === 0}
                aria-label="Previous Round"
                data-testid="button-previous-round"
                className="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 p-0 bg-transparent border-0 rounded-lg transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img 
                  src="/icons/arrow_l.png" 
                  alt="Previous" 
                  className="block w-full h-full object-contain"
                />
              </button>
              
              <div className="text-center flex-1 bg-gradient-to-br from-cinnamon-brown/20 to-cinnamon-brown/30 rounded-xl py-4 px-6 border-2 border-cinnamon-brown/40 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Select
                    value={selectedRound.toString()}
                    onValueChange={(value) => setSelectedRound(parseInt(value))}
                  >
                    <SelectTrigger className="w-auto min-w-[200px] bg-transparent border-cinnamon-brown/50 text-white">
                      <SelectValue>
                        {getRoundDisplayName(selectedRound)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableRounds.map((round) => (
                        <SelectItem key={round} value={round.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{getRoundDisplayName(round)}</span>
                            {matchesByRound[round] && (
                              <span className="text-muted-foreground ml-2 text-xs">
                                ({matchesByRound[round].length} heats)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm font-semibold text-white/90">
                  {selectedRoundMatches.length} Heat{selectedRoundMatches.length !== 1 ? 's' : ''} • Round {availableRounds.indexOf(selectedRound) + 1} of {availableRounds.length}
                </p>
              </div>
              
              <button
                onClick={handleNextRound}
                disabled={availableRounds.indexOf(selectedRound) === availableRounds.length - 1}
                aria-label="Next Round"
                data-testid="button-next-round"
                className="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 p-0 bg-transparent border-0 rounded-lg transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img 
                  src="/icons/arrow_r.png" 
                  alt="Next" 
                  className="block w-full h-full object-contain"
                />
              </button>
            </div>

            {/* Tournament Heats - All heats in selected round */}
            <div className="space-y-4">
              {selectedRoundMatches && selectedRoundMatches.length > 0 ? (
                selectedRoundMatches.map(match => (
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (match.competitor1Name && match.competitor1Name !== 'BYE' && match.competitor1Name !== 'SCRATCHED') {
                              const encodedName = encodeURIComponent(match.competitor1Name);
                              navigate(`/results/${tournamentSlug}/baristas/${encodedName}?heat=${match.heatNumber}`);
                            }
                          }}
                          className="text-sm font-medium truncate hover:underline cursor-pointer text-left flex-1"
                          disabled={!match.competitor1Name || match.competitor1Name === 'BYE' || match.competitor1Name === 'SCRATCHED'}
                        >
                          {match.competitor1Name || '—'}
                        </button>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (match.competitor2Name && match.competitor2Name !== 'BYE' && match.competitor2Name !== 'SCRATCHED') {
                              const encodedName = encodeURIComponent(match.competitor2Name);
                              navigate(`/results/${tournamentSlug}/baristas/${encodedName}?heat=${match.heatNumber}`);
                            }
                          }}
                          className="text-sm font-medium truncate hover:underline cursor-pointer text-left flex-1"
                          disabled={!match.competitor2Name || match.competitor2Name === 'BYE' || match.competitor2Name === 'SCRATCHED'}
                        >
                          {match.competitor2Name || '—'}
                        </button>
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
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No heats found for this round.
              </CardContent>
            </Card>
          )}
        </div>
        </>
        )}
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
