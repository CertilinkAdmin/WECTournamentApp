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
  const [selectedHeatId, setSelectedHeatId] = useState<number | null>(null);

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

  // Get judges assigned to the selected heat (filtered by round and heat)
  const approvedJudges = useMemo(() => {
    if (!selectedHeatId || !allUsers.length || !allMatchJudges || Object.keys(allMatchJudges).length === 0) {
      return [];
    }

    // Get judges assigned to the selected heat
    const heatJudges = allMatchJudges[selectedHeatId] || [];
    
    if (heatJudges.length === 0) {
      return [];
    }

    // Get user info for each judge assigned to this heat
    const judges = heatJudges
      .map(judgeAssignment => {
        const user = allUsers.find(u => u.id === judgeAssignment.judgeId && u.role === 'JUDGE');
        if (user) {
          const participant = participants.find(p => p.userId === judgeAssignment.judgeId);
          return { 
            id: participant?.id || 0,
            userId: user.id,
            seed: participant?.seed || 0,
            user,
            role: judgeAssignment.role
          };
        }
        return null;
      })
      .filter((j): j is { id: number; userId: number; seed: number; user: User; role: 'ESPRESSO' | 'CAPPUCCINO' } => j !== null);

    // Filter out test judges if not a test tournament
    if (!isTestTournament) {
      return judges.filter(j => {
        const email = j.user.email.toLowerCase();
        const name = j.user.name.toLowerCase();
        const isTestJudge = email.includes('@test.com') || 
                           email.includes('test-judge') ||
                           name.includes('test judge');
        return !isTestJudge;
      });
    }

    return judges;
  }, [selectedHeatId, allUsers, allMatchJudges, participants, isTestTournament]);

  // Get selected judge
  const selectedJudge = useMemo(() => {
    if (!selectedJudgeId) return null;
    return approvedJudges.find(j => j.user.id === selectedJudgeId);
  }, [selectedJudgeId, approvedJudges]);


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

  // Get all matches for tournament (for round/heat selection)
  const tournamentMatches = useMemo(() => {
    if (!tournamentIdNum) return [];
    return allTournamentMatches.filter(m => (m as any).tournamentId === tournamentIdNum);
  }, [tournamentIdNum, allTournamentMatches]);

  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped: Record<number, Match[]> = {};
    tournamentMatches.forEach(match => {
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
  }, [tournamentMatches]);

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
    }
  }, [availableRounds, selectedRound]);

  // Get matches for selected round
  const roundMatches = useMemo(() => {
    if (!selectedRound) return [];
    return matchesByRound[selectedRound] || [];
  }, [selectedRound, matchesByRound]);

  // Fetch global lock status for all matches in the selected round to determine if all judges have submitted
  const { data: allMatchesLockStatus = {} } = useQuery<Record<number, {
    isLocked: boolean;
    allSegmentsEnded: boolean;
    allJudgesSubmitted: boolean;
  }>>({
    queryKey: ['/api/matches/global-lock-status', selectedRound],
    queryFn: async () => {
      if (!selectedRound || roundMatches.length === 0) return {};
      
      // Fetch lock status for all matches in the round
      const statusPromises = roundMatches.map(async (match) => {
        try {
          const response = await fetch(`/api/matches/${match.id}/global-lock-status`);
          if (!response.ok) return { matchId: match.id, status: null };
          const status = await response.json();
          return { matchId: match.id, status };
        } catch {
          return { matchId: match.id, status: null };
        }
      });
      
      const results = await Promise.all(statusPromises);
      const statusMap: Record<number, any> = {};
      results.forEach(({ matchId, status }) => {
        if (status) {
          statusMap[matchId] = status;
        }
      });
      return statusMap;
    },
    enabled: !!selectedRound && roundMatches.length > 0,
    refetchInterval: 5000, // Poll every 5 seconds to detect when all judges submit
  });

  // Reset selected heat when round changes
  React.useEffect(() => {
    setSelectedHeatId(null);
    setSelectedJudgeId(null);
    setActivatedMatchId(null);
  }, [selectedRound]);

  // Get activated match (use selectedHeatId if activatedMatchId is not set)
  const activatedMatch = useMemo(() => {
    const matchId = activatedMatchId || selectedHeatId;
    if (!matchId) return null;
    const match = allTournamentMatches.find(m => m.id === matchId);
    if (!match) return null;
    // Get judge role from allMatchJudges
    const matchJudges = allMatchJudges[matchId] || [];
    const judgeAssignment = matchJudges.find(j => j.judgeId === selectedJudgeId);
    if (judgeAssignment) {
      return { ...match, judgeRole: judgeAssignment.role };
    }
    // If no judge selected yet, get first judge's role for display
    if (matchJudges.length > 0) {
      return { ...match, judgeRole: matchJudges[0].role };
    }
    return match;
  }, [activatedMatchId, selectedHeatId, allTournamentMatches, allMatchJudges, selectedJudgeId]);

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

  // Fetch scores for selected heat to check judge completion status
  const { data: selectedHeatScores = [] } = useQuery<JudgeDetailedScore[]>({
    queryKey: [`/api/matches/${selectedHeatId}/detailed-scores`],
    queryFn: async () => {
      if (!selectedHeatId) return [];
      const response = await fetch(`/api/matches/${selectedHeatId}/detailed-scores`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedHeatId,
    refetchInterval: 5000, // Poll every 5 seconds to detect completion
  });

  // Check if each judge has completed their scorecard for the selected heat
  const judgeCompletionStatus = useMemo(() => {
    if (!selectedHeatId || !selectedHeatScores.length) return {};
    
    const status: Record<number, boolean> = {};
    const matchJudges = allMatchJudges[selectedHeatId] || [];
    
    matchJudges.forEach(({ judgeId, role }) => {
      const judge = approvedJudges.find(j => j.user.id === judgeId);
      if (!judge) return;
      
      const judgeScores = selectedHeatScores.filter(
        score => score.judgeName === judge.user.name
      );
      
      if (judgeScores.length === 0) {
        status[judgeId] = false;
        return;
      }
      
      // Check if latte art is submitted (required for all judges)
      const latteArtSubmitted = judgeScores.some(
        score => score.visualLatteArt === 'left' || score.visualLatteArt === 'right'
      );
      
      if (!latteArtSubmitted) {
        status[judgeId] = false;
        return;
      }
      
      // Check sensory scoring based on judge role
      if (role === 'CAPPUCCINO') {
        const cappuccinoSensoryComplete = judgeScores.some(score =>
          score.sensoryBeverage === 'Cappuccino' &&
          (score.taste === 'left' || score.taste === 'right') &&
          (score.tactile === 'left' || score.tactile === 'right') &&
          (score.flavour === 'left' || score.flavour === 'right') &&
          (score.overall === 'left' || score.overall === 'right')
        );
        status[judgeId] = cappuccinoSensoryComplete;
      } else if (role === 'ESPRESSO') {
        const espressoSensoryComplete = judgeScores.some(score =>
          score.sensoryBeverage === 'Espresso' &&
          (score.taste === 'left' || score.taste === 'right') &&
          (score.tactile === 'left' || score.tactile === 'right') &&
          (score.flavour === 'left' || score.flavour === 'right') &&
          (score.overall === 'left' || score.overall === 'right')
        );
        status[judgeId] = espressoSensoryComplete;
      } else {
        status[judgeId] = false;
      }
    });
    
    return status;
  }, [selectedHeatId, selectedHeatScores, allMatchJudges, approvedJudges]);

  // Fetch global lock status for activated match
  const { data: globalLockStatus } = useQuery<{
    isLocked: boolean;
    allSegmentsEnded: boolean;
    allJudgesSubmitted: boolean;
    missingSubmissions: Array<{
      judgeName: string;
      role: 'ESPRESSO' | 'CAPPUCCINO';
      missing: string[];
    }>;
  }>({
    queryKey: [`/api/matches/${activatedMatchId}/global-lock-status`],
    queryFn: async () => {
      if (!activatedMatchId) return null;
      const response = await fetch(`/api/matches/${activatedMatchId}/global-lock-status`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!activatedMatchId,
    refetchInterval: 5000, // Poll every 5 seconds to detect lock status changes
  });

  // Check if activated match has been fully scored by this judge
  // A judge is only "fully scored" when:
  // 1. Latte art is submitted (all judges must do this)
  // 2. Sensory scoring is complete (Cappuccino judge for Cappuccino sensory, Espresso judge for Espresso sensory)
  // OR if global lock is active (all segments ended AND all judges submitted)
  const activatedMatchScored = useMemo(() => {
    // If global lock is active, consider the match as scored (locked)
    if (globalLockStatus?.isLocked) {
      return true;
    }
    if (!activatedMatchId || !selectedJudge || !activatedMatchScores.length) return false;
    
    const judgeScores = activatedMatchScores.filter(
      score => score.judgeName === selectedJudge.user.name
    );
    
    if (judgeScores.length === 0) return false;
    
    // Check if latte art is submitted (required for all judges)
    const latteArtSubmitted = judgeScores.some(
      score => score.visualLatteArt === 'left' || score.visualLatteArt === 'right'
    );
    
    if (!latteArtSubmitted) return false;
    
    // Check sensory scoring based on judge role
    const judgeRole = selectedJudge.role;
    
    if (judgeRole === 'CAPPUCCINO') {
      // Cappuccino judge must complete Cappuccino sensory (all 4 categories)
      const cappuccinoSensoryComplete = judgeScores.some(score =>
        score.sensoryBeverage === 'Cappuccino' &&
        (score.taste === 'left' || score.taste === 'right') &&
        (score.tactile === 'left' || score.tactile === 'right') &&
        (score.flavour === 'left' || score.flavour === 'right') &&
        (score.overall === 'left' || score.overall === 'right')
      );
      return cappuccinoSensoryComplete;
    } else if (judgeRole === 'ESPRESSO') {
      // Espresso judge must complete Espresso sensory (all 4 categories)
      const espressoSensoryComplete = judgeScores.some(score =>
        score.sensoryBeverage === 'Espresso' &&
        (score.taste === 'left' || score.taste === 'right') &&
        (score.tactile === 'left' || score.tactile === 'right') &&
        (score.flavour === 'left' || score.flavour === 'right') &&
        (score.overall === 'left' || score.overall === 'right')
      );
      return espressoSensoryComplete;
    }
    
    return false;
  }, [activatedMatchId, selectedJudge, activatedMatchScores, globalLockStatus]);

  // Auto-activate match when judge is selected
  React.useEffect(() => {
    if (selectedJudgeId && selectedHeatId && !activatedMatchId) {
      setActivatedMatchId(selectedHeatId);
    }
  }, [selectedJudgeId, selectedHeatId, activatedMatchId]);

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

      {/* Round and Heat Selection */}
      <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
        <CardHeader className="pb-3 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Select Round and Heat</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
          {/* Round Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label className="text-xs sm:text-sm font-medium text-foreground sm:min-w-[80px]">
              Round:
            </label>
            <Select
              value={selectedRound?.toString() || ''}
              onValueChange={(value) => {
                setSelectedRound(value ? parseInt(value) : null);
              }}
            >
              <SelectTrigger className="w-full sm:max-w-[200px] min-h-[2.75rem] sm:min-h-[2.5rem] touch-manipulation">
                <SelectValue placeholder="Select round..." />
              </SelectTrigger>
              <SelectContent>
                {availableRounds.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No rounds available</div>
                ) : (
                  availableRounds.map((round) => (
                    <SelectItem key={round} value={round.toString()}>
                      Round {round} ({matchesByRound[round]?.length || 0} heats)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Heat Selection */}
          {selectedRound && roundMatches.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-medium text-foreground sm:min-w-[80px]">
                Heat:
              </label>
              <Select
                value={selectedHeatId?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedHeatId(value ? parseInt(value) : null);
                  setSelectedJudgeId(null);
                  setActivatedMatchId(null);
                }}
              >
                <SelectTrigger className="w-full sm:max-w-[200px] min-h-[2.75rem] sm:min-h-[2.5rem] touch-manipulation">
                  <SelectValue placeholder="Select heat..." />
                </SelectTrigger>
                <SelectContent>
                  {roundMatches.map((match) => {
                    // Check if all judges have submitted for this heat
                    const lockStatus = allMatchesLockStatus[match.id];
                    const allJudgesSubmitted = lockStatus?.allJudgesSubmitted || false;
                    const heatStatus = allJudgesSubmitted ? 'done' : 'pending';
                    
                    return (
                      <SelectItem key={match.id} value={match.id.toString()}>
                        Heat {match.heatNumber} - {heatStatus}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedRound && roundMatches.length === 0 && (
            <div className="text-center p-4 text-foreground/70 dark:text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No heats found for Round {selectedRound}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Judge Selection - Only show judges for selected heat */}
      {selectedHeatId && (
        <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
          <CardHeader className="pb-3 bg-[var(--brand-light-sand)]/80 dark:bg-transparent">
            <CardTitle className="text-sm sm:text-base lg:text-lg">
              Select Judge for Round {selectedRound}, Heat {roundMatches.find(m => m.id === selectedHeatId)?.heatNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Loading State */}
            {(usersLoading || participantsLoading) && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                <span>Loading judges...</span>
              </div>
            )}

            {/* Judge Selector */}
            {!usersLoading && !participantsLoading && (
              <Select
                value={selectedJudgeId?.toString() || ''}
                onValueChange={(value) => {
                  setSelectedJudgeId(value ? parseInt(value) : null);
                  setActivatedMatchId(selectedHeatId);
                }}
              >
                <SelectTrigger className="w-full sm:max-w-md min-h-[2.75rem] sm:min-h-[2.5rem] touch-manipulation">
                  <SelectValue placeholder="Choose a judge for this heat..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedJudges.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs sm:text-sm text-foreground/70 dark:text-muted-foreground">
                      No judges assigned to this heat
                    </div>
                  ) : (
                    approvedJudges.map((judge) => {
                      const isComplete = judgeCompletionStatus[judge.user.id] || false;
                      return (
                        <SelectItem key={judge.user.id} value={judge.user.id.toString()}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={isComplete ? 'line-through opacity-60' : ''}>{judge.user.name}</span>
                              <Badge variant={judge.role === 'ESPRESSO' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                                {judge.role}
                              </Badge>
                            </div>
                            {isComplete && (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Complete
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
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
        <DrawerContent className="max-h-[95vh] flex flex-col">
          <DrawerHeader className="border-b bg-[var(--brand-light-sand)]/80 dark:bg-card flex-shrink-0">
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
            <DrawerDescription className="sr-only">
              Scoring interface for Round {activatedMatch?.round}, Heat {activatedMatch?.heatNumber}. Submit scores for Visual Latte Art and Sensory categories.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 bg-[var(--brand-light-sand)]/80 dark:bg-transparent pb-8">
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
                isReadOnly={activatedMatchScored || globalLockStatus?.isLocked || false}
                onScoreSubmitted={() => {
                  // Refresh scores and global lock status after submission
                  queryClient.invalidateQueries({ queryKey: [`/api/matches/${activatedMatch.id}/detailed-scores`] });
                  queryClient.invalidateQueries({ queryKey: [`/api/matches/${activatedMatch.id}/global-lock-status`] });
                }}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Instructions */}
      {!selectedHeatId && (
        <Card className="bg-[var(--brand-light-sand)]/60 dark:bg-muted/50 border border-[var(--brand-light-sand)]/50 dark:border-border">
          <CardContent className="p-4 sm:p-6 bg-[var(--brand-light-sand)]/60 dark:bg-transparent">
            <div className="space-y-2 text-xs sm:text-sm lg:text-base text-foreground/70 dark:text-muted-foreground">
              <p className="font-semibold text-foreground dark:text-foreground">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Select a round from the dropdown above</li>
                <li>Select a heat from that round</li>
                <li>Choose a judge assigned to that heat</li>
                <li>The scorecard will open automatically for scoring</li>
                <li>Once scores are submitted, the scorecard becomes read-only</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
