import React, { useMemo } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppHeader from '../../components/AppHeader';
import { findTournamentBySlug } from '@/utils/tournamentUtils';
import './ResultsLayout.css';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
}

const ResultsLayout: React.FC = () => {
  const { tournamentSlug } = useParams<{ tournamentSlug: string }>();

  // Fetch all tournaments to find by slug
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const tournament = useMemo(() => {
    if (!tournamentSlug) return null;
    return findTournamentBySlug(tournaments, tournamentSlug);
  }, [tournaments, tournamentSlug]);

  const { data: tournamentData, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournament?.id}`],
    enabled: !!tournament?.id,
  });

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
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default ResultsLayout;
