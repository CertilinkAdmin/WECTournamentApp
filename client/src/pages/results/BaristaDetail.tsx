import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Trophy, ArrowLeft, Loader2 } from 'lucide-react';
import { findTournamentBySlug } from '@/utils/tournamentUtils';
import { stationIdToLetter } from '@/utils/stationUtils';
import { transformTournamentData } from '@/utils/tournamentDataTransform';

interface Match {
  id: number;
  round: number;
  heatNumber: number;
  status: string;
  competitor1Id: number | null;
  competitor2Id: number | null;
  winnerId: number | null;
  competitor1Name: string;
  competitor2Name: string;
  stationId?: number | null;
}

interface JudgeDetailedScore {
  matchId: number;
  judgeName: string;
  leftCupCode: string;
  rightCupCode: string;
  sensoryBeverage: string;
  visualLatteArt: 'left' | 'right';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}

interface TournamentData {
  tournament: any;
  matches: Match[];
  detailedScores: JudgeDetailedScore[];
}

interface CategoryScores {
  latteArt: number;
  taste: number;
  tactile: number;
  flavor: number;
  overall: number;
}

interface HeatScore {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner: string;
  cupCode: string;
  categoryScores: CategoryScores;
  totalPoints: number;
}

const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

const JUDGES_COUNT = 3;

// Helper function to determine category result
const getCategoryResult = (earnedPoints: number, maxPointsPerJudge: number): 'WIN' | 'LOSS' | 'TIE' => {
  const maxPossible = maxPointsPerJudge * JUDGES_COUNT;
  const winThreshold = maxPointsPerJudge * (JUDGES_COUNT / 2); // More than half the judges
  
  if (earnedPoints > winThreshold) return 'WIN';
  if (earnedPoints === 0) return 'LOSS';
  if (earnedPoints < winThreshold) return 'LOSS';
  return 'TIE'; // Exactly half (rare with odd number of judges)
};

