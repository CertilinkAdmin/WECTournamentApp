import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gavel, Loader2, AlertCircle, CheckCircle2, Play, Lock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import JudgeScoringView from '@/components/JudgeScoringView';
import type { User, Tournament, TournamentParticipant, Match, JudgeDetailedScore } from '@shared/schema';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';

export default function LiveJudgesScoring() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournamentIdNum = tournamentId ? parseInt(tournamentId) : null;
  const queryClient = useQueryClient();
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(null);
  const [activatedMatchId, setActivatedMatchId] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [currentHeatPage, setCurrentHeatPage] = useState<number>(1);
  const heatsPerPage = 10;

  // Fetch tournament
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const tournament = useMemo(() => {
    return tournaments.find(t => t.id === tournamentIdNum) || tournaments[0];
  }, [tournaments, tournamentIdNum]);

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch participants for tournament (including judges)
  const { 
    data: participants = [], 
    isLoading: participantsLoading, 
    error: participantsError 
  } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentIdNum, 'participants'],
    queryFn: async () => {
      if (!tournamentIdNum) return [];
      const response = await fetch(`/api/tournaments/${tournamentIdNum}/participants?includeJudges=true`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch participants:', response.status, errorText);
        throw new Error(`Failed to fetch participants: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetched participants:', data.length, 'participants');
      }
      return data;
    },
    enabled: !!tournamentIdNum,
  });

  // Check if this is a test tournament
  const isTestTournament = useMemo(() => {
    if (!tournament) return false;
    const tournamentName = tournament.name.toLowerCase();
    return tournamentName.includes('test') || tournamentName.includes('demo');
  }, [tournament]);

  // Fetch all matches for tournament to get assigned judges
  const { data: allTournamentMatches = [] } = useQuery<Match[]>({
    queryKey: ['/api/tournaments', tournamentIdNum, 'matches'],
    queryFn: async () => {
      if (!tournamentIdNum) return [];
      const response = await fetch(`/api/tournaments/${tournamentIdNum}/matches`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!tournamentIdNum,
  });

  // Fetch judges for all matches to get all assigned judges
  const { data: allMatchJudges = {} } = useQuery<Record<number, Array<{ judgeId: number; role: 'ESPRESSO' | 'CAPPUCCINO' }>>>({
    queryKey: ['/api/tournaments', tournamentIdNum, 'matches', 'judges', allTournamentMatches.map(m => m.id).join(',')],
    queryFn: async () => {
      if (!tournamentIdNum || allTournamentMatches.length === 0) return {};
      const judgesPromises = allTournamentMatches.map(async (match) => {
        try {
          const response = await fetch(`/api/matches/${match.id}/judges`);
          if (!response.ok) return { matchId: match.id, judges: [] };
          const judges = await response.json();
          return { matchId: match.id, judges };
        } catch (error) {
          return { matchId: match.id, judges: [] };
        }
      });
      const results = await Promise.all(judgesPromises);
      const judgesMap: Record<number, Array<{ judgeId: number; role: 'ESPRESSO' | 'CAPPUCCINO' }>> = {};
      results.forEach(({ matchId, judges }) => {
        judgesMap[matchId] = judges.map((j: any) => ({ judgeId: j.judgeId, role: j.role }));
      });
      return judgesMap;
    },
    enabled: !!tournamentIdNum && allTournamentMatches.length > 0,
  });

  // Get all judges assigned to heats in this tournament (not just tournament participants)
  // This ensures we show all judges who are actually assigned to score heats
  const approvedJudges = useMemo(() => {
    if (!allUsers.length || !allMatchJudges || Object.keys(allMatchJudges).length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No users or match judges:', { usersCount: allUsers.length, matchJudgesCount: Object.keys(allMatchJudges || {}).length });
      }
      return [];
    }

    // Get all unique judge IDs from assigned heats
    const assignedJudgeIds = new Set<number>();
    Object.values(allMatchJudges).forEach(judges => {
      judges.forEach(j => assignedJudgeIds.add(j.judgeId));
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Processing judges from assigned heats:', {
        uniqueJudgeIds: assignedJudgeIds.size,
        totalUsers: allUsers.length,
        isTestTournament,
      });
    }

    // Get all users who are judges and assigned to at least one heat
    const judges = Array.from(assignedJudgeIds)
      .map(judgeId => {
        const user = allUsers.find(u => u.id === judgeId && u.role === 'JUDGE');
        if (user) {
          // Find participant record if exists (for seed info)
          const participant = participants.find(p => p.userId === judgeId);
          return { 
            id: participant?.id || 0,
            userId: user.id,
            seed: participant?.seed || 0,
            user 
          };
        }
        return null;
      })
      .filter((j): j is { id: number; userId: number; seed: number; user: User } => j !== null);

    if (process.env.NODE_ENV === 'development') {
      console.log('Found judges from assigned heats:', judges.length);
    }

    // If this is NOT a test tournament, filter out test judges
    if (!isTestTournament) {
      const filtered = judges.filter(j => {
        const email = j.user.email.toLowerCase();
        const name = j.user.name.toLowerCase();
        // Filter out test judges (emails containing @test.com or test-judge pattern)
        const isTestJudge = email.includes('@test.com') || 
                           email.includes('test-judge') ||
                           name.includes('test judge');
        return !isTestJudge;
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('Filtered judges (non-test tournament):', filtered.length);
      }
      return filtered;
    }

    // If this IS a test tournament, return all judges (including test judges)
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning all judges (test tournament):', judges.length);
    }
    return judges;
  }, [allUsers, allMatchJudges, participants, isTestTournament]);

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

  // Fetch segments for activated match to check pause status
  const { data: activatedMatchSegments = [] } = useQuery<Array<{ segment: string; status: string }>>({
    queryKey: [`/api/matches/${activatedMatchId}/segments`],
    queryFn: async () => {
      if (!activatedMatchId) return [];
      const response = await fetch(`/api/matches/${activatedMatchId}/segments`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!activatedMatchId,
    refetchInterval: 5000, // Poll every 5 seconds to detect segment status changes
  });

  // Check if we're in a pause period (Cappuccino segment ended, Espresso not started)
  const isPausePeriod = useMemo(() => {
    if (!activatedMatchSegments.length) return false;
    const cappuccinoSegment = activatedMatchSegments.find(s => s.segment === 'CAPPUCCINO');
    const espressoSegment = activatedMatchSegments.find(s => s.segment === 'ESPRESSO');
    // Pause period: Cappuccino ended, Espresso not started
    return cappuccinoSegment?.status === 'ENDED' && espressoSegment?.status !== 'RUNNING' && espressoSegment?.status !== 'ENDED';
  }, [activatedMatchSegments]);

  // Filter assigned matches to current tournament
  const filteredAssignedMatches = useMemo(() => {
    if (!tournamentIdNum) return assignedMatches;
    return assignedMatches.filter(m => (m as any).tournamentId === tournamentIdNum);
  }, [assignedMatches, tournamentIdNum]);

  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped: Record<number, (Match & { judgeRole: 'ESPRESSO' | 'CAPPUCCINO' })[]> = {};
    filteredAssignedMatches.forEach(match => {
      if (!grouped[match.round]) {
        grouped[match.round] = [];
      }
      grouped[match.round].push(match);
    });
    // Sort heats within each round
    Object.keys(grouped).forEach(round => {
      grouped[parseInt(round)].sort((a, b) => a.heatNumber - b.heatNumber);
    });
    return grouped;
  }, [filteredAssignedMatches]);

  // Get available rounds
  const availableRounds = useMemo(() => {
    return Object.keys(matchesByRound)
      .map(r => parseInt(r))
      .sort((a, b) => a - b);
  }, [matchesByRound]);

  // Auto-select first round when matches are available
  React.useEffect(() => {
    if (availableRounds.length > 0 && !selectedRound) {
      setSelectedRound(availableRounds[0]);
      setCurrentHeatPage(1);
    }
  }, [availableRounds, selectedRound]);

  // Reset heat page when round changes
  React.useEffect(() => {
    setCurrentHeatPage(1);
  }, [selectedRound]);

  // Get matches for selected round
  const roundMatches = useMemo(() => {
    if (!selectedRound) return [];
    return matchesByRound[selectedRound] || [];
  }, [selectedRound, matchesByRound]);

  // Paginate heats within selected round
  const totalHeatPages = Math.ceil(roundMatches.length / heatsPerPage);
  const startHeatIndex = (currentHeatPage - 1) * heatsPerPage;
  const endHeatIndex = startHeatIndex + heatsPerPage;
  const paginatedHeats = roundMatches.slice(startHeatIndex, endHeatIndex);

  // Get activated match
  const activatedMatch = useMemo(() => {
    if (!activatedMatchId) return null;
    const match = allTournamentMatches.find(m => m.id === activatedMatchId);
    if (!match) return null;
    // Get judge role from assigned matches if available, otherwise from allMatchJudges
    const assignedMatch = assignedMatches.find(m => m.id === activatedMatchId);
    if (assignedMatch) {
      return { ...match, judgeRole: assignedMatch.judgeRole };
    }
    // Try to get from allMatchJudges
    const matchJudges = allMatchJudges[activatedMatchId] || [];
    const judgeAssignment = matchJudges.find(j => j.judgeId === selectedJudgeId);
    if (judgeAssignment) {
      return { ...match, judgeRole: judgeAssignment.role };
    }
    return match;
  }, [activatedMatchId, allTournamentMatches, assignedMatches, allMatchJudges, selectedJudgeId]);

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
    setSelectedRound(null);
    setCurrentHeatPage(1);
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
    <div className="min-h-screen bg-[var(--espresso-foam)] dark:bg-background p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
        <CardHeader className="pb-3 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
            <Gavel className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
            <span>Judges Scoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
          <p className="text-xs sm:text-sm lg:text-base text-foreground/70 dark:text-muted-foreground">
            Select a judge to view their assigned heats. Activate a heat to begin scoring.
          </p>
        </CardContent>
      </Card>

      {/* Judge Selection */}
      <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
        <CardHeader className="pb-3 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Select Judge</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Loading State */}
          {(usersLoading || participantsLoading) && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
              <span>Loading judges...</span>
            </div>
          )}

          {/* Error State */}
          {(usersError || participantsError) && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <AlertTitle className="text-sm sm:text-base">Error Loading Judges</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                {usersError?.message || participantsError?.message || 'Failed to load judges. Please refresh the page.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Judge Selector */}
          {!usersLoading && !participantsLoading && !usersError && !participantsError && (
            <Select
              value={selectedJudgeId?.toString() || ''}
              onValueChange={(value) => {
                setSelectedJudgeId(value ? parseInt(value) : null);
              }}
            >
              <SelectTrigger className="w-full sm:max-w-md min-h-[2.75rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] touch-manipulation">
                <SelectValue placeholder="Choose an approved judge..." />
              </SelectTrigger>
              <SelectContent>
                {approvedJudges.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">
                    {participants.length === 0 
                      ? 'No participants found for this tournament'
                      : allUsers.length === 0
                      ? 'No users loaded'
                      : 'No approved judges found. Judges must have seed > 0 and role = JUDGE.'}
                  </div>
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
          )}

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && approvedJudges.length === 0 && !usersLoading && !participantsLoading && (
            <div className="text-[10px] sm:text-xs text-foreground/70 dark:text-muted-foreground space-y-1 p-3 bg-[var(--brand-light-sand)]/40 dark:bg-muted/30 rounded-md border border-[var(--brand-light-sand)]/50 dark:border-border">
              <p className="font-semibold">Debug Info:</p>
              <p>Participants: {participants.length}</p>
              <p>Users: {allUsers.length}</p>
              <p>Users with JUDGE role: {allUsers.filter(u => u.role === 'JUDGE').length}</p>
              <p>Participants with seed &gt; 0: {participants.filter(p => p.seed && p.seed > 0).length}</p>
              <p>Is Test Tournament: {isTestTournament ? 'Yes' : 'No'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Judge's Assigned Heats */}
      {selectedJudge && (
        <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
          <CardHeader className="pb-3 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
            <CardTitle className="text-sm sm:text-base lg:text-lg">
              Assigned Heats for {selectedJudge.user.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
            {filteredAssignedMatches.length === 0 ? (
              <div className="text-center p-4 sm:p-6 text-foreground/70 dark:text-muted-foreground">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-xs sm:text-sm lg:text-base">
                  {selectedJudge.user.name} has no assigned heats for this tournament yet.
                </p>
              </div>
            ) : (
              <>
                {/* Round Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-[var(--brand-light-sand)]/50 dark:border-border">
                  <label className="text-xs sm:text-sm font-medium text-foreground sm:min-w-[80px]">
                    Round:
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={selectedRound?.toString() || ''}
                      onValueChange={(value) => {
                        setSelectedRound(value ? parseInt(value) : null);
                        setCurrentHeatPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:max-w-[200px] min-h-[2.75rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] touch-manipulation">
                        <SelectValue placeholder="Select round..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRounds.map((round) => (
                          <SelectItem key={round} value={round.toString()}>
                            Round {round} ({matchesByRound[round]?.length || 0} heats)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableRounds.length > 1 && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentIndex = availableRounds.indexOf(selectedRound || 0);
                            if (currentIndex > 0) {
                              setSelectedRound(availableRounds[currentIndex - 1]);
                              setCurrentHeatPage(1);
                            }
                          }}
                          disabled={!selectedRound || availableRounds.indexOf(selectedRound || 0) === 0}
                          className="min-h-[2.75rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] px-3 touch-manipulation"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentIndex = availableRounds.indexOf(selectedRound || 0);
                            if (currentIndex < availableRounds.length - 1) {
                              setSelectedRound(availableRounds[currentIndex + 1]);
                              setCurrentHeatPage(1);
                            }
                          }}
                          disabled={!selectedRound || availableRounds.indexOf(selectedRound || 0) === availableRounds.length - 1}
                          className="min-h-[2.75rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] px-3 touch-manipulation"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Heats List */}
                {selectedRound && (
                  <>
                    <div className="space-y-2 sm:space-y-3">
                      {paginatedHeats.length === 0 ? (
                        <div className="text-center p-4 sm:p-6 text-foreground/70 dark:text-muted-foreground">
                          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                          <p className="text-xs sm:text-sm lg:text-base">
                            No heats found for Round {selectedRound}.
                          </p>
                        </div>
                      ) : (
                        paginatedHeats.map((match) => {
                          const isActivated = activatedMatchId === match.id;

                          return (
                            <div
                              key={match.id}
                              className={`p-3 sm:p-4 rounded-lg border-2 transition-colors touch-manipulation ${
                                isActivated
                                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                  : 'border-[var(--brand-light-sand)]/50 dark:border-border bg-[var(--brand-light-sand)]/60 dark:bg-card hover:bg-[var(--brand-light-sand)]/80 dark:hover:bg-muted/50'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                                      Round {match.round}, Heat {match.heatNumber}
                                    </Badge>
                                    <Badge variant={match.judgeRole === 'ESPRESSO' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                                      {match.judgeRole}
                                    </Badge>
                                  </div>
                                  <div className="text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">
                                    Status: <span className="font-medium text-foreground dark:text-foreground">{match.status}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                          {!isActivated && (
                            <Button
                              onClick={() => {
                                setActivatedMatchId(match.id);
                              }}
                              variant="default"
                              size="sm"
                              className="min-h-[2.5rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] touch-manipulation text-xs sm:text-sm"
                            >
                              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                              <span className="whitespace-nowrap">Activate Scorecard</span>
                            </Button>
                          )}
                                  {isActivated && (
                                    <Button
                                      onClick={() => setActivatedMatchId(null)}
                                      variant="outline"
                                      size="sm"
                                      className="min-h-[2.5rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] touch-manipulation text-xs sm:text-sm"
                                    >
                                      <span className="whitespace-nowrap">Close Scorecard</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Heat Pagination */}
                    {totalHeatPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-[var(--brand-light-sand)]/50 dark:border-border">
                        <div className="text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">
                          Showing {startHeatIndex + 1}-{Math.min(endHeatIndex, roundMatches.length)} of {roundMatches.length} heats
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentHeatPage(prev => Math.max(1, prev - 1))}
                            disabled={currentHeatPage === 1}
                            className="min-h-[2.5rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] touch-manipulation text-xs sm:text-sm"
                          >
                            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                            <span className="whitespace-nowrap">Previous</span>
                          </Button>
                          <div className="text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground px-2">
                            Page {currentHeatPage} of {totalHeatPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentHeatPage(prev => Math.min(totalHeatPages, prev + 1))}
                            disabled={currentHeatPage === totalHeatPages}
                            className="min-h-[2.5rem] sm:min-h-[2.5rem] lg:min-h-[2.5rem] touch-manipulation text-xs sm:text-sm"
                          >
                            <span className="whitespace-nowrap">Next</span>
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activated Scorecard - Drawer */}
      <Drawer open={!!(selectedJudge && activatedMatch)} onOpenChange={(open) => {
        if (!open) {
          setActivatedMatchId(null);
        }
      }}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="border-b bg-[var(--brand-light-sand)]/80 dark:bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Gavel className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <DrawerTitle className="text-sm sm:text-base lg:text-lg">
                  Scorecard - Round {activatedMatch?.round}, Heat {activatedMatch?.heatNumber}
                </DrawerTitle>
                {activatedMatchScored && (
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-[10px] sm:text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
                    Completed
                  </Badge>
                )}
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Close</span>
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
            {/* Pause Period Warning */}
            {isPausePeriod && activatedMatch && (
              <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 animate-pulse">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <AlertTitle className="text-amber-900 dark:text-amber-200 font-semibold text-xs sm:text-sm lg:text-base">Judging Pause Period</AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm lg:text-base">
                  The Cappuccino segment has ended. Please submit your scores for Visual Latte Art and Cappuccino sensory before the Espresso segment begins.
                </AlertDescription>
              </Alert>
            )}
            {selectedJudgeId && activatedMatch?.id && (
              <JudgeScoringView
                key={`${selectedJudgeId}-${activatedMatch.id}`}
                judgeId={selectedJudgeId}
                matchId={activatedMatch.id}
                judgeRole={(activatedMatch as any).judgeRole || (allMatchJudges[activatedMatch.id]?.find(j => j.judgeId === selectedJudgeId)?.role || undefined)}
                isReadOnly={activatedMatchScored}
                onScoreSubmitted={() => {
                  // Refresh scores after submission
                  queryClient.invalidateQueries({ queryKey: [`/api/matches/${activatedMatch.id}/detailed-scores`] });
                }}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Instructions */}
      {!selectedJudge && (
        <Card className="bg-[var(--brand-light-sand)]/60 dark:bg-muted/50 border border-[var(--brand-light-sand)]/50 dark:border-border">
          <CardContent className="p-4 sm:p-6 bg-[var(--brand-light-sand)]/60 dark:bg-transparent">
            <div className="space-y-2 text-xs sm:text-sm lg:text-base text-foreground/70 dark:text-muted-foreground">
              <p className="font-semibold text-foreground dark:text-foreground">Instructions:</p>
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
