import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Calendar, MapPin, ChevronDown, ChevronUp, Gavel, Radio } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { extractTournamentSlug } from '@/utils/tournamentUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tournament {
  id: number;
  name: string;
  location: string | null;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  totalRounds: number;
  currentRound: number;
}

export default function Championships() {
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [activeTab, setActiveTab] = useState('upcoming'); // Default to 'upcoming'

  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Filter for upcoming tournaments (SETUP status)
  const upcomingTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'SETUP').sort((a, b) => {
      // Sort by start date if available, otherwise by name
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [tournaments]);

  // Filter for active tournaments
  const activeTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'ACTIVE');
  }, [tournaments]);

  // Filter for completed tournaments
  const completedTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'COMPLETED');
  }, [tournaments]);

  const handleTournamentSelect = (tournamentId: string) => {
    if (!tournamentId) return;

    const tournament = tournaments.find(t => t.id.toString() === tournamentId);
    if (!tournament) return;

    if (tournament.status === 'ACTIVE') {
      navigate(`/live/${tournament.id}`);
    } else if (tournament.status === 'SETUP') {
      // For upcoming tournaments, navigate to setup/admin view or create a dedicated page
      navigate(`/admin/tournaments/${tournament.id}`);
    } else if (tournament.status === 'COMPLETED') {
      const slug = extractTournamentSlug(tournament.name);
      if (slug) {
        navigate(`/results/${slug}`);
      } else {
        navigate(`/results/WEC2025`); // Fallback
      }
    }
  };

  const getShortName = (name: string): string => {
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading championships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Page Title */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Championships</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Select an upcoming championship to view details or register
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">
        <div className="space-y-6">

          {/* Tournament Selector Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-lg">
              <TabsTrigger 
                value="live" 
                className="flex items-center gap-2 bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm" 
                data-testid="tab-live"
              >
                <Radio className="h-4 w-4" />
                <span>Live</span>
                {activeTournaments.length > 0 && (
                  <Badge variant="destructive" className="ml-1 animate-pulse">
                    {activeTournaments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming" 
                className="flex items-center gap-2 bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm" 
                data-testid="tab-upcoming"
              >
                <Calendar className="h-4 w-4" />
                <span>Upcoming</span>
                {upcomingTournaments.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {upcomingTournaments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="flex items-center gap-2 bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm" 
                data-testid="tab-completed"
              >
                <Trophy className="h-4 w-4" />
                <span>Completed</span>
                {completedTournaments.length > 0 && (
                  <Badge variant="outline" className="ml-1">
                    {completedTournaments.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="mt-6 space-y-6">
              {activeTournaments.length > 0 ? (
                activeTournaments.map((tournament) => (
                  <Card key={tournament.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {getShortName(tournament.name)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {tournament.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tournament.location}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          className="w-full justify-between h-auto py-3"
                          onClick={() => handleTournamentSelect(tournament.id.toString())}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-semibold">View Tournament</span>
                          </div>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/live/${tournament.id}/judges-scoring`);
                          }}
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Judge Scoring
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No live championships</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6 space-y-6">
              {upcomingTournaments.length > 0 ? (
                upcomingTournaments.map((tournament) => (
                  <Card key={tournament.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {getShortName(tournament.name)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        {tournament.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(tournament.startDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {tournament.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{tournament.location}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleTournamentSelect(tournament.id.toString())}
                      >
                        View Tournament Details
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No upcoming championships</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6 space-y-6">
              {completedTournaments.length > 0 ? (
                completedTournaments.map((tournament) => (
                  <Card key={tournament.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        {getShortName(tournament.name)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        {tournament.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(tournament.startDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {tournament.endDate &&
                                ` - ${new Date(tournament.endDate).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}`
                              }
                            </span>
                          </div>
                        )}
                        {tournament.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{tournament.location}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const slug = extractTournamentSlug(tournament.name);
                          if (slug) {
                            navigate(`/results/${slug}`);
                          } else {
                            navigate(`/results/WEC2025`); // Fallback
                          }
                        }}
                      >
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No completed championships</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Info Card if no tournaments */}
          {upcomingTournaments.length === 0 && activeTournaments.length === 0 && completedTournaments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No championships available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Championships will appear here once they are created
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}