import React from 'react';
import { useParams } from 'react-router-dom';
import TrueTournamentBracket from '../../components/TrueTournamentBracket';
import '../../styles/tournament-bracket.css';

const LiveBracket: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <TrueTournamentBracket mode="live" tournamentId={tournamentId ? parseInt(tournamentId) : undefined} />
    </div>
  );
};

export default LiveBracket;
