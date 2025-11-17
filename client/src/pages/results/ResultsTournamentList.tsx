import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Trophy, ChevronRight, Radio, Clock } from 'lucide-react';
import { format } from 'date-fns';
import AppHeader from '../../components/AppHeader';
import { extractTournamentSlug } from '@/utils/tournamentUtils';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  totalRounds: number;
  currentRound: number;
}

interface Match {
  id: number;
  tournamentId: number;
  round: number;
  heatNumber: number;
  status: 'PENDING' | 'READY' | 'RUNNING' | 'DONE';
}

export default function ResultsTournamentList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'live'>('all');

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    refetchInterval: 10000, // Poll every 10s for live results
  });

  // Filter tournaments
  const completedTournaments = useMemo(() => {
    return tournaments?.filter(t => t.status === 'COMPLETED') || [];
  }, [tournaments]);

  const liveTournaments = useMemo(() => {
    return tournaments?.filter(t => t.status === 'ACTIVE') || [];
  }, [tournaments]);

  const allTournaments = useMemo(() => {
    return [...(liveTournaments || []), ...(completedTournaments || [])];
  }, [liveTournaments, completedTournaments]);

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600 text-white animate-pulse">LIVE</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };

  const getShortName = (name: string): string => {
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  // Component to show live tournament result stats
  const LiveResultStats = ({ tournamentId }: { tournamentId: number }) => {
    const { data: matches = [] } = useQuery<Match[]>({
      queryKey: [`/api/tournaments/${tournamentId}/matches`],
      enabled: activeTab !== 'completed',
      refetchInterval: 10000, // Poll every 10s
    });

    const completedHeats = matches.filter(m => m.status === 'DONE').length;
    const totalHeats = matches.length;
    const latestResults = matches
      .filter(m => m.status === 'DONE')
      .sort((a, b) => b.id - a.id)
      .slice(0, 3);

    return (
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Radio className="w-3 h-3 text-green-600 animate-pulse" />
          <span>Live Results</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Completed: </span>
            <span className="font-semibold">{completedHeats}/{totalHeats}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Progress: </span>
            <span className="font-semibold">
              {totalHeats > 0 ? Math.round((completedHeats / totalHeats) * 100) : 0}%
            </span>
          </div>
        </div>
        {latestResults.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Latest: Heat {latestResults.map(m => m.heatNumber).join(', ')}
          </div>
        )}
      </div>
    );
  };

  const renderTournamentCard = (tournament: Tournament) => {
    const isLive = tournament.status === 'ACTIVE';
    
    return (
      <Card
        key={tournament.id}
        className={`
          hover-elevate active-elevate-2 cursor-pointer transition-all
          ${isLive ? 'ring-2 ring-green-500 ring-opacity-30' : ''}
        `}
        onClick={() => {
          const slug = extractTournamentSlug(tournament.name);
          console.log('Tournament name:', tournament.name, 'Extracted slug:', slug);
          if (slug) {
            navigate(`/results/${slug}`);
          } else {
            // Fallback: For WEC 2025 Milano, use WEC2025 slug
            if (tournament.name.includes('2025') && tournament.name.toLowerCase().includes('milano')) {
              navigate(`/results/WEC2025`);
            } else {
              // Fallback to WEC2025 if slug can't be extracted
              navigate(`/results/WEC2025`);
            }
          }
        }}
        data-testid={`card-tournament-${tournament.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">
                  {tournament.name}
                </CardTitle>
                {isLive && (
                  <span className="flex items-center gap-1 text-green-600 animate-pulse">
                    <Radio className="w-4 h-4" />
                    <span className="text-xs font-semibold">LIVE</span>
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {getShortName(tournament.name)}
              </div>
              {isLive && tournament.currentRound && (
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
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {tournament.startDate ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(tournament.startDate), 'MMMM d, yyyy')}
                  {tournament.endDate && 
                    ` - ${format(new Date(tournament.endDate), 'MMMM d, yyyy')}`
                  }
                </span>
              </>
            ) : (
              <span>Date TBD</span>
            )}
          </div>
          {isLive && <LiveResultStats tournamentId={tournament.id} />}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Page Title */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Results</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            View completed tournament results and live results as they publish
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2" data-testid="tab-all">
              <Trophy className="h-4 w-4" />
              <span>All</span>
              {allTournaments.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {allTournaments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2" data-testid="tab-completed">
              <Trophy className="h-4 w-4" />
              <span>Completed</span>
              {completedTournaments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedTournaments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2" data-testid="tab-live">
              <Radio className="h-4 w-4" />
              <span>Live</span>
              {liveTournaments.length > 0 && (
                <Badge variant="destructive" className="ml-1 animate-pulse">
                  {liveTournaments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="mt-6">
            <div className="space-y-3">
              {allTournaments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No tournaments available</p>
                    <p className="text-sm text-muted-foreground mt-2">Tournaments will appear here when they're active or completed</p>
                  </CardContent>
                </Card>
              ) : (
                allTournaments.map(tournament => renderTournamentCard(tournament))
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

          {/* Live Tab */}
          <TabsContent value="live" className="mt-6">
            <div className="space-y-3">
              {liveTournaments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No live tournaments</p>
                    <p className="text-sm text-muted-foreground mt-2">Live results will appear here as tournaments progress</p>
                  </CardContent>
                </Card>
              ) : (
                liveTournaments.map(tournament => renderTournamentCard(tournament))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

