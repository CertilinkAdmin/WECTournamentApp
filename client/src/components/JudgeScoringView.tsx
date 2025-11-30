import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function JudgeScoringView() {
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
  
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedSegmentType, setSelectedSegmentType] = useState<'CAPPUCCINO' | 'ESPRESSO' | null>(null);
  
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

  // Get approved judges
  const approvedJudges = useMemo(() => {
    if (!participants.length) return [];
    
    return participants
      .map(p => {
        const user = allUsers.find(u => u.id === p.userId && u.role === 'JUDGE');
        return user && p.seed && p.seed > 0 ? { ...p, user } : null;
      })
      .filter((j): j is TournamentParticipant & { user: User } => j !== null);
  }, [participants, allUsers]);

  // Auto-select current user as judge if they are a judge
  React.useEffect(() => {
    if (isJudge && currentUser && !selectedJudgeId) {
      const judgeParticipant = approvedJudges.find(j => j.user.id === currentUser.id);
      if (judgeParticipant) {
        setSelectedJudgeId(currentUser.id);
      }
    }
  }, [isJudge, currentUser, approvedJudges, selectedJudgeId]);

  // Listen for judge notifications via WebSocket
  React.useEffect(() => {
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
  const { data: assignedMatches = [] } = useQuery<(Match & { judgeRole: 'HEAD' | 'TECHNICAL' | 'SENSORY' })[]>({
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

  // Auto-select first assigned match when matches are available
  React.useEffect(() => {
    if (!selectedMatchId && tournamentMatches.length > 0) {
      setSelectedMatchId(tournamentMatches[0].id);
    }
  }, [selectedMatchId, tournamentMatches]);

  // Auto-select first available segment when segments are loaded
  React.useEffect(() => {
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
  React.useEffect(() => {
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
  React.useEffect(() => {
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

      {/* Notifications */}
      {notifications.length > 0 && (
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
          {/* Judge Selection - Only show if not auto-selected or if admin */}
          {(!isJudge || !currentUser) && (
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

          {/* Current Judge Info - Show if auto-selected */}
          {isJudge && currentUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Judge: {currentUser.name}
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {/* Match Selection */}
          {effectiveJudgeId && (
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
                      const roleLabel = match.judgeRole === 'SENSORY' ? 'Cappuccino Judge' : 'Espresso Judge';
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
            <Card>
              <CardHeader>
                <CardTitle>Scoring: {selectedSegmentType === 'CAPPUCCINO' ? 'Cappuccino (including Visual Latte Art)' : 'Espresso (sensory categories only)'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Blind Judging Notice - Judges don't see cup codes */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">Blind Judging: Score based on Left/Right cup positions only</span>
                  </div>
                </div>

                {/* Visual/Latte Art (3 points) - ONLY on CAPPUCCINO */}
                {selectedSegmentType === 'CAPPUCCINO' && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold">Visual/Latte Art (3 points)</Label>
                      {visualLatteArt && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {visualLatteArt.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={visualLatteArt === 'left'}
                          onCheckedChange={(checked) => setVisualLatteArt(checked ? 'left' : null)}
                        />
                        <Label className="cursor-pointer">Left</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={visualLatteArt === 'right'}
                          onCheckedChange={(checked) => setVisualLatteArt(checked ? 'right' : null)}
                        />
                        <Label className="cursor-pointer">Right</Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sensory Categories (for both CAPPUCCINO and ESPRESSO) */}
                <>
                  {/* Taste (1 point) */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">Taste (1 point)</Label>
                        {taste && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {taste.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={taste === 'left'}
                            onCheckedChange={(checked) => setTaste(checked ? 'left' : null)}
                          />
                          <Label className="cursor-pointer">Left</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={taste === 'right'}
                            onCheckedChange={(checked) => setTaste(checked ? 'right' : null)}
                          />
                          <Label className="cursor-pointer">Right</Label>
                        </div>
                      </div>
                    </div>

                    {/* Tactile (1 point) */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">Tactile (1 point)</Label>
                        {tactile && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {tactile.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={tactile === 'left'}
                            onCheckedChange={(checked) => setTactile(checked ? 'left' : null)}
                          />
                          <Label className="cursor-pointer">Left</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={tactile === 'right'}
                            onCheckedChange={(checked) => setTactile(checked ? 'right' : null)}
                          />
                          <Label className="cursor-pointer">Right</Label>
                        </div>
                      </div>
                    </div>

                    {/* Flavour (1 point) */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">Flavour (1 point)</Label>
                        {flavour && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {flavour.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={flavour === 'left'}
                            onCheckedChange={(checked) => setFlavour(checked ? 'left' : null)}
                          />
                          <Label className="cursor-pointer">Left</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={flavour === 'right'}
                            onCheckedChange={(checked) => setFlavour(checked ? 'right' : null)}
                          />
                          <Label className="cursor-pointer">Right</Label>
                        </div>
                      </div>
                    </div>

                    {/* Overall (5 points) */}
                    <div className="p-4 border rounded-lg bg-primary/5">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">Overall (5 points)</Label>
                        {overall && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {overall.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={overall === 'left'}
                            onCheckedChange={(checked) => setOverall(checked ? 'left' : null)}
                          />
                          <Label className="cursor-pointer font-medium">Left</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={overall === 'right'}
                            onCheckedChange={(checked) => setOverall(checked ? 'right' : null)}
                          />
                          <Label className="cursor-pointer font-medium">Right</Label>
                        </div>
                      </div>
                    </div>
                </>

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

