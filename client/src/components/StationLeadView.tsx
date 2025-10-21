import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Clock, Play, Square } from "lucide-react";
import type { Station, Match, HeatSegment, User } from "@shared/schema";
import { useWebSocket } from "@/hooks/useWebSocket";

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

  const handleStartSegment = (segmentId: number) => {
    startSegmentMutation.mutate(segmentId);
  };

  const handleEndSegment = (segmentId: number) => {
    endSegmentMutation.mutate(segmentId);
  };

  const selectedStationData = stations.find(s => s.id === selectedStation);
  const competitor1 = users.find(u => u.id === currentMatch?.competitor1Id);
  const competitor2 = users.find(u => u.id === currentMatch?.competitor2Id);

  const runningSegment = segments.find(s => s.status === 'RUNNING');

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
            <CardContent>
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
                        disabled={!canStart}
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
