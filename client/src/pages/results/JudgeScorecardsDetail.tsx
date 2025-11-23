import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Trophy, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
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

const JudgeScorecardsDetail: React.FC = () => {
  const { judgeName, tournamentSlug } = useParams<{ judgeName: string; tournamentSlug?: string }>();
  const navigate = useNavigate();
  const tournament = tournamentSlug || 'WEC2025';
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedJudgeName = judgeName ? decodeURIComponent(judgeName) : '';

  // Fetch tournament data from API
  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get tournament ID from slug using the same utility as other components
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
          // Fallback: try to find by name containing 'wec' or 'world espresso'
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
        console.error('Tournament slug:', tournament);
        console.error('Error details:', err);
        setError(err.message || 'Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournament]);

  // Get all heats where this judge participated, from database
  const judgeHeats = useMemo(() => {
    if (!tournamentData?.detailedScores || !tournamentData?.matches) return [];

    // Get unique match IDs where this judge has scores
    const judgeMatchIds = new Set(
      tournamentData.detailedScores
        .filter(score => score.judgeName === decodedJudgeName)
        .map(score => score.matchId)
    );

    // Get matches and attach judge scorecard data
    return tournamentData.matches
      .filter(match => judgeMatchIds.has(match.id))
      .map(match => {
        const judgeScore = tournamentData.detailedScores.find(
          score => score.matchId === match.id && score.judgeName === decodedJudgeName
        );
        
        // Determine station from match data
        const station = stationIdToLetter(match.stationId);
        
        return {
          id: match.id,
          heatNumber: match.heatNumber,
          round: match.round,
          competitor1: match.competitor1Name,
          competitor2: match.competitor2Name,
          winner: match.winnerId === match.competitor1Id ? match.competitor1Name : 
                  match.winnerId === match.competitor2Id ? match.competitor2Name : null,
          station,
          judgeScorecard: judgeScore ? {
            judgeName: judgeScore.judgeName,
            leftCupCode: judgeScore.leftCupCode,
            rightCupCode: judgeScore.rightCupCode,
            sensoryBeverage: judgeScore.sensoryBeverage,
            visualLatteArt: judgeScore.visualLatteArt,
            taste: judgeScore.taste,
            tactile: judgeScore.tactile,
            flavour: judgeScore.flavour,
            overall: judgeScore.overall,
          } : null
        };
      })
      .filter(heat => heat.judgeScorecard !== null)
      .sort((a, b) => a.heatNumber - b.heatNumber);
  }, [tournamentData, decodedJudgeName]);

  const currentHeat = judgeHeats[currentHeatIndex];
  const currentJudgeScorecard = currentHeat?.judgeScorecard;

  // Calculate consensus for Visual Latte Art for current heat
  const visualLatteArtConsensus = useMemo(() => {
    if (!currentHeat || !tournamentData?.detailedScores) return null;
    
    // Get all judge scores for this heat
    const allJudgeScores = tournamentData.detailedScores.filter(
      score => score.matchId === currentHeat.id
    );
    
    if (allJudgeScores.length === 0) return null;
    
    // Count votes
    const votes = allJudgeScores.map(score => score.visualLatteArt);
    const leftVotes = votes.filter(v => v === 'left').length;
    const rightVotes = votes.filter(v => v === 'right').length;
    
    if (leftVotes > rightVotes) return 'left';
    if (rightVotes > leftVotes) return 'right';
    return 'tie';
  }, [currentHeat, tournamentData]);

  // Check if current judge's vote is in majority
  const isInMajority = useMemo(() => {
    if (!visualLatteArtConsensus || !currentJudgeScorecard) return null;
    if (visualLatteArtConsensus === 'tie') return true;
    return currentJudgeScorecard.visualLatteArt === visualLatteArtConsensus;
  }, [visualLatteArtConsensus, currentJudgeScorecard]);

  const nextHeat = () => {
    if (currentHeatIndex < judgeHeats.length - 1) {
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
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="max-w-md border-2 border-primary/20 bg-secondary/30 dark:bg-card shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading judge scorecards...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="max-w-md border-2 border-destructive/30 bg-secondary/30 dark:bg-card shadow-md">
          <CardHeader className="bg-destructive/5 dark:bg-transparent rounded-t-lg">
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate(`/results/${tournament}/judges`)}>Back to Judges</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!decodedJudgeName || judgeHeats.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="max-w-md border-2 border-primary/20 bg-secondary/30 dark:bg-card shadow-md">
          <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
            <CardTitle className="text-primary dark:text-foreground">Judge Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">No scorecards found for {decodedJudgeName}.</p>
            <Button onClick={() => navigate(`/results/${tournament}/judges`)}>Back to Judges</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen tournament-bracket-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/results/${tournament}/judges`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Judges
            </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Users className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-primary">{decodedJudgeName}'s Scorecards</h1>
              <Users className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl text-muted-foreground">
              {judgeHeats.length} heats judged
            </p>
          </div>
        </div>

        {/* Navigation */}
        {judgeHeats.length > 0 && (
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
                Heat {currentHeatIndex + 1} of {judgeHeats.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Heat {currentHeat?.heatNumber} - {currentHeat?.competitor1} vs {currentHeat?.competitor2}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={nextHeat}
              disabled={currentHeatIndex === judgeHeats.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <img src="/icons/arrow_r.png" alt="Next" className="h-4 w-4 object-contain" />
            </Button>
          </div>
        )}

        {/* Judge Scorecard Display */}
        {currentHeat && currentJudgeScorecard && (
          <Card className="min-h-[600px] relative border-2 border-primary/30 dark:border-primary/20 bg-secondary/30 dark:bg-card shadow-lg">
            <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg border-b border-primary/20">
              <CardTitle className="flex items-center justify-between text-primary dark:text-foreground">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    Heat {currentHeat.heatNumber}
                  </span>
                  <Badge>
                    Station {currentHeat.station}
                  </Badge>
                </div>
                {currentHeat.winner && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-secondary">
                    <Trophy className="h-4 w-4 mr-1" />
                    Winner: {currentHeat.winner}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {/* Competitors */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`p-6 rounded-xl border-2 ${
                  currentHeat.winner === currentHeat.competitor1 
                    ? 'border-primary bg-secondary/60 dark:bg-secondary shadow-md' 
                    : 'border-primary/30 dark:border-border bg-secondary/40 dark:bg-card'
                }`}>
                  <div className="font-medium text-sm text-muted-foreground mb-2">Left Competitor</div>
                  <div className="font-bold text-xl mb-3 text-primary dark:text-foreground">
                    {currentHeat.competitor1}
                  </div>
                  {currentJudgeScorecard?.leftCupCode && (
                    <div className="text-sm text-muted-foreground mb-2 font-mono bg-secondary/60 dark:bg-muted px-2 py-1 rounded border border-primary/20">
                      Cup: {currentJudgeScorecard.leftCupCode}
                    </div>
                  )}
                </div>
                
                <div className={`p-6 rounded-xl border-2 ${
                  currentHeat.winner === currentHeat.competitor2 
                    ? 'border-primary bg-secondary/60 dark:bg-secondary shadow-md' 
                    : 'border-primary/30 dark:border-border bg-secondary/40 dark:bg-card'
                }`}>
                  <div className="font-medium text-sm text-muted-foreground mb-2">Right Competitor</div>
                  <div className="font-bold text-xl mb-3 text-primary dark:text-foreground">
                    {currentHeat.competitor2 || '—'}
                  </div>
                  {currentJudgeScorecard?.rightCupCode && (
                    <div className="text-sm text-muted-foreground mb-2 font-mono bg-secondary/60 dark:bg-muted px-2 py-1 rounded border border-primary/20">
                      Cup: {currentJudgeScorecard.rightCupCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Judge Scorecard */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-3 bg-secondary/50 dark:bg-secondary/30 p-4 rounded-xl border-2 border-primary/30 dark:border-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="text-primary">
                    {decodedJudgeName}'s Scorecard
                  </span>
                </h3>
                
                <Card className="border-l-4 border-l-primary bg-secondary/20 dark:bg-card border-2 border-primary/20 shadow-sm">
                  <CardHeader className="pb-3 bg-primary/5 dark:bg-transparent rounded-t-lg">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary dark:text-foreground">
                      <Users className="h-5 w-5" />
                      <span className="font-bold">{decodedJudgeName}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cup Codes */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/40 dark:bg-secondary/20 rounded-lg border-2 border-secondary/50 dark:border-secondary/40">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-medium">Left Cup</div>
                        <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded mt-1">
                          {currentJudgeScorecard?.leftCupCode || '—'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-medium">Right Cup</div>
                        <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded mt-1">
                          {currentJudgeScorecard?.rightCupCode || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Scoring Categories */}
                    <div className="space-y-3">
                      {/* Visual Latte Art */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border-2 border-primary/40 dark:border-primary/30 bg-secondary/40 dark:bg-secondary/20">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard?.visualLatteArt === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                          {currentJudgeScorecard?.visualLatteArt === 'left' && visualLatteArtConsensus && (
                            isInMajority ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : (
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">L</span>
                            )
                          )}
                        </label>
                        <div className="text-center font-semibold text-primary">Visual Latte Art</div>
                        <label className="flex items-center gap-2 justify-end">
                          {currentJudgeScorecard?.visualLatteArt === 'right' && visualLatteArtConsensus && (
                            isInMajority ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : (
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">R</span>
                            )
                          )}
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard?.visualLatteArt === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Sensory */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border-2 border-primary/40 dark:border-primary/30 bg-secondary/40 dark:bg-secondary/20">
                        <div></div>
                        <div className="text-center font-semibold text-primary">{`Sensory ${currentJudgeScorecard?.sensoryBeverage || '—'}`}</div>
                        <div></div>
                      </div>

                      {/* Taste */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border-2 border-primary/40 dark:border-primary/30 bg-secondary/40 dark:bg-secondary/20">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard?.taste === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold text-primary">Taste</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard?.taste === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Tactile */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border-2 border-primary/40 dark:border-primary/30 bg-secondary/40 dark:bg-secondary/20">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard?.tactile === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold text-primary">Tactile</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard?.tactile === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Flavour */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border-2 border-primary/40 dark:border-primary/30 bg-secondary/40 dark:bg-secondary/20">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard?.flavour === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold text-primary">Flavour</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard?.flavour === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Overall */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border-2 border-primary/40 dark:border-primary/30 bg-secondary/40 dark:bg-secondary/20">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard?.overall === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold text-primary">Overall</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard?.overall === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JudgeScorecardsDetail;

