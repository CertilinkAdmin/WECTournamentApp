import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Clock, Play, Square, CheckCircle2, Info, ChevronDown } from "lucide-react";
import type { Station, Match, HeatSegment, User } from "@shared/schema";
import { useWebSocket } from "@/hooks/useWebSocket";
import StationWarning from "./StationWarning";

interface SegmentTimerProps {
  startTime: Date;
  durationMinutes: number;
  onComplete?: () => void;
}

function SegmentTimer({ startTime, durationMinutes, onComplete }: SegmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, (durationMinutes * 60) - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0 && onComplete) {
        onComplete();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((durationMinutes * 60 - timeRemaining) / (durationMinutes * 60)) * 100;
  const remainingProgress = 100 - progress;

  return (
    <div className="text-center space-y-4">
      {/* Wave Timer Container */}
      <div className="relative h-40 bg-black rounded-lg overflow-hidden">
        {/* Time Display Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div 
            className={`text-7xl font-bold font-mono ${timeRemaining < 60 ? "text-red-500" : "text-white"}`}
            data-testid="text-segment-timer"
          >
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Animated Wave Marker */}
        <div 
          className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-linear overflow-hidden"
          style={{ 
            height: `${remainingProgress}%`,
            background: timeRemaining < 60 ? '#DC2626' : '#8B5A3C',
            opacity: Math.max(0.6, remainingProgress / 100)
          }}
        >
          {/* Wave Animation */}
          <div 
            className="absolute top-0 left-0 w-[200%] h-8 animate-wave"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.1) 10px,
                rgba(255, 255, 255, 0.1) 20px
              )`
            }}
          />
        </div>
      </div>
      
      {timeRemaining === 0 && (
        <Badge variant="destructive" className="text-sm">
          TIME'S UP!
        </Badge>
      )}
    </div>
  );
}

export default function StationLeadView() {
  const { toast } = useToast();
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const socket = useWebSocket();

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Select first available station by default
  useEffect(() => {
    if (stations.length > 0 && !selectedStation) {
      setSelectedStation(stations[0].id);
    }
  }, [stations, selectedStation]);

  // Fetch tournaments to get the current one
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournamentId = tournaments[0]?.id || 1;

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
      setCurrentSegmentId(data.id);
      toast({
        title: "Segment Started",
        description: `${data.segment} segment has begun.`,
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
    const currentStationIndex = stationOrder.indexOf(selectedStationData?.name || '');
    
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
        <CardContent>
          <div className="flex gap-2">
            {stations.map((station) => (
              <Button
                key={station.id}
                variant={selectedStation === station.id ? "default" : "outline"}
                onClick={() => setSelectedStation(station.id)}
                data-testid={`button-station-${station.name}`}
              >
                Station {station.name}
              </Button>
            ))}
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
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTitle className="text-base font-semibold">Timer Controls</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p className="text-sm">
                    Use the <strong className="text-primary">Start</strong> button to begin a segment when ready. 
                    The timer will countdown and turn <span className="text-destructive font-semibold">red</span> in the final 60 seconds.
                    Use <strong className="text-destructive">End Segment</strong> to stop the timer when the segment is complete.
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
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Current Heat
                </div>
                <Badge variant={currentMatch.status === 'RUNNING' ? 'default' : 'secondary'}>
                  Round {currentMatch.round} - Heat {currentMatch.heatNumber}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Competitor 1</div>
                  <div className="text-lg font-bold" data-testid="competitor1-name">
                    {competitor1?.name || 'TBD'}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground mb-1">Competitor 2</div>
                  <div className="text-lg font-bold" data-testid="competitor2-name">
                    {competitor2?.name || 'TBD'}
                  </div>
                </div>
              </div>

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

              {currentMatch.status === 'DONE' && (
                <div className="p-4 bg-primary/10 rounded-md text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-semibold text-primary">Heat Completed</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {segments.map((segment, index) => {
              const isRunning = segment.status === 'RUNNING';
              const isEnded = segment.status === 'ENDED';
              const canStart = index === 0 || segments[index - 1]?.status === 'ENDED';

              return (
                <Card key={segment.id} className={isRunning ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5" />
                        <span className="capitalize">{segment.segment.toLowerCase().replace('_', ' ')}</span>
                        <Badge variant={isRunning ? 'default' : isEnded ? 'secondary' : 'outline'}>
                          {segment.plannedMinutes} min
                        </Badge>
                      </div>
                      <Badge 
                        variant={isRunning ? 'default' : isEnded ? 'secondary' : 'outline'}
                        data-testid={`segment-status-${segment.segment}`}
                      >
                        {segment.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isRunning && segment.startTime ? (
                      <div className="space-y-4">
                        <SegmentTimer
                          durationMinutes={segment.plannedMinutes}
                          startTime={new Date(segment.startTime)}
                          onComplete={() => handleEndSegment(segment.id)}
                        />
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleEndSegment(segment.id)}
                          data-testid={`button-end-${segment.segment}`}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          End {segment.segment} Segment
                        </Button>
                      </div>
                    ) : isEnded ? (
                      <div className="text-center p-4 text-muted-foreground">
                        Segment completed
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleStartSegment(segment.id)}
                        disabled={!canStart || currentMatch.status !== 'RUNNING'}
                        data-testid={`button-start-${segment.segment}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start {segment.segment} Segment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
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
