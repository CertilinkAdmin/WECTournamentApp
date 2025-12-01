import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Calendar, MapPin, ChevronDown, ChevronUp, Gavel } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { extractTournamentSlug } from '@/utils/tournamentUtils';

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
          {/* Active Tournaments Section */}
          {activeTournaments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Live Championships
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeTournaments.map((tournament) => (
                  <div key={tournament.id} className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                      onClick={() => handleTournamentSelect(tournament.id.toString())}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold">{getShortName(tournament.name)}</span>
                        {tournament.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tournament.location}
                          </span>
                        )}
                      </div>
                      <Badge variant="default" className="ml-2">Live</Badge>
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
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Tournaments Dropdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Championships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTournament} onValueChange={handleTournamentSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an upcoming championship..." />
                </SelectTrigger>
                <SelectContent>
                  {upcomingTournaments.length === 0 ? (
                    <SelectItem value="" disabled>
                      No upcoming championships
                    </SelectItem>
                  ) : (
                    upcomingTournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id.toString()}>
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold">{getShortName(tournament.name)}</span>
                          {tournament.startDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(tournament.startDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                          {tournament.location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {tournament.location}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Selected Tournament Details */}
              {selectedTournament && (
                <div className="mt-4 p-4 bg-secondary/50 rounded-lg border">
                  {(() => {
                    const tournament = tournaments.find(t => t.id.toString() === selectedTournament);
                    if (!tournament) return null;
                    
                    return (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{tournament.name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                        <div className="pt-2">
                          <Button 
                            onClick={() => handleTournamentSelect(selectedTournament)}
                            className="w-full"
                          >
                            View Tournament Details
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card if no tournaments */}
          {upcomingTournaments.length === 0 && activeTournaments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No championships available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Upcoming championships will appear here once they are created
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

