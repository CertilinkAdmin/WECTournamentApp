import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Gavel, CheckCircle2, Loader2, Trophy, ArrowLeft, Coffee, Bell, X, Users, AlertTriangle } from 'lucide-react';
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
  judgeRole?: 'ESPRESSO' | 'CAPPUCCINO';
  isReadOnly?: boolean;
  onScoreSubmitted?: () => void;
}

export default function JudgeScoringView({ 
  judgeId: propJudgeId, 
  matchId: propMatchId,
  judgeRole: propJudgeRole,
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

  // Scoring state - separate for Latte Art and Sensory segments
  // Latte Art (all judges score this)
  const [latteArtVisual, setLatteArtVisual] = useState<'left' | 'right' | null>(null);
  
  // Cappuccino sensory (only Cappuccino judge scores this)
  const [cappuccinoTaste, setCappuccinoTaste] = useState<'left' | 'right' | null>(null);
  const [cappuccinoTactile, setCappuccinoTactile] = useState<'left' | 'right' | null>(null);
  const [cappuccinoFlavour, setCappuccinoFlavour] = useState<'left' | 'right' | null>(null);
  // Overall for sensory is derived (2 of 3 categories), so we don't take direct input
  const [cappuccinoOverall, setCappuccinoOverall] = useState<'left' | 'right' | null>(null);
  
  // Espresso sensory (only Espresso judge scores this)
  const [espressoTaste, setEspressoTaste] = useState<'left' | 'right' | null>(null);
  const [espressoTactile, setEspressoTactile] = useState<'left' | 'right' | null>(null);
  const [espressoFlavour, setEspressoFlavour] = useState<'left' | 'right' | null>(null);
  const [espressoOverall, setEspressoOverall] = useState<'left' | 'right' | null>(null);
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

  // Fetch global lock status - locks scoring when all segments ended AND all judges submitted
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
    queryKey: [`/api/matches/${selectedMatchId}/global-lock-status`],
    queryFn: async () => {
      if (!selectedMatchId) return null;
      const response = await fetch(`/api/matches/${selectedMatchId}/global-lock-status`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedMatchId,
    refetchInterval: 5000, // Poll every 5 seconds to detect lock status changes
  });

  // Derive isGloballyLocked from globalLockStatus
  const isGloballyLocked = globalLockStatus?.isLocked || false;

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

  // Determine judge role (from prop, match, or assigned matches)
  const effectiveJudgeRole = useMemo(() => {
    if (propJudgeRole) return propJudgeRole;
    if (selectedMatch?.judgeRole) return selectedMatch.judgeRole;
    // Try to find role from assigned matches
    const matchWithRole = assignedMatches.find(m => m.id === selectedMatchId);
    return matchWithRole?.judgeRole || null;
  }, [propJudgeRole, selectedMatch, assignedMatches, selectedMatchId]);

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

  // Check for existing scores by segment type
  const existingLatteArtScore = useMemo(() => {
    if (!effectiveJudgeId || !selectedMatchId || !selectedJudge) return null;
    // Look for score with visualLatteArt filled with valid value (indicates Latte Art was scored)
    // Only consider it submitted if visualLatteArt has a valid value ('left' or 'right')
    return existingScores.find(score => 
      score.judgeName === selectedJudge.user.name && 
      score.matchId === selectedMatchId &&
      (score.visualLatteArt === 'left' || score.visualLatteArt === 'right')
    ) || null;
  }, [existingScores, effectiveJudgeId, selectedMatchId, selectedJudge]);

  const existingCappuccinoScore = useMemo(() => {
    if (!effectiveJudgeId || !selectedMatchId || !selectedJudge) return null;
    // Look for Cappuccino sensory score - must have ALL sensory categories filled with valid values ('left' or 'right')
    // This ensures latte art submission doesn't lock sensory scoring
    // Only consider it submitted if ALL four sensory categories have valid values
    return existingScores.find(score => 
      score.judgeName === selectedJudge.user.name && 
      score.matchId === selectedMatchId &&
      score.sensoryBeverage === 'Cappuccino' &&
      (score.taste === 'left' || score.taste === 'right') && 
      (score.tactile === 'left' || score.tactile === 'right') && 
      (score.flavour === 'left' || score.flavour === 'right') && 
      (score.overall === 'left' || score.overall === 'right')
    ) || null;
  }, [existingScores, effectiveJudgeId, selectedMatchId, selectedJudge]);

  const existingEspressoScore = useMemo(() => {
    if (!effectiveJudgeId || !selectedMatchId || !selectedJudge) return null;
    // Look for Espresso sensory score - must have ALL sensory categories filled with valid values ('left' or 'right')
    // Only consider it submitted if ALL four sensory categories have valid values
    return existingScores.find(score => 
      score.judgeName === selectedJudge.user.name && 
      score.matchId === selectedMatchId &&
      score.sensoryBeverage === 'Espresso' &&
      (score.taste === 'left' || score.taste === 'right') && 
      (score.tactile === 'left' || score.tactile === 'right') && 
      (score.flavour === 'left' || score.flavour === 'right') && 
      (score.overall === 'left' || score.overall === 'right')
    ) || null;
  }, [existingScores, effectiveJudgeId, selectedMatchId, selectedJudge]);

  const latteArtSubmitted = !!existingLatteArtScore;
  const cappuccinoSensorySubmitted = !!existingCappuccinoScore;
  const espressoSensorySubmitted = !!existingEspressoScore;

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

  // Judge role is locked - no segment selection needed
  // Judges can only score for their assigned role (ESPRESSO or CAPPUCCINO)

  // Load existing scores if judge has already scored
  useEffect(() => {
    // Load Latte Art score
    if (existingLatteArtScore) {
      setLatteArtVisual(existingLatteArtScore.visualLatteArt as 'left' | 'right' | null);
    } else {
      setLatteArtVisual(null);
    }

        // Load Cappuccino sensory scores (overall is derived from category winners)
        if (existingCappuccinoScore) {
          setCappuccinoTaste(existingCappuccinoScore.taste as 'left' | 'right' | null);
          setCappuccinoTactile(existingCappuccinoScore.tactile as 'left' | 'right' | null);
          setCappuccinoFlavour(existingCappuccinoScore.flavour as 'left' | 'right' | null);
          const cappVotes = [
            existingCappuccinoScore.taste,
            existingCappuccinoScore.tactile,
            existingCappuccinoScore.flavour,
          ];
          const leftWins = cappVotes.filter((v) => v === 'left').length;
          const rightWins = cappVotes.filter((v) => v === 'right').length;
          const derived = leftWins > rightWins ? 'left' : rightWins > leftWins ? 'right' : null;
          setCappuccinoOverall(derived);
        } else {
          setCappuccinoTaste(null);
          setCappuccinoTactile(null);
          setCappuccinoFlavour(null);
          setCappuccinoOverall(null);
        }

        // Load Espresso sensory scores (overall is derived from category winners)
        if (existingEspressoScore) {
          setEspressoTaste(existingEspressoScore.taste as 'left' | 'right' | null);
          setEspressoTactile(existingEspressoScore.tactile as 'left' | 'right' | null);
          setEspressoFlavour(existingEspressoScore.flavour as 'left' | 'right' | null);
          const espVotes = [
            existingEspressoScore.taste,
            existingEspressoScore.tactile,
            existingEspressoScore.flavour,
          ];
          const leftWins = espVotes.filter((v) => v === 'left').length;
          const rightWins = espVotes.filter((v) => v === 'right').length;
          const derived = leftWins > rightWins ? 'left' : rightWins > leftWins ? 'right' : null;
          setEspressoOverall(derived);
        } else {
          setEspressoTaste(null);
          setEspressoTactile(null);
          setEspressoFlavour(null);
          setEspressoOverall(null);
        }
  }, [existingLatteArtScore, existingCappuccinoScore, existingEspressoScore]);

  // Reset scoring state when match changes (only if no existing scores)
  useEffect(() => {
    if (!existingLatteArtScore) setLatteArtVisual(null);
    if (!existingCappuccinoScore) {
      setCappuccinoTaste(null);
      setCappuccinoTactile(null);
      setCappuccinoFlavour(null);
      setCappuccinoOverall(null);
    }
    if (!existingEspressoScore) {
      setEspressoTaste(null);
      setEspressoTactile(null);
      setEspressoFlavour(null);
      setEspressoOverall(null);
    }
  }, [selectedMatchId, existingLatteArtScore, existingCappuccinoScore, existingEspressoScore]);

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
    onSuccess: (data) => {
      console.log('Score submitted successfully:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${selectedMatchId}/detailed-scores`] });
      // Also invalidate judge completion queries to update completion status
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${selectedMatchId}/segments/ESPRESSO/judges-completion`] });
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${selectedMatchId}/segments/CAPPUCCINO/judges-completion`] });
      // Keep global lock / judges status monitor in sync
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${selectedMatchId}/global-lock-status`] });
      toast({
        title: 'Score Submitted',
        description: 'Your score has been submitted successfully.',
      });
      // Call callback if provided
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    },
    onError: (error: any) => {
      console.error('Submit score mutation error:', error);
      const errorMessage = error.message || 'Failed to submit score';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    },
  });

  // Submit Latte Art score (all judges)
  const handleSubmitLatteArt = () => {
    if (!selectedJudge || !selectedMatchId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a judge and match',
        variant: 'destructive',
      });
      return;
    }

    if (!latteArtVisual) {
      toast({
        title: 'Validation Error',
        description: 'Please select a winner for Visual Latte Art',
        variant: 'destructive',
      });
      return;
    }

    // Only submit visual latte art - don't include sensory fields to preserve existing values
    const scoreData: InsertJudgeDetailedScore = {
      matchId: selectedMatchId,
      judgeName: selectedJudge.user.name,
      sensoryBeverage: 'Cappuccino', // Use Cappuccino as default for Latte Art
      visualLatteArt: latteArtVisual,
      // Don't include sensory fields - they should remain independent
    };

    submitScoreMutation.mutate(scoreData);
  };

  // Submit Cappuccino sensory score (only Cappuccino judge)
  const handleSubmitCappuccinoSensory = () => {
    console.log('handleSubmitCappuccinoSensory called', {
      selectedJudge,
      selectedMatchId,
      cappuccinoTaste,
      cappuccinoTactile,
      cappuccinoFlavour,
      cappuccinoOverall,
      isCappuccinoSensoryComplete,
      cappuccinoSensorySubmitted,
      submitScoreMutation: { isPending: submitScoreMutation.isPending }
    });

    if (!selectedJudge || !selectedMatchId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a judge and match',
        variant: 'destructive',
      });
      return;
    }

    if (!cappuccinoTaste || !cappuccinoTactile || !cappuccinoFlavour) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all Cappuccino sensory categories (Taste, Tactile, Flavour)',
        variant: 'destructive',
      });
      return;
    }

    // Derive overall winner from majority of the three sensory categories
    const cappuccinoVotes = [cappuccinoTaste, cappuccinoTactile, cappuccinoFlavour];
    const leftWins = cappuccinoVotes.filter(v => v === 'left').length;
    const rightWins = cappuccinoVotes.filter(v => v === 'right').length;
    const derivedOverall: 'left' | 'right' = leftWins > rightWins ? 'left' : 'right';
    setCappuccinoOverall(derivedOverall);

    // Only submit Cappuccino sensory - don't include visualLatteArt to preserve existing value
    const scoreData: InsertJudgeDetailedScore = {
      matchId: selectedMatchId,
      judgeName: selectedJudge.user.name,
      sensoryBeverage: 'Cappuccino',
      taste: cappuccinoTaste,
      tactile: cappuccinoTactile,
      flavour: cappuccinoFlavour,
      overall: derivedOverall,
      // Don't include visualLatteArt - it should remain independent
    };

    console.log('Submitting cappuccino sensory score:', scoreData);
    try {
      submitScoreMutation.mutate(scoreData, {
        onError: (error) => {
          console.error('Cappuccino sensory submission error:', error);
        }
      });
    } catch (error) {
      console.error('Error calling submitScoreMutation:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit score. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Submit Espresso sensory score (only Espresso judge)
  const handleSubmitEspressoSensory = () => {
    console.log('handleSubmitEspressoSensory called', {
      selectedJudge,
      selectedMatchId,
      espressoTaste,
      espressoTactile,
      espressoFlavour,
      espressoOverall,
      isEspressoSensoryComplete,
      espressoSensorySubmitted,
      submitScoreMutation: { isPending: submitScoreMutation.isPending }
    });

    if (!selectedJudge || !selectedMatchId) {
      console.error('Validation failed: missing judge or match', { selectedJudge, selectedMatchId });
      toast({
        title: 'Validation Error',
        description: 'Please select a judge and match',
        variant: 'destructive',
      });
      return;
    }

    if (!espressoTaste || !espressoTactile || !espressoFlavour) {
      console.error('Validation failed: incomplete categories', {
        espressoTaste,
        espressoTactile,
        espressoFlavour,
      });
      toast({
        title: 'Validation Error',
        description: 'Please complete all Espresso sensory categories (Taste, Tactile, Flavour)',
        variant: 'destructive',
      });
      return;
    }

    // Derive overall winner from majority of the three sensory categories
    const espressoVotes = [espressoTaste, espressoTactile, espressoFlavour];
    const leftWins = espressoVotes.filter(v => v === 'left').length;
    const rightWins = espressoVotes.filter(v => v === 'right').length;
    const derivedOverall: 'left' | 'right' = leftWins > rightWins ? 'left' : 'right';
    setEspressoOverall(derivedOverall);

    // Only submit Espresso sensory - don't include visualLatteArt to preserve existing value
    const scoreData: InsertJudgeDetailedScore = {
      matchId: selectedMatchId,
      judgeName: selectedJudge.user.name,
      sensoryBeverage: 'Espresso',
      taste: espressoTaste,
      tactile: espressoTactile,
      flavour: espressoFlavour,
      overall: derivedOverall,
      // Don't include visualLatteArt - it should remain independent
    };

    console.log('Submitting espresso sensory score:', scoreData);
    try {
      submitScoreMutation.mutate(scoreData, {
        onError: (error) => {
          console.error('Espresso sensory submission error:', error);
        }
      });
    } catch (error) {
      console.error('Error calling submitScoreMutation:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit score. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check if scoring is complete for each segment
  const isLatteArtComplete = latteArtVisual !== null;
  const isCappuccinoSensoryComplete =
    cappuccinoTaste !== null && cappuccinoTactile !== null && cappuccinoFlavour !== null;
  const isEspressoSensoryComplete =
    espressoTaste !== null && espressoTactile !== null && espressoFlavour !== null;

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


          {/* Judge Role Indicator - Show locked role */}
          {selectedMatchId && effectiveJudgeRole && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Gavel className="h-4 w-4 text-primary" />
                  <span className="font-medium">Assigned Role:</span>
                  <Badge variant={effectiveJudgeRole === 'ESPRESSO' ? 'default' : 'secondary'} className="font-semibold">
                    {effectiveJudgeRole === 'ESPRESSO' ? 'Espresso Judge' : 'Cappuccino Judge'}
                  </Badge>
                  <span className="text-muted-foreground text-xs ml-auto">(Locked - Cannot be changed)</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scoring Interface - Show when match is selected (judge role determines what to show) */}
          {selectedMatchId && competitor1 && competitor2 && effectiveJudgeRole && (
            <div className="space-y-4 sm:space-y-6">
              {/* Global Lock Notice */}
              {isGloballyLocked && (
                <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <AlertTitle className="text-amber-900 dark:text-amber-200 font-semibold text-xs sm:text-sm lg:text-base">
                    Scoring Locked
                  </AlertTitle>
                  <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm lg:text-base">
                    All segments have been completed and all judges have submitted their scores. Scoring is now locked for this heat.
                  </AlertDescription>
                </Alert>
              )}
              {/* Latte Art Scorecard - All Judges */}
              <Card className="border-l-4 border-l-blue-500 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[var(--brand-cinnamon-brown)] dark:text-[var(--brand-cinnamon-brown)]">
                    <Users className="h-5 w-5" />
                    <span className="font-bold">Visual Latte Art</span>
                    {latteArtSubmitted && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-auto">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Submitted
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  {/* Cup Codes - Only show after match is completed (DONE status) */}
                  {selectedMatch?.status === 'DONE' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/40">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-medium">Left Cup</div>
                        <div className="text-lg font-bold text-primary px-2 py-1 rounded mt-1 bg-[var(--espresso-dark)] dark:bg-[var(--espresso-dark)] text-[var(--espresso-cream)]">
                          {(() => {
                            const leftPosition = cupPositions?.find(p => p.position === 'left');
                            return leftPosition?.cupCode || dialInSegment?.leftCupCode || '—';
                          })()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-medium">Right Cup</div>
                        <div className="text-lg font-bold text-primary px-2 py-1 rounded mt-1 bg-[var(--espresso-dark)] dark:bg-[var(--espresso-dark)] text-[var(--espresso-cream)]">
                          {(() => {
                            const rightPosition = cupPositions?.find(p => p.position === 'right');
                            return rightPosition?.cupCode || dialInSegment?.rightCupCode || '—';
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blind Judging Notice */}
                  {selectedMatch?.status !== 'DONE' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Bell className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">Blind Judging: Score based on Left/Right cup positions only. Cup codes will be revealed after the round is completed.</span>
                      </div>
                    </div>
                  )}

                  {/* Visual Latte Art Scoring */}
                  <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[var(--espresso-dark)] dark:bg-[var(--espresso-dark)] min-h-[3rem] sm:min-h-[3.5rem]">
                    <label className="flex items-center gap-2 justify-start text-[var(--brand-cinnamon-brown)] dark:text-[var(--brand-cinnamon-brown)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={latteArtVisual === 'left'}
                        onChange={(e) => setLatteArtVisual(e.target.checked ? 'left' : null)}
                        disabled={latteArtSubmitted || propIsReadOnly || isGloballyLocked}
                        className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                    </label>
                    <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                      Visual Latte Art
                    </div>
                    <label className="flex items-center gap-2 justify-end cursor-pointer">
                      <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                      <input
                        type="checkbox"
                        checked={latteArtVisual === 'right'}
                        onChange={(e) => setLatteArtVisual(e.target.checked ? 'right' : null)}
                        disabled={latteArtSubmitted || propIsReadOnly || isGloballyLocked}
                        className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                      />
                    </label>
                  </div>

                  {/* Latte Art Completion Status */}
                  {isLatteArtComplete && !latteArtSubmitted && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">Latte Art scoring complete</span>
                      </div>
                    </div>
                  )}

                  {/* Latte Art Submit Button */}
                  <Button
                    onClick={handleSubmitLatteArt}
                    disabled={!isLatteArtComplete || submitScoreMutation.isPending || latteArtSubmitted || propIsReadOnly || isGloballyLocked}
                    className="w-full min-h-[2.75rem] sm:min-h-[2.5rem]"
                    size="lg"
                  >
                    {submitScoreMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : latteArtSubmitted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Latte Art Submitted
                      </>
                    ) : (
                      'Submit Latte Art Score'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Cappuccino Sensory Scorecard - Only for Cappuccino Judge */}
              {effectiveJudgeRole === 'CAPPUCCINO' && (
                <Card className="border-l-4 border-l-amber-500 bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[var(--brand-cinnamon-brown)] dark:text-[var(--brand-cinnamon-brown)]">
                      <Coffee className="h-5 w-5" />
                      <span className="font-bold">Cappuccino Sensory</span>
                      {cappuccinoSensorySubmitted && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-auto">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    {/* Cappuccino Sensory Categories */}
                    <div className="space-y-3">
                      {/* Taste */}
                      <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12] min-h-[3rem] sm:min-h-[3.5rem]">
                        <label className="flex items-center gap-2 justify-start text-[#93401f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cappuccinoTaste === 'left'}
                            onChange={(e) => setCappuccinoTaste(e.target.checked ? 'left' : null)}
                            disabled={cappuccinoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                        </label>
                        <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                          Taste
                        </div>
                        <label className="flex items-center gap-2 justify-end cursor-pointer">
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                          <input
                            type="checkbox"
                            checked={cappuccinoTaste === 'right'}
                            onChange={(e) => setCappuccinoTaste(e.target.checked ? 'right' : null)}
                            disabled={cappuccinoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>

                      {/* Tactile */}
                      <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12] min-h-[3rem] sm:min-h-[3.5rem]">
                        <label className="flex items-center gap-2 justify-start text-[#93401f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cappuccinoTactile === 'left'}
                            onChange={(e) => setCappuccinoTactile(e.target.checked ? 'left' : null)}
                            disabled={cappuccinoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                        </label>
                        <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                          Tactile
                        </div>
                        <label className="flex items-center gap-2 justify-end cursor-pointer">
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                          <input
                            type="checkbox"
                            checked={cappuccinoTactile === 'right'}
                            onChange={(e) => setCappuccinoTactile(e.target.checked ? 'right' : null)}
                            disabled={cappuccinoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>

                      {/* Flavour */}
                      <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12] min-h-[3rem] sm:min-h-[3.5rem]">
                        <label className="flex items-center gap-2 justify-start text-[#93401f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cappuccinoFlavour === 'left'}
                            onChange={(e) => setCappuccinoFlavour(e.target.checked ? 'left' : null)}
                            disabled={cappuccinoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                        </label>
                        <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                          Flavour
                        </div>
                        <label className="flex items-center gap-2 justify-end cursor-pointer">
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                          <input
                            type="checkbox"
                            checked={cappuccinoFlavour === 'right'}
                            onChange={(e) => setCappuccinoFlavour(e.target.checked ? 'right' : null)}
                            disabled={cappuccinoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Cappuccino Sensory Completion Status */}
                    {isCappuccinoSensoryComplete && !cappuccinoSensorySubmitted && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Cappuccino sensory scoring complete</span>
                        </div>
                      </div>
                    )}

                    {/* Cappuccino Sensory Submit Button */}
                    <Button
                      onClick={handleSubmitCappuccinoSensory}
                      disabled={!isCappuccinoSensoryComplete || submitScoreMutation.isPending || cappuccinoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                      className="w-full min-h-[2.75rem] sm:min-h-[2.5rem]"
                      size="lg"
                    >
                      {submitScoreMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : cappuccinoSensorySubmitted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Cappuccino Sensory Submitted
                        </>
                      ) : (
                        'Submit Cappuccino Sensory Score'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Espresso Sensory Scorecard - Only for Espresso Judge */}
              {effectiveJudgeRole === 'ESPRESSO' && (
                <Card className="border-l-4 border-l-purple-500 bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[var(--brand-cinnamon-brown)] dark:text-[var(--brand-cinnamon-brown)]">
                      <Coffee className="h-5 w-5" />
                      <span className="font-bold">Espresso Sensory</span>
                      {espressoSensorySubmitted && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-auto">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    {/* Espresso Sensory Categories */}
                    <div className="space-y-3">
                      {/* Taste */}
                      <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12] min-h-[3rem] sm:min-h-[3.5rem]">
                        <label className="flex items-center gap-2 justify-start text-[#93401f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={espressoTaste === 'left'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoTaste('left');
                              } else {
                                setEspressoTaste(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                        </label>
                        <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                          Taste
                        </div>
                        <label className="flex items-center gap-2 justify-end cursor-pointer">
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                          <input
                            type="checkbox"
                            checked={espressoTaste === 'right'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoTaste('right');
                              } else {
                                setEspressoTaste(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>

                      {/* Tactile */}
                      <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12] min-h-[3rem] sm:min-h-[3.5rem]">
                        <label className="flex items-center gap-2 justify-start text-[#93401f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={espressoTactile === 'left'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoTactile('left');
                              } else {
                                setEspressoTactile(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                        </label>
                        <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                          Tactile
                        </div>
                        <label className="flex items-center gap-2 justify-end cursor-pointer">
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                          <input
                            type="checkbox"
                            checked={espressoTactile === 'right'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoTactile('right');
                              } else {
                                setEspressoTactile(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>

                      {/* Flavour */}
                      <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12] min-h-[3rem] sm:min-h-[3.5rem]">
                        <label className="flex items-center gap-2 justify-start text-[#93401f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={espressoFlavour === 'left'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoFlavour('left');
                              } else {
                                setEspressoFlavour(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                        </label>
                        <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                          Flavour
                        </div>
                        <label className="flex items-center gap-2 justify-end cursor-pointer">
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                          <input
                            type="checkbox"
                            checked={espressoFlavour === 'right'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoFlavour('right');
                              } else {
                                setEspressoFlavour(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>

                      {/* Overall */}
                      <div className="grid grid-cols-3 items-center p-3 sm:p-4 rounded-lg text-sm border border-primary/30 transition-all bg-[#2d1b12] min-h-[3rem] sm:min-h-[3.5rem]">
                        <label className="flex items-center gap-2 justify-start text-[#93401f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={espressoOverall === 'left'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoOverall('left');
                              } else {
                                setEspressoOverall(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Left</span>
                        </label>
                        <div className="text-center font-semibold text-[var(--espresso-cream)] dark:text-primary text-sm sm:text-base">
                          Overall
                        </div>
                        <label className="flex items-center gap-2 justify-end cursor-pointer">
                          <span className="text-xs sm:text-sm text-[var(--espresso-cream)] dark:text-muted-foreground font-medium">Right</span>
                          <input
                            type="checkbox"
                            checked={espressoOverall === 'right'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEspressoOverall('right');
                              } else {
                                setEspressoOverall(null);
                              }
                            }}
                            disabled={espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                            className="h-5 w-5 sm:h-6 sm:w-6 accent-[var(--brand-cinnamon-brown)] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Espresso Sensory Completion Status */}
                    {isEspressoSensoryComplete && !espressoSensorySubmitted && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Espresso sensory scoring complete</span>
                        </div>
                      </div>
                    )}

                    {/* Espresso Sensory Submit Button */}
                    {!isEspressoSensoryComplete && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                        Please complete all categories: Taste, Tactile, Flavour, and Overall
                      </div>
                    )}
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Submit button clicked', {
                          isEspressoSensoryComplete,
                          submitScoreMutation: { isPending: submitScoreMutation.isPending },
                          espressoSensorySubmitted,
                          propIsReadOnly,
                          espressoTaste,
                          espressoTactile,
                          espressoFlavour,
                          espressoOverall,
                          selectedJudge,
                          selectedMatchId
                        });
                        handleSubmitEspressoSensory();
                      }}
                      disabled={!isEspressoSensoryComplete || submitScoreMutation.isPending || espressoSensorySubmitted || propIsReadOnly || isGloballyLocked}
                      className="w-full min-h-[2.75rem] sm:min-h-[2.5rem]"
                      size="lg"
                      type="button"
                    >
                      {submitScoreMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : espressoSensorySubmitted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Espresso Sensory Submitted
                        </>
                      ) : (
                        'Submit Espresso Sensory Score'
                      )}
                    </Button>
                    {(!isEspressoSensoryComplete || espressoSensorySubmitted || propIsReadOnly) && (
                      <div className="text-xs text-muted-foreground mt-2 text-center">
                        {!isEspressoSensoryComplete && 'Complete all categories to enable submit'}
                        {espressoSensorySubmitted && 'Score already submitted'}
                        {propIsReadOnly && 'Read-only mode'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}