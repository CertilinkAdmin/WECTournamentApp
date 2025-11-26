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

  const stationMatches = allMatches.filter(m => m.stationId === stationId);
  const currentMatch = stationMatches.find(m => m.status === 'RUNNING') || 
                       stationMatches.find(m => m.status === 'READY') ||
                       stationMatches[0];

  // Fetch segments for current match
  const { data: segments = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${currentMatch?.id}/segments`],
    enabled: !!currentMatch,
  });

  // Segment control mutations
  const startSegmentMutation = useMutation({
    mutationFn: async ({ matchId, segmentCode }: { matchId: number; segmentCode: string }) => {
      const response = await fetch(`/api/heats/${matchId}/segment/${segmentCode}/start`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to start segment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      toast({ title: "Segment Started", description: "Timer is now running." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const stopSegmentMutation = useMutation({
    mutationFn: async ({ matchId, segmentCode }: { matchId: number; segmentCode: string }) => {
      const response = await fetch(`/api/heats/${matchId}/segment/${segmentCode}/stop`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to stop segment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentMatch?.id}/segments`] });
      toast({ title: "Segment Stopped", description: "Timer has been stopped." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleStartSegment = (segmentCode: string) => {
    if (!currentMatch) return;
    startSegmentMutation.mutate({ matchId: currentMatch.id, segmentCode });
  };

  const handleStopSegment = (segmentCode: string) => {
    if (!currentMatch) return;
    stopSegmentMutation.mutate({ matchId: currentMatch.id, segmentCode });
  };

  const getCompetitorName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  const getSegmentStatus = (segmentCode: string) => {
    const segment = segments.find(s => s.segment === segmentCode);
    return segment?.status || 'IDLE';
  };

  const getNextSegment = () => {
    const segmentOrder = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
    for (const code of segmentOrder) {
      if (getSegmentStatus(code) === 'IDLE') {
        return code;
      }
    }
    return null;
  };

  const isAllSegmentsComplete = () => {
    return segments.every(s => s.status === 'ENDED');
  };

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Match</span>
              <Badge variant={currentMatch.status === 'RUNNING' ? 'default' : 'secondary'}>
                {currentMatch.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

              {/* Segment Progress */}
              <div className="space-y-4">
                <h4 className="font-medium">Segment Progress</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'].map((segmentCode) => {
                    const segment = segments.find(s => s.segment === segmentCode);
                    const status = segment?.status || 'IDLE';
                    const isActive = status === 'RUNNING';
                    const isComplete = status === 'ENDED';
                    
                    return (
                      <div
                        key={segmentCode}
                        className={`p-3 rounded-lg border text-center ${
                          isActive ? 'bg-blue-50 border-blue-200' :
                          isComplete ? 'bg-green-50 border-green-200' :
                          'bg-muted border-muted-foreground/20'
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {segmentCode.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {status}
                        </div>
                        {isActive && <div className="text-blue-600 text-xs mt-1">● LIVE</div>}
                      </div>
                    );
                  })}
                </div>
                
                {/* Show timer for running segment in a dedicated section */}
                {(() => {
                  const runningSegment = segments.find(s => s.status === 'RUNNING');
                  if (runningSegment && runningSegment.startTime) {
                    return (
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="text-sm font-semibold text-muted-foreground mb-3 text-center">
                          {runningSegment.segment.replace('_', ' ')} Timer
                        </div>
                        <SegmentTimer
                          startTime={new Date(runningSegment.startTime)}
                          durationMinutes={runningSegment.plannedMinutes}
                          isPaused={false}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Segment Controls */}
              <div className="space-y-4">
                <Separator />
                
                <div className="flex flex-wrap gap-2">
                  {['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'].map((segmentCode) => {
                    const status = getSegmentStatus(segmentCode);
                    const isRunning = status === 'RUNNING';
                    const isEnded = status === 'ENDED';
                    
                    return (
                      <Button
                        key={segmentCode}
                        variant={isRunning ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                          if (isRunning) {
                            handleStopSegment(segmentCode);
                          } else if (!isEnded) {
                            handleStartSegment(segmentCode);
                          }
                        }}
                        disabled={isEnded}
                      >
                        {isRunning ? (
                          <>
                            <Square className="h-4 w-4 mr-2" />
                            Stop {segmentCode.replace('_', ' ')}
                          </>
                        ) : isEnded ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {segmentCode.replace('_', ' ')} Complete
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start {segmentCode.replace('_', ' ')}
                          </>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Quick Start Next Segment */}
                {getNextSegment() && (
                  <Button
                    variant="outline"
                    onClick={() => handleStartSegment(getNextSegment()!)}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Next Segment ({getNextSegment()?.replace('_', ' ')})
                  </Button>
                )}

                {/* Match Complete */}
                {isAllSegmentsComplete() && (
                  <Alert>
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