const BaristaDetail: React.FC = () => {
  const { baristaName, tournamentSlug } = useParams<{ baristaName: string; tournamentSlug?: string }>();
  const navigate = useNavigate();
  const tournament = tournamentSlug || 'WEC2025';
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get heat number from URL query params if navigating from a heat
  const searchParams = new URLSearchParams(window.location.search);
  const heatNumberParam = searchParams.get('heat');

  const decodedBaristaName = baristaName ? decodeURIComponent(baristaName) : '';

  // Fetch tournament data from API
  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const tournamentsResponse = await fetch('/api/tournaments');
        if (!tournamentsResponse.ok) {
          const errorText = await tournamentsResponse.text();
          console.error('Failed to fetch tournaments:', errorText);
          throw new Error(`Failed to fetch tournaments list: ${tournamentsResponse.status} ${tournamentsResponse.statusText}`);
        }
        
        const tournaments = await tournamentsResponse.json();
        console.log('Fetched tournaments:', tournaments);
        
        const wecTournament = findTournamentBySlug(tournaments, tournament);
        
        if (!wecTournament) {
          const fallbackTournament = tournaments.find((t: any) => 
            t.name?.toLowerCase().includes('wec') || 
            t.name?.toLowerCase().includes('world espresso') ||
            t.name?.toLowerCase().includes('2025')
          );
          
          if (!fallbackTournament) {
            console.error('No tournament found. Available tournaments:', tournaments.map((t: any) => ({ id: t.id, name: t.name })));
            throw new Error(`Tournament not found. Looking for: ${tournament}. Available: ${tournaments.map((t: any) => t.name).join(', ')}`);
          }
          
          const tournamentId = fallbackTournament.id;
          console.log('Using fallback tournament:', fallbackTournament.name, 'ID:', tournamentId);
          const response = await fetch(`/api/tournaments/${tournamentId}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch tournament data:', errorText);
            throw new Error(`Failed to fetch tournament data: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Fetched tournament data:', { 
            tournament: data.tournament?.name, 
            matchesCount: data.matches?.length, 
            detailedScoresCount: data.detailedScores?.length 
          });
          
          const transformedData = transformTournamentData(data);
          setTournamentData(transformedData);
          return;
        }

        const tournamentId = wecTournament.id;
        console.log('Using tournament:', wecTournament.name, 'ID:', tournamentId);
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch tournament data:', errorText);
          throw new Error(`Failed to fetch tournament data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched tournament data:', { 
          tournament: data.tournament?.name, 
          matchesCount: data.matches?.length, 
          detailedScoresCount: data.detailedScores?.length 
        });
        
        const transformedData = transformTournamentData(data);
        setTournamentData(transformedData);
      } catch (err: any) {
        console.error('Error fetching tournament data:', err);
        setError(err.message || 'Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournament]);

  // Helper function to match barista name
  const matchesBarista = (name: string, baristaNameLower: string): boolean => {
    if (!name) return false;
    const nameLower = name.toLowerCase().trim();
    return (
      nameLower === baristaNameLower ||
      nameLower.startsWith(baristaNameLower) ||
      nameLower.split(' ')[0] === baristaNameLower
    );
  };

  // Get all heats where this barista participated
  const baristaHeats = useMemo(() => {
    if (!tournamentData?.matches || !tournamentData?.detailedScores || !decodedBaristaName) return [];

    const baristaNameLower = decodedBaristaName.toLowerCase();

    return tournamentData.matches
      .filter(match => {
        const comp1 = match.competitor1Name?.trim() || '';
        const comp2 = match.competitor2Name?.trim() || '';
        return matchesBarista(comp1, baristaNameLower) || matchesBarista(comp2, baristaNameLower);
      })
      .map(match => {
        const comp1 = match.competitor1Name?.trim() || '';
        const comp2 = match.competitor2Name?.trim() || '';
        
        const isCompetitor1 = matchesBarista(comp1, baristaNameLower);
        const isCompetitor2 = matchesBarista(comp2, baristaNameLower);
        
        // Determine cup code and position
        const competitorPosition: 'left' | 'right' = isCompetitor1 ? 'left' : 'right';
        
        // Get judge scores for this match
        const judgeScores = tournamentData.detailedScores.filter(
          score => score.matchId === match.id
        );
        
        // Get cup code from first judge
        const firstJudge = judgeScores[0];
        const cupCode = isCompetitor1 
          ? (firstJudge?.leftCupCode || '')
          : (firstJudge?.rightCupCode || '');
        
        // Calculate category scores from judges
        const categoryScores: CategoryScores = {
          latteArt: 0,
          taste: 0,
          tactile: 0,
          flavor: 0,
          overall: 0,
        };
        
        judgeScores.forEach(judge => {
          const wonLatteArt = judge.visualLatteArt === competitorPosition;
          const wonTaste = judge.taste === competitorPosition;
          const wonTactile = judge.tactile === competitorPosition;
          const wonFlavor = judge.flavour === competitorPosition;
          const wonOverall = judge.overall === competitorPosition;
          
          if (wonLatteArt) categoryScores.latteArt += CATEGORY_POINTS.visualLatteArt;
          if (wonTaste) categoryScores.taste += CATEGORY_POINTS.taste;
          if (wonTactile) categoryScores.tactile += CATEGORY_POINTS.tactile;
          if (wonFlavor) categoryScores.flavor += CATEGORY_POINTS.flavour;
          if (wonOverall) categoryScores.overall += CATEGORY_POINTS.overall;
        });
        
        const totalPoints = categoryScores.latteArt + categoryScores.taste + 
                           categoryScores.tactile + categoryScores.flavor + 
                           categoryScores.overall;
        
        // Determine winner
        const winner = match.winnerId === match.competitor1Id 
          ? match.competitor1Name 
          : match.winnerId === match.competitor2Id 
          ? match.competitor2Name 
          : null;
        
        // Determine station
        const station = stationIdToLetter(match.stationId);
        
        return {
          heatNumber: match.heatNumber,
          station,
          competitor1: match.competitor1Name || '',
          competitor2: match.competitor2Name || '',
          winner: winner || '',
          cupCode: cupCode || '',
          categoryScores,
          totalPoints,
        } as HeatScore;
      })
      .sort((a, b) => a.heatNumber - b.heatNumber);
  }, [tournamentData, decodedBaristaName]);

  // Set initial heat index if navigating from a specific heat
  useEffect(() => {
    if (heatNumberParam && baristaHeats.length > 0) {
      const heatNum = parseInt(heatNumberParam, 10);
      const heatIndex = baristaHeats.findIndex(h => h.heatNumber === heatNum);
      if (heatIndex !== -1) {
        setCurrentHeatIndex(heatIndex);
      }
    }
  }, [heatNumberParam, baristaHeats.length]);

  const currentHeat = baristaHeats[currentHeatIndex];

  const nextHeat = () => {
    if (currentHeatIndex < baristaHeats.length - 1) {
      setCurrentHeatIndex(prev => prev + 1);
    }
  };

  const prevHeat = () => {
    if (currentHeatIndex > 0) {
      setCurrentHeatIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen tournament-bracket-bg p-6 flex items-center justify-center">
        <Card className="max-w-md border-2 border-primary/20 bg-secondary/30 dark:bg-card shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading barista data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen tournament-bracket-bg p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!decodedBaristaName || baristaHeats.length === 0) {
    return (
      <div className="min-h-screen tournament-bracket-bg p-6 flex items-center justify-center">
        <Card className="max-w-md w-full border-2 border-primary/20 bg-secondary/30 dark:bg-card shadow-md">
          <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
            <CardTitle className="text-primary dark:text-foreground">Barista Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">No heats found for this barista.</p>
            <Button onClick={() => navigate(`/results/${tournament}/baristas`)}>Back to Baristas</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall totals across all heats
  const overallTotals = baristaHeats.reduce((totals, heat) => {
    totals.latteArt += heat.categoryScores.latteArt;
    totals.taste += heat.categoryScores.taste;
    totals.tactile += heat.categoryScores.tactile;
    totals.flavor += heat.categoryScores.flavor;
    totals.overall += heat.categoryScores.overall;
    return totals;
  }, { latteArt: 0, taste: 0, tactile: 0, flavor: 0, overall: 0 });

  const overallTotalPoints = overallTotals.latteArt + overallTotals.taste + 
                             overallTotals.tactile + overallTotals.flavor + 
                             overallTotals.overall;

  return (
    <div className="min-h-screen tournament-bracket-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/results/${tournament}/baristas`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Baristas
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <User className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-primary">{decodedBaristaName}'s Scores</h1>
              <User className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl text-muted-foreground">
              {baristaHeats.length} heat{baristaHeats.length !== 1 ? 's' : ''} competed
            </p>
          </div>
        </div>

        {/* Overall Summary Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-chart-3/10 border-2 border-primary/30 dark:border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
            <CardTitle className="text-2xl text-center text-primary dark:text-foreground">Overall Tournament Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Latte Art</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.latteArt}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Taste</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.taste}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Tactile</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.tactile}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Flavor</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.flavor}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Overall</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.overall}</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Points</div>
              <div className="text-4xl font-bold text-primary">{overallTotalPoints}</div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        {baristaHeats.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={prevHeat}
              disabled={currentHeatIndex === 0}
              className="flex items-center gap-2"
            >
              <img src="/icons/arrow_l.png" alt="Previous" className="h-4 w-4 object-contain" />
              Previous
            </Button>
            
            <div className="text-center px-6 py-3 bg-gradient-to-r from-primary/10 to-chart-3/10 rounded-xl border border-primary/20 backdrop-blur-sm">
              <div className="text-lg font-semibold text-primary">
                Heat {currentHeatIndex + 1} of {baristaHeats.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Heat {currentHeat?.heatNumber} - Station {currentHeat?.station}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={nextHeat}
              disabled={currentHeatIndex === baristaHeats.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <img src="/icons/arrow_r.png" alt="Next" className="h-4 w-4 object-contain" />
            </Button>
          </div>
        )}

        {/* Current Heat Scores */}
        {currentHeat && (
          <Card className="mb-6 border-2 border-primary/20 dark:border-border shadow-md bg-secondary/30 dark:bg-card">
            <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg border-b border-primary/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-primary dark:text-foreground">Heat {currentHeat.heatNumber} Details</CardTitle>
                <Badge variant="default" className="text-lg px-4 py-1">
                  Station {currentHeat.station}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Matchup */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/60 dark:bg-muted/50 rounded-lg border border-border/60">
                <div className={`text-center p-4 rounded-lg ${
                  (() => {
                    const comp1Lower = currentHeat.competitor1.toLowerCase();
                    const baristaNameLower = decodedBaristaName.toLowerCase();
                    return comp1Lower === baristaNameLower || 
                           comp1Lower.startsWith(baristaNameLower) ||
                           comp1Lower.split(' ')[0] === baristaNameLower;
                  })() ? 'bg-primary/20 border-2 border-primary' : ''
                }`}>
                  <div className="text-sm text-muted-foreground mb-2">Competitor 1</div>
                  <div className="font-semibold text-lg">{currentHeat.competitor1}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cup: {(() => {
                      const comp1Lower = currentHeat.competitor1.toLowerCase();
                      const baristaNameLower = decodedBaristaName.toLowerCase();
                      const isThisBarista = comp1Lower === baristaNameLower || 
                                          comp1Lower.startsWith(baristaNameLower) ||
                                          comp1Lower.split(' ')[0] === baristaNameLower;
                      return isThisBarista ? (currentHeat.cupCode || 'N/A') : (currentHeat.competitor1 === 'BYE' ? 'BYE' : 'N/A');
                    })()}
                  </div>
                </div>
                <div className={`text-center p-4 rounded-lg ${
                  (() => {
                    const comp2Lower = currentHeat.competitor2.toLowerCase();
                    const baristaNameLower = decodedBaristaName.toLowerCase();
                    return comp2Lower !== 'BYE' && (
                      comp2Lower === baristaNameLower || 
                      comp2Lower.startsWith(baristaNameLower) ||
                      comp2Lower.split(' ')[0] === baristaNameLower
                    );
                  })() ? 'bg-primary/20 border-2 border-primary' : ''
                }`}>
                  <div className="text-sm text-muted-foreground mb-2">Competitor 2</div>
                  <div className="font-semibold text-lg">{currentHeat.competitor2}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cup: {(() => {
                      const comp2Lower = currentHeat.competitor2.toLowerCase();
                      const baristaNameLower = decodedBaristaName.toLowerCase();
                      const isThisBarista = comp2Lower !== 'BYE' && (
                        comp2Lower === baristaNameLower || 
                        comp2Lower.startsWith(baristaNameLower) ||
                        comp2Lower.split(' ')[0] === baristaNameLower
                      );
                      return isThisBarista ? (currentHeat.cupCode || 'N/A') : (currentHeat.competitor2 === 'BYE' ? 'BYE' : 'N/A');
                    })()}
                  </div>
                </div>
              </div>

              {/* Category Scores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-center text-primary dark:text-foreground">Scores by Category</h3>
                
                {/* Cappuccino Section */}
                <div className="space-y-3">
                  <div className="bg-secondary/90 dark:bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-center font-bold text-lg border border-secondary/40" data-testid="section-cappuccino">
                    CAPPUCCINO
                  </div>
                  
                  {/* Latte Art */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-latte-art">
                    <span className="font-semibold">Latte Art:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.latteArt} / {CATEGORY_POINTS.visualLatteArt * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.latteArt, CATEGORY_POINTS.visualLatteArt)}
                    </span>
                  </div>
                </div>

                {/* Espresso Section */}
                <div className="space-y-3 mt-6">
                  <div className="bg-secondary/90 dark:bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-center font-bold text-lg border border-secondary/40" data-testid="section-espresso">
                    ESPRESSO
                  </div>
                  
                  {/* Taste */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-taste">
                    <span className="font-semibold">Taste:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.taste} / {CATEGORY_POINTS.taste * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.taste, CATEGORY_POINTS.taste)}
                    </span>
                  </div>
                  
                  {/* Tactile */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-tactile">
                    <span className="font-semibold">Tactile:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.tactile} / {CATEGORY_POINTS.tactile * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.tactile, CATEGORY_POINTS.tactile)}
                    </span>
                  </div>
                  
                  {/* Flavour */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-flavour">
                    <span className="font-semibold">Flavour:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.flavor} / {CATEGORY_POINTS.flavour * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.flavor, CATEGORY_POINTS.flavour)}
                    </span>
                  </div>
                  
                  {/* Overall */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-overall">
                    <span className="font-semibold">Overall:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.overall} / {CATEGORY_POINTS.overall * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.overall, CATEGORY_POINTS.overall)}
                    </span>
                  </div>
                </div>

                {/* Total Score */}
                <div className="bg-secondary/90 dark:bg-secondary text-secondary-foreground rounded-lg px-6 py-4 text-center mt-6 border-2 border-secondary/50 shadow-md" data-testid="total-score">
                  <div className="text-3xl font-bold">
                    {currentHeat.totalPoints} / 33 <span className="ml-4">
                      {currentHeat.totalPoints > 16 ? 'WIN' : currentHeat.totalPoints === 16 ? 'TIE' : 'LOSS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Points for Heat */}
              <div className="pt-4 border-t border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-primary dark:text-foreground">Heat Total Points</div>
                  <div className="text-3xl font-bold text-primary">{currentHeat.totalPoints}</div>
                </div>
              </div>

              {/* Winner Badge */}
              {currentHeat.winner && (
                <div className="flex items-center justify-center gap-2">
                  {(() => {
                    const winnerLower = currentHeat.winner.toLowerCase();
                    const baristaNameLower = decodedBaristaName.toLowerCase();
                    const won = winnerLower === baristaNameLower || 
                               winnerLower.startsWith(baristaNameLower) ||
                               winnerLower.split(' ')[0] === baristaNameLower ||
                               winnerLower.includes(baristaNameLower);
                    return won ? (
                      <Badge variant="default" className="text-lg px-6 py-2">
                        <Trophy className="h-4 w-4 mr-2" />
                        Won this Heat
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-lg px-6 py-2">
                        Runner-up
                      </Badge>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Heats Summary Table */}
        <Card className="border-2 border-primary/20 dark:border-border shadow-md bg-secondary/30 dark:bg-card">
          <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg border-b border-primary/20">
            <CardTitle className="text-primary dark:text-foreground">All Heats Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Heat</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Station</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Latte Art</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Taste</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Tactile</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Flavor</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Overall</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Total</th>
                    <th className="text-center p-2 bg-secondary/40 dark:bg-muted text-primary dark:text-foreground font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {baristaHeats.map((heat, idx) => (
                    <tr 
                      key={heat.heatNumber} 
                      className={`border-b border-primary/10 cursor-pointer hover:bg-secondary/50 dark:hover:bg-muted/50 ${idx === currentHeatIndex ? 'bg-primary/20 dark:bg-primary/10' : 'bg-secondary/20 dark:bg-card'}`}
                      onClick={() => setCurrentHeatIndex(idx)}
                    >
                      <td className="p-2 font-semibold">{heat.heatNumber}</td>
                      <td className="p-2 text-center">{heat.station}</td>
                      <td className="p-2 text-center">{heat.categoryScores.latteArt}</td>
                      <td className="p-2 text-center">{heat.categoryScores.taste}</td>
                      <td className="p-2 text-center">{heat.categoryScores.tactile}</td>
                      <td className="p-2 text-center">{heat.categoryScores.flavor}</td>
                      <td className="p-2 text-center">{heat.categoryScores.overall}</td>
                      <td className="p-2 text-center font-semibold">{heat.totalPoints}</td>
                      <td className="p-2 text-center">
                        {(() => {
                          const winnerLower = heat.winner.toLowerCase();
                          const baristaNameLower = decodedBaristaName.toLowerCase();
                          const won = winnerLower === baristaNameLower || 
                                     winnerLower.startsWith(baristaNameLower) ||
                                     winnerLower.split(' ')[0] === baristaNameLower ||
                                     winnerLower.includes(baristaNameLower);
                          return won ? (
                            <Badge variant="default" className="text-xs">
                              <Trophy className="h-3 w-3 mr-1" />
                              Won
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Loss</Badge>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BaristaDetail;

