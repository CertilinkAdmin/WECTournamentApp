import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Coffee, Zap } from 'lucide-react';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from './WEC25BracketData';

interface BracketMatch {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner: string;
  score1: number;
  score2: number;
  leftCupCode: string;
  rightCupCode: string;
}

interface BracketRound {
  title: string;
  matches: BracketMatch[];
}

const TrueTournamentBracket: React.FC = () => {
  const [animatedMatches, setAnimatedMatches] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Organize data into rounds
  const rounds: BracketRound[] = [
    {
      title: "Round 1",
      matches: WEC25_BRACKET_POSITIONS
    },
    {
      title: "Round 2", 
      matches: WEC25_ROUND2_POSITIONS
    },
    {
      title: "Round 3",
      matches: WEC25_ROUND3_POSITIONS
    },
    {
      title: "Semi-Finals",
      matches: WEC25_ROUND4_POSITIONS
    },
    {
      title: "Final",
      matches: [WEC25_FINAL_POSITION]
    }
  ];

  // Animate matches on load
  useEffect(() => {
    setIsLoaded(true);
    const allMatches = rounds.flatMap(round => round.matches);
    
    allMatches.forEach((match, index) => {
      setTimeout(() => {
        setAnimatedMatches(prev => new Set([...prev, match.heatNumber]));
      }, index * 200);
    });
  }, []);

  const getMedalIcon = (roundTitle: string, isWinner: boolean) => {
    if (!isWinner) return null;
    
    if (roundTitle === "Final") {
      return <Trophy className="h-5 w-5 text-yellow-500 ml-2 animate-bounce" />;
    } else if (roundTitle === "Semi-Finals") {
      return <Medal className="h-4 w-4 text-gray-400 ml-2" />;
    }
    return null;
  };

  const getSpecialIcon = (roundTitle: string) => {
    switch (roundTitle) {
      case "Round 1": return <Coffee className="h-5 w-5 text-amber-600" />;
      case "Round 2": return <Zap className="h-5 w-5 text-blue-600" />;
      case "Round 3": return <Star className="h-5 w-5 text-purple-600" />;
      case "Semi-Finals": return <Award className="h-5 w-5 text-orange-600" />;
      case "Final": return <Trophy className="h-6 w-6 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="tournament-bracket-container">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent animate-pulse" 
            style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '2px' }}>
          WEC 2025 MILANO
        </h1>
        <h2 className="text-xl font-semibold mb-4 text-amber-100" 
            style={{ fontFamily: 'Exo 2, sans-serif', letterSpacing: '1px' }}>
          TOURNAMENT BRACKET
        </h2>
        <div className="flex items-center justify-center gap-6 text-sm text-amber-200">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 rounded-lg border border-amber-600/30">
            <Coffee className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-xs">31 HEATS</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 rounded-lg border border-yellow-400/30">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold text-xs">CHAMPION: AGA MUHAMMED</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 rounded-lg border border-amber-500/30">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-xs">MILAN, ITALY</span>
          </div>
        </div>
      </div>
      
      <div className="tournament-bracket tournament-bracket--rounded">
        {rounds.map((round, roundIndex) => (
          <div key={round.title} className="tournament-bracket__round">
            <h3 className="tournament-bracket__round-title flex items-center justify-center gap-2">
              {getSpecialIcon(round.title)}
              {round.title}
            </h3>
            <ul className="tournament-bracket__list">
              {round.matches.map((match, matchIndex) => (
                <li 
                  key={`${round.title}-${match.heatNumber}`} 
                  className={`tournament-bracket__item ${animatedMatches.has(match.heatNumber) ? 'animate-fade-in' : 'opacity-0'}`}
                  style={{ transitionDelay: `${matchIndex * 100}ms` }}
                >
                  <div className={`tournament-bracket__match ${round.title === 'Final' ? 'championship-match' : ''}`} tabIndex={0}>
                    <table className="tournament-bracket__table">
                      <caption className="tournament-bracket__caption">
                        <span className="flex items-center justify-center gap-2">
                          {round.title === 'Final' && <Trophy className="h-4 w-4 text-yellow-500 animate-bounce" />}
                          Heat {match.heatNumber} - Station {match.station}
                          {round.title === 'Final' && <Trophy className="h-4 w-4 text-yellow-500 animate-bounce" />}
                        </span>
                      </caption>
                      <thead className="sr-only">
                        <tr>
                          <th>Competitor</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody className="tournament-bracket__content">
                        <tr className={`tournament-bracket__team ${match.winner === match.competitor1 ? 'tournament-bracket__team--winner' : ''}`}>
                          <td className="tournament-bracket__country">
                            <span className="tournament-bracket__code" title={match.competitor1}>
                              {match.competitor1}
                            </span>
                            <span className="tournament-bracket__flag" aria-label="Cup Code">
                              {match.leftCupCode}
                            </span>
                          </td>
                          <td className="tournament-bracket__score">
                            <span className="tournament-bracket__number">{match.score1}</span>
                            {getMedalIcon(round.title, match.winner === match.competitor1)}
                          </td>
                        </tr>
                        <tr className={`tournament-bracket__team ${match.winner === match.competitor2 ? 'tournament-bracket__team--winner' : ''}`}>
                          <td className="tournament-bracket__country">
                            <span className="tournament-bracket__code" title={match.competitor2}>
                              {match.competitor2}
                            </span>
                            <span className="tournament-bracket__flag" aria-label="Cup Code">
                              {match.rightCupCode}
                            </span>
                          </td>
                          <td className="tournament-bracket__score">
                            <span className="tournament-bracket__number">{match.score2}</span>
                            {getMedalIcon(round.title, match.winner === match.competitor2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrueTournamentBracket;
