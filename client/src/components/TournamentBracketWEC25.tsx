import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, MapPin, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Match, User, Station } from '@shared/schema';

interface TournamentBracketWEC25Props {
  tournamentId?: number;
}

interface BracketHeatProps {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner?: string;
  score1?: number | null;
  score2?: number | null;
  isFinal?: boolean;
}

function BracketHeat({ heatNumber, station, competitor1, competitor2, winner, score1, score2, isFinal = false }: BracketHeatProps) {
  const getStationColor = (station: string) => {
    switch (station) {
      case 'A': return 'bg-primary text-primary-foreground';
      case 'B': return 'bg-chart-3 text-primary-foreground';
      case 'C': return 'bg-chart-1 text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isWinner1 = winner === competitor1;
  const isWinner2 = winner === competitor2;

  return (
    <Card className={`min-h-[140px] transition-all duration-300 ${isFinal ? 'ring-4 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-xl' : isWinner1 || isWinner2 ? 'ring-2 ring-chart-3 bg-gradient-to-br from-chart-3/20 to-chart-3/30 shadow-lg' : 'hover:shadow-xl hover:scale-105'}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Heat {heatNumber}</span>
          </div>
          <Badge className={`${getStationColor(station)} text-sm font-medium`}>
            Station {station}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className={`p-3 rounded-lg border-2 transition-all duration-200 ${competitor1 === 'BYE' ? 'bg-muted text-muted-foreground border-border' : 'bg-gradient-to-r from-secondary to-secondary/80 dark:from-white dark:to-slate-50 border-border shadow-sm'} ${isWinner1 ? 'ring-2 ring-chart-3 bg-chart-3/20 dark:bg-chart-3/30 border-chart-3 dark:border-chart-3/80 shadow-lg' : 'hover:shadow-md'}`}>
            <div className="flex justify-between items-center">
              <div className="font-semibold text-base text-foreground">
                {competitor1}
              </div>
              {score1 !== null && score1 !== undefined && (
                <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {score1}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center text-muted-foreground font-bold text-sm tracking-wider">VS</div>
          
          <div className={`p-3 rounded-lg border-2 transition-all duration-200 ${competitor2 === 'BYE' ? 'bg-muted text-muted-foreground border-border' : 'bg-gradient-to-r from-secondary to-secondary/80 dark:from-white dark:to-slate-50 border-border shadow-sm'} ${isWinner2 ? 'ring-2 ring-chart-3 bg-chart-3/20 dark:bg-chart-3/30 border-chart-3 dark:border-chart-3/80 shadow-lg' : 'hover:shadow-md'}`}>
            <div className="flex justify-between items-center">
              <div className="font-semibold text-base text-foreground">
                {competitor2}
              </div>
              {score2 !== null && score2 !== undefined && (
                <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {score2}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {winner && (
          <div className="mt-4 text-center">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-4 py-2 shadow-lg">
              🏆 Winner: {winner}
            </Badge>
          </div>
        )}
        
        {isFinal && (
          <div className="mt-4 text-center">
            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold px-4 py-2 shadow-lg animate-pulse">
              🏆 CHAMPIONSHIP FINAL
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BracketRound {
  title: string;
  matches: Array<{
    heatNumber: number;
    station: string;
    competitor1: string;
    competitor2: string;
    winner?: string;
    score1?: number | null;
    score2?: number | null;
  }>;
  heatCount: number;
}

export default function TournamentBracketWEC25({ tournamentId }: TournamentBracketWEC25Props) {
  // Fetch tournaments if no tournamentId provided
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
    enabled: !tournamentId,
  });
  
  const currentTournamentId = tournamentId || tournaments[0]?.id || 1;

  // Fetch tournament data
  const { data: tournamentData } = useQuery<{
    tournament: any;
    matches: Match[];
    participants: any[];
  }>({
    queryKey: [`/api/tournaments/${currentTournamentId}`],
    enabled: !!currentTournamentId,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Process matches into bracket rounds
  const rounds = useMemo(() => {
    if (!tournamentData?.matches || tournamentData.matches.length === 0) {
      return [];
    }

    const matches = tournamentData.matches.filter(m => 
      !tournamentId || m.tournamentId === tournamentId
    );

    const roundsMap = new Map<number, Match[]>();

    matches.forEach(match => {
      const round = match.round || 1;
      if (!roundsMap.has(round)) {
        roundsMap.set(round, []);
      }
      roundsMap.get(round)!.push(match);
    });

    // Convert to array and sort by round
    const roundsArray: BracketRound[] = Array.from(roundsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([roundNum, roundMatches]) => {
        const getCompetitorName = (userId: number | null) => {
          if (!userId) return "BYE";
          const user = allUsers.find(u => u.id === userId);
          return user?.name || `User ${userId}`;
        };

        const getStationName = (stationId: number | null) => {
          if (!stationId) return "A";
          const station = stations.find(s => s.id === stationId);
          return station?.name || "A";
        };

        const processedMatches = roundMatches
          .sort((a, b) => (a.heatNumber || 0) - (b.heatNumber || 0))
          .map(match => ({
            heatNumber: match.heatNumber || 0,
            station: getStationName(match.stationId),
            competitor1: getCompetitorName(match.competitor1Id),
            competitor2: getCompetitorName(match.competitor2Id),
            winner: match.winnerId ? getCompetitorName(match.winnerId) : undefined,
            score1: null, // Would need score data from segments
            score2: null,
          }));

        const roundTitle = roundNum === 1 ? 'Round 1' : 
                          roundNum === 2 ? 'Round 2' : 
                          roundNum === 3 ? 'Round 3' : 
                          roundNum === 4 ? 'Semifinals' : 
                          'Final';

        return {
          title: roundTitle,
          matches: processedMatches,
          heatCount: processedMatches.length,
        };
      });

    return roundsArray;
  }, [tournamentData, allUsers, stations, tournamentId]);

  const totalHeats = rounds.reduce((sum, round) => sum + round.heatCount, 0);
  const totalCompetitors = tournamentData?.participants?.filter((p: any) => {
    const user = allUsers.find(u => u.id === p.userId);
    return user?.role === 'BARISTA';
  }).length || 0;

  if (!tournamentData) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading tournament bracket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">
              {tournamentData.tournament?.name || 'Tournament'} Bracket
            </h1>
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground">
            Tournament Bracket - Complete View
          </p>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalCompetitors}</div>
              <div className="text-sm text-muted-foreground">Competitors</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalHeats}</div>
              <div className="text-sm text-muted-foreground">Total Heats</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stations.length}</div>
              <div className="text-sm text-muted-foreground">Stations</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{rounds.length}</div>
              <div className="text-sm text-muted-foreground">Rounds</div>
            </CardContent>
          </Card>
        </div>

        {/* Bracket Display - Overlapping Cards Style */}
        <div className="bg-secondary dark:bg-card rounded-lg shadow-lg p-6">
          <div className="relative" style={{ minHeight: '600px' }}>
            <div className="flex flex-row items-start gap-4 overflow-x-auto pb-4" style={{ 
              perspective: '1000px',
            }}>
              {rounds.map((round, roundIndex) => {
                const isLastRound = roundIndex === rounds.length - 1;
                const cardWidth = isLastRound ? '280px' : 
                                roundIndex === rounds.length - 2 ? '320px' :
                                roundIndex === rounds.length - 3 ? '360px' :
                                roundIndex === rounds.length - 4 ? '400px' :
                                '440px';
                const zIndex = rounds.length - roundIndex;
                const marginLeft = roundIndex > 0 ? '-60px' : '0';

                return (
                  <div
                    key={round.title}
                    className="relative"
                    style={{
                      width: cardWidth,
                      minWidth: cardWidth,
                      zIndex,
                      marginLeft,
                      transform: `scale(${1 - roundIndex * 0.05})`,
                      transformOrigin: 'left center',
                    }}
                  >
                    <Card className="bg-gradient-to-br from-[#DECCA7] to-[#F5F0E8] border-2 border-[#994D27] shadow-xl">
                      <CardContent className="p-4">
                        <div className="text-center mb-4 pb-2 border-b-2 border-[#994D27]">
                          <h2 className="text-xl font-bold text-[#994D27] mb-1">{round.title}</h2>
                          <p className="text-sm text-[#6B5B4F]">{round.heatCount} {round.heatCount === 1 ? 'Heat' : 'Heats'}</p>
                        </div>
                        
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {round.matches.map((match) => (
                            <div key={match.heatNumber} className="mb-3 pb-2 border-b border-[#994D27]/20 last:border-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-[#994D27]">Heat {match.heatNumber}</span>
                                <Badge className="bg-[#994D27] text-white text-xs px-2 py-0.5">
                                  {match.station}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className={`${match.winner === match.competitor1 ? 'font-bold text-[#C48D49]' : 'text-[#3E3F24]'}`}>
                                  {match.competitor1}
                                </div>
                                <div className="text-xs text-center text-[#6B5B4F]">vs</div>
                                <div className={`${match.winner === match.competitor2 ? 'font-bold text-[#C48D49]' : 'text-[#3E3F24]'}`}>
                                  {match.competitor2}
                                </div>
                              </div>
                              {match.winner && (
                                <div className="mt-1 text-xs font-semibold text-[#C48D49] text-center">
                                  Winner: {match.winner}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Bracket Display - Grid Layout */}
        <div className="bg-secondary dark:bg-card rounded-lg shadow-lg p-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
            {rounds.map((round) => (
              <div key={round.title} className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">{round.title}</h2>
                  <p className="text-sm text-muted-foreground">{round.heatCount} {round.heatCount === 1 ? 'Heat' : 'Heats'}</p>
                </div>
                
                <div className="space-y-3">
                  {round.matches.map((match) => (
                    <BracketHeat
                      key={match.heatNumber}
                      heatNumber={match.heatNumber}
                      station={match.station}
                      competitor1={match.competitor1}
                      competitor2={match.competitor2}
                      winner={match.winner}
                      score1={match.score1}
                      score2={match.score2}
                      isFinal={round.title === 'Final'}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Station Legend */}
        <div className="mt-8 flex justify-center">
          <Card className="p-4">
            <CardContent>
              <div className="flex items-center gap-6">
                {stations.map((station) => (
                  <div key={station.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${
                      station.name === 'A' ? 'bg-primary' :
                      station.name === 'B' ? 'bg-chart-3' :
                      station.name === 'C' ? 'bg-chart-1' :
                      'bg-muted'
                    }`}></div>
                    <span className="text-sm font-medium">Station {station.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

