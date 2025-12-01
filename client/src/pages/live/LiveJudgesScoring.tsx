import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gavel, Loader2, AlertCircle, CheckCircle2, Play, Lock } from 'lucide-react';
import JudgeScoringView from '@/components/JudgeScoringView';
import type { User, Tournament, TournamentParticipant, Match, JudgeDetailedScore } from '@shared/schema';

export default function LiveJudgesScoring() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournamentIdNum = tournamentId ? parseInt(tournamentId) : null;
  const queryClient = useQueryClient();
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(null);
  const [activatedMatchId, setActivatedMatchId] = useState<number | null>(null);

  // Fetch tournament
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const tournament = useMemo(() => {
    return tournaments.find(t => t.id === tournamentIdNum) || tournaments[0];
  }, [tournaments, tournamentIdNum]);

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch participants for tournament (including judges)
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentIdNum, 'participants'],
    queryFn: async () => {
      if (!tournamentIdNum) return [];
      const response = await fetch(`/api/tournaments/${tournamentIdNum}/participants?includeJudges=true`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!tournamentIdNum,
  });

  // Check if this is a test tournament
  const isTestTournament = useMemo(() => {
    if (!tournament) return false;
    const tournamentName = tournament.name.toLowerCase();
    return tournamentName.includes('test') || tournamentName.includes('demo');
  }, [tournament]);

  // Get approved judges (seed > 0 and role === 'JUDGE')
  // Filter out test judges if this is NOT a test tournament
  const approvedJudges = useMemo(() => {
    if (!participants.length) return [];

    const judges = participants
      .map(p => {
        const user = allUsers.find(u => u.id === p.userId && u.role === 'JUDGE');
        return user && p.seed && p.seed > 0 ? { ...p, user } : null;
      })
      .filter((j): j is TournamentParticipant & { user: User } => j !== null);

    // If this is NOT a test tournament, filter out test judges
    if (!isTestTournament) {
      return judges.filter(j => {
        const email = j.user.email.toLowerCase();
        // Filter out test judges (emails containing @test.com or test-judge pattern)
        return !email.includes('@test.com') && 
               !email.includes('test-judge') &&
               !j.user.name.toLowerCase().includes('test judge');
      });
    }

    // If this IS a test tournament, return all judges (including test judges)
    return judges;
  }, [participants, allUsers, isTestTournament]);

  // Get selected judge
  const selectedJudge = useMemo(() => {
    if (!selectedJudgeId) return null;
    return approvedJudges.find(j => j.user.id === selectedJudgeId);
  }, [selectedJudgeId, approvedJudges]);

  // Fetch assigned matches for selected judge
  const { data: assignedMatches = [] } = useQuery<(Match & { judgeRole: 'ESPRESSO' | 'CAPPUCCINO' })[]>({
    queryKey: [`/api/judges/${selectedJudgeId}/matches`],
    queryFn: async () => {
      if (!selectedJudgeId) return [];
      const response = await fetch(`/api/judges/${selectedJudgeId}/matches`);
      if (!response.ok) throw new Error('Failed to fetch assigned matches');
      return response.json();
    },
    enabled: !!selectedJudgeId,
  });

  // Filter matches to current tournament
  const tournamentMatches = useMemo(() => {
    if (!tournamentIdNum) return assignedMatches;
    return assignedMatches.filter(m => (m as any).tournamentId === tournamentIdNum);
  }, [assignedMatches, tournamentIdNum]);

  // Get activated match
  const activatedMatch = useMemo(() => {
    if (!activatedMatchId) return null;
    return tournamentMatches.find(m => m.id === activatedMatchId) || null;
  }, [activatedMatchId, tournamentMatches]);

  // Fetch scores for activated match to check completion status
  const { data: activatedMatchScores = [] } = useQuery<JudgeDetailedScore[]>({
    queryKey: [`/api/matches/${activatedMatchId}/detailed-scores`],
    queryFn: async () => {
      if (!activatedMatchId) return [];
      const response = await fetch(`/api/matches/${activatedMatchId}/detailed-scores`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!activatedMatchId,
  });

  // Check if activated match has been scored by this judge
  const activatedMatchScored = useMemo(() => {
    if (!activatedMatchId || !selectedJudge || !activatedMatchScores.length) return false;
    return activatedMatchScores.some(
      score => score.judgeName === selectedJudge.user.name
    );
  }, [activatedMatchId, selectedJudge, activatedMatchScores]);

  // Reset activated match when judge changes
  React.useEffect(() => {
    setActivatedMatchId(null);
  }, [selectedJudgeId]);

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading tournament...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Gavel className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span>Judges Scoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-muted-foreground">
            Select a judge to view their assigned heats. Activate a heat to begin scoring.
          </p>
        </CardContent>
      </Card>

      {/* Judge Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Select Judge</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Select
            value={selectedJudgeId?.toString() || ''}
            onValueChange={(value) => {
              setSelectedJudgeId(value ? parseInt(value) : null);
            }}
          >
            <SelectTrigger className="w-full sm:max-w-md min-h-[2.75rem] sm:min-h-[2.5rem]">
              <SelectValue placeholder="Choose an approved judge..." />
            </SelectTrigger>
            <SelectContent>
              {approvedJudges.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No approved judges for this tournament</div>
              ) : (
                approvedJudges.map((judge) => (
                  <SelectItem key={judge.id} value={judge.user.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{judge.user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {judge.user.email}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Judge's Assigned Heats */}
      {selectedJudge && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">
              Assigned Heats for {selectedJudge.user.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {tournamentMatches.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">
                  {selectedJudge.user.name} has no assigned heats for this tournament yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tournamentMatches.map((match) => {
                  const isActivated = activatedMatchId === match.id;

                  return (
                    <div
                      key={match.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isActivated
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              Round {match.round}, Heat {match.heatNumber}
                            </Badge>
                            <Badge variant={match.judgeRole === 'ESPRESSO' ? 'default' : 'secondary'}>
                              {match.judgeRole}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Status: <span className="font-medium">{match.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!isActivated && (
                            <Button
                              onClick={() => setActivatedMatchId(match.id)}
                              variant="default"
                              size="sm"
                              className="min-h-[2.5rem] sm:min-h-[2.5rem]"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Activate Scorecard
                            </Button>
                          )}
                          {isActivated && (
                            <Button
                              onClick={() => setActivatedMatchId(null)}
                              variant="outline"
                              size="sm"
                              className="min-h-[2.5rem] sm:min-h-[2.5rem]"
                            >
                              Close Scorecard
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activated Scorecard */}
      {selectedJudge && activatedMatch && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              <span>
                Scorecard - Round {activatedMatch.round}, Heat {activatedMatch.heatNumber}
              </span>
              {activatedMatchScored && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 sm:p-6">
              {selectedJudgeId && activatedMatch.id && (
                <JudgeScoringView
                  key={`${selectedJudgeId}-${activatedMatch.id}`}
                  judgeId={selectedJudgeId}
                  matchId={activatedMatch.id}
                  isReadOnly={activatedMatchScored}
                  onScoreSubmitted={() => {
                    // Refresh scores after submission
                    queryClient.invalidateQueries({ queryKey: [`/api/matches/${activatedMatch.id}/detailed-scores`] });
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!selectedJudge && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
              <p className="font-semibold text-foreground">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Select a judge from the dropdown above</li>
                <li>View their assigned heats for this tournament</li>
                <li>Click "Activate Scorecard" to begin scoring a heat</li>
                <li>Once scores are submitted, the scorecard becomes read-only</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
