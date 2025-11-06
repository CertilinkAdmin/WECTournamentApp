import React from 'react';
import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, LayoutGrid, ListOrdered, Award, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '../../components/ThemeToggle';
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

  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  const navItems = [
    { path: 'bracket', label: 'Bracket', icon: LayoutGrid },
    { path: 'heats', label: 'Heats', icon: ListOrdered },
    { path: 'leaderboard', label: 'Leaderboard', icon: Award },
    { path: 'stations', label: 'Stations', icon: Radio },
  ];

  const isActive = (path: string) => {
    const currentPath = location.pathname.split('/').pop();
    return currentPath === path || (currentPath === tournamentId && path === 'bracket');
  };

  const getShortName = (name: string | undefined): string => {
    if (!name) return '';
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b border-primary-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link 
              to="/live" 
              className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-md"
              data-testid="link-back-tournaments"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Tournaments</span>
            </Link>
            <div className="flex items-center gap-3">
              {tournament?.status === 'ACTIVE' && (
                <Badge className="bg-green-600 text-white" data-testid="badge-live">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
                  LIVE
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>

          {/* Tournament Title */}
          {isLoading ? (
            <div className="h-8 bg-primary-foreground/10 rounded animate-pulse w-64" />
          ) : tournament ? (
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">{getShortName(tournament.name)}</h1>
                <p className="text-xs text-primary-foreground/70">{tournament.name}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 px-4 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={`/live/${tournamentId}/${item.path}`}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap
                  ${active 
                    ? 'border-primary-foreground text-primary-foreground font-semibold' 
                    : 'border-transparent text-primary-foreground/60 hover:text-primary-foreground/90'
                  }
                `}
                data-testid={`link-nav-${item.path}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default LiveLayout;
