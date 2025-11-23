import React from 'react';
import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, LayoutGrid, ListOrdered, Award, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
      <AppHeader />

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-6 lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default LiveLayout;
