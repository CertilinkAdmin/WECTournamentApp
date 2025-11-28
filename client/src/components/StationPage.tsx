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
  MapPin,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Station, Match, HeatSegment, User } from '@shared/schema';
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

  // Filter matches for this station - ensure we're matching by station ID correctly
  const stationMatches = allMatches.filter(match => {
    if (!match.stationId || !station) return false;
    return match.stationId === station.id;
  });

  // Debug logging to help identify the issue
  React.useEffect(() => {
    if (station && allMatches.length > 0) {
      console.log(`Station ${stationName} (ID: ${station.id}) matches:`, stationMatches);
      console.log('All matches:', allMatches.map(m => ({ id: m.id, heatNumber: m.heatNumber, stationId: m.stationId })));
    }
  }, [station, allMatches, stationMatches, stationName]);
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
        description: `${data.segment} segment has begun. Cup placement: ${data.leftCupCode || 'L'} / ${data.rightCupCode || 'R'}` 
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Station {stationName}
            <Badge variant="outline" className="ml-2">
              {station?.status || 'OFFLINE'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stationMatches.length}</div>
              <div className="text-sm text-muted-foreground">Total Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stationMatches.filter(m => m.status === 'DONE').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stationMatches.filter(m => m.status === 'RUNNING').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Match */}
      {currentMatch && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Round {currentMatch.round} · Heat {currentMatch.heatNumber}
              </span>
              <Badge variant={currentMatch.status === 'RUNNING' ? 'default' : 'secondary'}>
                {currentMatch.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Heat Countdown Timer - Show when heat is RUNNING */}
              {currentMatch.status === 'RUNNING' && totalHeatTimeRemaining !== null && (
                <HeatCountdownTimer 
                  totalSeconds={totalHeatTimeRemaining} 
                  isActive={currentMatch.status === 'RUNNING'} 
                />
              )}

              {/* Competitors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="font-medium">Competitor 1</div>
                  <div className="text-lg font-bold">
                    {getCompetitorName(currentMatch.competitor1Id || 0)}
                  </div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="font-medium">Competitor 2</div>
                  <div className="text-lg font-bold">
                    {getCompetitorName(currentMatch.competitor2Id || 0)}
                  </div>
                </div>
              </div>

              {/* Segment Controls - Manual Start for Each Segment */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Segment Controls</h4>
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
                        className={`rounded-xl border p-4 ${
                          isRunning ? 'border-primary shadow-primary/40 shadow-lg bg-primary/5' : 
                          isEnded ? 'border-green-200 bg-green-50/50' : 
                          'border-muted-foreground/20 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm uppercase tracking-wide font-medium">
                              {segmentCode.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {segment?.plannedMinutes || 0} minutes
                            </div>
                          </div>
                          <Badge variant={isRunning ? 'default' : isEnded ? 'secondary' : 'outline'}>
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
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant={pausedSegmentId === segment.id ? "default" : "secondary"}
                                className="flex-1"
                                onClick={() => setPausedSegmentId(pausedSegmentId === segment.id ? null : segment.id)}
                                size="sm"
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
                                size="sm"
                              >
                                <Square className="h-4 w-4 mr-2" />
                                End Segment
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Start Button for Idle Segments */}
                        {!isRunning && !isEnded && (
                          <Button
                            variant="default"
                            className="w-full"
                            onClick={() => segment && handleStartSegment(segment.id)}
                            disabled={!segment || !canStart || currentMatch.status !== 'RUNNING'}
                            size="lg"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start {segmentCode.replace('_', ' ')}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Station Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Station Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stationMatches.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No matches scheduled for this station.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stationMatches.map((match, index) => (
                <div
                  key={match.id}
                  className={`p-3 rounded-lg border ${
                    match.status === 'RUNNING' ? 'bg-blue-50 border-blue-200' :
                    match.status === 'DONE' ? 'bg-green-50 border-green-200' :
                    'bg-muted border-muted-foreground/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        Match {index + 1}: {getCompetitorName(match.competitor1Id || 0)} vs {getCompetitorName(match.competitor2Id || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Round {match.round}, Heat {match.heatNumber}
                      </div>
                    </div>
                    <Badge variant={
                      match.status === 'RUNNING' ? 'default' :
                      match.status === 'DONE' ? 'secondary' :
                      'outline'
                    }>
                      {match.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}