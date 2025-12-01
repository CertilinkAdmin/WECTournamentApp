import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JudgesStatusMonitor from './JudgesStatusMonitor';
import type { Station, Match, HeatSegment } from '@shared/schema';
import { getMainStationsForTournament } from '@/utils/stationUtils';

export default function StationsManagement() {
  const { tournamentId } = useParams<{ tournamentId: string }>();

  // Fetch stations - filter by tournament if tournamentId is available
  const { data: allStations = [], isLoading } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
    refetchInterval: 5000,
  });

  const tournamentScopedStations = React.useMemo(() => {
    return getMainStationsForTournament(allStations, tournamentId ? parseInt(tournamentId) : undefined);
  }, [allStations, tournamentId]);

  const stationA = tournamentScopedStations.find((station) => station.normalizedName === 'A');
  const stationB = tournamentScopedStations.find((station) => station.normalizedName === 'B');
  const stationC = tournamentScopedStations.find((station) => station.normalizedName === 'C');

  // Fetch matches for all stations to show judge status
  const tournamentIdNum = tournamentId ? parseInt(tournamentId) : undefined;
  const { data: allMatches = [] } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${tournamentIdNum}/matches`],
    enabled: !!tournamentIdNum,
    refetchInterval: 5000,
  });

  // Get current match for each station
  const getCurrentMatchForStation = (stationId: number | undefined) => {
    if (!stationId) return null;
    return allMatches.find(m => m.stationId === stationId && (m.status === 'RUNNING' || m.status === 'READY')) ||
           allMatches.find(m => m.stationId === stationId);
  };

  const stationAMatch = getCurrentMatchForStation(stationA?.id);
  const stationBMatch = getCurrentMatchForStation(stationB?.id);
  const stationCMatch = getCurrentMatchForStation(stationC?.id);

  // Fetch segments for current matches to determine which segment type to show
  const { data: segmentsA = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${stationAMatch?.id}/segments`],
    enabled: !!stationAMatch,
    refetchInterval: 5000,
  });

  const { data: segmentsB = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${stationBMatch?.id}/segments`],
    enabled: !!stationBMatch,
    refetchInterval: 5000,
  });

  const { data: segmentsC = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${stationCMatch?.id}/segments`],
    enabled: !!stationCMatch,
    refetchInterval: 5000,
  });

  const getSegmentTypeForMatch = (segments: HeatSegment[]) => {
    const cappuccinoSegment = segments.find(s => s.segment === 'CAPPUCCINO');
    const espressoSegment = segments.find(s => s.segment === 'ESPRESSO');
    
    if (cappuccinoSegment && (cappuccinoSegment.status === 'ENDED' || cappuccinoSegment.status === 'RUNNING')) {
      return 'CAPPUCCINO';
    }
    if (espressoSegment && (espressoSegment.status === 'ENDED' || espressoSegment.status === 'RUNNING')) {
      return 'ESPRESSO';
    }
    return 'CAPPUCCINO';
  };

  const getStationStatus = (station: Station | undefined) => {
    if (!station) return 'OFFLINE';
    return station.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-600';
      case 'BUSY': return 'text-blue-600';
      case 'OFFLINE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'default';
      case 'BUSY': return 'secondary';
      case 'OFFLINE': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Loading stations...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#dbc494]">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Station Management
          </CardTitle>
          <Button asChild variant="outline">
            <Link to="/station-lead">Open Station Lead View</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage and monitor all tournament stations. Each station operates independently with staggered timing.
          </p>
        </CardContent>
      </Card>
      {/* Station Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          { station: stationA, name: 'A', description: 'Starts immediately' },
          { station: stationB, name: 'B', description: 'Starts +10 minutes' },
          { station: stationC, name: 'C', description: 'Starts +20 minutes' }
        ].map(({ station, name, description }) => (
          <Card key={name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-base sm:text-lg">Station {name}</span>
                </span>
                <Badge variant={getStatusBadgeVariant(getStationStatus(station))} className="text-xs sm:text-sm w-fit">
                  {getStationStatus(station)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {description}
                </div>
                <div className="text-xs sm:text-sm">
                  Status: <span className={getStatusColor(getStationStatus(station))}>
                    {getStationStatus(station)}
                  </span>
                </div>
                {station && (
                  <div className="text-xs text-muted-foreground">
                    Next available: {new Date(station.nextAvailableAt).toLocaleTimeString()}
                  </div>
                )}
                <div className="pt-2 sm:pt-3">
                  {station ? (
                    <Button asChild size="sm" className="w-full min-h-[2.75rem] sm:min-h-[2.5rem] text-xs sm:text-sm">
                      <Link to={`/station-lead?stationId=${station.id}`}>
                        Manage Station {name}
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full min-h-[2.75rem] sm:min-h-[2.5rem] text-xs sm:text-sm" disabled>
                      Station offline
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Judges Status Monitor - Overview for All Stations */}
      {(stationAMatch || stationBMatch || stationCMatch) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Judges Status Monitor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {stationA && stationAMatch && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold">Station A</span>
                    <Badge variant="outline" className="text-xs">
                      Heat {stationAMatch.heatNumber}
                    </Badge>
                  </div>
                  <JudgesStatusMonitor 
                    matchId={stationAMatch.id} 
                    segmentType={getSegmentTypeForMatch(segmentsA)}
                  />
                </div>
              )}
              {stationB && stationBMatch && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold">Station B</span>
                    <Badge variant="outline" className="text-xs">
                      Heat {stationBMatch.heatNumber}
                    </Badge>
                  </div>
                  <JudgesStatusMonitor 
                    matchId={stationBMatch.id} 
                    segmentType={getSegmentTypeForMatch(segmentsB)}
                  />
                </div>
              )}
              {stationC && stationCMatch && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold">Station C</span>
                    <Badge variant="outline" className="text-xs">
                      Heat {stationCMatch.heatNumber}
                    </Badge>
                  </div>
                  <JudgesStatusMonitor 
                    matchId={stationCMatch.id} 
                    segmentType={getSegmentTypeForMatch(segmentsC)}
                  />
                </div>
              )}
            </div>
            {!stationAMatch && !stationBMatch && !stationCMatch && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No active matches to monitor
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
