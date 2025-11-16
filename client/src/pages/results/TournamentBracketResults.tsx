import React from 'react';
import TrueTournamentBracket from '../../components/TrueTournamentBracket';
import '../../styles/tournament-bracket.css';

const TournamentBracketResults: React.FC = () => {
  return (
    <div className="min-h-screen tournament-bracket-bg">
      <TrueTournamentBracket mode="results" />
    </div>
  );
};

export default TournamentBracketResults;
