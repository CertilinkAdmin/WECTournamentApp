import React, { useEffect, useState } from 'react';
import './WEC2025Results.css';

interface Tournament {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  totalRounds: number;
  currentRound: number;
}

interface Participant {
  id: number;
  seed: number;
  finalRank: number | null;
  userId: number;
  name: string;
  email: string;
}

interface Match {
  id: number;
  round: number;
  heatNumber: number;
  status: string;
  startTime: string;
  endTime: string;
  competitor1Id: number;
  competitor2Id: number;
  winnerId: number;
  competitor1Name: string;
  competitor2Name: string;
}

interface Score {
  matchId: number;
  judgeId: number;
  competitorId: number;
  segment: string;
  score: number;
  judgeName: string;
}

interface TournamentData {
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
  scores: Score[];
}

const WEC2025Results: React.FC = () => {
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHeat, setSelectedHeat] = useState<Match | null>(null);

  useEffect(() => {
    fetchTournamentData();
  }, []);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      // For now, use mock data since the API has issues
      const mockData: TournamentData = {
        tournament: {
          id: 4,
          name: "World Espresso Championships 2025 Milano",
          status: "COMPLETED",
          startDate: "2025-01-15T08:00:00.000Z",
          endDate: "2025-01-17T18:00:00.000Z",
          totalRounds: 5,
          currentRound: 5
        },
        participants: [
          { id: 1, seed: 1, finalRank: 1, userId: 1, name: "Aga", email: "aga@wec2025.com" },
          { id: 2, seed: 2, finalRank: 2, userId: 2, name: "Jae", email: "jae@wec2025.com" },
          { id: 3, seed: 3, finalRank: 3, userId: 3, name: "Stevo", email: "stevo@wec2025.com" }
        ],
        matches: [
          {
            id: 1,
            round: 2,
            heatNumber: 12,
            status: "DONE",
            startTime: "2025-01-15T10:00:00.000Z",
            endTime: "2025-01-15T10:15:00.000Z",
            competitor1Id: 1,
            competitor2Id: 2,
            winnerId: 1,
            competitor1Name: "Stevo",
            competitor2Name: "Edwin"
          },
          {
            id: 2,
            round: 5,
            heatNumber: 31,
            status: "DONE",
            startTime: "2025-01-17T16:00:00.000Z",
            endTime: "2025-01-17T16:15:00.000Z",
            competitor1Id: 1,
            competitor2Id: 2,
            winnerId: 1,
            competitor1Name: "Aga",
            competitor2Name: "Jae"
          }
        ],
        scores: [
          { matchId: 1, judgeId: 1, competitorId: 1, segment: "DIAL_IN", score: 28, judgeName: "Jasper" },
          { matchId: 1, judgeId: 2, competitorId: 2, segment: "DIAL_IN", score: 5, judgeName: "Korn" },
          { matchId: 2, judgeId: 1, competitorId: 1, segment: "DIAL_IN", score: 19, judgeName: "Shinsaku" },
          { matchId: 2, judgeId: 2, competitorId: 2, segment: "DIAL_IN", score: 14, judgeName: "Korn" }
        ]
      };
      setTournamentData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getHeatScores = (matchId: number) => {
    if (!tournamentData?.scores) return [];
    return tournamentData.scores.filter(score => score.matchId === matchId);
  };

  const getCompetitorScores = (matchId: number, competitorId: number) => {
    const scores = getHeatScores(matchId);
    return scores.filter(score => score.competitorId === competitorId);
  };

  const getTotalScore = (matchId: number, competitorId: number) => {
    const scores = getCompetitorScores(matchId, competitorId);
    return scores.reduce((total, score) => total + score.score, 0);
  };

  const getJudgesForHeat = (matchId: number) => {
    const scores = getHeatScores(matchId);
    const judgeIds = [...new Set(scores.map(score => score.judgeId))];
    return judgeIds.map(judgeId => {
      const judgeScore = scores.find(s => s.judgeId === judgeId);
      return judgeScore?.judgeName || 'Unknown Judge';
    });
  };

  if (loading) {
    return (
      <div className="results-loading">
        <div className="loading-spinner"></div>
        <p>Loading WEC 2025 Milano Results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-error">
        <h2>Error Loading Results</h2>
        <p>{error}</p>
        <button onClick={fetchTournamentData}>Retry</button>
      </div>
    );
  }

  if (!tournamentData) {
    return (
      <div className="results-error">
        <h2>No Tournament Data Found</h2>
        <p>Unable to load tournament results.</p>
      </div>
    );
  }

  return (
    <div className="wec2025-results">
      <header className="results-header">
        <h1>🏆 {tournamentData?.tournament?.name || 'WEC 2025 Milano'}</h1>
        <div className="tournament-info">
          <span className="status-badge completed">COMPLETED</span>
          <span className="date-range">
            {tournamentData?.tournament?.startDate ? new Date(tournamentData.tournament.startDate).toLocaleDateString() : ''} - 
            {tournamentData?.tournament?.endDate ? new Date(tournamentData.tournament.endDate).toLocaleDateString() : ''}
          </span>
        </div>
      </header>

      <div className="results-content">
        {/* Champion Section */}
        <section className="champion-section">
          <h2>🥇 Champion</h2>
          <div className="champion-card">
            {tournamentData?.participants
              ?.filter(p => p.finalRank === 1)
              ?.map(champion => (
                <div key={champion.id} className="champion-info">
                  <div className="champion-name">{champion.name}</div>
                  <div className="champion-seed">Seed #{champion.seed}</div>
                </div>
              ))}
          </div>
        </section>

        {/* Heats Section */}
        <section className="heats-section">
          <h2>⚔️ Tournament Heats</h2>
          <div className="heats-grid">
            {tournamentData?.matches && tournamentData.matches.length > 0 ? (
              tournamentData.matches
                .sort((a, b) => a.round - b.round || a.heatNumber - b.heatNumber)
                .map(match => (
                  <div key={match.id} className="heat-card" onClick={() => setSelectedHeat(match)}>
                    <div className="heat-header">
                      <span className="heat-number">Heat {match.heatNumber}</span>
                      <span className="round-badge">Round {match.round}</span>
                    </div>
                    
                    <div className="competitors">
                      <div className={`competitor ${match.winnerId === match.competitor1Id ? 'winner' : ''}`}>
                        <span className="name">{match.competitor1Name}</span>
                        <span className="score">{getTotalScore(match.id, match.competitor1Id)}</span>
                      </div>
                      <div className="vs">vs</div>
                      <div className={`competitor ${match.winnerId === match.competitor2Id ? 'winner' : ''}`}>
                        <span className="name">{match.competitor2Name}</span>
                        <span className="score">{getTotalScore(match.id, match.competitor2Id)}</span>
                      </div>
                    </div>

                    <div className="heat-status">
                      <span className={`status ${match.status.toLowerCase()}`}>{match.status}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="no-matches">No tournament matches found.</div>
            )}
          </div>
        </section>

        {/* Heat Details Modal */}
        {selectedHeat && (
          <div className="heat-modal-overlay" onClick={() => setSelectedHeat(null)}>
            <div className="heat-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Heat {selectedHeat.heatNumber} - Round {selectedHeat.round}</h3>
                <button className="close-button" onClick={() => setSelectedHeat(null)}>×</button>
              </div>
              
              <div className="modal-content">
                <div className="heat-details">
                  <div className="competitor-details">
                    <div className="competitor">
                      <h4>{selectedHeat.competitor1Name}</h4>
                      <div className="total-score">Total: {getTotalScore(selectedHeat.id, selectedHeat.competitor1Id)}</div>
                      <div className="judge-scores">
                        {getCompetitorScores(selectedHeat.id, selectedHeat.competitor1Id).map((score, index) => (
                          <div key={index} className="judge-score">
                            <span className="judge-name">{score.judgeName}</span>
                            <span className="score-value">{score.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="vs-divider">VS</div>
                    
                    <div className="competitor">
                      <h4>{selectedHeat.competitor2Name}</h4>
                      <div className="total-score">Total: {getTotalScore(selectedHeat.id, selectedHeat.competitor2Id)}</div>
                      <div className="judge-scores">
                        {getCompetitorScores(selectedHeat.id, selectedHeat.competitor2Id).map((score, index) => (
                          <div key={index} className="judge-score">
                            <span className="judge-name">{score.judgeName}</span>
                            <span className="score-value">{score.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="judges-list">
                    <h4>Judges</h4>
                    <div className="judges">
                      {getJudgesForHeat(selectedHeat.id).map((judge, index) => (
                        <span key={index} className="judge-badge">{judge}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WEC2025Results;
