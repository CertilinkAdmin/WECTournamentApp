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

export default function StationLeadView() {
  const { toast } = useToast();
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const [pausedSegmentId, setPausedSegmentId] = useState<number | null>(null);
  const socket = useWebSocket();
  const [searchParams] = useSearchParams();

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
      // Get competitor cup codes
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
      
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RUNNING',
          startTime: new Date().toISOString(),
          leftCupCode,
          rightCupCode
        })
      });
      if (!response.ok) throw new Error('Failed to start segment');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      setCurrentSegmentId(data.id);
      toast({
        title: "Segment Started",
        description: `${data.segment} segment has begun. Cup placement: ${data.leftCupCode || 'L'} / ${data.rightCupCode || 'R'}`,
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
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RUNNING',
          startTime: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Failed to start match');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${currentTournamentId}/matches`] });
      toast({
        title: "Heat Started",
        description: `Round ${data.round}, Heat ${data.heatNumber} has begun.`,
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

  const handlePopulateNextRound = () => {
    populateNextRoundMutation.mutate();
  };

  const selectedStationData = stations.find(s => s.id === selectedStation);
  const competitor1 = users.find(u => u.id === currentMatch?.competitor1Id);
  const competitor2 = users.find(u => u.id === currentMatch?.competitor2Id);

  const runningSegment = segments.find(s => s.status === 'RUNNING');
  const allSegmentsEnded = segments.length > 0 && segments.every(s => s.status === 'ENDED');

  // Calculate station warnings based on other stations
  const getStationWarnings = () => {
    const warnings: Array<{ referenceStationName: string; targetStartTime: Date }> = [];
    
    // Define station order (A, B, C)
    const stationOrder = ['A', 'B', 'C'];
    const currentStationNormalizedName = selectedStationData?.name.startsWith('Station ') 
      ? selectedStationData.name.replace(/^Station /, '') 
      : selectedStationData?.name || '';
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

  return (
    <div className="space-y-6 p-6">
      <Card className="bg-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <MapPin className="h-6 w-6" />
            Station Lead Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {mainStations.map((station) => {
              const stationLead = station.stationLeadId ? users.find(u => u.id === station.stationLeadId) : null;
              const displayName = `Station ${station.normalizedName}`;
              return (
                <Button
                  key={station.id}
                  variant={selectedStation === station.id ? "default" : "outline"}
                  onClick={() => setSelectedStation(station.id)}
                  data-testid={`button-station-${station.normalizedName}`}
                  className="flex flex-col items-start h-auto py-2"
                >
                  <span>{displayName}</span>
                  {stationLead && (
                    <span className="text-xs opacity-80 font-normal">Lead: {stationLead.name}</span>
                  )}
                </Button>
              );
            })}
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button asChild variant="secondary" className="w-full md:w-auto">
              <Link to={`/live/${currentTournamentId}/stations`}>
                Back to Station Management
              </Link>
            </Button>
            {selectedStation && (
              <Button asChild variant="outline" className="w-full md:w-auto" data-testid="button-view-station-page">
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
        <Card className="border-primary/20">
          <CardHeader>
            <CollapsibleTrigger className="flex items-center justify-between w-full group" data-testid="button-toggle-rules">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Heat Management Guidelines</CardTitle>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform ${rulesOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Alert>
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

              <Alert>
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

              <Alert>
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

      {currentMatch && (
        <Card className="border border-primary/30 bg-[#1b110a] text-white shadow-lg">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between text-sm uppercase tracking-wide text-primary/70">
              <span>Station {selectedStationData?.name || '—'}</span>
              <Badge variant={currentMatch.status === 'RUNNING' ? 'default' : 'secondary'}>
                Round {currentMatch.round} · Heat {currentMatch.heatNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div key={slot.label} className="rounded-xl border border-primary/30 bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>{slot.label}</span>
                    <Coffee className="h-4 w-4" />
                  </div>
                  <div className="text-3xl font-mono font-bold">{slot.placement}</div>
                  <div className="text-sm text-white/70 uppercase">Cup Code</div>
                  <div className="text-2xl font-mono">{slot.cupCode}</div>
                  <div className="text-xs text-white/60">{slot.competitor}</div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-1">
              <div className="text-xs text-white/50 uppercase">Heat Status</div>
              <div className="text-3xl font-bold tracking-wide">{currentMatch.status}</div>
            </div>

            <div className="space-y-3">
              {['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'].map((segmentCode, idx) => {
                const segment = segments.find(s => s.segment === segmentCode);
                const status = segment?.status || 'IDLE';
                const isRunning = status === 'RUNNING';
                const isEnded = status === 'ENDED';
                const canStart = idx === 0 || segments.find(s => s.segment === ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'][idx - 1])?.status === 'ENDED';
                
                return (
                  <div
                    key={segmentCode}
                    className={`rounded-xl border p-4 bg-black/30 ${isRunning ? 'border-primary shadow-primary/40 shadow-lg' : 'border-white/10'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm uppercase tracking-wide text-white/60">{segmentCode.replace('_', ' ')}</div>
                        <div className="text-xs text-white/40">{segment?.plannedMinutes || 0} minutes</div>
                      </div>
                      <Badge variant={isRunning ? 'default' : isEnded ? 'secondary' : 'outline'}>
                        {status}
                      </Badge>
                    </div>

                    {isRunning && segment?.startTime && (
                      <div className="mt-3 space-y-3">
                        <SegmentTimer
                          durationMinutes={segment.plannedMinutes}
                          startTime={new Date(segment.startTime)}
                          isPaused={pausedSegmentId === segment.id}
                          onComplete={() => handleEndSegment(segment.id)}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant={pausedSegmentId === segment.id ? "default" : "secondary"}
                            className="flex-1"
                            onClick={() => setPausedSegmentId(pausedSegmentId === segment.id ? null : segment.id)}
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
                        variant="ghost"
                        className="w-full mt-3 text-white border border-white/10 bg-white/5"
                        onClick={() => segment && handleStartSegment(segment.id)}
                        disabled={!segment || !canStart || currentMatch.status !== 'RUNNING'}
                        data-testid={`button-start-${segmentCode}`}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Start {segmentCode.replace('_', ' ')}
                      </Button>
                    )}

                    {isEnded && (
                      <div className="mt-3 text-xs text-white/60 text-center">
                        Segment completed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {currentMatch.status !== 'RUNNING' && currentMatch.status !== 'DONE' && (
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={() => handleStartMatch(currentMatch.id)}
                  disabled={startMatchMutation.isPending}
                  data-testid="button-start-heat"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Heat
                </Button>
              )}

              {currentMatch.status === 'RUNNING' && allSegmentsEnded && (
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={() => handleCompleteMatch(currentMatch.id)}
                  disabled={completeMatchMutation.isPending}
                  data-testid="button-complete-heat"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Complete Heat
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="w-full border-dashed border-white/30 text-white"
                onClick={handlePopulateNextRound}
                disabled={!allSegmentsEnded || populateNextRoundMutation.isPending}
                data-testid="button-advance-next-heat"
              >
                Advance to Next Heat (Reset Clock)
              </Button>
              <p className="text-xs text-center text-white/50">
                Activates after all three segments are complete.
              </p>
            </div>

            <p className="text-xs text-center text-white/40 uppercase tracking-wide">
              Cup code will stay with competitor for the entire event. This ID drives scoring.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Station A Lead Controls - Populate Next Round */}
      {normalizeStationName(selectedStationData?.name || '') === 'A' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              Station A Lead Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                As Station A lead, you can populate the next round of competitors across all stations.
              </p>
              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={handlePopulateNextRound}
                disabled={populateNextRoundMutation.isPending}
                data-testid="button-populate-next-round"
              >
                <Users className="h-5 w-5 mr-2" />
                {populateNextRoundMutation.isPending ? "Populating..." : "Populate Next Round"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentMatch && selectedStationData && (
        <Card>
          <CardContent className="p-12 text-center">
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
