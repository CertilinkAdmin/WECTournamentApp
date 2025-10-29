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
      
      // Fetch actual tournament data from API (Tournament ID 7: WEC 2025 Milano)
      const response = await fetch('/api/tournaments/7');
      
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
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setError('Failed to load tournament data');
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentSegment === 0}
            data-testid="button-previous-segment"
            className="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 p-2 bg-white/90 hover:bg-white border-2 border-cinnamon-brown/30 hover:border-cinnamon-brown rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <img 
              src="arrow_l.png" 
              alt="Previous" 
              className="w-full h-full object-contain filter hover:brightness-110"
            />
          </button>
          
          <div className="text-center flex-1 bg-cinnamon-brown/10 rounded-lg py-3 px-4 border border-cinnamon-brown/20">
            <p className="text-sm font-bold text-cinnamon-brown">
              Heats {startIndex + 1}-{Math.min(endIndex, sortedMatches.length)} of {sortedMatches.length}
            </p>
            <p className="text-xs text-cinnamon-brown/70 font-medium">
              Segment {currentSegment + 1} of {totalSegments}
            </p>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentSegment === totalSegments - 1}
            data-testid="button-next-segment"
            className="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 p-2 bg-white/90 hover:bg-white border-2 border-cinnamon-brown/30 hover:border-cinnamon-brown rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <img 
              src="arrow_r.png" 
              alt="Next" 
              className="w-full h-full object-contain filter hover:brightness-110"
            />
          </button>
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
