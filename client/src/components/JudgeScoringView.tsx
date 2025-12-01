import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Gavel, CheckCircle2, Loader2, Trophy, ArrowLeft, Coffee, Bell, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User, Tournament, TournamentParticipant, Match, HeatSegment, JudgeDetailedScore } from '@shared/schema';
import type { InsertJudgeDetailedScore } from '@shared/schema';

const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

interface JudgeScoringViewProps {
  judgeId?: number;
  matchId?: number;
  isReadOnly?: boolean;
  onScoreSubmitted?: () => void;
}

export default function JudgeScoringView({ 
  judgeId: propJudgeId, 
  matchId: propMatchId, 
  isReadOnly: propIsReadOnly = false,
  onScoreSubmitted 
}: JudgeScoringViewProps = {}) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current logged-in user
  const { data: currentUserData } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  const currentUser = currentUserData?.user;
  const isJudge = currentUser?.role === 'JUDGE';

  const [searchParams] = useSearchParams();
  const judgeIdFromUrl = searchParams.get('judgeId');
  
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(
    propJudgeId || (judgeIdFromUrl ? parseInt(judgeIdFromUrl) : null)
  );
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(propMatchId || null);
  const [selectedSegmentType, setSelectedSegmentType] = useState<'CAPPUCCINO' | 'ESPRESSO' | null>(null);
  
  // Update selectedJudgeId when prop or URL param changes
  useEffect(() => {
    if (propJudgeId) {
      setSelectedJudgeId(propJudgeId);
    } else if (judgeIdFromUrl) {
      setSelectedJudgeId(parseInt(judgeIdFromUrl));
    }
  }, [propJudgeId, judgeIdFromUrl]);

  // Update selectedMatchId when prop changes
  useEffect(() => {
    if (propMatchId !== undefined && propMatchId !== null) {
      setSelectedMatchId(propMatchId);
    }
  }, [propMatchId]);

  // Scoring state - judges score left/right (blind, no cup codes shown)
  const [visualLatteArt, setVisualLatteArt] = useState<'left' | 'right' | null>(null);
  const [taste, setTaste] = useState<'left' | 'right' | null>(null);
  const [tactile, setTactile] = useState<'left' | 'right' | null>(null);
  const [flavour, setFlavour] = useState<'left' | 'right' | null>(null);
  const [overall, setOverall] = useState<'left' | 'right' | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    matchId: number;
    heatNumber: number;
    round: number;
    segment: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const socket = useWebSocket();

  const tournamentIdNum = tournamentId ? parseInt(tournamentId) : null;

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

  // Get approved judges
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

  // Auto-select current user as judge if they are a judge (only if no prop provided)
  useEffect(() => {
    if (!propJudgeId && isJudge && currentUser && !selectedJudgeId) {
      const judgeParticipant = approvedJudges.find(j => j.user.id === currentUser.id);
      if (judgeParticipant) {
        setSelectedJudgeId(currentUser.id);
      }
    }
  }, [propJudgeId, isJudge, currentUser, approvedJudges, selectedJudgeId]);

  // Listen for judge notifications via WebSocket
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Join judge room
    socket.emit('join', `judge:${currentUser.id}`);

    const handleScoringRequired = (data: {
      matchId: number;
      heatNumber: number;
      round: number;
      segment: string;
      message: string;
    }) => {
      setNotifications(prev => [...prev, {
        ...data,
        timestamp: new Date(),
      }]);

      toast({
        title: 'Scoring Required',
        description: data.message,
        duration: 10000,
      });
    };

    socket.on('judge:scoring-required', handleScoringRequired);

    return () => {
      socket.off('judge:scoring-required', handleScoringRequired);
    };
  }, [socket, currentUser, toast]);

  // Determine which judge ID to use (selected or current user)
  const effectiveJudgeId = selectedJudgeId || (isJudge ? currentUser?.id : null);

  // Fetch assigned matches for selected judge (or current user if judge)
  const { data: assignedMatches = [] } = useQuery<(Match & { judgeRole: 'ESPRESSO' | 'CAPPUCCINO' })[]>({
    queryKey: [`/api/judges/${effectiveJudgeId}/matches`],
    queryFn: async () => {
      if (!effectiveJudgeId) return [];
      const response = await fetch(`/api/judges/${effectiveJudgeId}/matches`);
      if (!response.ok) throw new Error('Failed to fetch assigned matches');
      return response.json();
    },
    enabled: !!effectiveJudgeId,
  });

  // Filter to only show judges that have assigned matches
  const judgesWithAssignments = useMemo(() => {
    // For now, show all approved judges - we'll filter by assignments when judge is selected
    return approvedJudges;
  }, [approvedJudges]);

  // Fetch segments for selected match
  const { data: segments = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${selectedMatchId}/segments`],
    enabled: !!selectedMatchId,
  });

  // Fetch existing detailed scores for selected match
  const { data: existingScores = [] } = useQuery<JudgeDetailedScore[]>({
    queryKey: [`/api/matches/${selectedMatchId}/detailed-scores`],
    enabled: !!selectedMatchId,
  });

  // Fetch cup positions for selected match (if assigned)
  const { data: cupPositions = [] } = useQuery<Array<{ cupCode: string; position: 'left' | 'right' }>>({
    queryKey: [`/api/matches/${selectedMatchId}/cup-positions`],
    queryFn: async () => {
      if (!selectedMatchId) return [];
      const response = await fetch(`/api/matches/${selectedMatchId}/cup-positions`);
      if (!response.ok) return [];
      const positions = await response.json();
      return positions.map((p: any) => ({ cupCode: p.cupCode, position: p.position }));
    },
    enabled: !!selectedMatchId,
  });

  // Get cup codes from segments (dial-in segment has leftCupCode/rightCupCode)
  const dialInSegment = useMemo(() => {
    return segments.find(s => s.segment === 'DIAL_IN');
  }, [segments]);

  // Get selected judge (either from selection or current user)
  const selectedJudge = useMemo(() => {
    if (effectiveJudgeId) {
      return approvedJudges.find(j => j.user.id === effectiveJudgeId);
    }
    return null;
  }, [effectiveJudgeId, approvedJudges]);

  // Get selected match (from assigned matches) - filter by tournament if needed)
  const selectedMatch = useMemo(() => {
    if (!selectedMatchId) return undefined;
    const match = assignedMatches.find(m => m.id === selectedMatchId);
    // If tournamentId is specified, ensure match belongs to that tournament
    if (match && tournamentIdNum && (match as any).tournamentId !== tournamentIdNum) {
      return undefined;
    }
    return match;
  }, [assignedMatches, selectedMatchId, tournamentIdNum]);

  // All judges score both segments - no role distinction
  const judgeRoleForMatch = selectedMatch?.judgeRole;

  // Filter assigned matches by tournament if tournamentId is specified
  const tournamentMatches = useMemo(() => {
    if (!tournamentIdNum) return assignedMatches;
    return assignedMatches.filter(m => (m as any).tournamentId === tournamentIdNum);
  }, [assignedMatches, tournamentIdNum]);


  // Get participants for competitors
  const { data: allParticipants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentIdNum, 'participants'],
    enabled: !!tournamentIdNum,
  });

  // Get competitor info
  const competitor1 = useMemo(() => {
    if (!selectedMatch?.competitor1Id) return null;
    const participant = allParticipants.find(p => p.userId === selectedMatch.competitor1Id);
    const user = allUsers.find(u => u.id === selectedMatch.competitor1Id);
    return participant && user ? { participant, user, cupCode: participant.cupCode || '' } : null;
  }, [selectedMatch, allParticipants, allUsers]);

  const competitor2 = useMemo(() => {
    if (!selectedMatch?.competitor2Id) return null;
    const participant = allParticipants.find(p => p.userId === selectedMatch.competitor2Id);
    const user = allUsers.find(u => u.id === selectedMatch.competitor2Id);
    return participant && user ? { participant, user, cupCode: participant.cupCode || '' } : null;
  }, [selectedMatch, allParticipants, allUsers]);

  // Check if judge has already scored this match and get existing score
  const existingScore = useMemo(() => {
    if (!effectiveJudgeId || !selectedMatchId || !selectedJudge) return null;
    return existingScores.find(score => 
      score.judgeName === selectedJudge.user.name && score.matchId === selectedMatchId
    ) || null;
  }, [existingScores, effectiveJudgeId, selectedMatchId, selectedJudge]);

  const judgeHasScored = !!existingScore;

  // Get available segments for selected match based on progression
  const availableSegments = useMemo(() => {
    if (!segments.length) return [];

    const dialInSegment = segments.find(s => s.segment === 'DIAL_IN');
    const cappuccinoSegment = segments.find(s => s.segment === 'CAPPUCCINO');
    const espressoSegment = segments.find(s => s.segment === 'ESPRESSO');

    const available: HeatSegment[] = [];

    // CAPPUCCINO is available after DIAL_IN is ENDED
    if (cappuccinoSegment && dialInSegment?.status === 'ENDED') {
      available.push(cappuccinoSegment);
    }

    // ESPRESSO is available after CAPPUCCINO is ENDED
    if (espressoSegment && cappuccinoSegment?.status === 'ENDED') {
      available.push(espressoSegment);
    }

    return available;
  }, [segments]);

  // Auto-select first assigned match when matches are available (only if no prop provided)
  useEffect(() => {
    if (!propMatchId && !selectedMatchId && tournamentMatches.length > 0) {
      setSelectedMatchId(tournamentMatches[0].id);
    }
  }, [propMatchId, selectedMatchId, tournamentMatches]);

  // Auto-select first available segment when segments are loaded
  useEffect(() => {
    if (!selectedSegmentType && availableSegments.length > 0) {
      setSelectedSegmentType(availableSegments[0].segment as 'CAPPUCCINO' | 'ESPRESSO');
    }
  }, [selectedSegmentType, availableSegments]);

  // Get selected segment data
  const selectedSegmentData = useMemo(() => {
    if (!selectedSegmentType) return null;
    return segments.find(s => s.segment === selectedSegmentType);
  }, [segments, selectedSegmentType]);

  // Load existing score if judge has already scored
  useEffect(() => {
    if (existingScore) {
      // Judges score left/right (blind) - load from visualLatteArt, taste, etc. fields
      setVisualLatteArt(existingScore.visualLatteArt as 'left' | 'right' | null);
      setTaste(existingScore.taste as 'left' | 'right' | null);
      setTactile(existingScore.tactile as 'left' | 'right' | null);
      setFlavour(existingScore.flavour as 'left' | 'right' | null);
      setOverall(existingScore.overall as 'left' | 'right' | null);
    } else {
      setVisualLatteArt(null);
      setTaste(null);
      setTactile(null);
      setFlavour(null);
      setOverall(null);
    }
  }, [existingScore]);

  // Reset scoring state when match or segment changes (only if no existing score)
  useEffect(() => {
    if (!existingScore) {
      setVisualLatteArt(null);
      setTaste(null);
      setTactile(null);
      setFlavour(null);
      setOverall(null);
    }
  }, [selectedMatchId, selectedSegmentType, existingScore]);

  const submitScoreMutation = useMutation({
    mutationFn: async (scoreData: InsertJudgeDetailedScore) => {
      const response = await fetch('/api/detailed-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(scoreData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit score');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${selectedMatchId}/detailed-scores`] });
      toast({
        title: 'Score Submitted',
        description: 'Your score has been submitted successfully.',
      });
      // Reset form
      setVisualLatteArt(null);
      setTaste(null);
      setTactile(null);
      setFlavour(null);
      setOverall(null);
      // Call callback if provided
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit score',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedJudge || !selectedMatchId || !selectedSegmentType) {
      toast({
        title: 'Validation Error',
        description: 'Please select a judge, match, and segment',
        variant: 'destructive',
      });
      return;
    }

    // For cappuccino, all categories including visual latte art are required
    if (selectedSegmentType === 'CAPPUCCINO' && (!visualLatteArt || !taste || !tactile || !flavour || !overall)) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all scoring categories for Cappuccino (including Visual/Latte Art)',
        variant: 'destructive',
      });
      return;
    }

    // For espresso, only sensory categories are required (no visual latte art)
    if (selectedSegmentType === 'ESPRESSO' && (!taste || !tactile || !flavour || !overall)) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all sensory categories for Espresso',
        variant: 'destructive',
      });
      return;
    }

    // Judges score left/right (blind) - cup codes will be assigned by admin later
    const scoreData: InsertJudgeDetailedScore = {
      matchId: selectedMatchId,
      judgeName: selectedJudge.user.name,
      sensoryBeverage: selectedSegmentType === 'CAPPUCCINO' ? 'Cappuccino' : 'Espresso',
      visualLatteArt: selectedSegmentType === 'CAPPUCCINO' ? visualLatteArt! : null, // Visual/Latte Art only for Cappuccino
      taste: taste!,
      tactile: tactile!,
      flavour: flavour!,
      overall: overall!,
    };

    submitScoreMutation.mutate(scoreData);
  };

  // Check if scoring is complete
  const isScoringComplete = useMemo(() => {
    if (selectedSegmentType === 'CAPPUCCINO') {
      return visualLatteArt !== null && taste !== null && tactile !== null && flavour !== null && overall !== null;
    }
    if (selectedSegmentType === 'ESPRESSO') {
      return taste !== null && tactile !== null && flavour !== null && overall !== null;
    }
    return false;
  }, [selectedSegmentType, visualLatteArt, taste, tactile, flavour, overall]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (tournamentIdNum) {
                navigate(`/live/${tournamentIdNum}`);
              } else {
                navigate('/admin/judges');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tournamentIdNum ? 'Back to Tournament' : 'Back to Judges'}
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Gavel className="h-8 w-8 text-primary" />
          Judge Scoring
        </h1>
        <p className="text-muted-foreground">
          Score heats for approved judges - Starting with Cappuccino and Visual Latte Art
        </p>
      </div>

      {/* Notifications - Only show if not embedded (no props) */}
      {!propJudgeId && !propMatchId && notifications.length > 0 && (
        <div className="space-y-2 mb-6">
          {notifications.map((notification, idx) => (
            <Alert key={idx} className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <Bell className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">
                Scoring Required
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <div className="flex items-center justify-between">
                  <span>{notification.message}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNotifications(prev => prev.filter((_, i) => i !== idx));
                        setSelectedMatchId(notification.matchId);
                      }}
                    >
                      View Heat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotifications(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {!tournament ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading tournament...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Judge Selection - Only show if not provided as prop and not auto-selected */}
          {!propJudgeId && (!isJudge || !currentUser) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Select Judge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedJudgeId?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedJudgeId(value ? parseInt(value) : null);
                    setSelectedMatchId(null);
                    setSelectedSegmentType(null);
                  }}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Choose an approved judge..." />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedJudges.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No approved judges</div>
                    ) : (
                      approvedJudges.map((judge) => (
                        <SelectItem key={judge.id} value={judge.user.id.toString()}>
                          {judge.user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Current Judge Info - Show if auto-selected or prop provided */}
          {(isJudge && currentUser && !propJudgeId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Judge: {currentUser.name}
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {/* Match Selection - Only show if not provided as prop */}
          {!propMatchId && effectiveJudgeId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Select Heat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedMatchId?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedMatchId(value ? parseInt(value) : null);
                    setSelectedSegmentType(null);
                  }}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Choose a heat..." />
                  </SelectTrigger>
                <SelectContent>
                  {tournamentMatches.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {effectiveJudgeId ? 'No assigned heats for this judge' : 'Select a judge first'}
                    </div>
                  ) : (
                    tournamentMatches.map((match) => {
                      const roleLabel = match.judgeRole === 'CAPPUCCINO' ? 'Cappuccino Judge' : 'Espresso Judge';
                      return (
                        <SelectItem key={match.id} value={match.id.toString()}>
                          Round {match.round}, Heat {match.heatNumber} - {roleLabel} - {match.status}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Segment Selection */}
          {selectedMatchId && availableSegments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Select Segment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {availableSegments.map((segment) => (
                    <Button
                      key={segment.id}
                      variant={selectedSegmentType === segment.segment ? 'default' : 'outline'}
                      onClick={() => setSelectedSegmentType(segment.segment as 'CAPPUCCINO' | 'ESPRESSO')}
                    >
                      {segment.segment.replace('_', ' ')}
                    </Button>
                  ))}
                  {availableSegments.length === 0 && segments.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const dialIn = segments.find(s => s.segment === 'DIAL_IN');
                        const cappuccino = segments.find(s => s.segment === 'CAPPUCCINO');
                        if (dialIn && dialIn.status !== 'ENDED') {
                          return 'Waiting for Dial-In segment to complete...';
                        }
                        if (cappuccino && cappuccino.status !== 'ENDED') {
                          return 'Waiting for Cappuccino segment to complete...';
                        }
                        return 'No segments available for scoring yet.';
                      })()}
                    </div>
                  )}
                </div>
                {availableSegments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No cappuccino segments available for this heat</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scoring Interface */}
          {selectedSegmentType && selectedMatchId && competitor1 && competitor2 && (
            <Card className="border-l-4 border-l-primary bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-[#93401f]">
                  <Users className="h-5 w-5" />
                  <span className="font-bold">Judge Scorecard</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cup Codes - Only show after match is completed (DONE status) */}
                {selectedMatch?.status === 'DONE' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/40">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground font-medium">Left Cup</div>
                      <div className="text-lg font-bold text-primary px-2 py-1 rounded mt-1 bg-[#2d1b12]">
                        {(() => {
                          // Try to get cup code from cup positions if assigned
                          const leftPosition = cupPositions?.find(p => p.position === 'left');
                          return leftPosition?.cupCode || dialInSegment?.leftCupCode || '—';
                        })()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground font-medium">Right Cup</div>
                      <div className="text-lg font-bold text-primary px-2 py-1 rounded mt-1 bg-[#2d1b12]">
                        {(() => {
                          const rightPosition = cupPositions?.find(p => p.position === 'right');
                          return rightPosition?.cupCode || dialInSegment?.rightCupCode || '—';
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Blind Judging Notice - Judges don't see cup codes during scoring */}
                {selectedMatch?.status !== 'DONE' && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Bell className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">Blind Judging: Score based on Left/Right cup positions only. Cup codes will be revealed after the round is completed.</span>
                    </div>
                  </div>
                )}

                {/* Visual/Latte Art (3 points) - ONLY on CAPPUCCINO */}
                {selectedSegmentType === 'CAPPUCCINO' && (
                  <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12]">
                    <label className="flex items-center gap-2 justify-start text-[#93401f]">
                      <input
                        type="checkbox"
                        checked={visualLatteArt === 'left'}
                        onChange={(e) => setVisualLatteArt(e.target.checked ? 'left' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                      <span className="text-xs text-muted-foreground">Left</span>
                    </label>
                    <div className="text-center font-semibold text-primary">
                      Visual Latte Art
                    </div>
                    <label className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-muted-foreground">Right</span>
                      <input
                        type="checkbox"
                        checked={visualLatteArt === 'right'}
                        onChange={(e) => setVisualLatteArt(e.target.checked ? 'right' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                    </label>
                  </div>
                )}

                {/* Sensory Beverage Label */}
                <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-[#2d1b12]">
                  <div></div>
                  <div className="text-center font-semibold text-primary">
                    Sensory {selectedSegmentType === 'CAPPUCCINO' ? 'Cappuccino' : 'Espresso'}
                  </div>
                  <div></div>
                </div>

                {/* Sensory Categories (for both CAPPUCCINO and ESPRESSO) */}
                <div className="space-y-3">
                  {/* Taste (1 point) */}
                  <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12]">
                    <label className="flex items-center gap-2 justify-start text-[#93401f]">
                      <input
                        type="checkbox"
                        checked={taste === 'left'}
                        onChange={(e) => setTaste(e.target.checked ? 'left' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                      <span className="text-xs text-muted-foreground">Left</span>
                    </label>
                    <div className="text-center font-semibold text-primary">
                      Taste
                    </div>
                    <label className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-muted-foreground">Right</span>
                      <input
                        type="checkbox"
                        checked={taste === 'right'}
                        onChange={(e) => setTaste(e.target.checked ? 'right' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                    </label>
                  </div>

                  {/* Tactile (1 point) */}
                  <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12]">
                    <label className="flex items-center gap-2 justify-start text-[#93401f]">
                      <input
                        type="checkbox"
                        checked={tactile === 'left'}
                        onChange={(e) => setTactile(e.target.checked ? 'left' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                      <span className="text-xs text-muted-foreground">Left</span>
                    </label>
                    <div className="text-center font-semibold text-primary">
                      Tactile
                    </div>
                    <label className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-muted-foreground">Right</span>
                      <input
                        type="checkbox"
                        checked={tactile === 'right'}
                        onChange={(e) => setTactile(e.target.checked ? 'right' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                    </label>
                  </div>

                  {/* Flavour (1 point) */}
                  <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12]">
                    <label className="flex items-center gap-2 justify-start text-[#93401f]">
                      <input
                        type="checkbox"
                        checked={flavour === 'left'}
                        onChange={(e) => setFlavour(e.target.checked ? 'left' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                      <span className="text-xs text-muted-foreground">Left</span>
                    </label>
                    <div className="text-center font-semibold text-primary">
                      Flavour
                    </div>
                    <label className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-muted-foreground">Right</span>
                      <input
                        type="checkbox"
                        checked={flavour === 'right'}
                        onChange={(e) => setFlavour(e.target.checked ? 'right' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                    </label>
                  </div>

                  {/* Overall (5 points) */}
                  <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12]">
                    <label className="flex items-center gap-2 justify-start text-[#93401f]">
                      <input
                        type="checkbox"
                        checked={overall === 'left'}
                        onChange={(e) => setOverall(e.target.checked ? 'left' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                      <span className="text-xs text-muted-foreground">Left</span>
                    </label>
                    <div className="text-center font-semibold text-primary">
                      Overall
                    </div>
                    <label className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-muted-foreground">Right</span>
                      <input
                        type="checkbox"
                        checked={overall === 'right'}
                        onChange={(e) => setOverall(e.target.checked ? 'right' : null)}
                        disabled={judgeHasScored}
                        className="h-4 w-4 accent-[color:oklch(var(--foreground))]"
                      />
                    </label>
                  </div>
                </div>

                {/* Completion Status with L/R Checkmarks */}
                {isScoringComplete && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-4">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Scoring Complete</span>
                    </div>
                    <div className={`grid gap-2 ${selectedSegmentType === 'CAPPUCCINO' ? 'grid-cols-5' : 'grid-cols-4'}`}>
                      {selectedSegmentType === 'CAPPUCCINO' && (
                        <div className="text-center">
                          <div className="text-xs font-medium mb-1">Visual/Latte Art</div>
                          <div className="flex items-center justify-center h-10 w-10 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900">
                            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="mt-1 text-xs font-bold">{visualLatteArt?.toUpperCase()}</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-xs font-medium mb-1">Taste</div>
                        <div className="flex items-center justify-center h-10 w-10 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900">
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="mt-1 text-xs font-bold">{taste?.toUpperCase()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium mb-1">Tactile</div>
                        <div className="flex items-center justify-center h-10 w-10 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900">
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="mt-1 text-xs font-bold">{tactile?.toUpperCase()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium mb-1">Flavour</div>
                        <div className="flex items-center justify-center h-10 w-10 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900">
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="mt-1 text-xs font-bold">{flavour?.toUpperCase()}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium mb-1">Overall</div>
                        <div className="flex items-center justify-center h-10 w-10 rounded border-2 border-green-500 bg-green-100 dark:bg-green-900">
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="mt-1 text-xs font-bold">{overall?.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-green-600 dark:text-green-400 text-center">
                      All required categories have been scored. You can now submit your scores.
                    </div>
                  </div>
                )}

                {/* Existing Score Notice */}
                {judgeHasScored && existingScore && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Score Already Submitted</span>
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Submitted at: {new Date(existingScore.submittedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!isScoringComplete || submitScoreMutation.isPending || judgeHasScored}
                  className="w-full"
                  size="lg"
                >
                  {submitScoreMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : judgeHasScored ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Already Scored
                    </>
                  ) : (
                    'Submit Scores'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}