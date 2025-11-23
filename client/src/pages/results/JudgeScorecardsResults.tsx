import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Users, Coffee, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { findTournamentBySlug } from '@/utils/tournamentUtils';
import { transformTournamentData } from '@/utils/tournamentDataTransform';
import { stationIdToLetter } from '@/utils/stationUtils';
import JudgeConsensus from '@/components/JudgeConsensus';

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
}

const JudgeScorecardsResults: React.FC = () => {
  const navigate = useNavigate();
  const { tournamentSlug } = useParams<{ tournamentSlug?: string }>();
  const tournament = tournamentSlug || 'WEC2025';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHeat, setSelectedHeat] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [selectedJudgeTab, setSelectedJudgeTab] = useState<string>('');
  const [showConsensus, setShowConsensus] = useState(false);
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Transform API data to heat structure
  const allHeats = useMemo(() => {
    if (!tournamentData?.matches || !tournamentData?.detailedScores) return [];

    return tournamentData.matches
      .map(match => {
        // Get all judge scorecards for this match
        const judgeScores = tournamentData.detailedScores.filter(
          score => score.matchId === match.id
        );

        // If no judge scores, skip this match
        if (judgeScores.length === 0) return null;

        // Get first judge's cup codes (they should be consistent across judges)
        const firstJudge = judgeScores[0];
        const leftCupCode = firstJudge.leftCupCode;
        const rightCupCode = firstJudge.rightCupCode;

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
        } as Heat;
      })
      .filter((heat): heat is Heat => heat !== null)
      .sort((a, b) => a.heatNumber - b.heatNumber);
  }, [tournamentData]);


  // Helper function to determine round from heat number (fallback if round not in data)
  const getRoundFromHeatNumber = (heatNumber: number, round?: number): number => {
    if (round !== undefined) return round;
    if (heatNumber >= 1 && heatNumber <= 16) return 1;  // Round 1: Heats 1-16
    if (heatNumber >= 17 && heatNumber <= 24) return 2; // Round 2: Heats 17-24
    if (heatNumber >= 25 && heatNumber <= 28) return 3; // Round 3: Heats 25-28
    if (heatNumber >= 29 && heatNumber <= 30) return 4; // Round 4: Heats 29-30
    if (heatNumber >= 31) return 5;                      // Final: Heat 31+
    return 1; // Default fallback
  };

  // Get available rounds from database or calculate
  const availableRounds = useMemo(() => {
    if (!tournamentData?.matches) return [];
    const rounds = tournamentData.matches
      .map(m => m.round)
      .filter((round): round is number => round !== undefined && round !== null);
    return Array.from(new Set(rounds)).sort((a, b) => a - b);
  }, [tournamentData]);

  // Get round for each heat from database
  const getHeatRound = useMemo(() => {
    if (!tournamentData?.matches) return new Map<number, number>();
    const roundMap = new Map<number, number>();
    tournamentData.matches.forEach(match => {
      if (match.round !== undefined && match.round !== null) {
        roundMap.set(match.heatNumber, match.round);
      }
    });
    return roundMap;
  }, [tournamentData]);

  // Filter heats based on search and filters
  const filteredHeats = useMemo(() => {
    return allHeats.filter(heat => {
      const matchesSearch = !searchTerm || 
        heat.competitor1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        heat.competitor2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        heat.winner?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesHeat = !selectedHeat || heat.heatNumber === selectedHeat;
      
      const heatRound = getHeatRound.get(heat.heatNumber);
      const matchesRound = !selectedRound || getRoundFromHeatNumber(heat.heatNumber, heatRound) === selectedRound;
      
      return matchesSearch && matchesHeat && matchesRound;
    });
  }, [allHeats, searchTerm, selectedHeat, selectedRound, getHeatRound]);

  // Reset current index when filters change
  useEffect(() => {
    setCurrentHeatIndex(0);
  }, [searchTerm, selectedHeat, selectedRound]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentHeatIndex < filteredHeats.length - 1) {
      setCurrentHeatIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentHeatIndex > 0) {
      setCurrentHeatIndex(prev => prev - 1);
    }
  };

  const nextHeat = () => {
    if (currentHeatIndex < filteredHeats.length - 1) {
      setCurrentHeatIndex(prev => prev + 1);
    }
  };

  const prevHeat = () => {
    if (currentHeatIndex > 0) {
      setCurrentHeatIndex(prev => prev - 1);
    }
  };

  const currentHeat = filteredHeats[currentHeatIndex];

  // Reset judge tab when heat changes
  useEffect(() => {
    if (currentHeat?.judges && currentHeat.judges.length > 0) {
      setSelectedJudgeTab(currentHeat.judges[0].judgeName);
    } else {
      setSelectedJudgeTab('');
    }
  }, [currentHeat]);


  if (loading) {
    return (
      <div className="min-h-screen tournament-bracket-bg p-6 flex items-center justify-center">
        <Card className="max-w-md">
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

  return (
    <div className="min-h-screen tournament-bracket-bg p-6">
      <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Users className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">WEC25 Judge Scorecards</h1>
            <Users className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground">
            Complete judge scorecards and detailed scoring breakdown for all heats
          </p>
        </div>

        {/* Streamlined Search and Filters - Inline */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/30 rounded-lg border border-primary/10">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitors or heats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          <Select
            value={selectedRound?.toString() || 'all'}
            onValueChange={(value) => setSelectedRound(value === 'all' ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              {availableRounds.map(round => {
                const roundHeats = allHeats.filter(h => {
                  const heatRound = getHeatRound.get(h.heatNumber);
                  return getRoundFromHeatNumber(h.heatNumber, heatRound) === round;
                });
                const roundName = round === 5 ? 'Final' : round === 4 ? 'Semi-Finals' : `Round ${round}`;
                return (
                  <SelectItem key={round} value={round.toString()}>
                    {roundName} ({roundHeats.length} heats)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <select
            value={selectedHeat || ''}
            onChange={(e) => setSelectedHeat(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 h-9 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All Heats</option>
            {(selectedRound 
              ? allHeats.filter(h => {
                  const heatRound = getHeatRound.get(h.heatNumber);
                  return getRoundFromHeatNumber(h.heatNumber, heatRound) === selectedRound;
                })
              : allHeats
            ).map(heat => (
              <option key={heat.heatNumber} value={heat.heatNumber}>
                Heat {heat.heatNumber}
              </option>
            ))}
          </select>
          
          {(searchTerm || selectedHeat || selectedRound) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedHeat(null);
                setSelectedRound(null);
              }}
              className="h-9"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Heat Navigation */}
        {filteredHeats.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={prevHeat}
              disabled={currentHeatIndex === 0}
              className="flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <img src="/icons/arrow_l.png" alt="Previous" className="h-4 w-4 object-contain" />
              Previous
            </Button>
            
            <div className="text-center px-6 py-3 bg-gradient-to-r from-primary/10 to-chart-3/10 rounded-xl border-2 border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/10">
              <div className="text-lg font-semibold text-primary animate-pulse">
                Heat {currentHeatIndex + 1} of {filteredHeats.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {currentHeat?.competitor1} vs {currentHeat?.competitor2}
              </div>
              {currentHeat && (
                <div className="text-xs text-primary/70 font-medium mt-1">
                  {(() => {
                    const heatRound = getHeatRound.get(currentHeat.heatNumber);
                    const round = getRoundFromHeatNumber(currentHeat.heatNumber, heatRound);
                    const roundName = round === 5 ? 'Final' : round === 4 ? 'Semi-Finals' : `Round ${round}`;
                    return roundName;
                  })()}
                </div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              onClick={nextHeat}
              disabled={currentHeatIndex === filteredHeats.length - 1}
              className="flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              Next
              <img src="/icons/arrow_r.png" alt="Next" className="h-4 w-4 object-contain" />
            </Button>
          </div>
        )}

        {/* Single Heat Display */}
        {filteredHeats.length > 0 && currentHeat ? (
          <div 
            className="heat-swipe-container group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Card className="min-h-[600px] relative border border-primary/30 bg-card">
              
              <CardHeader className="relative z-10 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Heat Number - Prominent on left */}
                  <div className="flex items-center gap-3">
                    <Trophy className="h-7 w-7 text-primary animate-bounce" />
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      Heat {currentHeat.heatNumber}
                    </span>
                  </div>
                  
                  {/* Station and Winner badges - Grouped on right */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3 lg:gap-4">
                    <Badge className={`text-base px-4 py-2 transition-all duration-300 hover:scale-105 ${
                      currentHeat.station === 'A' ? 'bg-primary shadow-lg shadow-primary/25' :
                      currentHeat.station === 'B' ? 'bg-chart-3 shadow-lg shadow-chart-3/25' :
                      'bg-chart-1 shadow-lg shadow-chart-1/25'
                    }`}>
                      Station {currentHeat.station}
                    </Badge>
                    {currentHeat.winner && (
                      <Badge variant="secondary" className="text-base px-4 py-2 bg-secondary text-secondary-foreground border-2 border-primary/30 shadow-lg">
                        <Trophy className="h-4 w-4 mr-2" />
                        Winner: {currentHeat.winner}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                {/* Judge Scorecards - Now First */}
                {currentHeat.judges && currentHeat.judges.length > 0 ? (
                  <div className="space-y-6 mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-3 bg-secondary/30 dark:bg-[#2D1B12] p-4 rounded-xl border border-primary/20 dark:border-[hsl(40_50%_65%)]">
                      <Users className="h-6 w-6 text-primary text-[hsl(20_85%_30%)] dark:text-[hsl(40_50%_72%)] animate-pulse" />
                      <span className="text-primary text-[hsl(20_85%_30%)] dark:text-[hsl(40_30%_95%)]">
                        Judge Scorecards ({currentHeat.judges.length} judges)
                      </span>
                    </h3>
                    
                    {/* Judge Consensus Overview - Collapsible */}
                    <Card className="border-primary/20">
                      <CardHeader 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setShowConsensus(!showConsensus)}
                      >
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="text-[#ab4c0c] dark:text-[hsl(40_30%_95%)]">Judge Consensus Overview</span>
                          </div>
                          {showConsensus ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      {showConsensus && (
                        <CardContent>
                          <JudgeConsensus judges={currentHeat.judges} />
                        </CardContent>
                      )}
                    </Card>
                    
                    {/* Judge Details Tabs */}
                    {(() => {
                      if (!currentHeat.judges) return null;
                      
                      // Only calculate consensus for Visual Latte Art
                      const getConsensus = (category: 'visualLatteArt'): 'left' | 'right' | 'tie' => {
                        const votes = currentHeat.judges!.map(j => j[category]);
                        const leftVotes = votes.filter(v => v === 'left').length;
                        const rightVotes = votes.filter(v => v === 'right').length;
                        if (leftVotes > rightVotes) return 'left';
                        if (rightVotes > leftVotes) return 'right';
                        return 'tie';
                      };
                      
                      const visualLatteArtConsensus = getConsensus('visualLatteArt');
                      
                      const isInMajority = (judgeVote: 'left' | 'right' | null, categoryConsensus: 'left' | 'right' | 'tie') => {
                        if (!judgeVote || categoryConsensus === 'tie') return true;
                        return judgeVote === categoryConsensus;
                      };
                      
                      return (
                        <Tabs value={selectedJudgeTab} onValueChange={setSelectedJudgeTab} className="w-full">
                          <TabsList 
                            className="grid w-full gap-2 h-auto p-2 bg-muted/70 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg shadow-primary/10"
                            style={{ gridTemplateColumns: `repeat(${currentHeat.judges.length}, 1fr)` }}
                          >
                            {currentHeat.judges.map((judge, index) => (
                              <TabsTrigger 
                                key={`judge-tab-${index}`}
                                value={judge.judgeName}
                                className="px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-md border border-transparent hover:border-primary/30 hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:border-primary data-[state=active]:scale-105 data-[state=active]:font-bold"
                              >
                                {judge.judgeName}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          
                          {currentHeat.judges.map((judge, index) => {
                            const renderCategoryRow = (
                              category: 'visualLatteArt' | 'taste' | 'tactile' | 'flavour' | 'overall',
                              label: string
                            ) => {
                              const judgeVote = judge[category];
                              // Only show consensus for Visual Latte Art
                              const isVisualLatteArt = category === 'visualLatteArt';
                              const categoryConsensus = isVisualLatteArt ? visualLatteArtConsensus : null;
                              const inMajority = isVisualLatteArt && categoryConsensus 
                                ? isInMajority(judgeVote, categoryConsensus)
                                : null;
                              
                              return (
                                <div 
                                  key={category}
                                  className="relative grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12]"
                                >
                                  <label className="flex items-center gap-2 justify-start text-[#93401f]">
                                    <input 
                                      type="checkbox" 
                                      checked={judgeVote === 'left'} 
                                      readOnly 
                                      className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                                    />
                                    <span className="text-xs text-muted-foreground">Left</span>
                                    {isVisualLatteArt && categoryConsensus && judgeVote === 'left' && (
                                      inMajority ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                      ) : (
                                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">L</span>
                                      )
                                    )}
                                  </label>
                                  <div className="text-center font-semibold text-primary">
                                    {label}
                                  </div>
                                  <label className="flex items-center gap-2 justify-end">
                                    {isVisualLatteArt && categoryConsensus && judgeVote === 'right' && (
                                      inMajority ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                      ) : (
                                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">R</span>
                                      )
                                    )}
                                    <span className="text-xs text-muted-foreground">Right</span>
                                    <input 
                                      type="checkbox" 
                                      checked={judgeVote === 'right'} 
                                      readOnly 
                                      className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                                    />
                                  </label>
                                </div>
                              );
                            };
                            
                            return (
                              <TabsContent 
                                key={`judge-content-${index}`}
                                value={judge.judgeName}
                                className="mt-4"
                              >
                                <Card className="border-l-4 border-l-primary bg-card">
                                  <CardHeader className="pb-3 relative z-10">
                                    <CardTitle className="text-lg flex items-center gap-2 group-hover/judge:text-primary transition-colors duration-300 text-[#93401f]">
                                      <Users className="h-5 w-5" />
                                      <span className="font-bold">{judge.judgeName}</span>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4 relative z-10">
                                    {/* Cup Codes */}
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/40">
                                      <div className="text-center">
                                        <div className="text-xs text-muted-foreground font-medium">Left Cup</div>
                                        <div className="text-lg font-bold text-primary px-2 py-1 rounded mt-1 bg-[#2d1b12]">
                                          {judge.leftCupCode}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-muted-foreground font-medium">Right Cup</div>
                                        <div className="text-lg font-bold text-primary px-2 py-1 rounded mt-1 bg-[#2d1b12]">
                                          {judge.rightCupCode}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Scoring Categories with Consensus Indicators */}
                                    <div className="space-y-3">
                                      {renderCategoryRow('visualLatteArt', 'Visual Latte Art')}
                                      
                                      {/* Sensory Beverage (no left/right) */}
                                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-[#2d1b12]">
                                        <div></div>
                                        <div className="text-center font-semibold text-primary">{`Sensory ${judge.sensoryBeverage}`}</div>
                                        <div></div>
                                      </div>

                                      {renderCategoryRow('taste', 'Taste')}
                                      {renderCategoryRow('tactile', 'Tactile')}
                                      {renderCategoryRow('flavour', 'Flavour')}
                                      {renderCategoryRow('overall', 'Overall')}
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center p-6 text-muted-foreground mb-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No judge scorecards available for this heat</p>
                  </div>
                )}

                {/* Competitors - Now After Judges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  <div className={`group/competitor p-6 rounded-xl border-2 relative ${
                    currentHeat.winner === currentHeat.competitor1 
                      ? 'border-primary bg-secondary' 
                      : 'border-border bg-card'
                  }`}>
                    <div className="font-medium text-sm text-muted-foreground mb-2">Left Competitor</div>
                    <div className="font-bold text-xl text-foreground mb-3 group-hover/competitor:text-primary transition-colors duration-300">
                      {currentHeat.competitor1}
                    </div>
                    {currentHeat.leftCupCode && (
                      <div className="text-sm text-muted-foreground mb-2 font-mono bg-muted px-2 py-1 rounded">
                        Cup: {currentHeat.leftCupCode}
                      </div>
                    )}
                    {currentHeat.score1 !== undefined && (
                      <div className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg inline-block">
                        Score: {currentHeat.score1}
                      </div>
                    )}
                    {currentHeat.winner === currentHeat.competitor1 && (
                      <div className="absolute top-2 right-2">
                        <Trophy className="h-6 w-6 text-green-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  <div className={`group/competitor p-6 rounded-xl border-2 relative ${
                    currentHeat.winner === currentHeat.competitor2 
                      ? 'border-primary bg-secondary' 
                      : 'border-border bg-card'
                  }`}>
                    <div className="font-medium text-sm text-muted-foreground mb-2">Right Competitor</div>
                    <div className="font-bold text-xl text-foreground mb-3 group-hover/competitor:text-primary transition-colors duration-300">
                      {currentHeat.competitor2}
                    </div>
                    {currentHeat.rightCupCode && (
                      <div className="text-sm text-muted-foreground mb-2 font-mono bg-muted px-2 py-1 rounded">
                        Cup: {currentHeat.rightCupCode}
                      </div>
                    )}
                    {currentHeat.score2 !== undefined && (
                      <div className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg inline-block">
                        Score: {currentHeat.score2}
                      </div>
                    )}
                    {currentHeat.winner === currentHeat.competitor2 && (
                      <div className="absolute top-2 right-2">
                        <Trophy className="h-6 w-6 text-green-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center p-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Heats Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default JudgeScorecardsResults;
