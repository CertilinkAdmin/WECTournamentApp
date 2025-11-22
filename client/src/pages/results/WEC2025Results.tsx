import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { findTournamentBySlug } from '@/utils/tournamentUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trophy, Coffee, ArrowLeft, Loader2 } from 'lucide-react';
import CompetitorScorecard from '@/components/CompetitorScorecard';
import SensoryEvaluationCard from '@/components/SensoryEvaluationCard';
import { validateScores, logScoreDiscrepancies } from '@/utils/scoreValidation';
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
  // Uses database round field directly, following Tournament -> Round -> Heat hierarchy
  const matchesByRound = useMemo(() => {
    if (!tournamentData?.matches) return {};

    const grouped = tournamentData.matches.reduce((acc, match) => {
      // Use database round field directly (Tournament -> Round -> Heat hierarchy)
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
  // Show rounds based on database structure (Tournament -> Rounds -> Heats)
  // For WEC2025, we expect 5 rounds (1-5)
  const availableRounds = useMemo(() => {
    if (!tournamentData?.tournament) {
      // Default to 5 rounds for WEC tournaments if no data yet
      return [1, 2, 3, 4, 5];
    }
    
    // Get rounds from database matches, or use tournament totalRounds
    const roundsFromMatches = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
    const totalRounds = tournamentData.tournament.totalRounds || 5;
    
    // If we have matches, use those rounds; otherwise show all rounds up to totalRounds
    if (roundsFromMatches.length > 0) {
      return roundsFromMatches;
    }
    
    // Generate rounds 1 through totalRounds
    return Array.from({ length: totalRounds }, (_, i) => i + 1);
  }, [tournamentData?.tournament, matchesByRound]);

  // Get selected round matches - memoized (MUST be before any returns)
  const selectedRoundMatches = useMemo(() => {
    if (!selectedRound) return [];
    return matchesByRound[selectedRound] || [];
  }, [matchesByRound, selectedRound]);

  const handleError = (err: any) => {
    console.error('Error fetching tournament data:', err);
    setError(err.message || 'Failed to load tournament data. Please try again later.');
    setLoading(false);
  };

  // Helper function to determine round from heat number (used in both API and fallback)
  // Round mapping based on user specification:
  // Round 1: Heats 1-16 (first 16 heats)
  // Round 2: Heats 17-24 (next 8 heats)
  // Round 3: Heats 25-28 (next 4 heats)
  // Round 4: Heats 29-30 (2 heats - semifinals)
  // Round 5: Heat 31+ (Final)
  const getRoundFromHeatNumber = (heatNumber: number): number => {
    if (heatNumber >= 1 && heatNumber <= 16) return 1;  // Round 1 - First 16 heats
    if (heatNumber >= 17 && heatNumber <= 24) return 2; // Round 2 - Next 8 heats
    if (heatNumber >= 25 && heatNumber <= 28) return 3; // Round 3 - Next 4 heats
    if (heatNumber >= 29 && heatNumber <= 30) return 4; // Round 4 - 2 heats (Semifinals)
    if (heatNumber >= 31) return 5;                      // Round 5 - Final
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
        round: m.round || getRoundFromHeatNumber(m.heatNumber), // Use database round field, fallback to heat number calculation
        heatNumber: m.heatNumber,
        status: m.status,
        startTime: m.startTime,
        endTime: m.endTime,
        competitor1Id: m.competitor1Id || m.competitor1RegistrationId,
        competitor2Id: m.competitor2Id || m.competitor2RegistrationId,
        winnerId: m.winnerId || m.winnerRegistrationId,
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

    // Validate scores after data is loaded
    if (transformedData.detailedScores.length > 0 && transformedData.scores.length > 0) {
      const discrepancies = validateScores(
        transformedData.detailedScores,
        transformedData.scores,
        transformedData.matches
      );
      logScoreDiscrepancies(discrepancies);
    }
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
      1: 'Round 1 - First 16 Heats',
      2: 'Round 2 - Next 8 Heats', 
      3: 'Round 3 - Next 4 Heats',
      4: 'Round 4 - Semifinals (2 Heats)',
      5: 'Round 5 - Final'
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
        <Card className="max-w-md w-full border-2 border-destructive/30 bg-secondary/20 dark:bg-card shadow-md">
          <CardHeader className="bg-destructive/5 dark:bg-transparent rounded-t-lg">
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
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-[#2D1B12] dark:bg-[#2D1B12] overflow-visible">
      <div className="max-w-4xl mx-auto overflow-visible">
        {/* Round Selection Cards */}
        {!selectedRound ? (
          <div className="round-cards-container" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            {availableRounds.map((round) => {
              const roundMatches = matchesByRound[round] || [];
              const heatCount = roundMatches.length;
              const progress = heatCount > 0 ? 100 : 0; // Full progress if heats exist

              // Dynamic sizing based on heat count
              const baseHeight = 120; // Minimum height for header and footer
              const heatHeight = 13; // Height per heat match
              const dynamicHeight = Math.max(200, baseHeight + (heatCount * heatHeight) + 60); // 60px padding
              const svgHeight = Math.max(120, heatCount * heatHeight + 30); // 30px padding for SVG

              return (
                <div
                  key={round}
                  className="round-card"
                  onClick={() => setSelectedRound(round)}
                  data-testid={`card-round-${round}`}
                  style={{ height: `${dynamicHeight}px` }}
                >
                  <h3 className="round-card-title">{getRoundDisplayName(round)}</h3>
                  <div className="round-card-bracket">
                    {heatCount > 0 ? (
                      <svg 
                        viewBox={`0 0 180 ${svgHeight}`} 
                        className="bracket-svg" 
                        style={{ width: '100%', height: '100%' }}
                      >
                        {roundMatches.map((match, heatIdx) => {
                          // Two-column bracket view: left column vs right column
                          // Increased spacing for larger display
                          const y = 15 + (heatIdx * 13); // 13px spacing per heat (larger)
                          const hasWinner = match.winnerId > 0;
                          const competitor1Wins = hasWinner && match.winnerId === match.competitor1Id;
                          const competitor2Wins = hasWinner && match.winnerId === match.competitor2Id;
                          
                          return (
                            <g key={match.id}>
                              {/* Left competitor name */}
                              <text
                                x="8"
                                y={y + 4}
                                fontSize="9"
                                fill="currentColor"
                                className={competitor1Wins ? "text-golden dark:text-amber-300" : "text-muted-foreground dark:text-foreground"}
                                style={{ fontFamily: 'system-ui, sans-serif', fontWeight: '500' }}
                              >
                                {match.competitor1Name || '—'}
                              </text>
                              {/* Left competitor line extending right */}
                              <line
                                x1="8"
                                y1={y + 7}
                                x2="75"
                                y2={y + 7}
                                stroke="currentColor"
                                strokeWidth="2"
                                className={competitor1Wins ? "text-golden dark:text-amber-300" : "text-muted-foreground dark:text-foreground"}
                              />
                              {/* Right competitor name */}
                              <text
                                x="172"
                                y={y + 4}
                                fontSize="9"
                                fill="currentColor"
                                className={competitor2Wins ? "text-golden dark:text-amber-300" : "text-muted-foreground dark:text-foreground"}
                                style={{ fontFamily: 'system-ui, sans-serif', textAnchor: 'end', fontWeight: '500' }}
                              >
                                {match.competitor2Name || 'BYE'}
                              </text>
                              {/* Right competitor line extending left */}
                              <line
                                x1="105"
                                y1={y + 7}
                                x2="172"
                                y2={y + 7}
                                stroke="currentColor"
                                strokeWidth="2"
                                className={competitor2Wins ? "text-golden dark:text-amber-300" : "text-muted-foreground dark:text-foreground"}
                              />
                            </g>
                          );
                        })}
                      </svg>
                    ) : (
                      <div className="text-muted-foreground text-sm">No heats</div>
                    )}
                  </div>
                  <div className="round-card-heat-count-small">
                    {heatCount} {heatCount === 1 ? 'Heat' : 'Heats'}
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

              <div className="text-center flex-1 bg-gradient-to-br from-primary/90 to-primary/80 dark:bg-primary/40 rounded-xl py-4 px-6 border-2 border-primary/50 dark:border-cinnamon-brown/40 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Select
                    value={selectedRound.toString()}
                    onValueChange={(value) => setSelectedRound(parseInt(value))}
                  >
                    <SelectTrigger className="w-auto min-w-[200px] bg-[#dcccb6] dark:bg-[#2d1b12] border-[#9a4828]/50 dark:border-cinnamon-brown/50 text-[#2d1b12] dark:text-white backdrop-blur-sm">
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
                <p className="text-sm font-semibold text-white dark:text-white/90">
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
                  className="cursor-pointer hover-elevate active-elevate-2 transition-all border-2 border-primary/30 dark:border-primary/20 hover:border-primary/50 dark:hover:border-primary/40 bg-secondary/20 dark:bg-card shadow-md"
                  onClick={() => setSelectedHeat(match)}
                  data-testid={`card-heat-${match.id}`}
                >
                  <CardHeader className="pb-3 dark:bg-transparent rounded-t-lg border-b border-primary/20 bg-[#f2e6d3]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary dark:text-cinnamon-brown">
                        Heat {match.heatNumber}
                      </span>
                      <Badge variant="secondary" className="text-xs border border-primary/30">
                        Round {match.round}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 bg-[#f2e6d3]">
                    <div className="space-y-2">
                      <div
                        className={`flex items-center justify-between p-2 rounded-md border-2 ${
                          match.winnerId === match.competitor1Id
                            ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800 border-primary/30'
                            : 'bg-secondary/40 dark:bg-muted/50 border-primary/20 dark:border-border'
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
                          className="text-base font-medium truncate hover:underline cursor-pointer text-left flex-1 text-[#2d1b12] dark:text-white"
                          disabled={!match.competitor1Name || match.competitor1Name === 'BYE' || match.competitor1Name === 'SCRATCHED'}
                        >
                          {match.competitor1Name || '—'}
                        </button>
                        <span className="text-lg font-bold text-golden dark:text-amber-300 ml-2">
                          {getTotalScore(match.id, match.competitor1Id)}
                        </span>
                      </div>

                      <div className="text-center text-xs text-muted-foreground font-medium">
                        VS
                      </div>

                      <div
                        className={`flex items-center justify-between p-2 rounded-md border-2 ${
                          match.winnerId === match.competitor2Id
                            ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800 border-primary/30'
                            : 'bg-secondary/40 dark:bg-muted/50 border-primary/20 dark:border-border'
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
                          className="text-base font-medium truncate hover:underline cursor-pointer text-left flex-1 text-[#2d1b12] dark:text-white"
                          disabled={!match.competitor2Name || match.competitor2Name === 'BYE' || match.competitor2Name === 'SCRATCHED'}
                        >
                          {match.competitor2Name || '—'}
                        </button>
                        <span className="text-lg font-bold text-golden dark:text-amber-300 ml-2">
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
            <Card className="border-2 border-primary/20 dark:border-border bg-secondary/20 dark:bg-card shadow-md">
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