import React, { useMemo } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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

  // Hide header on baristas and judges carousel pages only (not detail pages)
  const shouldHideHeader = useMemo(() => {
    const path = location.pathname;
    // Match paths that end with /baristas or /judges (carousel pages)
    // But not /baristas/:name or /judges/:name (detail pages)
    return path.endsWith('/baristas') || path.endsWith('/judges');
  }, [location.pathname]);

  const getShortName = (name: string | undefined): string => {
    if (!name) return '';
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  return (
    <div className="min-h-screen bg-background">
      {!shouldHideHeader && <AppHeader />}

      {/* Content */}
      <main className="flex-1 pb-20 md:pb-6 lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ResultsLayout;
