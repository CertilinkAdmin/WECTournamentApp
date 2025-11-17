import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Trophy, ChevronRight, Radio, Clock, Activity, MapPin, UserPlus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { extractTournamentSlug } from '@/utils/tournamentUtils';
import AppHeader from '../../components/AppHeader';

interface Match {
  id: number;
  tournamentId: number;
  round: number;
  heatNumber: number;
  stationId: number | null;
  status: 'PENDING' | 'READY' | 'RUNNING' | 'DONE';
  competitor1Id: number | null;
  competitor2Id: number | null;
  winnerId: number | null;
}

interface Station {
  id: number;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'JUDGE' | 'BARISTA' | 'STATION_LEAD';
}

interface TournamentParticipant {
  id: number;
  tournamentId: number;
  userId: number;
  seed: number | null;
}

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  totalRounds: number;
  currentRound: number;
}

export default function TournamentList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('live');

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    refetchInterval: activeTab === 'live' ? 5000 : false, // Poll every 5s for live tab
  });

  // Filter tournaments by status for each tab
  const liveTournaments = useMemo(() => {
    return tournaments?.filter(t => t.status === 'ACTIVE') || [];
  }, [tournaments]);

  const upcomingTournaments = useMemo(() => {
    return tournaments?.filter(t => t.status === 'SETUP') || [];
  }, [tournaments]);

  const completedTournaments = useMemo(() => {
    return tournaments?.filter(t => t.status === 'COMPLETED') || [];
  }, [tournaments]);


  const handleTournamentClick = (tournament: Tournament) => {
    if (tournament.status === 'ACTIVE') {
      navigate(`/live/${tournament.id}`);
    } else if (tournament.status === 'COMPLETED') {
      const slug = extractTournamentSlug(tournament.name);
      if (slug) {
        navigate(`/results/${slug}`);
      } else {
        // Fallback: For WEC 2025 Milano, use WEC2025 slug
        if (tournament.name.includes('2025') && tournament.name.toLowerCase().includes('milano')) {
          navigate(`/results/WEC2025`);
        } else {
          // Fallback to ID if slug can't be extracted (deprecated, but kept for backwards compatibility)
          navigate(`/results/${tournament.id}`);
        }
      }
    }
  };

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600 text-white" data-testid={`badge-status-active`}>LIVE</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary" data-testid={`badge-status-completed`}>Completed</Badge>;
      case 'SETUP':
        return <Badge variant="outline" className="text-muted-foreground" data-testid={`badge-status-setup`}>Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const getShortName = (name: string): string => {
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  // Component to show live tournament stats
  const LiveTournamentStats = ({ tournamentId }: { tournamentId: number }) => {
    const { data: matches = [] } = useQuery<Match[]>({
      queryKey: [`/api/tournaments/${tournamentId}/matches`],
      enabled: activeTab === 'live',
      refetchInterval: 5000, // Poll every 5s
    });

    const { data: stations = [] } = useQuery<Station[]>({
      queryKey: ['/api/stations'],
      enabled: activeTab === 'live',
    });

    const activeHeats = matches.filter(m => m.status === 'RUNNING' || m.status === 'READY').length;
    const totalHeats = matches.length;
    const completedHeats = matches.filter(m => m.status === 'DONE').length;
    const activeStations = stations.filter(s => s.status === 'BUSY').length;
    const totalStations = stations.length;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-600" />
          <div>
            <div className="text-xs text-muted-foreground">Active Heats</div>
            <div className="text-sm font-semibold">{activeHeats}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-sm font-semibold">{completedHeats}/{totalHeats}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <div>
            <div className="text-xs text-muted-foreground">Stations</div>
            <div className="text-sm font-semibold">{activeStations}/{totalStations} active</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-600" />
          <div>
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="text-sm font-semibold">
              {totalHeats > 0 ? Math.round((completedHeats / totalHeats) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Registration component for upcoming tournaments
  const TournamentRegistration = ({ tournament }: { tournament: Tournament }) => {
    const { data: users = [] } = useQuery<User[]>({
      queryKey: ['/api/users'],
    });

    const { data: participants = [] } = useQuery<TournamentParticipant[]>({
      queryKey: ['/api/tournaments', tournament.id, 'participants'],
      enabled: tournament.status === 'SETUP',
    });

    const registeredUserIds = new Set(participants.map(p => p.userId));
    const availableBaristas = users.filter(u => u.role === 'BARISTA' && !registeredUserIds.has(u.id));
    const availableJudges = users.filter(u => u.role === 'JUDGE' && !registeredUserIds.has(u.id));

    const registerMutation = useMutation({
      mutationFn: async ({ userId, role }: { userId: number; role: 'BARISTA' | 'JUDGE' }) => {
        const response = await fetch(`/api/tournaments/${tournament.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId, seed: null }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Registration failed');
        }
        return response.json();
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournament.id, 'participants'] });
        toast({
          title: 'Registration Successful',
          description: `Successfully registered as ${variables.role.toLowerCase()}`,
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Registration Failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    const handleRegister = (userId: number, role: 'BARISTA' | 'JUDGE') => {
      registerMutation.mutate({ userId, role });
    };

    return (
      <div className="mt-4 pt-4 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <UserPlus className="w-4 h-4" />
          <span>Registration</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Baristas</span>
              <Badge variant="secondary">{availableBaristas.length} available</Badge>
            </div>
            {availableBaristas.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableBaristas.slice(0, 5).map(barista => (
                  <Button
                    key={barista.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleRegister(barista.id, 'BARISTA')}
                    disabled={registerMutation.isPending}
                  >
                    <Users className="w-3 h-3 mr-2" />
                    {barista.name}
                  </Button>
                ))}
                {availableBaristas.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{availableBaristas.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">All baristas registered</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Judges</span>
              <Badge variant="secondary">{availableJudges.length} available</Badge>
            </div>
            {availableJudges.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {availableJudges.slice(0, 5).map(judge => (
                  <Button
                    key={judge.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleRegister(judge.id, 'JUDGE')}
                    disabled={registerMutation.isPending}
                  >
                    <Users className="w-3 h-3 mr-2" />
                    {judge.name}
                  </Button>
                ))}
                {availableJudges.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{availableJudges.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">All judges registered</p>
            )}
          </div>
        </div>
        {participants.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderTournamentCard = (tournament: Tournament, showLiveIndicators = false) => {
    const isClickable = tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED';
    
    return (
      <Card
        key={tournament.id}
        className={`
          ${isClickable ? 'hover-elevate active-elevate-2 cursor-pointer' : 'opacity-60'}
          transition-all
          ${showLiveIndicators && tournament.status === 'ACTIVE' ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
        `}
        onClick={() => handleTournamentClick(tournament)}
        data-testid={`card-tournament-${tournament.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">
                  {tournament.name}
                </CardTitle>
                {showLiveIndicators && tournament.status === 'ACTIVE' && (
                  <span className="flex items-center gap-1 text-green-600 animate-pulse">
                    <Radio className="w-4 h-4" />
                    <span className="text-xs font-semibold">LIVE</span>
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {getShortName(tournament.name)}
              </div>
              {showLiveIndicators && tournament.status === 'ACTIVE' && tournament.currentRound && (
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    Round {tournament.currentRound} of {tournament.totalRounds || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(tournament.status)}
              {isClickable && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {tournament.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" />
              <span>{tournament.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {tournament.status === 'SETUP' || !tournament.startDate ? (
              <span>Coming Soon</span>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(tournament.startDate), 'MMMM d, yyyy')}
                  {tournament.endDate && 
                    ` - ${format(new Date(tournament.endDate), 'MMMM d, yyyy')}`
                  }
                </span>
              </>
            )}
          </div>
          {showLiveIndicators && tournament.status === 'ACTIVE' && (
            <LiveTournamentStats tournamentId={tournament.id} />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Page Title */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Tournaments</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            {activeTab === 'live' && 'Watch live tournament action as it happens'}
            {activeTab === 'upcoming' && 'Register for upcoming tournaments'}
            {activeTab === 'completed' && 'View completed tournament results'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="flex items-center gap-2" data-testid="tab-live">
              <Radio className="h-4 w-4" />
              <span>Live</span>
              {liveTournaments.length > 0 && (
                <Badge variant="destructive" className="ml-1 animate-pulse">
                  {liveTournaments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2" data-testid="tab-upcoming">
              <Calendar className="h-4 w-4" />
              <span>Upcoming</span>
              {upcomingTournaments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {upcomingTournaments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2" data-testid="tab-completed">
              <Trophy className="h-4 w-4" />
              <span>Completed</span>
              {completedTournaments.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {completedTournaments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Live Tab */}
          <TabsContent value="live" className="mt-6">
            <div className="space-y-3">
              {liveTournaments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No live tournaments at the moment</p>
                    <p className="text-sm text-muted-foreground mt-2">Check back soon for live action!</p>
                  </CardContent>
                </Card>
              ) : (
                liveTournaments.map(tournament => renderTournamentCard(tournament, true))
              )}
            </div>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="mt-6">
            <div className="space-y-3">
              {upcomingTournaments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No upcoming tournaments</p>
                    <p className="text-sm text-muted-foreground mt-2">New tournaments will appear here when they're announced</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingTournaments.map(tournament => (
                  <Card
                    key={tournament.id}
                    className="transition-all"
                    data-testid={`card-tournament-${tournament.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                              {tournament.name}
                            </CardTitle>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getShortName(tournament.name)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(tournament.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        {tournament.status === 'SETUP' || !tournament.startDate ? (
                          <span>Coming Soon</span>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(tournament.startDate), 'MMMM d, yyyy')}
                              {tournament.endDate && 
                                ` - ${format(new Date(tournament.endDate), 'MMMM d, yyyy')}`
                              }
                            </span>
                          </>
                        )}
                      </div>
                      <TournamentRegistration tournament={tournament} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="mt-6">
            <div className="space-y-3">
              {completedTournaments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No completed tournaments</p>
                    <p className="text-sm text-muted-foreground mt-2">Completed tournaments will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                completedTournaments.map(tournament => renderTournamentCard(tournament))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
