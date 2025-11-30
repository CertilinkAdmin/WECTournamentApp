import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Trophy,
  Clock,
  Timer,
  CheckCircle2,
  Play,
  BarChart3,
  TrendingUp,
  Calendar,
  User as UserIcon,
  Award,
  Target,
  Activity,
  ArrowLeft
} from 'lucide-react';
import type { Station, Match, User, HeatSegment, HeatJudge } from '@shared/schema';

export default function FullStationPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const numericStationId = stationId ? parseInt(stationId) : null;
  const [activeTab, setActiveTab] = useState<'overview' | 'heats'>('overview');

  // Fetch station data
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  const station = stations.find(s => s.id === numericStationId);

  // Fetch tournaments
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });

  const currentTournament = tournaments[0];
  const currentTournamentId = currentTournament?.id;

  // Fetch all matches for tournament
  const { data: allMatches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${currentTournamentId}/matches`],
    enabled: !!currentTournamentId,
  });

  // Filter matches for this station
  const stationMatches = useMemo(() => {
    if (!numericStationId) return [];
    return allMatches.filter(m => m.stationId === numericStationId);
  }, [allMatches, numericStationId]);

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch participants for cup codes
  const { data: participants = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments', currentTournamentId, 'participants'],
    enabled: !!currentTournamentId,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHeats = stationMatches.length;
    const completedHeats = stationMatches.filter(m => m.status === 'DONE').length;
    const activeHeats = stationMatches.filter(m => m.status === 'RUNNING' || m.status === 'READY').length;
    const pendingHeats = stationMatches.filter(m => m.status === 'PENDING').length;
    const completionRate = totalHeats > 0 ? Math.round((completedHeats / totalHeats) * 100) : 0;

    // Calculate average heat time
    const completedMatchesWithTime = stationMatches.filter(m => 
      m.status === 'DONE' && m.startTime && m.endTime
    );
    const totalTime = completedMatchesWithTime.reduce((sum, m) => {
      const start = new Date(m.startTime!).getTime();
      const end = new Date(m.endTime!).getTime();
      return sum + (end - start);
    }, 0);
    const averageTimeMinutes = completedMatchesWithTime.length > 0
      ? Math.round(totalTime / completedMatchesWithTime.length / 1000 / 60)
      : 0;

    // Get current round
    const rounds = [...new Set(stationMatches.map(m => m.round))].sort((a, b) => a - b);
    const currentRound = rounds.length > 0 ? Math.max(...rounds) : 1;
    const currentRoundMatches = stationMatches.filter(m => m.round === currentRound);
    const currentRoundCompleted = currentRoundMatches.filter(m => m.status === 'DONE').length;
    const currentRoundProgress = currentRoundMatches.length > 0
      ? Math.round((currentRoundCompleted / currentRoundMatches.length) * 100)
      : 0;

    return {
      totalHeats,
      completedHeats,
      activeHeats,
      pendingHeats,
      completionRate,
      averageTimeMinutes,
      currentRound,
      currentRoundMatches: currentRoundMatches.length,
      currentRoundCompleted,
      currentRoundProgress,
      rounds
    };
  }, [stationMatches]);

  // Get current match
  const currentMatch = useMemo(() => {
    return stationMatches.find(m => m.status === 'RUNNING') ||
           stationMatches.find(m => m.status === 'READY') ||
           null;
  }, [stationMatches]);

  // Get upcoming matches (PENDING or READY, sorted by heat number)
  const upcomingMatches = useMemo(() => {
    return stationMatches
      .filter(m => m.status === 'PENDING' || m.status === 'READY')
      .sort((a, b) => a.heatNumber - b.heatNumber)
      .slice(0, 10); // Show next 10
  }, [stationMatches]);

  // Fetch segments for current match
  const { data: segments = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${currentMatch?.id}/segments`],
    enabled: !!currentMatch,
  });

  // Fetch judges for current match
  const { data: currentMatchJudges = [] } = useQuery<HeatJudge[]>({
    queryKey: [`/api/matches/${currentMatch?.id}/judges`],
    enabled: !!currentMatch,
  });

  // Get station lead
  const stationLead = useMemo(() => {
    if (!station?.stationLeadId) return null;
    return users.find(u => u.id === station.stationLeadId) || null;
  }, [station, users]);

  if (!numericStationId || !station) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Station not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserById = (id: number | null | undefined) => {
    if (!id) return null;
    return users.find(u => u.id === id) || null;
  };

  // Determine back navigation destination
  const getBackPath = () => {
    if (currentTournamentId) {
      return `/live/${currentTournamentId}/stations`;
    }
    return '/station-lead';
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6">
      {/* Back Button - Desktop Only */}
      <div className="hidden lg:block">
        <Button
          variant="ghost"
          onClick={() => navigate(getBackPath())}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stations
        </Button>
      </div>

      {/* Station Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  Station {station.name}
                </CardTitle>
                {station.location && (
                  <p className="text-sm text-muted-foreground mt-1">{station.location}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={station.status === 'AVAILABLE' ? 'default' : station.status === 'BUSY' ? 'secondary' : 'outline'}
                className="text-sm px-3 py-1"
              >
                {station.status}
              </Badge>
              {stationLead && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <UserIcon className="h-3 w-3 mr-1" />
                  {stationLead.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Heats</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalHeats}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.completedHeats}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.activeHeats}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pendingHeats}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Time</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.averageTimeMinutes}m</p>
              </div>
              <Timer className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Round Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Round {stats.currentRound} Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {stats.currentRoundCompleted} of {stats.currentRoundMatches} heats completed
              </span>
              <span className="font-semibold">{stats.currentRoundProgress}%</span>
            </div>
            <Progress value={stats.currentRoundProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="heats" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Heats</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          {/* Current Heat */}
          {currentMatch ? (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    <span>Current Heat - Round {currentMatch.round}, Heat {currentMatch.heatNumber}</span>
                  </div>
                  <Badge variant="default" className="animate-pulse">LIVE</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Competitors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CompetitorCard
                    competitor={getUserById(currentMatch.competitor1Id)}
                    isWinner={currentMatch.winnerId === currentMatch.competitor1Id}
                    position="left"
                  />
                  <CompetitorCard
                    competitor={getUserById(currentMatch.competitor2Id)}
                    isWinner={currentMatch.winnerId === currentMatch.competitor2Id}
                    position="right"
                  />
                </div>

                {/* Segments */}
                {segments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Segments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {segments.map((segment) => (
                        <SegmentCard key={segment.id} segment={segment} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Judges */}
                {currentMatchJudges.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Judges ({currentMatchJudges.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentMatchJudges.map((judge) => {
                        const judgeUser = getUserById(judge.judgeId);
                        return judgeUser ? (
                          <Badge key={judge.id} variant="outline">
                            {judgeUser.name} ({judge.role})
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active heat at this station</p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Heats Queue */}
          {upcomingMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Heats ({upcomingMatches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingMatches.slice(0, 5).map((match) => (
                    <UpcomingHeatCard
                      key={match.id}
                      match={match}
                      getUserById={getUserById}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Heats Tab */}
        <TabsContent value="heats" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stationMatches
              .sort((a, b) => a.heatNumber - b.heatNumber)
              .map((match) => (
                <HeatCard
                  key={match.id}
                  match={match}
                  getUserById={getUserById}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function CompetitorCard({ competitor, isWinner, position }: { competitor: User | null; isWinner: boolean; position: 'left' | 'right' }) {
  if (!competitor) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground">
          TBD
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isWinner ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{competitor.name}</p>
            <p className="text-xs text-muted-foreground">{position.toUpperCase()}</p>
          </div>
          {isWinner && <Award className="h-5 w-5 text-green-600" />}
        </div>
      </CardContent>
    </Card>
  );
}

function SegmentCard({ segment }: { segment: HeatSegment }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-500';
      case 'ENDED': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">{segment.segment.replace('_', ' ')}</p>
            <p className="text-xs text-muted-foreground">{segment.plannedMinutes}m</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(segment.status)}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingHeatCard({ match, getUserById }: { match: Match; getUserById: (id: number | null | undefined) => User | null }) {
  const comp1 = getUserById(match.competitor1Id);
  const comp2 = getUserById(match.competitor2Id);

  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-semibold">Heat {match.heatNumber}</span>
            <Badge variant="outline" className="text-xs">Round {match.round}</Badge>
          </div>
          <Badge variant="secondary">{match.status}</Badge>
        </div>
        <div className="text-sm">
          <p>{comp1?.name || 'TBD'} vs {comp2?.name || 'TBD'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function HeatCard({ match, getUserById }: { match: Match; getUserById: (id: number | null | undefined) => User | null }) {
  const comp1 = getUserById(match.competitor1Id);
  const comp2 = getUserById(match.competitor2Id);
  const winner = getUserById(match.winnerId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'DONE': return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'READY': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default: return '';
    }
  };

  return (
    <Card className={getStatusColor(match.status)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-bold">Heat {match.heatNumber}</span>
          </div>
          <Badge variant="outline" className="text-xs">R{match.round}</Badge>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">{comp1?.name || 'TBD'}</div>
          <div className="text-center text-xs text-muted-foreground">VS</div>
          <div className="text-sm font-medium">{comp2?.name || 'TBD'}</div>
        </div>
        {winner && (
          <div className="mt-3 pt-3 border-t">
            <Badge className="bg-green-600">
              <Award className="h-3 w-3 mr-1" />
              {winner.name}
            </Badge>
          </div>
        )}
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">{match.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}


