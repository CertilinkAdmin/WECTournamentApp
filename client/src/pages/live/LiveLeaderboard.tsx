import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

interface Participant {
  id: number;
  userId: number;
  name: string;
  seed: number | null;
  finalRank: number | null;
}

interface Score {
  matchId: number;
  judgeId: number;
  competitorId: number;
  score: number;
}

interface LeaderboardEntry {
  participantId: number;
  userId: number;
  name: string;
  seed: number | null;
  finalRank: number | null;
  totalScore: number;
}

const LiveLeaderboard: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();

  // Fetch full tournament data - API returns { tournament, participants, matches, scores }
  const { data: fullData, isLoading: dataLoading } = useQuery<{
    tournament: Tournament;
    participants: Participant[];
    matches: any[];
    scores: Score[];
  }>({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
    refetchInterval: 5000,
  });

  const tournament = fullData?.tournament;
  const participants = fullData?.participants || [];

  // Calculate leaderboard
  const leaderboard = useMemo(() => {
    if (!fullData || !fullData.scores || !fullData.participants) return [];

    const participantMap = new Map<number, Participant>();
    fullData.participants.forEach(p => {
      participantMap.set(p.userId, p);
    });

    const totals = new Map<number, number>();
    fullData.scores.forEach(score => {
      const current = totals.get(score.competitorId) || 0;
      totals.set(score.competitorId, current + score.score);
    });

    const entries: LeaderboardEntry[] = [];
    totals.forEach((totalScore, competitorId) => {
      const participant = Array.from(participantMap.values()).find(
        p => p.userId === competitorId
      );
      if (participant) {
        entries.push({
          participantId: participant.id,
          userId: participant.userId,
          name: participant.name,
          seed: participant.seed,
          finalRank: participant.finalRank,
          totalScore,
        });
      }
    });

    // Sort by score descending, then by seed ascending
    entries.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return (a.seed || 999) - (b.seed || 999);
    });

    return entries;
  }, [fullData]);

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Tournament not found</p>
        </div>
      </div>
    );
  }

  if (tournament.status !== 'ACTIVE' && tournament.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-semibold mb-2">Tournament Not Started</p>
          <p className="text-muted-foreground">
            The leaderboard will be available once the tournament is initiated and matches begin.
          </p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return (
        <Badge className={rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-amber-600'}>
          #{rank}
        </Badge>
      );
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6" />
                Live Leaderboard
              </CardTitle>
              <Badge variant="secondary">{leaderboard.length} competitors</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardContent className="p-0">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scores yet</p>
                <p className="text-sm mt-2">Scores will appear here as matches are completed</p>
              </div>
            ) : (
              <div className="divide-y">
                {leaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  
                  return (
                    <div
                      key={entry.participantId}
                      className={`flex items-center justify-between p-4 transition-colors ${
                        isTopThree ? 'bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 flex items-center justify-center">
                          {getRankIcon(rank) || (
                            <span className="text-lg font-bold text-muted-foreground w-8 text-right">
                              {rank}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-lg">{entry.name}</span>
                            {getRankBadge(rank)}
                            {entry.seed && (
                              <Badge variant="outline" className="text-xs">
                                Seed {entry.seed}
                              </Badge>
                            )}
                          </div>
                          {entry.finalRank && entry.finalRank !== rank && (
                            <div className="text-xs text-muted-foreground">
                              Final Rank: {entry.finalRank}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{entry.totalScore}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                        {rank <= 3 && (
                          <TrendingUp className="h-5 w-5 text-chart-3" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{leaderboard[0]?.totalScore || 0}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {leaderboard[0]?.name || 'N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(
                    leaderboard.reduce((sum, e) => sum + e.totalScore, 0) / leaderboard.length
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Across all competitors
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Competitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{leaderboard.length}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  In tournament
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveLeaderboard;

