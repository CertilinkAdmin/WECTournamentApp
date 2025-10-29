import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, X } from 'lucide-react';
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
            id: 2,
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
          { matchId: 1, judgeId: 1, competitorId: 1, segment: "DIAL_IN", score: 28, judgeName: "Jasper" },
          { matchId: 1, judgeId: 2, competitorId: 2, segment: "DIAL_IN", score: 5, judgeName: "Korn" },
          { matchId: 2, judgeId: 1, competitorId: 1, segment: "DIAL_IN", score: 19, judgeName: "Shinsaku" },
          { matchId: 2, judgeId: 2, competitorId: 2, segment: "DIAL_IN", score: 14, judgeName: "Korn" }
        ],
        detailedScores: [
          // Match 1 - Heat 12
          { matchId: 1, judgeName: "Jasper", leftCupCode: "A12", rightCupCode: "B34", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 1, judgeName: "Korn", leftCupCode: "A12", rightCupCode: "B34", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "right", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 1, judgeName: "Michelle", leftCupCode: "A12", rightCupCode: "B34", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "right", overall: "left" },
          // Match 2 - Final Heat 31
          { matchId: 2, judgeName: "Shinsaku", leftCupCode: "C56", rightCupCode: "D78", sensoryBeverage: "Cappuccino", visualLatteArt: "left", taste: "left", tactile: "right", flavour: "left", overall: "left" },
          { matchId: 2, judgeName: "Korn", leftCupCode: "C56", rightCupCode: "D78", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "left", tactile: "left", flavour: "left", overall: "left" },
          { matchId: 2, judgeName: "Jasper", leftCupCode: "C56", rightCupCode: "D78", sensoryBeverage: "Espresso", visualLatteArt: "left", taste: "right", tactile: "left", flavour: "right", overall: "right" }
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

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Tournament Heats - Direct Grid Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournamentData.matches && tournamentData.matches.length > 0 ? (
            tournamentData.matches
              .sort((a, b) => a.round - b.round || a.heatNumber - b.heatNumber)
              .map(match => (
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
