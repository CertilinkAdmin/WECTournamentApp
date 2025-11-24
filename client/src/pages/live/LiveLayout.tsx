import React from 'react';
import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, LayoutGrid, ListOrdered, Award, Radio, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '../../components/AppHeader';
import './LiveLayout.css';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
}

const LiveLayout: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const location = useLocation();

  // API returns { tournament, participants, matches, scores }
  const { data: tournamentData, isLoading } = useQuery<{
    tournament: Tournament;
    participants: any[];
    matches: any[];
    scores: any[];
  }>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  const tournament = tournamentData?.tournament;

  const navItems = [
    { path: 'overview', label: 'Overview', icon: BarChart3 },
    { path: 'bracket', label: 'Bracket', icon: LayoutGrid },
    { path: 'heats', label: 'Heats', icon: ListOrdered },
    { path: 'leaderboard', label: 'Leaderboard', icon: Award },
    { path: 'stations', label: 'Stations', icon: Radio },
  ];

  const isActive = (path: string) => {
    const currentPath = location.pathname.split('/').pop();
    return currentPath === path || (currentPath === tournamentId && path === 'overview');
  };

  const getShortName = (name: string | undefined): string => {
    if (!name) return '';
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  // Determine current tab from URL
  const currentTab = React.useMemo(() => {
    const path = location.pathname.split('/').pop();
    if (path === tournamentId || path === 'overview') return 'overview';
    if (path === 'bracket') return 'bracket';
    if (path === 'heats') return 'heats';
    if (path === 'leaderboard') return 'leaderboard';
    if (path === 'stations') return 'stations';
    return 'overview';
  }, [location.pathname, tournamentId]);

  // Only show navigation for ACTIVE or COMPLETED tournaments
  const showNavigation = tournament && (tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Tournament Header with Navigation */}
      {showNavigation && (
        <div className="border-b bg-card sticky top-[73px] md:top-[81px] lg:top-[89px] z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{getShortName(tournament.name)}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={tournament.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={tournament.status === 'ACTIVE' ? 'bg-green-600' : ''}
                  >
                    {tournament.status === 'ACTIVE' && <Radio className="h-3 w-3 mr-1 animate-pulse" />}
                    {tournament.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Tabs value={currentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TabsTrigger
                      key={item.path}
                      value={item.path}
                      asChild
                      className="flex items-center gap-2 py-2 text-xs sm:text-sm"
                    >
                      <Link to={`/live/${tournamentId}/${item.path}`}>
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                      </Link>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-6 lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default LiveLayout;
