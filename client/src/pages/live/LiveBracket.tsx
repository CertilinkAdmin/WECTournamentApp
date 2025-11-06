import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TrueTournamentBracket from '../../components/TrueTournamentBracket';
import '../../styles/tournament-bracket.css';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

const LiveBracket: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  
  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tournament bracket...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Tournament not found</p>
        </div>
      </div>
    );
  }

  // Only show bracket for ACTIVE or COMPLETED tournaments
  if (tournament.status !== 'ACTIVE' && tournament.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Tournament Not Started</p>
          <p className="text-muted-foreground">This tournament is currently in setup and has no bracket data yet.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <TrueTournamentBracket 
        mode="live" 
        tournamentId={tournamentId ? parseInt(tournamentId) : undefined} 
      />
    </div>
  );
};

export default LiveBracket;
