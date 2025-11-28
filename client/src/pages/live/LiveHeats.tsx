import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Trophy, Users, MapPin, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMainStationsForTournament } from '@/utils/stationUtils';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

interface Match {
  id: number;
  heatNumber: number;
  round: number;
  status: 'PENDING' | 'READY' | 'RUNNING' | 'DONE';
  stationId: number | null;
  competitor1Id: number | null;
  competitor2Id: number | null;
  competitor1Name?: string;
  competitor2Name?: string;
  winnerId: number | null;
}

interface Station {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

const LiveHeats: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [selectedStation, setSelectedStation] = useState<string>('all');

  // API returns { tournament, participants, matches, scores }
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery<{
    tournament: Tournament;
    participants: any[];
    matches: Match[];
    scores: any[];
  }>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
    refetchInterval: 5000,
  });

  const tournament = tournamentData?.tournament;
  
  // Use matches from main query or fallback to separate query
  const { data: matchesFallback = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
    enabled: !!tournamentId && !tournamentData?.matches,
    refetchInterval: 5000,
  });

  const matches = tournamentData?.matches || matchesFallback;

  const { data: stations = [], isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
    refetchInterval: 5000,
  });

  // Filter to only show stations A, B, and C for the current tournament
  const mainStations = useMemo(() => {
    const tournamentIdNum = tournamentId ? parseInt(tournamentId) : undefined;
    return getMainStationsForTournament(stations, tournamentIdNum);
  }, [stations, tournamentId]);

  // Filter matches by station
  const filteredMatches = useMemo(() => {
    if (selectedStation === 'all') return matches;
    const station = mainStations.find(s => 
      s.normalizedName === selectedStation || s.name === selectedStation
    );
    if (!station) return matches;
    return matches.filter(m => m.stationId === station.id);
  }, [matches, mainStations, selectedStation]);

  // Group matches by status
  const matchesByStatus = useMemo(() => {
    return {
      pending: filteredMatches.filter(m => m.status === 'PENDING'),
      ready: filteredMatches.filter(m => m.status === 'READY'),
      running: filteredMatches.filter(m => m.status === 'RUNNING'),
      done: filteredMatches.filter(m => m.status === 'DONE'),
    };
  }, [filteredMatches]);

  // Get station stats
  const stationStats = useMemo(() => {
    const stats: Record<string, { total: number; active: number; completed: number }> = {};
    
    stations.forEach(station => {
      const stationMatches = matches.filter(m => m.stationId === station.id);
      stats[station.name] = {
        total: stationMatches.length,
        active: stationMatches.filter(m => m.status === 'RUNNING' || m.status === 'READY').length,
        completed: stationMatches.filter(m => m.status === 'DONE').length,
      };
    });

    return stats;
  }, [matches, stations]);

  if (tournamentLoading || matchesLoading || stationsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading heats...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Tournament not found</p>
        </div>
      </div>
    );
  }

  if (tournament.status !== 'ACTIVE' && tournament.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-semibold mb-2">Tournament Not Started</p>
          <p className="text-muted-foreground">
            This tournament is currently in setup. Heats will be available once the tournament is initiated.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'RUNNING':
        return <Badge className="bg-green-600 text-white animate-pulse min-w-[3rem]">LIVE</Badge>;
      case 'READY':
        return <Badge variant="default">READY</Badge>;
      case 'DONE':
        return <Badge variant="secondary">DONE</Badge>;
      case 'PENDING':
        return <Badge variant="outline">PENDING</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStationName = (stationId: number | null) => {
    if (!stationId) return 'TBD';
    const station = stations.find(s => s.id === stationId);
    if (!station) return 'Unknown';
    // Remove "Station " prefix if present to avoid duplication when adding prefix in JSX
    return station.name.startsWith('Station ') ? station.name.replace(/^Station /, '') : station.name;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Current Heats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 min-h-[2rem] flex items-center justify-center">{matchesByStatus.running.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 min-h-[2rem] flex items-center justify-center">{matchesByStatus.ready.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Ready</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold min-h-[2rem] flex items-center justify-center">{matchesByStatus.done.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold min-h-[2rem] flex items-center justify-center">{filteredMatches.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Station Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Filter by Station
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStation} onValueChange={setSelectedStation}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
                <TabsTrigger value="all" className="text-xs sm:text-sm">All Stations</TabsTrigger>
                {mainStations.map(station => {
                  const displayName = `Station ${station.normalizedName}`;
                  return (
                    <TabsTrigger key={station.id} value={station.normalizedName} className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">{displayName}</span>
                      <span className="sm:hidden">{station.normalizedName}</span>
                      {stationStats[station.name] && (
                        <Badge variant="secondary" className="ml-1 sm:ml-2 min-w-[1.5rem] text-xs">
                          {stationStats[station.name].active}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Station Overview */}
        {selectedStation === 'all' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainStations.map(station => {
              const stats = stationStats[station.name] || { total: 0, active: 0, completed: 0 };
              const displayName = `Station ${station.normalizedName}`;
              return (
                <Card key={station.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {displayName}
                      </span>
                      <Badge variant={station.status === 'BUSY' ? 'default' : 'secondary'}>
                        {station.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold">{stats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 font-medium">Active:</span>
                        <span className="font-semibold">{stats.active}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="font-semibold">{stats.completed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Active Heats */}
        {matchesByStatus.running.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Active Heats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchesByStatus.running.map(match => (
                  <Card key={match.id} className="border-green-500 border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Heat {match.heatNumber}</CardTitle>
                        {getStatusBadge(match.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>Station {getStationName(match.stationId)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="h-4 w-4 flex-shrink-0" />
                          <span>Round {match.round}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-sm font-medium">
                            {match.competitor1Name || 'TBD'} vs {match.competitor2Name || 'TBD'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ready Heats */}
        {matchesByStatus.ready.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ready Heats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchesByStatus.ready.map(match => (
                  <Card key={match.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Heat {match.heatNumber}</CardTitle>
                        {getStatusBadge(match.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>Station {getStationName(match.stationId)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Trophy className="h-4 w-4 flex-shrink-0" />
                          <span>Round {match.round}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-sm font-medium">
                            {match.competitor1Name || 'TBD'} vs {match.competitor2Name || 'TBD'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Heats List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Heats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No heats found for this tournament</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMatches
                  .sort((a, b) => b.heatNumber - a.heatNumber)
                  .map(match => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors min-h-[4rem]"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold">Heat {match.heatNumber}</span>
                          {getStatusBadge(match.status)}
                          <Badge variant="outline" className="text-xs">
                            Round {match.round}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Station {getStationName(match.stationId)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {match.competitor1Name || 'TBD'} vs {match.competitor2Name || 'TBD'}
                        </div>
                      </div>
                      {match.status === 'DONE' && match.winnerId && (
                        <Trophy className="h-5 w-5 text-chart-3" />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveHeats;

