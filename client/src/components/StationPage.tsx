import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Station, Match, HeatSegment, User } from '@shared/schema';
import { getMainStationsForTournament, normalizeStationName } from '@/utils/stationUtils';
import SegmentTimer from '@/components/SegmentTimer';
import HeatCountdownTimer from '@/components/HeatCountdownTimer';

interface StationPageProps {
  stationId: number;
  stationName: string;
  tournamentId?: number; // Optional tournament ID for filtering
}

export default function StationPage({ stationId, stationName, tournamentId }: StationPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSegmentId, setCurrentSegmentId] = useState<number | null>(null);
  const [pausedSegmentId, setPausedSegmentId] = useState<number | null>(null);

  // Fetch station data
  const { data: station } = useQuery<Station>({
    queryKey: ['/api/stations', stationId],
  });

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get tournament ID - use prop if provided, otherwise fetch from tournaments list
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
    enabled: !tournamentId, // Only fetch if tournamentId not provided
  });

  const currentTournamentId = tournamentId || tournaments[0]?.id || 1;

  // Fetch current matches for this station
  const { data: allMatches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${currentTournamentId}/matches`],
    enabled: !!currentTournamentId,
  });

  // Get main stations for tournament (same logic as LiveHeats)
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  const mainStations = React.useMemo(() => {
    const tournamentIdNum = tournamentId || undefined;
    return getMainStationsForTournament(stations, tournamentIdNum);
  }, [stations, tournamentId]);

  // Filter matches for this station using the same logic as LiveHeats
  const stationMatches = allMatches.filter(match => {
    if (!match.stationId || !station) return false;
    
    // Find the main station that corresponds to our current station
    const mainStation = mainStations.find(s => s.id === station.id);
    if (!mainStation) return false;
    
    // Check if the match's station matches our main station
    const matchStation = stations.find(s => s.id === match.stationId);
    if (!matchStation) return false;
    
    // Use the same normalization logic as LiveHeats
    const matchStationNormalized = normalizeStationName(matchStation.name);
    return matchStationNormalized === mainStation.normalizedName;
  });

  // Debug logging to help identify the issue
  React.useEffect(() => {
    if (station && allMatches.length > 0) {
      console.log(`Station ${stationName} (ID: ${station.id}) matches:`, stationMatches);
      console.log('All matches:', allMatches.map(m => ({ id: m.id, heatNumber: m.heatNumber, stationId: m.stationId })));
      console.log('Main stations:', mainStations);
    }
  }, [station, allMatches, stationMatches, stationName, mainStations]);
  const currentMatch = stationMatches.find(m => m.status === 'RUNNING') || 
                       stationMatches.find(m => m.status === 'READY') ||
                       stationMatches[0];

  // Fetch segments for current match
  const { data: segments = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${currentMatch?.id}/segments`],
    enabled: !!currentMatch,
  });

  // Fetch participants to get cup codes
  const { data: participants = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments', currentTournamentId, 'participants'],
    enabled: !!currentTournamentId,
  });

  // Segment control mutations - using same pattern as StationLeadView
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
      setCurrentSegmentId(data.id);
      toast({ 
        title: "Segment Started", 
        description: `${data.segment} segment has begun.` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      toast({ title: "Segment Ended", description: `${data.segment} segment has completed.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleStartSegment = (segmentId: number) => {
    startSegmentMutation.mutate(segmentId);
  };

  const handleEndSegment = (segmentId: number) => {
    endSegmentMutation.mutate(segmentId);
  };

  const getCompetitorName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getSegmentStatus = (segmentCode: string) => {
    const segment = segments.find(s => s.segment === segmentCode);
    return segment?.status || 'IDLE';
  };

  const runningSegment = segments.find(s => s.status === 'RUNNING');
  const allSegmentsEnded = segments.length > 0 && segments.every(s => s.status === 'ENDED');

  // Calculate total heat time remaining (sum of remaining segment times)
  const [totalHeatTimeRemaining, setTotalHeatTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!currentMatch || currentMatch.status !== 'RUNNING' || segments.length === 0) {
      setTotalHeatTimeRemaining(null);
      return;
    }
    
    const calculateRemaining = () => {
      let totalSeconds = 0;
      const segmentOrder = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
      
      for (const code of segmentOrder) {
        const segment = segments.find(s => s.segment === code);
        if (!segment) continue;
        
        if (segment.status === 'RUNNING' && segment.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(segment.startTime).getTime()) / 1000);
          const remaining = Math.max(0, (segment.plannedMinutes * 60) - elapsed);
          totalSeconds += remaining;
        } else if (segment.status === 'IDLE') {
          totalSeconds += segment.plannedMinutes * 60;
        }
        // ENDED segments contribute 0
      }
      
      return totalSeconds;
    };

    setTotalHeatTimeRemaining(calculateRemaining());

    // Update every second when heat is running
    const interval = setInterval(() => {
      setTotalHeatTimeRemaining(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMatch, segments, currentMatch?.status]);

  return (
    <div className="space-y-6">
      {/* Station Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="text-lg sm:text-xl">Station {stationName}</span>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm w-fit sm:ml-2">
              {station?.status || 'OFFLINE'}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Current Match */}
      {currentMatch && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <span className="flex items-center gap-2 min-w-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base truncate">Round {currentMatch.round} · Heat {currentMatch.heatNumber}</span>
              </span>
              <Badge variant={currentMatch.status === 'RUNNING' ? 'default' : 'secondary'} className="text-xs sm:text-sm w-fit">
                {currentMatch.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Heat Countdown Timer - Show when heat is RUNNING */}
              {currentMatch.status === 'RUNNING' && totalHeatTimeRemaining !== null && (
                <HeatCountdownTimer 
                  totalSeconds={totalHeatTimeRemaining} 
                  isActive={currentMatch.status === 'RUNNING'} 
                />
              )}

              {/* Competitors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-muted rounded-lg min-h-[4rem] flex flex-col justify-center">
                  <div className="font-medium text-xs sm:text-sm mb-1">Competitor 1</div>
                  <div className="text-base sm:text-lg font-bold truncate">
                    {getCompetitorName(currentMatch.competitor1Id || 0)}
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-muted rounded-lg min-h-[4rem] flex flex-col justify-center">
                  <div className="font-medium text-xs sm:text-sm mb-1">Competitor 2</div>
                  <div className="text-base sm:text-lg font-bold truncate">
                    {getCompetitorName(currentMatch.competitor2Id || 0)}
                  </div>
                </div>
              </div>

              {/* Segment Controls - Manual Start for Each Segment */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-base sm:text-lg">Segment Controls</h4>
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
                        className={`rounded-xl border p-3 sm:p-4 ${
                          isRunning ? 'border-primary shadow-primary/40 shadow-lg bg-primary/5' : 
                          isEnded ? 'border-green-200 bg-green-50/50' : 
                          'border-muted-foreground/20 bg-muted/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm uppercase tracking-wide font-medium truncate">
                              {segmentCode.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {segment?.plannedMinutes || 0} minutes
                            </div>
                          </div>
                          <Badge variant={isRunning ? 'default' : isEnded ? 'secondary' : 'outline'} className="text-xs sm:text-sm w-fit">
                            {status}
                          </Badge>
                        </div>

                        {/* Timer Display for Running Segment */}
                        {isRunning && segment?.startTime && (
                          <div className="mb-3">
                            <SegmentTimer
                              durationMinutes={segment.plannedMinutes}
                              startTime={new Date(segment.startTime)}
                              isPaused={pausedSegmentId === segment.id}
                              onComplete={() => handleEndSegment(segment.id)}
                            />
                            <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-3">
                              <Button
                                variant={pausedSegmentId === segment.id ? "default" : "secondary"}
                                className="flex-1 min-h-[2.75rem] sm:min-h-[2.5rem]"
                                onClick={() => setPausedSegmentId(pausedSegmentId === segment.id ? null : segment.id)}
                                size="sm"
                              >
                                {pausedSegmentId === segment.id ? (
                                  <>
                                    <Play className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm">Resume</span>
                                  </>
                                ) : (
                                  <>
                                    <Pause className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm">Pause</span>
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1 min-h-[2.75rem] sm:min-h-[2.5rem]"
                                onClick={() => handleEndSegment(segment.id)}
                                size="sm"
                              >
                                <Square className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">End Segment</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Start Button for Idle Segments */}
                        {!isRunning && !isEnded && (
                          <Button
                            variant="default"
                            className="w-full min-h-[2.75rem] sm:min-h-[3rem]"
                            onClick={() => segment && handleStartSegment(segment.id)}
                            disabled={!segment || !canStart || currentMatch.status !== 'RUNNING'}
                            size="lg"
                          >
                            <Play className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm sm:text-base">Start {segmentCode.replace('_', ' ')}</span>
                          </Button>
                        )}

                        {isEnded && (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            ✓ Segment completed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Match Complete Alert */}
                {allSegmentsEnded && (
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Match Complete!</AlertTitle>
                    <AlertDescription>
                      All segments have been completed. The match is ready for scoring.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Judges Status Monitor - Prominent Display */}
              {currentMatch && (
                <div className="mt-6 border-t pt-6">
                  <JudgesStatusMonitor 
                    matchId={currentMatch.id} 
                    segmentType={(() => {
                      const cappuccinoSegment = segments.find(s => s.segment === 'CAPPUCCINO');
                      const espressoSegment = segments.find(s => s.segment === 'ESPRESSO');
                      
                      // Show CAPPUCCINO status if segment has ended or is running
                      if (cappuccinoSegment && (cappuccinoSegment.status === 'ENDED' || cappuccinoSegment.status === 'RUNNING')) {
                        return 'CAPPUCCINO';
                      }
                      // Show ESPRESSO status if segment has ended or is running
                      if (espressoSegment && (espressoSegment.status === 'ENDED' || espressoSegment.status === 'RUNNING')) {
                        return 'ESPRESSO';
                      }
                      // Default to CAPPUCCINO if no segment is active
                      return 'CAPPUCCINO';
                    })()}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}