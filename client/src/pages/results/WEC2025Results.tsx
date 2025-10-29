import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, X, ChevronLeft, ChevronRight } from 'lucide-react';
import CompetitorScorecard from '@/components/CompetitorScorecard';
import SensoryEvaluationCard from '@/components/SensoryEvaluationCard';

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
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHeat, setSelectedHeat] = useState<Match | null>(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const HEATS_PER_SEGMENT = 3;

  useEffect(() => {
    fetchTournamentData();
  }, []);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      // For now, use mock data since the API has issues
      const mockData: TournamentData = {
        tournament: {
          id: 4,
          name: "World Espresso Championships 2025 Milano",
          status: "COMPLETED",
          startDate: "2025-01-15T08:00:00.000Z",
          endDate: "2025-01-17T18:00:00.000Z",
          totalRounds: 5,
          currentRound: 5
        },
        participants: [
          { id: 1, seed: 1, finalRank: 1, userId: 1, name: "Aga", email: "aga@wec2025.com" },
          { id: 2, seed: 2, finalRank: 2, userId: 2, name: "Jae", email: "jae@wec2025.com" },
          { id: 3, seed: 3, finalRank: 3, userId: 3, name: "Stevo", email: "stevo@wec2025.com" }
        ],
        matches: [
          {
            id: 1,
            round: 1,
            heatNumber: 1,
            status: "DONE",
            startTime: "2025-01-15T08:00:00.000Z",
            endTime: "2025-01-15T08:15:00.000Z",
            competitor1Id: 1,
            competitor2Id: 2,
            winnerId: 1,
            competitor1Name: "Alice",
            competitor2Name: "Bob"
          },
          {
            id: 2,
            round: 1,
            heatNumber: 2,
            status: "DONE",
            startTime: "2025-01-15T08:20:00.000Z",
            endTime: "2025-01-15T08:35:00.000Z",
            competitor1Id: 3,
            competitor2Id: 4,
            winnerId: 3,
            competitor1Name: "Charlie",
            competitor2Name: "Diana"
          },
          {
            id: 3,
            round: 1,
            heatNumber: 3,
            status: "DONE",
            startTime: "2025-01-15T08:40:00.000Z",
            endTime: "2025-01-15T08:55:00.000Z",
            competitor1Id: 5,
            competitor2Id: 6,
            winnerId: 5,
            competitor1Name: "Emma",
            competitor2Name: "Frank"
          },
          {
            id: 4,
            round: 1,
            heatNumber: 4,
            status: "DONE",
            startTime: "2025-01-15T09:00:00.000Z",
            endTime: "2025-01-15T09:15:00.000Z",
            competitor1Id: 7,
            competitor2Id: 8,
            winnerId: 7,
            competitor1Name: "Grace",
            competitor2Name: "Henry"
          },
          {
            id: 5,
            round: 1,
            heatNumber: 5,
            status: "DONE",
            startTime: "2025-01-15T09:20:00.000Z",
            endTime: "2025-01-15T09:35:00.000Z",
            competitor1Id: 9,
            competitor2Id: 10,
            winnerId: 9,
            competitor1Name: "Ivan",
            competitor2Name: "Julia"
          },
          {
            id: 6,
            round: 2,
            heatNumber: 12,
            status: "DONE",
            startTime: "2025-01-15T10:00:00.000Z",
            endTime: "2025-01-15T10:15:00.000Z",
            competitor1Id: 1,
            competitor2Id: 2,
            winnerId: 1,
            competitor1Name: "Stevo",
            competitor2Name: "Edwin"
          },
          {
            id: 7,
            round: 5,
            heatNumber: 31,
            status: "DONE",
            startTime: "2025-01-17T16:00:00.000Z",
            endTime: "2025-01-17T16:15:00.000Z",
            competitor1Id: 1,
            competitor2Id: 2,
            winnerId: 1,
            competitor1Name: "Aga",
            competitor2Name: "Jae"
          }
        ],
        scores: [
          { matchId: 1, judgeId: 1, competitorId: 1, segment: "DIAL_IN", score: 10, judgeName: "Jasper" },
          { matchId: 1, judgeId: 2, competitorId: 2, segment: "DIAL_IN", score: 8, judgeName: "Korn" },
          { matchId: 1, judgeId: 3, competitorId: 1, segment: "DIAL_IN", score: 9, judgeName: "Michelle" },
          { matchId: 2, judgeId: 1, competitorId: 3, segment: "DIAL_IN", score: 11, judgeName: "Jasper" },
          { matchId: 2, judgeId: 2, competitorId: 4, segment: "DIAL_IN", score: 7, judgeName: "Korn" },
          { matchId: 2, judgeId: 3, competitorId: 3, segment: "DIAL_IN", score: 10, judgeName: "Michelle" },
          { matchId: 3, judgeId: 1, competitorId: 5, segment: "DIAL_IN", score: 9, judgeName: "Jasper" },
          { matchId: 3, judgeId: 2, competitorId: 6, segment: "DIAL_IN", score: 6, judgeName: "Korn" },
          { matchId: 3, judgeId: 3, competitorId: 5, segment: "DIAL_IN", score: 8, judgeName: "Michelle" },
          { matchId: 4, judgeId: 1, competitorId: 7, segment: "DIAL_IN", score: 10, judgeName: "Jasper" },
          { matchId: 4, judgeId: 2, competitorId: 8, segment: "DIAL_IN", score: 5, judgeName: "Korn" },
          { matchId: 4, judgeId: 3, competitorId: 7, segment: "DIAL_IN", score: 11, judgeName: "Michelle" },
          { matchId: 5, judgeId: 1, competitorId: 9, segment: "DIAL_IN", score: 9, judgeName: "Jasper" },
          { matchId: 5, judgeId: 2, competitorId: 10, segment: "DIAL_IN", score: 7, judgeName: "Korn" },
          { matchId: 5, judgeId: 3, competitorId: 9, segment: "DIAL_IN", score: 10, judgeName: "Michelle" },
          { matchId: 6, judgeId: 1, competitorId: 1, segment: "DIAL_IN", score: 28, judgeName: "Jasper" },
          { matchId: 6, judgeId: 2, competitorId: 2, segment: "DIAL_IN", score: 5, judgeName: "Korn" },
          { matchId: 7, judgeId: 1, competitorId: 1, segment: "DIAL_IN", score: 19, judgeName: "Shinsaku" },
          { matchId: 7, judgeId: 2, competitorId: 2, segment: "DIAL_IN", score: 14, judgeName: "Korn" }
        ],
        detailedScores: [
          // Match 1 - Heat 1
          { matchId: 1, judgeName: "Jasper", leftCupCode: "A01", rightCupCode: "B01", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 1, judgeName: "Korn", leftCupCode: "A01", rightCupCode: "B01", sensoryBeverage: "Espresso", visualLatteArt: "right", taste: "left", tactile: "right", flavour: "left", overall: "left" },
          { matchId: 1, judgeName: "Michelle", leftCupCode: "A01", rightCupCode: "B01", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          // Match 2 - Heat 2
          { matchId: 2, judgeName: "Jasper", leftCupCode: "A02", rightCupCode: "B02", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 2, judgeName: "Korn", leftCupCode: "A02", rightCupCode: "B02", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "right", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 2, judgeName: "Michelle", leftCupCode: "A02", rightCupCode: "B02", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          // Match 3 - Heat 3
          { matchId: 3, judgeName: "Jasper", leftCupCode: "A03", rightCupCode: "B03", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 3, judgeName: "Korn", leftCupCode: "A03", rightCupCode: "B03", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "right", flavour: "right", overall: "left" },
          { matchId: 3, judgeName: "Michelle", leftCupCode: "A03", rightCupCode: "B03", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          // Match 4 - Heat 4
          { matchId: 4, judgeName: "Jasper", leftCupCode: "A04", rightCupCode: "B04", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 4, judgeName: "Korn", leftCupCode: "A04", rightCupCode: "B04", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "right", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 4, judgeName: "Michelle", leftCupCode: "A04", rightCupCode: "B04", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          // Match 5 - Heat 5
          { matchId: 5, judgeName: "Jasper", leftCupCode: "A05", rightCupCode: "B05", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 5, judgeName: "Korn", leftCupCode: "A05", rightCupCode: "B05", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "right", overall: "left" },
          { matchId: 5, judgeName: "Michelle", leftCupCode: "A05", rightCupCode: "B05", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          // Match 6 - Heat 12
          { matchId: 6, judgeName: "Jasper", leftCupCode: "A12", rightCupCode: "B34", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 6, judgeName: "Korn", leftCupCode: "A12", rightCupCode: "B34", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "right", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 6, judgeName: "Michelle", leftCupCode: "A12", rightCupCode: "B34", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "right", overall: "left" },
          // Match 7 - Final Heat 31
          { matchId: 7, judgeName: "Shinsaku", leftCupCode: "C56", rightCupCode: "D78", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "right", flavour: "left", overall: "left" },
          { matchId: 7, judgeName: "Korn", leftCupCode: "C56", rightCupCode: "D78", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 7, judgeName: "Jasper", leftCupCode: "C56", rightCupCode: "D78", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "right", tactile: "left", flavour: "right", overall: "right" }
        ]
      };
      setTournamentData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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

  // Sort matches by heat number
  const sortedMatches = tournamentData?.matches
    ? [...tournamentData.matches].sort((a, b) => a.heatNumber - b.heatNumber)
    : [];

  // Calculate pagination
  const totalSegments = Math.ceil(sortedMatches.length / HEATS_PER_SEGMENT);
  const startIndex = currentSegment * HEATS_PER_SEGMENT;
  const endIndex = startIndex + HEATS_PER_SEGMENT;
  const currentHeats = sortedMatches.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentSegment(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSegment(prev => Math.min(totalSegments - 1, prev + 1));
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-md mx-auto">
        {/* Carousel Navigation Header */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={currentSegment === 0}
            data-testid="button-previous-segment"
            className="text-cinnamon-brown"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Heats {startIndex + 1}-{Math.min(endIndex, sortedMatches.length)} of {sortedMatches.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Segment {currentSegment + 1} of {totalSegments}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={currentSegment === totalSegments - 1}
            data-testid="button-next-segment"
            className="text-cinnamon-brown"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Tournament Heats - 3-Stack Carousel */}
        <div className="space-y-4">
          {currentHeats && currentHeats.length > 0 ? (
            currentHeats.map(match => (
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
