import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Clock, Play, Square, Pause, CheckCircle2, Info, ChevronDown, ExternalLink, Coffee, ArrowRight, AlertTriangle, Loader2, Edit2, Save, X, Trophy } from "lucide-react";
import type { Station, Match, HeatSegment, User } from "@shared/schema";
import { getMainStationsForTournament, normalizeStationName } from '@/utils/stationUtils';
import { useWebSocket } from "@/hooks/useWebSocket";
import StationWarning from "./StationWarning";
import SegmentTimer from "./SegmentTimer";
import SevenSegmentTimer from "./SevenSegmentTimer";
import JudgesStatusMonitor from "./JudgesStatusMonitor";
import AdminCupPositionAssignment from "./AdminCupPositionAssignment";

export default function StationLeadView() {
  const { toast } = useToast();
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const [pausedSegmentId, setPausedSegmentId] = useState<number | null>(null);
  const [pausedTimes, setPausedTimes] = useState<Record<number, { pausedAt: number; elapsedBeforePause: number; pauseDuration: number }>>({});
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingMinutes, setEditingMinutes] = useState<number>(0);
  const socket = useWebSocket();
  const [searchParams] = useSearchParams();

  // Station timing coordination state
  const [stationTimingAlert, setStationTimingAlert] = useState<{
    message: string;
    countdown: number;
    show: boolean;
  } | null>(null);

  // Fetch tournaments to get the current one
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });

  const currentTournament = tournaments[0];
  const currentTournamentId = currentTournament?.id || 1;
  const enabledStations = currentTournament?.enabledStations || ['A', 'B', 'C'];

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Filter to only show enabled stations for the current tournament
  const mainStations = React.useMemo(() => {
    return getMainStationsForTournament(stations, currentTournamentId, enabledStations);
  }, [stations, currentTournamentId, enabledStations]);

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch participants to get cup codes
  const { data: participants = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments', currentTournamentId, 'participants'],
    enabled: !!currentTournamentId,
  });

  // Select station from query param or default to first available
  useEffect(() => {
    if (mainStations.length === 0) return;

    const stationParam = searchParams.get('stationId');
    const stationIdFromParam = stationParam ? Number(stationParam) : null;

    if (stationIdFromParam && mainStations.some(s => s.id === stationIdFromParam)) {
      setSelectedStation(stationIdFromParam);
      return;
    }

    if (!selectedStation) {
      setSelectedStation(mainStations[0].id);
    }
  }, [mainStations, selectedStation, searchParams]);

  // Fetch current matches for tournament
  const { data: allMatches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${currentTournamentId}/matches`],
    enabled: !!currentTournamentId,
  });

  // Get current round number - only consider matches assigned to stations
  // (ignore placeholder matches with stationId = null, same as backend logic)
  const currentRound = React.useMemo(() => {
    const matchesWithStations = allMatches.filter(m => m.stationId !== null);
    if (matchesWithStations.length === 0) return null;
    return Math.max(...matchesWithStations.map(m => m.round));
  }, [allMatches]);

  // Check if current round is complete using backend API
  // Backend validates: segments ended, judges scored, cup positions assigned
  const { data: roundCompletionStatus } = useQuery<{
    isComplete: boolean;
    round: number;
    totalMatches: number;
    completedMatches: number;
    matchesWithWinners: number;
    incompleteMatches: any[];
    matchesWithoutWinners: any[];
    stationStatus: Array<{
      stationId: number;
      stationName: string;
      totalMatches: number;
      completedMatches: number;
      matchesWithWinners: number;
      incompleteMatches: any[];
      matchesWithoutWinners: any[];
      isComplete: boolean;
    }>;
    errors: string[];
  }>({
    queryKey: [`/api/tournaments/${currentTournamentId}/round-completion`, currentRound],
    queryFn: async () => {
      if (!currentTournamentId || !currentRound) return null;
      const response = await fetch(`/api/tournaments/${currentTournamentId}/round-completion?round=${currentRound}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!currentTournamentId && currentRound !== null,
    refetchInterval: 3000, // Poll every 3 seconds to catch completion
  });

  const isCurrentRoundComplete = roundCompletionStatus?.isComplete ?? false;

  // Detect if we're in the final round
  // Final round = only 1 match in current round with 2 competitors
  const isFinalRound = React.useMemo(() => {
    if (!currentRound || allMatches.length === 0) return false;
    const matchesWithStations = allMatches.filter(m => m.stationId !== null);
    const currentRoundMatches = matchesWithStations.filter(m => m.round === currentRound);
    return currentRoundMatches.length === 1 && 
           currentRoundMatches[0].competitor1Id !== null && 
           currentRoundMatches[0].competitor2Id !== null;
  }, [currentRound, allMatches]);

  // Filter matches for this station, prioritizing current round matches
  const stationMatches = allMatches.filter(m => m.stationId === selectedStation);
  
  // Diagnostic logging
  React.useEffect(() => {
    if (selectedStation && allMatches.length > 0) {
      const stationMatchesAllRounds = allMatches.filter(m => m.stationId === selectedStation);
      const stationRound1 = stationMatchesAllRounds.filter(m => m.round === 1);
      const stationRound2 = stationMatchesAllRounds.filter(m => m.round === 2);
      const selectedStationData = stations.find(s => s.id === selectedStation);
      console.log(`🔍 Station ${selectedStationData?.name || selectedStation} (ID: ${selectedStation}):`, {
        totalMatches: stationMatchesAllRounds.length,
        round1Matches: stationRound1.length,
        round2Matches: stationRound2.length,
        round1: stationRound1.map(m => ({ id: m.id, heatNumber: m.heatNumber, status: m.status, round: m.round })),
        round2: stationRound2.map(m => ({ id: m.id, heatNumber: m.heatNumber, status: m.status, round: m.round }))
      });
    }
  }, [selectedStation, allMatches, stations]);

  // Prioritize matches from the current round (or highest round if currentRound is null)
  const targetRound = currentRound || (stationMatches.length > 0 ? Math.max(...stationMatches.map(m => m.round)) : null);
  const currentRoundMatches = targetRound ? stationMatches.filter(m => m.round === targetRound) : stationMatches;
  
  const currentMatch = currentRoundMatches.find(m => m.status === 'RUNNING') || 
                       currentRoundMatches.find(m => m.status === 'READY') ||
                       currentRoundMatches[0] ||
                       // Fallback to any match if no current round matches found
                       stationMatches.find(m => m.status === 'RUNNING') ||
                       stationMatches.find(m => m.status === 'READY') ||
                       stationMatches[0];

  // Fetch segments for current match
  const { data: segments = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${currentMatch?.id}/segments`],
    enabled: !!currentMatch,
  });

  // Check if Cappuccino segment has ended
  const cappuccinoSegment = React.useMemo(() => {
    return segments.find(s => s.segment === 'CAPPUCCINO');
  }, [segments]);

  const isCappuccinoEnded = cappuccinoSegment?.status === 'ENDED';
  const espressoSegment = React.useMemo(() => {
    return segments.find(s => s.segment === 'ESPRESSO');
  }, [segments]);
  const isEspressoEnded = espressoSegment?.status === 'ENDED';
  const isEspressoStarted = espressoSegment?.status === 'RUNNING' || espressoSegment?.status === 'ENDED';

  // Determine if ESPRESSO segment can be started (no judge completion check - segments proceed without blocking)
  const canStartEspresso = React.useMemo(() => {
    if (!isCappuccinoEnded) return false;
    if (isEspressoStarted) return false;
    // ESPRESSO can start immediately after CAPPUCCINO ends - no judge completion check
    return true;
  }, [isCappuccinoEnded, isEspressoStarted]);

  // Fetch judge completion status for heat completion (CAPPUCCINO and ESPRESSO)
  // This is checked before advancing to next heat, not before starting segments
  // Enable query for RUNNING matches OR when segments are ENDED (to catch completion after status changes)
  const { data: cappuccinoJudgeCompletion } = useQuery<{
    allComplete: boolean;
    judges: Array<{
      judgeId: number;
      judgeName: string;
      role: 'ESPRESSO' | 'CAPPUCCINO';
      completed: boolean;
    }>;
  }>({
    queryKey: [`/api/matches/${currentMatch?.id}/segments/CAPPUCCINO/judges-completion`],
    queryFn: async () => {
      if (!currentMatch?.id) return { allComplete: false, judges: [] };
      const response = await fetch(`/api/matches/${currentMatch.id}/segments/CAPPUCCINO/judges-completion`);
      if (!response.ok) return { allComplete: false, judges: [] };
      return response.json();
    },
    enabled: !!currentMatch?.id && (currentMatch?.status === 'RUNNING' || isCappuccinoEnded),
    refetchInterval: 3000, // Poll every 3 seconds when heat is running or cappuccino ended
  });

  const { data: espressoJudgeCompletion } = useQuery<{
    allComplete: boolean;
    judges: Array<{
      judgeId: number;
      judgeName: string;
      role: 'ESPRESSO' | 'CAPPUCCINO';
      completed: boolean;
    }>;
  }>({
    queryKey: [`/api/matches/${currentMatch?.id}/segments/ESPRESSO/judges-completion`],
    queryFn: async () => {
      if (!currentMatch?.id) return { allComplete: false, judges: [] };
      const response = await fetch(`/api/matches/${currentMatch.id}/segments/ESPRESSO/judges-completion`);
      if (!response.ok) return { allComplete: false, judges: [] };
      return response.json();
    },
    enabled: !!currentMatch?.id && (currentMatch?.status === 'RUNNING' || isEspressoEnded),
    refetchInterval: 3000, // Poll every 3 seconds when heat is running or espresso ended
  });

  // Check if all judges have completed scoring (for heat advancement)
  // Only require completion for segments that actually exist
  const allJudgesCompleted = React.useMemo(() => {
    const hasCappuccino = segments.some(s => s.segment === 'CAPPUCCINO');
    const hasEspresso = segments.some(s => s.segment === 'ESPRESSO');
    const cappuccinoComplete = !hasCappuccino || (cappuccinoJudgeCompletion?.allComplete ?? false);
    const espressoComplete = !hasEspresso || (espressoJudgeCompletion?.allComplete ?? false);
    return cappuccinoComplete && espressoComplete;
  }, [cappuccinoJudgeCompletion, espressoJudgeCompletion, segments]);

  // Fetch cup positions to check if they're assigned
  // Enable query when judges are complete OR when match is RUNNING (to catch completion)
  const { data: cupPositions = [] } = useQuery<Array<{ cupCode: string; position: 'left' | 'right' }>>({
    queryKey: [`/api/matches/${currentMatch?.id}/cup-positions`],
    queryFn: async () => {
      if (!currentMatch?.id) return [];
      const response = await fetch(`/api/matches/${currentMatch.id}/cup-positions`);
      if (!response.ok) return [];
      const positions = await response.json();
      return positions.map((p: any) => ({ cupCode: p.cupCode, position: p.position }));
    },
    enabled: !!currentMatch?.id && (currentMatch?.status === 'RUNNING' || allJudgesCompleted),
    refetchInterval: 3000, // Poll every 3 seconds when judges are complete or match is running
  });

  // Check if cup positions are assigned
  const cupPositionsAssigned = React.useMemo(() => {
    return cupPositions.length === 2 && 
           cupPositions.some(p => p.position === 'left') && 
           cupPositions.some(p => p.position === 'right');
  }, [cupPositions]);

  // Can advance heat only if all judges completed AND cup positions assigned (when match is RUNNING)
  // If match is not RUNNING, we can advance (no checks needed)
  const canAdvanceHeat = React.useMemo(() => {
    if (currentMatch?.status !== 'RUNNING') return true;
    return allJudgesCompleted && cupPositionsAssigned;
  }, [currentMatch?.status, allJudgesCompleted, cupPositionsAssigned]);

  const startSegmentMutation = useMutation({
    mutationFn: async (segmentId: number) => {
      // Get segment info to check if it's ESPRESSO
      const segment = segments.find(s => s.id === segmentId);
      
      // Start segment without assigning left/right positions
      // Cup codes stay with baristas throughout all segments
      // Left/right positions will be assigned by admin after all judges have scored
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RUNNING',
          startTime: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start segment' }));
        throw new Error(errorData.error || 'Failed to start segment');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      // Force immediate refetch to update timer
      queryClient.refetchQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      setCurrentSegmentId(data.id);
      toast({
        title: "Segment Started",
        description: `${data.segment} segment has begun.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "An error occurred while starting the segment.";
      
      toast({
        title: "Failed to Start Segment",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const endSegmentMutation = useMutation({
    mutationFn: async (segmentId: number) => {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ENDED',
          endTime: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Failed to end segment');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      setCurrentSegmentId(null);
      toast({
        title: "Segment Ended",
        description: `${data.segment} segment has completed.`,
      });
    }
  });

  const startMatchMutation = useMutation({
    mutationFn: async (matchId: number) => {
      // First, update match status to RUNNING
      const matchResponse = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RUNNING',
          startTime: new Date().toISOString()
        })
      });
      if (!matchResponse.ok) throw new Error('Failed to start match');
      const matchData = await matchResponse.json();

      // Fetch segments for this match to get the Dial-In segment
      const segmentsResponse = await fetch(`/api/matches/${matchId}/segments`);
      if (!segmentsResponse.ok) {
        console.warn('Failed to fetch segments, segments may not exist yet');
        return { match: matchData, segment: null };
      }
      const matchSegments = await segmentsResponse.json();

      // Ensure segments exist - if not, they should be created by the match creation endpoint
      if (!matchSegments || matchSegments.length === 0) {
        console.warn('No segments found for match, cannot auto-start Dial-In');
        return { match: matchData, segment: null };
      }

      // Then, automatically start the Dial-In segment
      const dialInSegment = matchSegments.find((s: HeatSegment) => s.segment === 'DIAL_IN');
      if (dialInSegment && dialInSegment.id) {
        // Get competitor cup codes from participants
        const comp1Participant = currentMatch?.competitor1Id 
          ? participants.find(p => p.userId === currentMatch.competitor1Id)
          : null;
        const comp2Participant = currentMatch?.competitor2Id 
          ? participants.find(p => p.userId === currentMatch.competitor2Id)
          : null;

        // Ensure both participants have cup codes - if not, fetch from server or generate
        let cupCode1 = comp1Participant?.cupCode || null;
        let cupCode2 = comp2Participant?.cupCode || null;

        // If cup codes are missing, try to get them from the server
        if (!cupCode1 && comp1Participant) {
          // Fetch updated participant data
          const participantResponse = await fetch(`/api/tournaments/${currentTournamentId}/participants`);
          if (participantResponse.ok) {
            const allParticipants = await participantResponse.json();
            const updatedParticipant = allParticipants.find((p: any) => p.userId === currentMatch.competitor1Id);
            cupCode1 = updatedParticipant?.cupCode || null;
          }
        }

        if (!cupCode2 && comp2Participant) {
          // Fetch updated participant data
          const participantResponse = await fetch(`/api/tournaments/${currentTournamentId}/participants`);
          if (participantResponse.ok) {
            const allParticipants = await participantResponse.json();
            const updatedParticipant = allParticipants.find((p: any) => p.userId === currentMatch.competitor2Id);
            cupCode2 = updatedParticipant?.cupCode || null;
          }
        }

        // If still missing, throw error - cup codes must be assigned before starting heat
        if (!cupCode1 || !cupCode2) {
          throw new Error(`Cannot start heat: Cup codes are missing. Competitor 1: ${cupCode1 || 'MISSING'}, Competitor 2: ${cupCode2 || 'MISSING'}. Please assign cup codes to participants before starting the heat.`);
        }

        // Randomly assign cup codes to left/right positions
        const shouldSwap = Math.random() < 0.5;
        const leftCupCode = shouldSwap ? cupCode2 : cupCode1;
        const rightCupCode = shouldSwap ? cupCode1 : cupCode2;

        const segmentResponse = await fetch(`/api/segments/${dialInSegment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'RUNNING',
            startTime: new Date().toISOString(),
            leftCupCode,
            rightCupCode
          })
        });
        if (!segmentResponse.ok) throw new Error('Failed to start Dial-In segment');
        const segmentData = await segmentResponse.json();

        // Server will handle station timing coordination via WebSocket events
        // No need to emit client-side as server handles it in the PATCH endpoint

        return { match: matchData, segment: segmentData };
      }

      return { match: matchData, segment: null };
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh UI immediately
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      if (data.segment) {
        setCurrentSegmentId(data.segment.id);
        // Force immediate refetch of segments to update timer
        queryClient.refetchQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      }
      toast({
        title: "Heat Started",
        description: `Round ${data.match.round}, Heat ${data.match.heatNumber} has begun. Dial-In segment started automatically.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Heat",
        description: error.message || "An error occurred while starting the heat.",
        variant: "destructive",
      });
    }
  });

  // REMOVED: completeMatchMutation - All heats must go through advance-heat endpoint
  // which validates: segments ended, judges scored, cup positions assigned
  // This ensures the global rule: Judges score → Enter cup codes → Advance heat

  const advanceHeatMutation = useMutation({
    mutationFn: async (stationId: number) => {
      const response = await fetch(`/api/stations/${stationId}/advance-heat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to advance heat' }));
        const error = new Error(errorData.error || 'Failed to advance heat');
        (error as any).errorData = errorData;
        throw error;
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });

      if (data.next) {
        toast({
          title: "Heat Advanced",
          description: `Advanced to Heat ${data.next.heatNumber}. Ready to start when competitors are prepared.`,
        });
      } else {
        toast({
          title: "Heat Completed",
          description: data.message || "No more heats in queue for this station.",
        });
      }
    },
    onError: (error: any) => {
      // Extract detailed error message
      let errorMessage = error.message || "An error occurred while advancing to the next heat.";
      
      // If error has errorData (from our custom error), use that
      if (error.errorData?.error) {
        errorMessage = error.errorData.error;
      }

      // Check if error is about cup positions
      const isCupPositionError = errorMessage.includes('cup') || errorMessage.includes('Cup') || errorMessage.includes('position');

      toast({
        title: "Cannot Advance Heat",
        description: errorMessage,
        variant: "destructive",
        duration: isCupPositionError || errorMessage.includes('judge') ? 8000 : 5000, // Longer duration for important errors
      });
    }
  });

  // Update segment timing mutation
  const updateSegmentTimingMutation = useMutation({
    mutationFn: async ({ segmentId, plannedMinutes }: { segmentId: number; plannedMinutes: number }) => {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plannedMinutes }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update segment timing' }));
        throw new Error(error.error || 'Failed to update segment timing');
      }
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      setEditingSegmentId(null);
      toast({
        title: "Timing Updated",
        description: `Segment timing updated to ${variables.plannedMinutes} minutes.`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to update segment timing',
        variant: "destructive",
      });
    },
  });

  const populateNextRoundMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tournaments/${currentTournamentId}/populate-next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to populate next round' }));
        const error = new Error(errorData.error || 'Failed to populate next round');
        (error as any).errorData = errorData; // Attach full error data for diagnostic display
        throw error;
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate all tournament-related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}`] }); // Refresh tournament to get updated currentRound
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/round-completion`] }); // Refresh round completion status
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/participants`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] }); // Refresh tournament list
      
      if (data.tournamentComplete) {
        toast({
          title: "🏆 Tournament Complete!",
          description: `Tournament has been finalized! Calculating results...`,
        });
        // Navigate to results page after a short delay
        setTimeout(() => {
          const tournamentSlug = currentTournament?.name?.toLowerCase().replace(/\s+/g, '-') || 'tournament';
          window.location.href = `/results/${tournamentSlug}/final-results`;
        }, 1500);
      } else {
        toast({
          title: "Next Round Populated",
          description: `Round ${data.nextRound} has been created with ${data.advancingCompetitors || data.matchesCreated} matches. Ready to start heats!`,
        });
      }
    },
    onError: (error: any) => {
      // Log full error details to console for debugging
      console.error('Populate Next Round Error:', error);
      if (error.errorData?.diagnostic) {
        console.error('Diagnostic Info:', error.errorData.diagnostic);
      }
      
      let errorMessage = error.message || "An error occurred while populating the next round. Please check that the current round is complete and all matches have winners.";
      
      // Include diagnostic info in error message if available
      if (error.errorData?.diagnostic) {
        const diag = error.errorData.diagnostic;
        errorMessage += `\n\nDiagnostic: Calculated Round ${diag.calculatedRound}, Tournament Round ${diag.tournamentCurrentRound}, Rounds with matches: [${diag.allRoundsWithMatches?.join(', ')}], Rounds completed: [${diag.roundsWithCompleted?.join(', ')}]`;
        if (diag.round3MatchesWithStations > 0) {
          errorMessage += `\n⚠️ Found ${diag.round3MatchesWithStations} Round 3 matches with stations assigned (this may be the issue).`;
        }
      }
      
      toast({
        title: "Failed to Populate Next Round",
        description: errorMessage,
        variant: "destructive",
        duration: 12000,
      });
    }
  });

  const finalizeStationRoundMutation = useMutation({
    mutationFn: async ({ stationId, round }: { stationId: number; round: number }) => {
      // First, ensure the current heat is completed through advance-heat if it's still RUNNING
      // The backend finalize-station-round endpoint will handle calculating winners for any
      // DONE matches that are missing winnerId
      if (currentMatch && currentMatch.status === 'RUNNING' && currentMatch.stationId === stationId && currentMatch.round === round) {
        const advanceResponse = await fetch(`/api/stations/${stationId}/advance-heat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!advanceResponse.ok) {
          const error = await advanceResponse.json().catch(() => ({ error: 'Failed to complete current heat before finalizing station round' }));
          throw new Error(error.error || 'Failed to complete current heat before finalizing station round');
        }
      }
      
      // Then finalize the station's round (backend will calculate winners for any matches missing winnerId)
      const response = await fetch(`/api/tournaments/${currentTournamentId}/finalize-station-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stationId, round })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to finalize station round' }));
        throw new Error(error.error || 'Failed to finalize station round');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
      toast({
        title: "Station Round Finalized",
        description: `Station ${data.stationName} Round ${data.round} finalized. Winners advanced to next round pool.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Finalize Station Round",
        description: error.message || "An error occurred while finalizing the station round.",
        variant: "destructive",
      });
    }
  });

  const handleStartSegment = (segmentId: number) => {
    startSegmentMutation.mutate(segmentId);
  };

  const handleEndSegment = (segmentId: number) => {
    endSegmentMutation.mutate(segmentId);
  };

  const handleStartMatch = (matchId: number) => {
    startMatchMutation.mutate(matchId);
  };

  const handleCompleteMatch = (matchId: number) => {
    completeMatchMutation.mutate(matchId);
  };

  const handleAdvanceHeat = () => {
    if (selectedStation) {
      advanceHeatMutation.mutate(selectedStation);
    }
  };

  const handlePopulateNextRound = () => {
    populateNextRoundMutation.mutate();
  };

  const handleFinalizeStationRound = () => {
    if (selectedStation && currentMatch) {
      finalizeStationRoundMutation.mutate({ 
        stationId: selectedStation, 
        round: currentMatch.round 
      });
    }
  };

  // Check if current heat is the last heat for this station in this round
  const isLastHeatInRound = React.useMemo(() => {
    if (!currentMatch || !selectedStation) return false;
    
    const currentRound = currentMatch.round;
    const stationRoundMatches = stationMatches.filter(m => m.round === currentRound);
    const sortedMatches = stationRoundMatches.sort((a, b) => a.heatNumber - b.heatNumber);
    const lastMatch = sortedMatches[sortedMatches.length - 1];
    
    return currentMatch.id === lastMatch?.id;
  }, [currentMatch, selectedStation, stationMatches]);

  const selectedStationData = stations.find(s => s.id === selectedStation);
  const competitor1 = users.find(u => u.id === currentMatch?.competitor1Id);
  const competitor2 = users.find(u => u.id === currentMatch?.competitor2Id);

  const runningSegment = segments.find(s => s.status === 'RUNNING');
  const allSegmentsEnded = segments.length > 0 && segments.every(s => s.status === 'ENDED');

  // Calculate current segment time remaining for prominent display - ALWAYS VISIBLE
  // Shows current segment countdown, or next segment's planned time if heat is running but no segment active
  const [currentSegmentTimeRemaining, setCurrentSegmentTimeRemaining] = useState<number>(0);
  const [currentSegmentName, setCurrentSegmentName] = useState<string>('READY');

  useEffect(() => {
    // If a segment is running, show its countdown (independent timer for each segment)
    if (runningSegment && runningSegment.startTime) {
      // Check if this segment is paused
      const isPaused = pausedSegmentId === runningSegment.id;
      const currentPausedTimes = pausedTimes; // Capture in closure
      const pauseData = currentPausedTimes[runningSegment.id];

      const calculateRemaining = () => {
        if (isPaused && pauseData) {
          // Use the elapsed time from when it was paused (frozen time)
          return Math.max(0, (runningSegment.plannedMinutes * 60) - pauseData.elapsedBeforePause);
        } else {
          // Calculate normally based on start time, accounting for pause duration if resumed
          const now = new Date();
          const start = new Date(runningSegment.startTime!);
          let elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);

          // If we resumed from a pause, subtract the pause duration
          if (pauseData && pauseData.pauseDuration > 0) {
            elapsed -= pauseData.pauseDuration;
          }

          const totalSeconds = runningSegment.plannedMinutes * 60;
          return Math.max(0, totalSeconds - elapsed);
        }
      };

      const remaining = calculateRemaining();
      setCurrentSegmentTimeRemaining(remaining);
      setCurrentSegmentName(isPaused 
        ? `${runningSegment.segment.replace('_', ' ')} (PAUSED)`
        : runningSegment.segment.replace('_', ' '));

      // Only update timer if not paused
      if (!isPaused) {
        const interval = setInterval(() => {
          const newRemaining = calculateRemaining();
          setCurrentSegmentTimeRemaining(newRemaining);
          if (newRemaining === 0) {
            clearInterval(interval);
            // When segment ends, check for next segment
            const segmentOrder = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
            const currentIndex = segmentOrder.indexOf(runningSegment.segment);
            if (currentIndex < segmentOrder.length - 1) {
              const nextCode = segmentOrder[currentIndex + 1];
              const nextSeg = segments.find(s => s.segment === nextCode);
              if (nextSeg && nextSeg.status === 'IDLE') {
                setCurrentSegmentTimeRemaining(nextSeg.plannedMinutes * 60);
                setCurrentSegmentName(`NEXT: ${nextCode.replace('_', ' ')}`);
              }
            }
          }
        }, 1000);

        return () => clearInterval(interval);
      }
    } else if (currentMatch?.status === 'RUNNING' && segments.length > 0) {
      // Heat is running but no segment is active - show next segment's planned time in sequence
      const segmentOrder = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
      const nextSegment = segmentOrder.find(code => {
        const seg = segments.find(s => s.segment === code);
        return seg && seg.status === 'IDLE';
      });

      if (nextSegment) {
        const seg = segments.find(s => s.segment === nextSegment);
        if (seg) {
          setCurrentSegmentTimeRemaining(seg.plannedMinutes * 60);
          setCurrentSegmentName(`NEXT: ${nextSegment.replace('_', ' ')}`);
        } else {
          setCurrentSegmentTimeRemaining(0);
          setCurrentSegmentName('READY');
        }
      } else {
        // All segments done or no next segment
        setCurrentSegmentTimeRemaining(0);
        setCurrentSegmentName('HEAT COMPLETE');
      }
    } else {
      // Heat not running - show 00:00
      setCurrentSegmentTimeRemaining(0);
      setCurrentSegmentName('READY');
    }
  }, [runningSegment, pausedSegmentId, currentMatch?.status, segments, pausedTimes]);

  // Calculate station warnings based on other stations
  const getStationWarnings = () => {
    const warnings: Array<{ referenceStationName: string; targetStartTime: Date }> = [];

    // Use enabled stations from tournament (fallback to A, B, C for backward compatibility)
    const stationOrder = enabledStations;
    const currentStationNormalizedName = normalizeStationName(selectedStationData?.name || '');
    const currentStationIndex = stationOrder.indexOf(currentStationNormalizedName);

    if (currentStationIndex === -1) {
      return warnings;
    }

    // Calculate warnings based on which stations have started
    const stationsStartTimes: Record<string, Date | null> = {};

    // Get start times for all stations (not just RUNNING - include DONE matches too)
    for (const station of stations) {
      const match = allMatches.find(m => 
        m.stationId === station.id && 
        m.startTime && 
        (m.status === 'RUNNING' || m.status === 'DONE')
      );
      if (match?.startTime) {
        stationsStartTimes[station.name] = new Date(match.startTime);
      }
    }

    // Find the most recent preceding station that has started
    // Look backwards from current station to find the closest one that's running
    let precedingStation: string | null = null;
    let precedingTime: Date | null = null;

    for (let i = currentStationIndex - 1; i >= 0; i--) {
      const stationName = stationOrder[i];
      if (stationsStartTimes[stationName]) {
        precedingStation = stationName;
        precedingTime = stationsStartTimes[stationName];
        break; // Found the most recent preceding station
      }
    }

    // If a preceding station has started and current station hasn't started yet
    if (precedingStation && precedingTime && !stationsStartTimes[selectedStationData?.name || '']) {
      // Current station should start 10 minutes after the preceding station
      const targetStartTime = new Date(precedingTime.getTime() + (10 * 60 * 1000));
      const secondsUntilStart = Math.ceil((targetStartTime.getTime() - Date.now()) / 1000);

      if (secondsUntilStart > 0 && secondsUntilStart <= 20 * 60) {
        warnings.push({
          referenceStationName: precedingStation,
          targetStartTime
        });
      }
    }

    return warnings;
  };

  const stationWarnings = getStationWarnings();
  const [rulesOpen, setRulesOpen] = useState(false);

  // Join tournament room for real-time updates
  useEffect(() => {
    if (!socket || !currentTournamentId) return;
    
    socket.emit("join:tournament", currentTournamentId);
    console.log(`Joined tournament room: ${currentTournamentId}`);
    
    return () => {
      // Note: Socket.IO doesn't have a direct "leave" event, but leaving the room
      // happens automatically on disconnect or when component unmounts
    };
  }, [socket, currentTournamentId]);

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleSegmentStarted = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      // Also invalidate all matches to update heat status across all clients
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
    };

    const handleSegmentEnded = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
    };

    const handleStationTimingStart = (data: {
      stationA?: { started: boolean; startTime: Date };
      stationB?: { countdown?: number; started?: boolean; startTime?: Date };
      stationC?: { countdown: number };
    }) => {
      const currentStationName = normalizeStationName(selectedStationData?.name || '');

      if (currentStationName === 'B' && data.stationB?.countdown !== undefined) {
        setStationTimingAlert({
          message: 'Station A has started DIAL-IN. Your station starts in:',
          countdown: data.stationB.countdown,
          show: true
        });
      } else if (currentStationName === 'C') {
        // Station C can receive countdown from either Station A (20 min fallback) or Station B (10 min)
        if (data.stationC?.countdown !== undefined) {
          if (data.stationB?.started) {
            // Station B has started, so Station C gets 10 min countdown
            setStationTimingAlert({
              message: 'Station B has started DIAL-IN. Your station starts in:',
              countdown: data.stationC.countdown,
              show: true
            });
          } else if (data.stationA?.started) {
            // Station A has started, so Station C gets 20 min fallback countdown
            setStationTimingAlert({
              message: 'Station A has started DIAL-IN. Your station starts in:',
              countdown: data.stationC.countdown,
              show: true
            });
          }
        }
      }
    };

    const handleHeatStarted = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
    };

    const handleHeatCompleted = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
    };

    const handleHeatAdvanced = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
    };

    const handleNextRoundPopulated = (data: any) => {
      console.log('StationLeadView: next-round-populated event received', data);
      // Force comprehensive refresh of all tournament data
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/round-completion`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      toast({
        title: "Next Round Ready",
        description: `Round ${data.round} has been set up. ${data.advancingCompetitors || 0} competitors advancing.`,
      });
    };

    const handleRoundComplete = (data: any) => {
      console.log('StationLeadView: round:complete event received', data);
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/round-completion`] });
    };

    socket.on("segment:started", handleSegmentStarted);
    socket.on("segment:ended", handleSegmentEnded);
    socket.on("station-timing:dial-in-started", handleStationTimingStart);
    socket.on("heat:started", handleHeatStarted);
    socket.on("heat:completed", handleHeatCompleted);
    socket.on("heat:advanced", handleHeatAdvanced);
    socket.on("next-round-populated", handleNextRoundPopulated);
    socket.on("round:complete", handleRoundComplete);

    return () => {
      socket.off("segment:started", handleSegmentStarted);
      socket.off("segment:ended", handleSegmentEnded);
      socket.off("station-timing:dial-in-started", handleStationTimingStart);
      socket.off("heat:started", handleHeatStarted);
      socket.off("heat:completed", handleHeatCompleted);
      socket.off("heat:advanced", handleHeatAdvanced);
      socket.off("next-round-populated", handleNextRoundPopulated);
      socket.off("round:complete", handleRoundComplete);
    };
  }, [socket, currentMatch?.id, selectedStationData?.name, currentTournamentId]);

  // Countdown for station timing coordination
  useEffect(() => {
    if (!stationTimingAlert?.show || stationTimingAlert.countdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setStationTimingAlert(prev => {
        if (!prev) return null;
        const newCountdown = prev.countdown - 1;

        if (newCountdown <= 0) {
          toast({
            title: "Station Ready!",
            description: "Your station should begin the heat now.",
            duration: 10000,
          });
          return { ...prev, show: false, countdown: 0 };
        }

        return { ...prev, countdown: newCountdown };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stationTimingAlert, toast]);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 dark:bg-background bg-[#f2e6d3]">
      <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-primary/10 border border-[var(--brand-light-sand)]/70 shadow-sm">
        <CardHeader className="flex flex-col space-y-1.5 p-4 sm:p-6 dark:bg-transparent bg-[#bd490f]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-[#9a4828]">
            <CardTitle className="flex items-center gap-2 text-primary text-lg sm:text-xl">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="truncate">Station Lead Control</span>
            </CardTitle>
            {/* Prominent Countdown Timer - Always Visible */}
            <div className="flex flex-col items-center sm:items-end gap-1.5 sm:gap-2 w-full sm:w-auto sm:min-w-[180px] flex-shrink-0">
              <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide text-center">
                {currentSegmentName}
              </div>
              <div className="rounded-lg p-1.5 sm:p-2 w-full sm:w-auto max-w-[200px] sm:max-w-none">
                <SevenSegmentTimer 
                  timeRemaining={currentSegmentTimeRemaining} 
                  isPaused={pausedSegmentId === runningSegment?.id}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 dark:bg-transparent bg-[#bd490f]">
          <div className="grid grid-cols-3 gap-2">
            {mainStations.map((station) => {
              const stationLead = station.stationLeadId ? users.find(u => u.id === station.stationLeadId) : null;
              const displayName = `Station ${station.normalizedName}`;
              return (
                <Button
                  key={station.id}
                  variant={selectedStation === station.id ? "default" : "outline"}
                  onClick={() => setSelectedStation(station.id)}
                  data-testid={`button-station-${station.normalizedName}`}
                  className="gap-2 whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 text-primary-foreground border border-primary-border min-h-[44px] sm:min-h-9 px-4 flex flex-col items-start justify-center h-auto py-2 sm:py-2 text-xs sm:text-sm min-w-0 bg-[#9a4828] touch-target"
                >
                  <span className="truncate w-full text-center sm:text-left">{displayName}</span>
                  {stationLead && (
                    <span className="text-[10px] sm:text-xs opacity-80 font-normal truncate w-full text-center sm:text-left">Lead: {stationLead.name}</span>
                  )}
                </Button>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="secondary" className="w-full md:w-auto min-h-[44px] touch-target bg-[var(--brand-light-sand)]/70 dark:bg-secondary hover:bg-[var(--brand-light-sand)]/90 dark:hover:bg-secondary/90">
              <Link to={`/live/${currentTournamentId}/stations`}>
                Back to Station Management
              </Link>
            </Button>
            {selectedStation && (
              <Button asChild variant="outline" className="w-full md:w-auto min-h-[44px] touch-target bg-[var(--brand-light-sand)]/50 dark:bg-background hover:bg-[var(--brand-light-sand)]/70 dark:hover:bg-accent/50" data-testid="button-view-station-page">
                <Link to={`/station/${selectedStation}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Station Page
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Heat Management Rules & Instructions */}
      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen}>
        <Card className="border-primary/20 bg-[var(--brand-light-sand)]/60 dark:bg-card border-[var(--brand-light-sand)]/50">
          <CardHeader className="flex flex-col space-y-1.5 p-6 dark:bg-transparent bg-[#bd490f]">
            <CollapsibleTrigger className="flex items-center justify-between w-full group" data-testid="button-toggle-rules">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Heat Management Guidelines</CardTitle>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 bg-[var(--brand-light-sand)]/40 dark:bg-transparent">
              <Alert className="bg-[var(--brand-light-sand)]/60 dark:bg-blue-950 border-[var(--brand-light-sand)]/80">
                <AlertTitle className="text-base font-semibold">Segment Sequence</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p className="text-sm">Each heat consists of three timed segments that must run in order:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                    <li><strong>Dial-In</strong> - Competitors calibrate their espresso machines and test shots</li>
                    <li><strong>Cappuccino</strong> - Competitors prepare cappuccinos for judging</li>
                    <li><strong>Espresso</strong> - Competitors prepare espresso shots for final scoring</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <Alert className="bg-[var(--brand-light-sand)]/60 dark:bg-blue-950 border-[var(--brand-light-sand)]/80">
                <AlertTitle className="text-base font-semibold">Station Lead Responsibilities</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    <li>Start each segment only when both competitors are ready</li>
                    <li>Monitor the timer and provide 1-minute and 30-second warnings</li>
                    <li>End the segment when time expires or both competitors finish early</li>
                    <li>Ensure judges have received all items before ending the segment</li>
                    <li>Maintain a fair and organized competition environment</li>
                    <li>Coordinate with other stations for timing coordination</li>
                    <li>Verify all 3 segments (Dial-in, Cappuccino, Espresso) are completed</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert className="bg-[var(--brand-light-sand)]/60 dark:bg-blue-950 border-[var(--brand-light-sand)]/80">
                <AlertTitle className="text-base font-semibold">Timer Controls</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p className="text-sm">
                    Use the <strong className="text-primary">Start</strong> button to begin a segment when ready. 
                    The timer will countdown and turn <span className="text-destructive font-semibold">red</span> in the final 60 seconds.
                  </p>
                  <p className="text-sm">
                    Once running, you can <strong>Pause</strong> the timer if needed and <strong>Resume</strong> to continue from where it stopped.
                    The timer will automatically end when time expires, or you can manually use <strong className="text-destructive">End Segment</strong> to stop early.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {/* Station Warnings - Show when other stations are starting */}
      {stationWarnings.map((warning) => (
        <StationWarning
          key={`${selectedStationData?.name}-${warning.referenceStationName}`}
          currentStationName={selectedStationData?.name || ''}
          referenceStationName={warning.referenceStationName}
          targetStartTime={warning.targetStartTime}
        />
      ))}
      {/* Station Timing Alert */}
      {stationTimingAlert?.show && (
        <Alert variant="default" className="bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-base font-semibold">Station Timing Coordination</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p className="text-sm">
              {stationTimingAlert.message}
              <strong className="ml-1">{stationTimingAlert.countdown}</strong> seconds.
            </p>
          </AlertDescription>
        </Alert>
      )}
      {currentMatch && (
        <Card className="border border-primary/30 bg-[var(--brand-light-sand)]/90 dark:bg-[var(--espresso-dark)] text-foreground dark:text-[var(--espresso-cream)] shadow-lg">
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 dark:bg-transparent bg-[#bd490f]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm uppercase tracking-wide text-foreground/70 dark:text-primary/70">
              <span className="truncate">Station {selectedStationData?.name || '—'}</span>
              <Badge variant={currentMatch.status === 'RUNNING' ? 'default' : 'secondary'} className="text-xs">
                Round {currentMatch.round} · Heat {currentMatch.heatNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                {
                  label: "Left Cup",
                  cupCode: (() => {
                    const participant = participants.find(p => p.userId === currentMatch?.competitor1Id);
                    return participant?.cupCode || "—";
                  })(),
                  placement: runningSegment?.leftCupCode || "L",
                  competitor: competitor1?.name || "Waiting",
                },
                {
                  label: "Right Cup",
                  cupCode: (() => {
                    const participant = participants.find(p => p.userId === currentMatch?.competitor2Id);
                    return participant?.cupCode || "—";
                  })(),
                  placement: runningSegment?.rightCupCode || "R",
                  competitor: competitor2?.name || "Waiting",
                }
              ].map((slot) => (
                <div key={slot.label} className="rounded-xl border border-primary/30 dark:bg-black/40 p-3 sm:p-4 space-y-2 sm:space-y-3 min-h-[3rem] sm:min-h-[3.5rem] shadow-sm bg-[#f2e6d3]">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-foreground/70 dark:text-white/70">
                    <span>{slot.label}</span>
                    <Coffee className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-foreground dark:text-white">{slot.placement}</div>
                  <div className="text-xs sm:text-sm text-foreground/70 dark:text-white/70 uppercase">Cup Code</div>
                  <div className="text-xl sm:text-2xl font-mono truncate text-foreground dark:text-white">{slot.cupCode}</div>
                  <div className="text-[10px] sm:text-xs text-foreground/60 dark:text-white/60 truncate">{slot.competitor}</div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-1">
              <div className="text-[10px] sm:text-xs text-foreground/50 dark:text-white/50 uppercase">Heat Status</div>
              <div className="text-2xl sm:text-3xl font-bold tracking-wide text-foreground dark:text-white">{currentMatch.status}</div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'].map((segmentCode, idx) => {
                const segment = segments.find(s => s.segment === segmentCode);
                const status = segment?.status || 'IDLE';
                const isRunning = status === 'RUNNING';
                const isEnded = status === 'ENDED';
                const canStart = idx === 0 || segments.find(s => s.segment === ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'][idx - 1])?.status === 'ENDED';

                return (
                  <div
                    key={segmentCode}
                    className="rounded-xl border p-3 sm:p-4 dark:bg-black/30 min-h-[3rem] sm:min-h-[3.5rem] shadow-sm border-[var(--brand-light-sand)]/70 bg-[#f2e6d3]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm uppercase tracking-wide text-foreground/60 dark:text-white/60 truncate">{segmentCode.replace('_', ' ')}</div>
                        {editingSegmentId === segment?.id ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              min={1}
                              value={editingMinutes}
                              onChange={(e) => setEditingMinutes(Number(e.target.value))}
                              className="w-16 px-2 py-1 text-xs border rounded bg-background text-foreground"
                              autoFocus
                            />
                            <span className="text-[10px] sm:text-xs text-foreground/40 dark:text-white/40">minutes</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (segment) {
                                  updateSegmentTimingMutation.mutate({ 
                                    segmentId: segment.id, 
                                    plannedMinutes: editingMinutes 
                                  });
                                }
                              }}
                              disabled={updateSegmentTimingMutation.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setEditingSegmentId(null);
                                setEditingMinutes(segment?.plannedMinutes || 0);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] sm:text-xs text-foreground/40 dark:text-white/40">
                              {segment?.plannedMinutes || 0} minutes
                            </div>
                            {!isRunning && !isEnded && segment && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                                onClick={() => {
                                  setEditingSegmentId(segment.id);
                                  setEditingMinutes(segment.plannedMinutes);
                                }}
                                title="Adjust timing"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant={isRunning ? 'default' : isEnded ? 'secondary' : 'outline'} className="text-[10px] sm:text-xs flex-shrink-0">
                        {status}
                      </Badge>
                    </div>
                    {isRunning && segment?.startTime && (
                      <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
                        <div className="scale-90 sm:scale-100 origin-center">
                          <SegmentTimer
                            durationMinutes={segment.plannedMinutes}
                            startTime={new Date(segment.startTime)}
                            isPaused={pausedSegmentId === segment.id}
                            externalTimeRemaining={currentSegmentTimeRemaining}
                            onComplete={() => handleEndSegment(segment.id)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={pausedSegmentId === segment.id ? "default" : "secondary"}
                            className="flex-1"
                            onClick={() => {
                              if (pausedSegmentId === segment.id) {
                                // Resuming - calculate pause duration and update
                                const now = new Date();
                                const pauseData = pausedTimes[segment.id];
                                if (pauseData) {
                                  const pauseDuration = Math.floor((now.getTime() - pauseData.pausedAt) / 1000);
                                  setPausedTimes(prev => ({
                                    ...prev,
                                    [segment.id]: {
                                      ...pauseData,
                                      pauseDuration: pauseDuration
                                    }
                                  }));
                                }
                                setPausedSegmentId(null);
                              } else {
                                // Pausing - store current elapsed time and pause start time
                                const now = new Date();
                                const start = new Date(segment.startTime!);
                                const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
                                setPausedSegmentId(segment.id);
                                setPausedTimes(prev => ({
                                  ...prev,
                                  [segment.id]: {
                                    pausedAt: now.getTime(),
                                    elapsedBeforePause: elapsed,
                                    pauseDuration: 0
                                  }
                                }));
                              }
                            }}
                            data-testid={`button-pause-${segment.segment}`}
                          >
                            {pausedSegmentId === segment.id ? (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleEndSegment(segment.id)}
                            data-testid={`button-end-${segment.segment}`}
                          >
                            <Square className="h-4 w-4 mr-2" />
                            End Segment
                          </Button>
                        </div>
                      </div>
                    )}
                    {!isRunning && !isEnded && (
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full mt-3 text-sm sm:text-base touch-manipulation"
                        onClick={() => segment && handleStartSegment(segment.id)}
                        disabled={
                          !segment ||
                          !canStart ||
                          // Enforce process order: segments can only start after the heat has started (RUNNING)
                          currentMatch.status !== "RUNNING"
                        }
                        data-testid={`button-start-${segmentCode}`}
                      >
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                        Start {segmentCode.replace("_", " ")}
                      </Button>
                    )}
                    {isEnded && (
                      <div className="mt-3 text-xs text-foreground/60 dark:text-white/60 text-center">
                        Segment completed
                      </div>
                    )}
                  </div>
                );
              }              )}
            </div>

            {/* Judges Status Monitor */}
            {currentMatch && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                <JudgesStatusMonitor 
                  matchId={currentMatch.id} 
                  segmentType={(() => {
                    const cappuccinoSegment = segments.find(s => s.segment === 'CAPPUCCINO');
                    const espressoSegment = segments.find(s => s.segment === 'ESPRESSO');

                    if (cappuccinoSegment && (cappuccinoSegment.status === 'ENDED' || cappuccinoSegment.status === 'RUNNING')) {
                      return 'CAPPUCCINO';
                    }
                    if (espressoSegment && (espressoSegment.status === 'ENDED' || espressoSegment.status === 'RUNNING')) {
                      return 'ESPRESSO';
                    }
                    return 'CAPPUCCINO';
                  })()}
                />
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              {currentMatch.status !== 'RUNNING' && currentMatch.status !== 'DONE' && (
                <Button
                  variant="default"
                  size="lg"
                  className="w-full text-sm sm:text-base"
                  onClick={() => handleStartMatch(currentMatch.id)}
                  disabled={startMatchMutation.isPending}
                  data-testid="button-start-heat"
                >
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Start Heat
                </Button>
              )}

              {/* Complete and Advance / Finalize Station Round */}
              {/* Button appears when segments are ended, but is disabled until heat is fully complete */}
              {currentMatch.status === 'RUNNING' && allSegmentsEnded && (
                <div className="space-y-2">
                  {/* Judge Completion Status and Cup Code Assignment - Required for EVERY heat (including last heat) */}
                  {/* Show this section for RUNNING matches OR when segments are ended (to catch completion) */}
                  {currentMatch && (currentMatch.status === 'RUNNING' || isCappuccinoEnded || isEspressoEnded) && (
                    <div className="mb-4 space-y-4">
                      {(!allJudgesCompleted) && (
                        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <AlertTitle className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                            Waiting for Judges Scores
                          </AlertTitle>
                          <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                            <p className="mb-2">All judges must complete scoring before advancing to the next heat.</p>
                            {cappuccinoJudgeCompletion && !cappuccinoJudgeCompletion.allComplete && (
                              <div className="mb-2">
                                <p className="font-medium">CAPPUCCINO Segment:</p>
                                <ul className="list-disc list-inside ml-2 space-y-0.5">
                                  {cappuccinoJudgeCompletion.judges
                                    .filter(j => !j.completed)
                                    .map(j => (
                                      <li key={j.judgeId}>
                                        {j.judgeName} ({j.role})
                                      </li>
                                    ))}
                                </ul>
                                <p className="text-xs mt-1">
                                  {cappuccinoJudgeCompletion.judges.filter(j => j.completed).length} of {cappuccinoJudgeCompletion.judges.length} judges completed
                                </p>
                              </div>
                            )}
                            {espressoJudgeCompletion && !espressoJudgeCompletion.allComplete && (
                              <div>
                                <p className="font-medium">ESPRESSO Segment:</p>
                                <ul className="list-disc list-inside ml-2 space-y-0.5">
                                  {espressoJudgeCompletion.judges
                                    .filter(j => !j.completed)
                                    .map(j => (
                                      <li key={j.judgeId}>
                                        {j.judgeName} ({j.role})
                                      </li>
                                    ))}
                                </ul>
                                <p className="text-xs mt-1">
                                  {espressoJudgeCompletion.judges.filter(j => j.completed).length} of {espressoJudgeCompletion.judges.length} judges completed
                                </p>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Cup Code Assignment - Show after judges complete scoring for EVERY heat on EVERY station */}
                      {/* This must appear for every heat (1, 2, 3) on every station (A, B, C) once judges finish scoring */}
                      {allJudgesCompleted && currentMatch && currentTournamentId && (
                        <div className="border rounded-lg p-4 bg-card">
                          <AdminCupPositionAssignment
                            matchId={currentMatch.id}
                            tournamentId={currentTournamentId}
                            onSuccess={() => {
                              queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch.id}/cup-positions`] });
                            }}
                          />
                        </div>
                      )}

                      {allJudgesCompleted && cupPositionsAssigned && (
                        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertTitle className="text-sm font-semibold text-green-900 dark:text-green-200">
                            Ready to {isLastHeatInRound ? 'Finalize' : 'Advance'}
                          </AlertTitle>
                          <AlertDescription className="text-xs text-green-800 dark:text-green-300">
                            All scorecards are complete and cup codes have been assigned. {isLastHeatInRound ? 'You can now finalize this station\'s round.' : 'You can now advance to the next heat.'}
                          </AlertDescription>
                        </Alert>
                      )}

                      {allJudgesCompleted && !cupPositionsAssigned && (
                        <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <AlertTitle className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                            Cup Code Assignment Required
                          </AlertTitle>
                          <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                            Please assign cup codes to left/right positions above before {isLastHeatInRound ? 'finalizing this station\'s round' : 'advancing to the next heat'}.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {isLastHeatInRound ? (
                    // Last heat in round - show finalize button (appears when segments done, disabled until judges + cup codes done)
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleFinalizeStationRound}
                      disabled={finalizeStationRoundMutation.isPending || !allJudgesCompleted || !cupPositionsAssigned}
                      data-testid="button-finalize-station-round"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {finalizeStationRoundMutation.isPending 
                        ? "Finalizing..." 
                        : `Finalize Station ${mainStations.find(s => s.id === selectedStation)?.name || ''} heats for Round ${currentMatch.round}`
                      }
                    </Button>
                  ) : (
                    // Not last heat - show complete and advance button
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={handleAdvanceHeat}
                      disabled={advanceHeatMutation.isPending || (currentMatch?.status === 'RUNNING' && !canAdvanceHeat)}
                      data-testid="button-complete-and-advance"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {advanceHeatMutation.isPending 
                        ? "Completing and Advancing..." 
                        : "Complete and Advance to Next Heat"
                      }
                    </Button>
                  )}
                  <p className="text-xs text-center text-foreground/70 dark:text-white/70">
                    {isLastHeatInRound 
                      ? `Calculate winners/losers from Station ${mainStations.find(s => s.id === selectedStation)?.name || ''} and advance them to the next round's bracket pool`
                      : "Complete this heat and advance to next heat in queue for this station"
                    }
                  </p>
                </div>
              )}

              {/* Show round completion status across all stations */}
              {(() => {
                if (allMatches.length === 0) return null;

                // Use tournament's currentRound for status display - this is the authoritative source
                // after populate-next-round updates it
                const currentRound = currentTournament?.currentRound || 1;
                
                // Get all matches that are assigned to stations (have stationId)
                const matchesWithStations = allMatches.filter(m => m.stationId !== null && m.stationId !== undefined);
                
                // Get all matches in current round that are assigned to stations
                const currentRoundMatches = matchesWithStations.filter(m => m.round === currentRound);

                // Group matches by station
                const matchesByStation = new Map<number, any[]>();
                currentRoundMatches.forEach(match => {
                  if (match.stationId) {
                    if (!matchesByStation.has(match.stationId)) {
                      matchesByStation.set(match.stationId, []);
                    }
                    matchesByStation.get(match.stationId)!.push(match);
                  }
                });

                // Get completion status for each main station
                const stationStatus = mainStations.map(station => {
                  const stationMatches = matchesByStation.get(station.id) || [];
                  const completedMatches = stationMatches.filter(m => m.status === 'DONE');

                  return {
                    name: station.name,
                    totalHeats: stationMatches.length,
                    completedHeats: completedMatches.length,
                    isComplete: stationMatches.length > 0 && completedMatches.length === stationMatches.length
                  };
                });

                const allComplete = stationStatus.every(s => s.isComplete && s.totalHeats > 0);

                return (
                  <div className="text-center space-y-2">
                    <div className="text-sm font-medium text-foreground dark:text-white border rounded-lg p-3 sm:p-4 min-h-[2.75rem] sm:min-h-[2.5rem] dark:bg-yellow-600/20 border-yellow-500/30 bg-[#312621]">
                      {allComplete ? '✅' : '⏳'} Round {currentRound} Status
                    </div>
                    {/* Station-by-station status */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {stationStatus.map(station => (
                        <div 
                          key={station.name}
                          className="p-2 rounded border text-center border-yellow-500/30 text-yellow-300 bg-[#9a4828]"
                        >
                          <div className="font-medium">Station {station.name}</div>
                          <div>{station.completedHeats}/{station.totalHeats}</div>
                          {station.totalHeats === 0 && <div className="text-[10px]">No heats</div>}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-foreground/60 dark:text-white/60">
                      {allComplete 
                        ? 'All stations have completed their heats for this round'
                        : 'Waiting for all stations to complete their heats'
                      }
                    </p>
                  </div>
                );
              })()}
            </div>

            <p className="text-xs text-center text-foreground/40 dark:text-white/40 uppercase tracking-wide">
              Cup code will stay with competitor for the entire event. This ID drives scoring.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Station A Lead Controls - Round Management */}
      {normalizeStationName(selectedStationData?.name || '') === 'A' && isCurrentRoundComplete && (
        <Card className="bg-[var(--brand-light-sand)]/50 dark:bg-primary/5 border-primary/20 border-[var(--brand-light-sand)]/60">
          <CardHeader className="bg-[var(--brand-light-sand)]/50 dark:bg-transparent">
            <CardTitle className="flex items-center gap-2 text-primary">
              {isFinalRound ? (
                <Trophy className="h-5 w-5" />
              ) : (
                <Users className="h-5 w-5" />
              )}
              {isFinalRound ? 'Final Round Complete - Station A Lead Controls' : 'Round Complete - Station A Lead Controls'}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[var(--brand-light-sand)]/50 dark:bg-transparent">
            <div className="space-y-4">
              <div className={`bg-[var(--brand-light-sand)]/40 border rounded-lg p-4 ${
                isFinalRound 
                  ? 'dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                  : 'dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}>
                <div className={`flex items-center gap-2 mb-2 ${
                  isFinalRound 
                    ? 'text-yellow-700 dark:text-yellow-400' 
                    : 'text-green-700 dark:text-green-400'
                }`}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">
                    {isFinalRound ? `Final Round (Round ${currentRound}) Complete` : `Round ${currentRound} Complete`}
                  </span>
                </div>
                <p className={`text-sm ${
                  isFinalRound 
                    ? 'text-yellow-600 dark:text-yellow-300' 
                    : 'text-green-600 dark:text-green-300'
                }`}>
                  {isFinalRound 
                    ? 'The final heat is complete! Ready to finalize the tournament and crown the champion.'
                    : 'All heats in this round are complete across all stations'
                  }
                </p>
              </div>

              <Button
                variant={isFinalRound ? "default" : "default"}
                size="lg"
                className={`w-full ${isFinalRound ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}`}
                onClick={handlePopulateNextRound}
                disabled={populateNextRoundMutation.isPending}
                data-testid={isFinalRound ? "button-finalize-tournament" : "button-setup-next-round"}
              >
                {isFinalRound ? (
                  <>
                    <Trophy className="h-5 w-5 mr-2" />
                    {populateNextRoundMutation.isPending ? "Finalizing Tournament..." : "Finalize Tournament"}
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5 mr-2" />
                    {populateNextRoundMutation.isPending ? "Setting Up Next Round..." : "Set Up Next Round"}
                  </>
                )}
              </Button>

              <div className={`bg-[var(--brand-light-sand)]/40 border rounded-lg p-3 ${
                isFinalRound 
                  ? 'dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                  : 'dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <p className={`text-xs ${
                  isFinalRound 
                    ? 'text-yellow-700 dark:text-yellow-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  <strong>{isFinalRound ? 'Tournament Finalization:' : 'Next Round Setup:'}</strong>{' '}
                  {isFinalRound 
                    ? 'This will finalize the tournament, update the winner, and mark the tournament as complete.'
                    : 'This will create new bracket with advancing competitors distributed across stations A, B, and C based on their wins from the current round.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {!currentMatch && selectedStationData && (
        <Card className="bg-[var(--brand-light-sand)]/60 dark:bg-card border-[var(--brand-light-sand)]/50">
          <CardContent className="p-12 text-center bg-[var(--brand-light-sand)]/60 dark:bg-transparent">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Active Heat</h3>
            <p className="text-muted-foreground">
              Station {selectedStationData.name} is currently idle.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}