import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Coffee, Award, ArrowLeft, Clock, MapPin, Loader2 } from 'lucide-react';
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

interface Heat {
  heatNumber: number;
  competitor1: string;
  competitor2: string;
  winner: string | null;
  station: string;
  leftCupCode?: string;
  rightCupCode?: string;
  score1?: number;
  score2?: number;
  judges: Array<{
    judgeName: string;
    leftCupCode: string;
    rightCupCode: string;
    sensoryBeverage: string;
    visualLatteArt: 'left' | 'right';
    taste: 'left' | 'right';
    tactile: 'left' | 'right';
    flavour: 'left' | 'right';
    overall: 'left' | 'right';
  }>;
  round: number;
}

const HeatResults: React.FC = () => {
  const { heatId, tournamentSlug } = useParams<{ heatId: string; tournamentSlug?: string }>();
  const heatNumber = heatId ? parseInt(heatId) : 0;
  const tournament = tournamentSlug || 'WEC2025';
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournament data from API
  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[HeatResults] Step 1: Fetching tournaments list from /api/tournaments');
        let tournamentsResponse: Response;
        try {
          tournamentsResponse = await fetch('/api/tournaments');
        } catch (fetchErr: any) {
          console.error('[HeatResults] Network error fetching tournaments:', fetchErr);
          throw new Error(`Network error: ${fetchErr?.message || 'Failed to connect to server'}`);
        }
        
        console.log('[HeatResults] Step 2: Tournaments response status:', tournamentsResponse.status, tournamentsResponse.statusText);
        if (!tournamentsResponse.ok) {
          const errorText = await tournamentsResponse.text();
          console.error('[HeatResults] Failed to fetch tournaments:', errorText);
          throw new Error(`Failed to fetch tournaments list: ${tournamentsResponse.status} ${tournamentsResponse.statusText}. Response: ${errorText}`);
        }
        
        console.log('[HeatResults] Step 3: Parsing tournaments JSON');
        let tournaments: any[];
        try {
          tournaments = await tournamentsResponse.json();
        } catch (jsonErr: any) {
          console.error('[HeatResults] JSON parse error:', jsonErr);
          const responseText = await tournamentsResponse.text();
          console.error('[HeatResults] Response text:', responseText);
          throw new Error(`Invalid JSON response: ${jsonErr?.message || 'Unknown parse error'}`);
        }
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
          console.log('[HeatResults] Step 4: Using fallback tournament:', fallbackTournament.name, 'ID:', tournamentId);
          console.log('[HeatResults] Step 5: Fetching tournament data from /api/tournaments/' + tournamentId);
          let response: Response;
          try {
            response = await fetch(`/api/tournaments/${tournamentId}`);
          } catch (fetchErr: any) {
            console.error('[HeatResults] Network error fetching tournament:', fetchErr);
            throw new Error(`Network error: ${fetchErr?.message || 'Failed to connect to server'}`);
          }
          
          console.log('[HeatResults] Step 6: Tournament response status:', response.status, response.statusText);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[HeatResults] Failed to fetch tournament data:', errorText);
            throw new Error(`Failed to fetch tournament data: ${response.status} ${response.statusText}. Response: ${errorText}`);
          }
          
          console.log('[HeatResults] Step 7: Parsing tournament JSON');
          let data: any;
          try {
            data = await response.json();
          } catch (jsonErr: any) {
            console.error('[HeatResults] JSON parse error:', jsonErr);
            const responseText = await response.text();
            console.error('[HeatResults] Response text:', responseText);
            throw new Error(`Invalid JSON response: ${jsonErr?.message || 'Unknown parse error'}`);
          }
          console.log('[HeatResults] Step 8: Fetched tournament data:', { 
            tournament: data.tournament?.name, 
            matchesCount: data.matches?.length, 
            detailedScoresCount: data.detailedScores?.length,
            dataKeys: Object.keys(data)
          });
          
          console.log('[HeatResults] Step 9: Transforming tournament data');
          let transformedData: TournamentData;
          try {
            transformedData = transformTournamentData(data);
            console.log('[HeatResults] Step 10: Transformation successful:', {
              matchesCount: transformedData.matches?.length,
              detailedScoresCount: transformedData.detailedScores?.length
            });
          } catch (transformErr: any) {
            console.error('[HeatResults] Transformation error:', transformErr);
            console.error('[HeatResults] Transform error stack:', transformErr?.stack);
            throw new Error(`Data transformation failed: ${transformErr?.message || 'Unknown error'}`);
          }
          
          setTournamentData(transformedData);
          return;
        }

        const tournamentId = wecTournament.id;
        console.log('[HeatResults] Step 4: Using tournament:', wecTournament.name, 'ID:', tournamentId);
        console.log('[HeatResults] Step 5: Fetching tournament data from /api/tournaments/' + tournamentId);
        let response: Response;
        try {
          response = await fetch(`/api/tournaments/${tournamentId}`);
        } catch (fetchErr: any) {
          console.error('[HeatResults] Network error fetching tournament:', fetchErr);
          throw new Error(`Network error: ${fetchErr?.message || 'Failed to connect to server'}`);
        }
        
        console.log('[HeatResults] Step 6: Tournament response status:', response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[HeatResults] Failed to fetch tournament data:', errorText);
          throw new Error(`Failed to fetch tournament data: ${response.status} ${response.statusText}. Response: ${errorText}`);
        }
        
        console.log('[HeatResults] Step 7: Parsing tournament JSON');
        let data: any;
        try {
          data = await response.json();
        } catch (jsonErr: any) {
          console.error('[HeatResults] JSON parse error:', jsonErr);
          const responseText = await response.text();
          console.error('[HeatResults] Response text:', responseText);
          throw new Error(`Invalid JSON response: ${jsonErr?.message || 'Unknown parse error'}`);
        }
        console.log('[HeatResults] Step 8: Fetched tournament data:', { 
          tournament: data.tournament?.name, 
          matchesCount: data.matches?.length, 
          detailedScoresCount: data.detailedScores?.length,
          dataKeys: Object.keys(data)
        });
        
        console.log('[HeatResults] Step 9: Transforming tournament data');
        let transformedData: TournamentData;
        try {
          transformedData = transformTournamentData(data);
          console.log('[HeatResults] Step 10: Transformation successful:', {
            matchesCount: transformedData.matches?.length,
            detailedScoresCount: transformedData.detailedScores?.length
          });
        } catch (transformErr: any) {
          console.error('[HeatResults] Transformation error:', transformErr);
          console.error('[HeatResults] Transform error stack:', transformErr?.stack);
          throw new Error(`Data transformation failed: ${transformErr?.message || 'Unknown error'}`);
        }
        
        setTournamentData(transformedData);
      } catch (err: any) {
        // Enhanced error logging
        console.error('=== Error fetching tournament data ===');
        console.error('Error type:', typeof err);
        console.error('Error constructor:', err?.constructor?.name);
        console.error('Error message:', err?.message);
        console.error('Error stack:', err?.stack);
        console.error('Full error object:', err);
        console.error('Error keys:', err ? Object.keys(err) : 'null/undefined');
        
        // Try to extract more details
        let errorMessage = 'Failed to load tournament data';
        if (err?.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err?.toString && err.toString() !== '[object Object]') {
          errorMessage = err.toString();
        } else {
          // Try to stringify the error
          try {
            const errorStr = JSON.stringify(err, Object.getOwnPropertyNames(err));
            if (errorStr !== '{}') {
              errorMessage = `Error: ${errorStr}`;
            }
          } catch (stringifyErr) {
            console.error('Failed to stringify error:', stringifyErr);
          }
        }
        
        console.error('Final error message:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournament]);

  // Transform API data to heat structure and find the specific heat
  const heat = useMemo(() => {
    if (!tournamentData?.matches || !tournamentData?.detailedScores || !heatNumber) return null;

    const match = tournamentData.matches.find(m => m.heatNumber === heatNumber);
    if (!match) return null;

    // Get all judge scorecards for this match
    const judgeScores = tournamentData.detailedScores.filter(
      score => score.matchId === match.id
    );

    // Get first judge's cup codes
    const firstJudge = judgeScores[0];
    const leftCupCode = firstJudge?.leftCupCode;
    const rightCupCode = firstJudge?.rightCupCode;

    // Determine winner
    const winner = match.winnerId === match.competitor1Id 
      ? match.competitor1Name 
      : match.winnerId === match.competitor2Id 
      ? match.competitor2Name 
      : null;

    // Determine station
    const station = stationIdToLetter(match.stationId);

    // Transform judge scores to expected format
    const judges = judgeScores.map(score => ({
      judgeName: score.judgeName,
      leftCupCode: score.leftCupCode,
      rightCupCode: score.rightCupCode,
      sensoryBeverage: score.sensoryBeverage,
      visualLatteArt: score.visualLatteArt,
      taste: score.taste,
      tactile: score.tactile,
      flavour: score.flavour,
      overall: score.overall,
    }));

    return {
      heatNumber: match.heatNumber,
      competitor1: match.competitor1Name || '',
      competitor2: match.competitor2Name || '',
      winner,
      station,
      leftCupCode,
      rightCupCode,
      judges,
      round: match.round || 1,
    } as Heat;
  }, [tournamentData, heatNumber]);

  // Check loading state first - before validating data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-[hsl(20_85%_40%)] p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading heat data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check error state second - before validating data
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-[hsl(20_85%_40%)] p-6 flex items-center justify-center">
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

  // Only check if heat exists after loading is complete and there's no error
  if (!heat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-[hsl(20_85%_40%)] p-6">
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 lg:px-6">
          <Card>
            <CardContent className="text-center p-8">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Heat Not Found</h1>
              <p className="text-muted-foreground mb-4">The requested heat could not be found.</p>
              <Link to={`/results/${tournament}/bracket`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Bracket
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getRoundInfo = (round: number) => {
    const roundTitles: Record<number, string> = {
      1: "Round 1 - Preliminary Heats",
      2: "Round 2 - Quarterfinals",
      3: "Round 3 - Semifinals",
      4: "Round 4 - Finals",
      5: "Final - Championship"
    };
    return { round, title: roundTitles[round] || `Round ${round}` };
  };

  const roundInfo = getRoundInfo(heat.round);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl lg:max-w-7xl xl:max-w-[1400px] mx-auto px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to={`/results/${tournament}/bracket`}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bracket
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Trophy className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-primary">Heat {heatNumber}</h1>
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl text-muted-foreground">{roundInfo.title}</p>
          </div>
        </div>

        {/* Heat Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Heat Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">Heat {heatNumber}</div>
                <div className="text-sm text-muted-foreground">Heat Number</div>
              </div>
              <div className="text-center p-4 bg-chart-1/10 rounded-lg">
                <div className="text-2xl font-bold text-chart-1">Station {heat.station}</div>
                <div className="text-sm text-muted-foreground">Station</div>
              </div>
              <div className="text-center p-4 bg-chart-3/10 rounded-lg">
                <div className="text-2xl font-bold text-chart-3">{roundInfo.round}</div>
                <div className="text-sm text-muted-foreground">Round</div>
              </div>
              <div className="text-center p-4 bg-chart-3/20 dark:bg-chart-3/30 rounded-lg">
                <div className="text-2xl font-bold text-chart-3">{heat.winner || "TBD"}</div>
                <div className="text-sm text-muted-foreground">Winner</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-8">
              <div className={`p-6 rounded-lg border-2 ${
                heat.winner === heat.competitor1 ? 'border-chart-3 bg-chart-3/20 dark:bg-chart-3/30' : 'border-border'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium text-sm text-muted-foreground">Left Competitor</div>
                  {heat.winner === heat.competitor1 && (
                    <Badge className="bg-chart-3/30 dark:bg-chart-3/40 text-foreground">Winner</Badge>
                  )}
                </div>
                <div className="font-bold text-2xl mb-2 text-foreground">{heat.competitor1}</div>
                {heat.leftCupCode && (
                  <div className="text-sm text-muted-foreground mb-2">Cup Code: {heat.leftCupCode}</div>
                )}
                {heat.score1 !== undefined && (
                  <div className="text-lg font-semibold text-primary">
                    Score: {heat.score1}
                  </div>
                )}
              </div>
              
              <div className={`p-6 rounded-lg border-2 ${
                heat.winner === heat.competitor2 ? 'border-chart-3 bg-chart-3/20 dark:bg-chart-3/30' : 'border-border'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium text-sm text-muted-foreground">Right Competitor</div>
                  {heat.winner === heat.competitor2 && (
                    <Badge className="bg-chart-3/30 dark:bg-chart-3/40 text-foreground">Winner</Badge>
                  )}
                </div>
                <div className="font-bold text-2xl mb-2 text-foreground">{heat.competitor2}</div>
                {heat.rightCupCode && (
                  <div className="text-sm text-muted-foreground mb-2">Cup Code: {heat.rightCupCode}</div>
                )}
                {heat.score2 !== undefined && (
                  <div className="text-lg font-semibold text-primary">
                    Score: {heat.score2}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Judge Scorecards */}
        {heat.judges && heat.judges.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Judge Scorecards ({heat.judges.length} judges)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
                {heat.judges.map((judge, index) => (
                  <Card key={`judge-${index}`} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {judge.judgeName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cup Codes */}
                      <div className="grid grid-cols-2 gap-4 p-3 bg-muted dark:bg-muted rounded-lg">
                        <div className="text-center">
                          <div className="font-semibold text-muted-foreground">Left Cup</div>
                          <div className="text-2xl font-bold text-primary">{judge.leftCupCode}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-muted-foreground">Right Cup</div>
                          <div className="text-2xl font-bold text-primary">{judge.rightCupCode}</div>
                        </div>
                      </div>

                      {/* Scoring Categories */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-secondary/60 dark:bg-[#2D1B12] rounded-lg border border-secondary/50 dark:border-[hsl(40_50%_65%)]">
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-primary dark:text-[hsl(40_50%_72%)]" />
                            <span className="font-medium text-primary dark:text-[hsl(40_30%_95%)]">Visual Latte Art</span>
                          </div>
                          <Badge variant={judge.visualLatteArt === 'left' ? 'default' : 'secondary'}>
                            {judge.visualLatteArt === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-chart-3/20 dark:bg-chart-3/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-chart-3" />
                            <span className="font-medium text-foreground">Sensory Beverage</span>
                          </div>
                          <Badge variant="outline" className="text-chart-3">
                            {judge.sensoryBeverage}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span className="font-medium text-orange-900">Taste</span>
                          <Badge variant={judge.taste === 'left' ? 'default' : 'secondary'}>
                            {judge.taste === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <span className="font-medium text-purple-900">Tactile</span>
                          <Badge variant={judge.tactile === 'left' ? 'default' : 'secondary'}>
                            {judge.tactile === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <span className="font-medium text-pink-900">Flavour</span>
                          <Badge variant={judge.flavour === 'left' ? 'default' : 'secondary'}>
                            {judge.flavour === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="font-medium text-red-900">Overall</span>
                          <Badge variant={judge.overall === 'left' ? 'default' : 'secondary'}>
                            {judge.overall === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center p-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Judge Scorecards</h3>
              <p className="text-gray-500">No judge scorecards are available for this heat.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HeatResults;
