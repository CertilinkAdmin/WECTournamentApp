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
import { MapPin, Users, Clock, Play, Square, Pause, CheckCircle2, Info, ChevronDown, ExternalLink, Coffee, ArrowRight } from "lucide-react";
import type { Station, Match, HeatSegment, User } from "@shared/schema";
import { getMainStationsForTournament, normalizeStationName } from '@/utils/stationUtils';
import { useWebSocket } from "@/hooks/useWebSocket";
import StationWarning from "./StationWarning";
import SegmentTimer from "./SegmentTimer";
import SevenSegmentTimer from "./SevenSegmentTimer";
import JudgesStatusMonitor from "./JudgesStatusMonitor";

export default function StationLeadView() {
  const { toast } = useToast();
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const [pausedSegmentId, setPausedSegmentId] = useState<number | null>(null);
  const [pausedTimes, setPausedTimes] = useState<Record<number, { pausedAt: number; elapsedBeforePause: number; pauseDuration: number }>>({});
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

  const currentTournamentId = tournaments[0]?.id || 1;

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Filter to only show stations A, B, and C for the current tournament
  const mainStations = React.useMemo(() => {
    return getMainStationsForTournament(stations, currentTournamentId);
  }, [stations, currentTournamentId]);

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

  // Check if current round is complete across ALL stations
  const isCurrentRoundComplete = React.useMemo(() => {
    if (allMatches.length === 0 || mainStations.length === 0) return false;

    // Get current round number
    const currentRound = Math.max(...allMatches.map(m => m.round));

    // Get all matches in current round across ALL stations
    const currentRoundMatches = allMatches.filter(m => m.round === currentRound);

    // Group matches by station to ensure each station has completed their heats
    const matchesByStation = new Map<number, any[]>();
    currentRoundMatches.forEach(match => {
      if (match.stationId) {
        if (!matchesByStation.has(match.stationId)) {
          matchesByStation.set(match.stationId, []);
        }
        matchesByStation.get(match.stationId)!.push(match);
      }
    });

    // Check if ALL main stations (A, B, C) have completed ALL their heats in current round
    for (const station of mainStations) {
      const stationMatches = matchesByStation.get(station.id) || [];

      // If station has matches assigned but not all are DONE, round is not complete
      if (stationMatches.length > 0 && !stationMatches.every(m => m.status === 'DONE')) {
        return false;
      }
    }

    // All stations must have at least one match and all matches must be DONE
    return currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === 'DONE');
  }, [allMatches, mainStations]);

  const stationMatches = allMatches.filter(m => m.stationId === selectedStation);
  const currentMatch = stationMatches.find(m => m.status === 'RUNNING') || 
                       stationMatches.find(m => m.status === 'READY') ||
                       stationMatches[0];

  // Fetch segments for current match
  const { data: segments = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${currentMatch?.id}/segments`],
    enabled: !!currentMatch,
  });

  const startSegmentMutation = useMutation({
    mutationFn: async (segmentId: number) => {
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
      if (!response.ok) throw new Error('Failed to start segment');
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
      toast({
        title: "Failed to Start Segment",
        description: error.message || "An error occurred while starting the segment.",
        variant: "destructive",
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

        const cupCode1 = comp1Participant?.cupCode || null;
        const cupCode2 = comp2Participant?.cupCode || null;

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

        // Emit WebSocket event for station timing coordination
        if (socket) {
          socket.emit("station-timing:dial-in-started", {
            stationA: { started: true, startTime: new Date(segmentData.startTime) },
            stationB: { countdown: 10 * 60 }, // 10 minutes
            stationC: { countdown: 20 * 60 }, // 20 minutes
          });
        }

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

  const completeMatchMutation = useMutation({
    mutationFn: async (matchId: number) => {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DONE',
          endTime: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Failed to complete match');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      toast({
        title: "Heat Completed",
        description: `Round ${data.round}, Heat ${data.heatNumber} is complete.`,
      });
    }
  });

  const advanceHeatMutation = useMutation({
    mutationFn: async (stationId: number) => {
      const response = await fetch(`/api/stations/${stationId}/advance-heat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to advance heat');
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
      toast({
        title: "Failed to Advance Heat",
        description: error.message || "An error occurred while advancing to the next heat.",
        variant: "destructive",
      });
    }
  });

  const populateNextRoundMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tournaments/${currentTournamentId}/populate-next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to populate next round');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
      toast({
        title: "Next Round Populated",
        description: `Next round of competitors has been assigned to all stations.`,
      });
    }
  });

  const finalizeStationRoundMutation = useMutation({
    mutationFn: async ({ stationId, round }: { stationId: number; round: number }) => {
      // First complete the current heat if it's running
      if (currentMatch && currentMatch.status === 'RUNNING') {
        const completeResponse = await fetch(`/api/matches/${currentMatch.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'DONE',
            endTime: new Date().toISOString()
          })
        });
        if (!completeResponse.ok) throw new Error('Failed to complete current heat');
      }
      
      // Then finalize the station's round (calculate winners/losers and advance to next round pool)
      const response = await fetch(`/api/tournaments/${currentTournamentId}/finalize-station-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    // Define station order (A, B, C)
    const stationOrder = ['A', 'B', 'C'];
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

  // Listen for WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleSegmentStarted = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
    };

    const handleSegmentEnded = (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
    };

    const handleStationTimingStart = (data: {
      stationA: { started: boolean; startTime: Date };
      stationB: { countdown: number };
      stationC: { countdown: number };
    }) => {
      const currentStationName = normalizeStationName(selectedStationData?.name || '');

      if (currentStationName === 'B') {
        setStationTimingAlert({
          message: 'Station A has started DIAL-IN. Your station starts in:',
          countdown: data.stationB.countdown,
          show: true
        });
      } else if (currentStationName === 'C') {
        setStationTimingAlert({
          message: 'Station A has started DIAL-IN. Your station starts in:',
          countdown: data.stationC.countdown,
          show: true
        });
      }
    };

    socket.on("segment:started", handleSegmentStarted);
    socket.on("segment:ended", handleSegmentEnded);
    socket.on("station-timing:dial-in-started", handleStationTimingStart);

    return () => {
      socket.off("segment:started", handleSegmentStarted);
      socket.off("segment:ended", handleSegmentEnded);
      socket.off("station-timing:dial-in-started", handleStationTimingStart);
    };
  }, [socket, currentMatch?.id, selectedStationData?.name]);

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 dark:bg-background bg-[#ecdcbb]">
      <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-primary/10 border border-[var(--brand-light-sand)]/70 shadow-sm">
        <CardHeader className="flex flex-col space-y-1.5 p-4 sm:p-6 dark:bg-transparent bg-[#bd490f]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <CardTitle className="flex items-center gap-2 text-primary text-lg sm:text-xl">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="truncate">Station Lead Control</span>
            </CardTitle>
            {/* Prominent Countdown Timer - Always Visible */}
            <div className="flex flex-col items-center sm:items-end gap-1.5 sm:gap-2 w-full sm:w-auto sm:min-w-[180px] flex-shrink-0">
              <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide text-center">
                {currentSegmentName}
              </div>
              <div className="bg-black rounded-lg p-1.5 sm:p-2 border-2 border-primary/50 shadow-lg shadow-primary/20 w-full sm:w-auto max-w-[200px] sm:max-w-none">
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
                  className="gap-2 whitespace-nowrap rounded-md font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2 text-primary-foreground border border-primary-border min-h-9 px-4 flex flex-col items-start justify-center h-auto py-1.5 sm:py-2 text-xs sm:text-sm min-w-0 bg-[#ecdcbb]"
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
            <Button asChild variant="secondary" className="w-full md:w-auto bg-[var(--brand-light-sand)]/70 dark:bg-secondary hover:bg-[var(--brand-light-sand)]/90 dark:hover:bg-secondary/90">
              <Link to={`/live/${currentTournamentId}/stations`}>
                Back to Station Management
              </Link>
            </Button>
            {selectedStation && (
              <Button asChild variant="outline" className="w-full md:w-auto bg-[var(--brand-light-sand)]/50 dark:bg-background hover:bg-[var(--brand-light-sand)]/70 dark:hover:bg-accent/50" data-testid="button-view-station-page">
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
                <div key={slot.label} className="rounded-xl border border-primary/30 dark:bg-black/40 p-3 sm:p-4 space-y-2 sm:space-y-3 min-h-[3rem] sm:min-h-[3.5rem] shadow-sm bg-[#ecdcbb]">
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
                    className="rounded-xl border p-3 sm:p-4 dark:bg-black/30 min-h-[3rem] sm:min-h-[3.5rem] shadow-sm border-[var(--brand-light-sand)]/70 bg-[#ecdcbb]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm uppercase tracking-wide text-foreground/60 dark:text-white/60 truncate">{segmentCode.replace('_', ' ')}</div>
                        <div className="text-[10px] sm:text-xs text-foreground/40 dark:text-white/40">{segment?.plannedMinutes || 0} minutes</div>
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
                        className="w-full mt-3 text-sm sm:text-base"
                        onClick={() => segment && handleStartSegment(segment.id)}
                        disabled={!segment || !canStart || (currentMatch.status !== 'RUNNING' && currentMatch.status !== 'READY')}
                        data-testid={`button-start-${segmentCode}`}
                      >
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Start {segmentCode.replace('_', ' ')}
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
              {currentMatch.status === 'RUNNING' && allSegmentsEnded && (
                <div className="space-y-2">
                  {isLastHeatInRound ? (
                    // Last heat in round - show finalize button
                    (<Button
                      variant="default"
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleFinalizeStationRound}
                      disabled={finalizeStationRoundMutation.isPending}
                      data-testid="button-finalize-station-round"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {finalizeStationRoundMutation.isPending 
                        ? "Finalizing..." 
                        : `Finalize Station ${mainStations.find(s => s.id === selectedStation)?.name || ''} heats for Round ${currentMatch.round}`
                      }
                    </Button>)
                  ) : (
                    // Not last heat - show complete and advance button
                    (<Button
                      variant="default"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={handleAdvanceHeat}
                      disabled={advanceHeatMutation.isPending}
                      data-testid="button-complete-and-advance"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {advanceHeatMutation.isPending 
                        ? "Completing and Advancing..." 
                        : "Complete and Advance to Next Heat"
                      }
                    </Button>)
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

                // Get current round from tournament or highest round with station-assigned matches
                const tournamentCurrentRound = tournaments[0]?.currentRound || 1;
                
                // Get all matches that are assigned to stations (have stationId)
                const matchesWithStations = allMatches.filter(m => m.stationId !== null && m.stationId !== undefined);
                
                // Determine the active round: use tournament currentRound, or highest round with station-assigned matches
                let currentRound = tournamentCurrentRound;
                if (matchesWithStations.length > 0) {
                  const highestRoundWithStations = Math.max(...matchesWithStations.map(m => m.round));
                  // Use the higher of tournament currentRound or highest round with matches
                  currentRound = Math.max(tournamentCurrentRound, highestRoundWithStations);
                }
                
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
                    <div className={`text-sm font-medium text-foreground dark:text-white border rounded-lg p-3 sm:p-4 min-h-[2.75rem] sm:min-h-[2.5rem] ${
                      allComplete 
                        ? 'bg-green-600/20 dark:bg-green-600/20 border-green-500/30' 
                        : 'bg-yellow-600/20 dark:bg-yellow-600/20 border-yellow-500/30'
                    }`}>
                      {allComplete ? '✅' : '⏳'} Round {currentRound} Status
                    </div>

                    {/* Station-by-station status */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {stationStatus.map(station => (
                        <div 
                          key={station.name}
                          className={`p-2 rounded border text-center ${
                            station.isComplete 
                              ? 'bg-green-600/20 border-green-500/30 text-green-300'
                              : station.totalHeats > 0
                                ? 'bg-yellow-600/20 border-yellow-500/30 text-yellow-300'
                                : 'bg-[var(--brand-light-sand)]/40 border-[var(--brand-light-sand)]/60 text-foreground/60 dark:text-gray-400'
                          }`}
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
              <Users className="h-5 w-5" />
              Round Complete - Station A Lead Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[var(--brand-light-sand)]/50 dark:bg-transparent">
            <div className="space-y-4">
              <div className="bg-[var(--brand-light-sand)]/40 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Round {Math.max(...allMatches.map(m => m.round))} Complete</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">
                  All heats in this round are complete across all stations
                </p>
              </div>

              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={handlePopulateNextRound}
                disabled={populateNextRoundMutation.isPending}
                data-testid="button-setup-next-round"
              >
                <Users className="h-5 w-5 mr-2" />
                {populateNextRoundMutation.isPending ? "Setting Up Next Round..." : "Set Up Next Round"}
              </Button>

              <div className="bg-[var(--brand-light-sand)]/40 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Next Round Setup:</strong> This will create new bracket with advancing competitors distributed across stations A, B, and C based on their wins from the current round.
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