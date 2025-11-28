import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, Clock, Users, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StationPage from './StationPage';
import type { Station } from '@shared/schema';
import { getMainStationsForTournament } from '@/utils/stationUtils';

export default function StationsManagement() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [activeStation, setActiveStation] = useState<string>('A');

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
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { station: stationA, name: 'A', description: 'Starts immediately' },
          { station: stationB, name: 'B', description: 'Starts +10 minutes' },
          { station: stationC, name: 'C', description: 'Starts +20 minutes' }
        ].map(({ station, name, description }) => (
          <Card key={name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Station {name}
                </span>
                <Badge variant={getStatusBadgeVariant(getStationStatus(station))}>
                  {getStationStatus(station)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
                <div className="text-sm">
                  Status: <span className={getStatusColor(getStationStatus(station))}>
                    {getStationStatus(station)}
                  </span>
                </div>
                {station && (
                  <div className="text-xs text-muted-foreground">
                    Next available: {new Date(station.nextAvailableAt).toLocaleTimeString()}
                  </div>
                )}
                <div className="pt-2">
                  {station ? (
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/station-lead?stationId=${station.id}`}>
                        Manage Station {name}
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full" disabled>
                      Station offline
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Station Details Tabs */}
      <Tabs value={activeStation} onValueChange={setActiveStation}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="A" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Station A
            {stationA && (
              <Badge variant={getStatusBadgeVariant(stationA.status)} className="ml-1 text-xs">
                {stationA.status}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="B" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Station B
            {stationB && (
              <Badge variant={getStatusBadgeVariant(stationB.status)} className="ml-1 text-xs">
                {stationB.status}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="C" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Station C
            {stationC && (
              <Badge variant={getStatusBadgeVariant(stationC.status)} className="ml-1 text-xs">
                {stationC.status}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="A" className="mt-6">
          {stationA ? (
            <StationPage stationId={stationA.id} stationName="A" tournamentId={tournamentId ? parseInt(tournamentId) : undefined} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Station A not found</p>
                  <p className="text-sm">Please ensure Station A is properly configured.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="B" className="mt-6">
          {stationB ? (
            <StationPage stationId={stationB.id} stationName="B" tournamentId={tournamentId ? parseInt(tournamentId) : undefined} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Station B not found</p>
                  <p className="text-sm">Please ensure Station B is properly configured.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="C" className="mt-6">
          {stationC ? (
            <StationPage stationId={stationC.id} stationName="C" />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Station C not found</p>
                  <p className="text-sm">Please ensure Station C is properly configured.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Station Timing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Station Timing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Staggered Start Times</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Station A</Badge>
                  <span>Starts immediately when tournament begins</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Station B</Badge>
                  <span>Starts 10 minutes after Station A</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Station C</Badge>
                  <span>Starts 20 minutes after Station A</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
