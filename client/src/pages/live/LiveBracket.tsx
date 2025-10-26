import React from 'react';
import TrueTournamentBracket from '../../components/TrueTournamentBracket';
import '../../styles/tournament-bracket.css';

const LiveBracket: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <TrueTournamentBracket mode="live" />
    </div>
  );
};

export default LiveBracket;
