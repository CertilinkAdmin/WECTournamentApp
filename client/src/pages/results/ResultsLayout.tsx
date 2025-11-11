import React from 'react';
import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Trophy, LayoutGrid, ListOrdered, Award, Users, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '../../components/ThemeToggle';
import './ResultsLayout.css';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
}

const ResultsLayout: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const location = useLocation();

  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  const navItems = [
    { path: '', label: 'Overview', icon: LayoutGrid },
    { path: 'bracket', label: 'Bracket', icon: Trophy },
    { path: 'baristas', label: 'Baristas', icon: Users },
    { path: 'judges', label: 'Judges', icon: Award },
    { path: 'scorecards', label: 'Scorecards', icon: FileText },
  ];

  const isActive = (path: string) => {
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    if (path === '') {
      return lastPart === tournamentId;
    }
    return lastPart === path;
  };

  const getShortName = (name: string | undefined): string => {
    if (!name) return '';
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <header className="bg-primary/80 backdrop-blur-sm text-primary-foreground border-b border-primary-border/50">
        <div className="px-4 py-4 flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-20"></div>
          
          {/* Center: WEC Logo */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 text-primary-foreground">
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold tracking-wider">WEC</div>
                <div className="text-xs opacity-80">CHAMPIONSHIPS</div>
              </div>
            </div>
          </div>
          
          {/* Right: Home + Theme Toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-md transition-colors"
              data-testid="link-home"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default ResultsLayout;
