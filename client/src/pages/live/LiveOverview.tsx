import React, { useMemo, memo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  Activity, 
  Clock, 
  MapPin, 
  Award,
  TrendingUp,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { format } from 'date-fns';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  totalRounds: number;
  currentRound: number;
  location?: string | null;
}

interface Match {
  id: number;
  heatNumber: number;
  round: number;
  status: 'PENDING' | 'READY' | 'RUNNING' | 'DONE';
  competitor1Name?: string;
  competitor2Name?: string;
  winnerId?: number | null;
}

interface Participant {
  id: number;
  userId: number;
  name: string;
  seed: number | null;
  finalRank: number | null;
}

interface Station {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

const LiveOverview: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const queryClient = useQueryClient();
  const socket = useWebSocket();
  
  // Join tournament room for real-time updates
  useEffect(() => {
    if (!socket || !tournamentId) return;
    
    socket.emit("join:tournament", Number(tournamentId));
    console.log(`Joined tournament room: ${tournamentId}`);
    
    // Listen for real-time updates
    const handleSegmentStarted = () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
    };

    const handleSegmentEnded = () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
    };

    const handleHeatStarted = () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
    };

    const handleHeatCompleted = () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
    };

    const handleHeatAdvanced = () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
    };

    socket.on("segment:started", handleSegmentStarted);
    socket.on("segment:ended", handleSegmentEnded);
    socket.on("heat:started", handleHeatStarted);
    socket.on("heat:completed", handleHeatCompleted);
    socket.on("heat:advanced", handleHeatAdvanced);

    return () => {
      socket.off("segment:started", handleSegmentStarted);
      socket.off("segment:ended", handleSegmentEnded);
      socket.off("heat:started", handleHeatStarted);
      socket.off("heat:completed", handleHeatCompleted);
      socket.off("heat:advanced", handleHeatAdvanced);
    };
  }, [socket, tournamentId, queryClient]);
  
  // Fetch tournament data - API returns { tournament, participants, matches, scores }
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery<{
    tournament: Tournament;
    participants: Participant[];
    matches: Match[];
    scores: any[];
  }>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
    refetchInterval: 10000, // Reduced polling since we have WebSocket updates
  });

  const tournament = tournamentData?.tournament;

  // Use matches and participants from the main tournament query if available
  const matches = tournamentData?.matches || [];
  const participants = tournamentData?.participants || [];
  
  // Fallback to separate queries if main query doesn't have the data
  const { data: matchesFallback = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
    enabled: !!tournamentId && !tournamentData?.matches,
    refetchInterval: 5000,
  });

  const { data: participantsFallback = [], isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: [`/api/tournaments/${tournamentId}/participants`],
    enabled: !!tournamentId && !tournamentData?.participants,
  });

  // Use fallback data if main query doesn't have it
  const finalMatches = matches.length > 0 ? matches : matchesFallback;
  const finalParticipants = participants.length > 0 ? participants : participantsFallback;

  const { data: stations = [], isLoading: stationsLoading } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
    refetchInterval: 5000,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMatches = finalMatches.length;
    const completedMatches = finalMatches.filter(m => m.status === 'DONE').length;
    const activeMatches = finalMatches.filter(m => m.status === 'RUNNING' || m.status === 'READY').length;
    const pendingMatches = finalMatches.filter(m => m.status === 'PENDING').length;
    const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
    
    const activeStations = stations.filter(s => s.status === 'BUSY').length;
    const totalStations = stations.length;
    
    const baristas = finalParticipants.filter(p => !p.finalRank).length;
    const judges = finalParticipants.length - baristas; // Approximate, may need adjustment
    
    return {
      totalMatches,
      completedMatches,
      activeMatches,
      pendingMatches,
      progress,
      activeStations,
      totalStations,
      baristas,
      judges,
    };
  }, [finalMatches, stations, finalParticipants]);

  const isLoading = tournamentLoading || (matchesLoading && !tournamentData?.matches) || (participantsLoading && !tournamentData?.participants) || stationsLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tournament overview...</p>
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

  // Only show overview for ACTIVE or COMPLETED tournaments
  if (tournament.status !== 'ACTIVE' && tournament.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-semibold mb-2">Tournament Not Started</p>
          <p className="text-muted-foreground">
            This tournament is currently in setup. The overview will be available once the tournament is initiated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Tournament Header */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2 break-words">{tournament.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                  {tournament.location && (
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{tournament.location}</span>
                    </div>
                  )}
                  {tournament.startDate && (
                    <div className="flex items-center gap-1 min-w-0">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {format(new Date(tournament.startDate), 'MMM d, yyyy')}
                        {tournament.endDate && ` - ${format(new Date(tournament.endDate), 'MMM d, yyyy')}`}
                      </span>
                    </div>
                  )}
                  <Badge 
                    variant={tournament.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={tournament.status === 'ACTIVE' ? 'bg-green-600' : ''}
                    aria-label={`Tournament status: ${tournament.status}`}
                  >
                    {tournament.status === 'ACTIVE' && <Radio className="h-3 w-3 mr-1 animate-pulse" aria-hidden="true" />}
                    {tournament.status}
                  </Badge>
                </div>
              </div>
              {tournament.status === 'ACTIVE' && (
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Current Round</div>
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {tournament.currentRound} / {tournament.totalRounds}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Matches */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">Total Matches</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{stats.totalMatches}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.completedMatches} completed
              </div>
            </CardContent>
          </Card>

          {/* Active Matches */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-green-600" aria-hidden="true" />
                <span className="truncate">Active Heats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 tabular-nums">{stats.activeMatches}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.pendingMatches} pending
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">Participants</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{stats.baristas}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.judges} judges
              </div>
            </CardContent>
          </Card>

          {/* Stations */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-blue-600" aria-hidden="true" />
                <span className="truncate">Stations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{stats.activeStations}/{stats.totalStations}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Active stations
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
              Tournament Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold tabular-nums">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-2" aria-label={`Tournament progress: ${stats.progress}%`} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold tabular-nums">{stats.completedMatches}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600 tabular-nums">{stats.activeMatches}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600 tabular-nums">{stats.pendingMatches}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold tabular-nums">{stats.totalMatches}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />
              Recent Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(finalMatches || []).length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-4" role="status">
                No matches found for this tournament
              </p>
            ) : (
              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto overscroll-contain" role="list" aria-label="Recent matches">
                {(finalMatches || [])
                  .sort((a, b) => b.heatNumber - a.heatNumber)
                  .slice(0, 10)
                  .map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors min-h-[44px] touch-manipulation"
                      role="listitem"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            Heat {match.heatNumber}
                          </Badge>
                          <Badge
                            variant={
                              match.status === 'DONE'
                                ? 'secondary'
                                : match.status === 'RUNNING'
                                ? 'default'
                                : 'outline'
                            }
                            className="text-xs"
                            aria-label={`Match status: ${match.status}`}
                          >
                            {match.status}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm truncate">
                          {match.competitor1Name || 'TBD'} vs {match.competitor2Name || 'TBD'}
                        </div>
                      </div>
                      {match.status === 'DONE' && (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 ml-2" aria-label="Match completed" />
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

export default memo(LiveOverview);

