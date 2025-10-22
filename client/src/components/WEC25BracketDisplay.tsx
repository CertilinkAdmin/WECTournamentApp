import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, MapPin, Clock, Loader2 } from 'lucide-react';
import type { Match, User, TournamentParticipant, Tournament } from '@shared/schema';

interface BracketHeatProps {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  isWinner?: boolean;
  isFinal?: boolean;
}

function BracketHeat({ heatNumber, station, competitor1, competitor2, isWinner = false, isFinal = false }: BracketHeatProps) {
  const getStationColor = (station: string) => {
    switch (station) {
      case 'A': return 'bg-primary text-white';
      case 'B': return 'bg-chart-3 text-white';
      case 'C': return 'bg-chart-1 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`min-h-[120px] transition-all duration-200 ${isFinal ? 'ring-4 ring-yellow-400 bg-yellow-50' : isWinner ? 'ring-2 ring-green-400 bg-green-50' : 'hover:shadow-lg'}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Heat {heatNumber}</span>
          </div>
          <Badge className={`${getStationColor(station)} text-sm font-medium`}>
            Station {station}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className={`p-2 rounded-md border ${competitor1 === 'BUY' ? 'bg-gray-100 text-gray-500' : 'bg-white'} ${isWinner && competitor1 !== 'BUY' ? 'ring-2 ring-green-400' : ''}`}>
            <div className="font-medium text-sm">
              {competitor1 === 'BUY' ? 'BYE' : competitor1}
            </div>
          </div>
          
          <div className="text-center text-muted-foreground font-bold">VS</div>
          
          <div className={`p-2 rounded-md border ${competitor2 === 'BUY' ? 'bg-gray-100 text-gray-500' : 'bg-white'} ${isWinner && competitor2 !== 'BUY' ? 'ring-2 ring-green-400' : ''}`}>
            <div className="font-medium text-sm">
              {competitor2 === 'BUY' ? 'BYE' : competitor2}
            </div>
          </div>
        </div>
        
        {isFinal && (
          <div className="mt-3 text-center">
            <Badge className="bg-yellow-500 text-white text-xs font-bold">
              🏆 FINAL
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WEC25BracketDisplay() {
  // Fetch tournament data
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournament = tournaments[0];
  
  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ['/api/tournaments', currentTournament?.id, 'matches'],
    enabled: !!currentTournament?.id,
  });
  
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', currentTournament?.id, 'participants'],
    enabled: !!currentTournament?.id,
  });
  
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Helper to get participant name
  const getParticipantName = (userId: number | null) => {
    if (!userId) return 'TBD';
    const user = users.find(u => u.id === userId);
    return user?.name || `Competitor ${userId}`;
  };
  
  // Organize matches by round
  const round1Matches = matches.filter(m => m.round === 1).sort((a, b) => a.heatNumber - b.heatNumber);
  const round2Matches = matches.filter(m => m.round === 2).sort((a, b) => a.heatNumber - b.heatNumber);
  const round3Matches = matches.filter(m => m.round === 3).sort((a, b) => a.heatNumber - b.heatNumber);
  const round4Matches = matches.filter(m => m.round === 4).sort((a, b) => a.heatNumber - b.heatNumber);
  const round5Matches = matches.filter(m => m.round === 5).sort((a, b) => a.heatNumber - b.heatNumber);
  
  // Calculate stats
  const totalHeats = matches.length;
  const totalCompetitors = participants.length;
  const totalRounds = currentTournament?.totalRounds || 5;
  
  // Count heats per station
  const stationCounts = matches.reduce((acc, match) => {
    const station = match.stationId;
    if (station) {
      acc[station] = (acc[station] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  if (matchesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tournament bracket...</p>
        </div>
      </div>
    );
  }
  
  if (!currentTournament || matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Tournament Data</h2>
            <p className="text-muted-foreground">
              Create a tournament and generate a bracket to view the WEC25 display.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">{currentTournament.name}</h1>
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground">
            Complete Tournament Bracket - {totalRounds} Rounds
          </p>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalCompetitors}</div>
              <div className="text-sm text-muted-foreground">Competitors</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalHeats}</div>
              <div className="text-sm text-muted-foreground">Total Heats</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{Object.keys(stationCounts).length}</div>
              <div className="text-sm text-muted-foreground">Stations</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{totalRounds}</div>
              <div className="text-sm text-muted-foreground">Rounds</div>
            </CardContent>
          </Card>
        </div>

        {/* Bracket Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Round 1 */}
            {round1Matches.length > 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">Round 1</h2>
                  <p className="text-sm text-muted-foreground">{round1Matches.length} Heats</p>
                </div>
                
                <div className="space-y-3">
                  {round1Matches.map((match) => (
                    <BracketHeat
                      key={match.heatNumber}
                      heatNumber={match.heatNumber}
                      station={String.fromCharCode(64 + (match.stationId || 1))}
                      competitor1={getParticipantName(match.competitor1Id)}
                      competitor2={getParticipantName(match.competitor2Id)}
                      isWinner={match.winnerId !== null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Round 2 */}
            {round2Matches.length > 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">Round 2</h2>
                  <p className="text-sm text-muted-foreground">{round2Matches.length} Heats</p>
                </div>
                
                <div className="space-y-6">
                  {round2Matches.map((match) => (
                    <BracketHeat
                      key={match.heatNumber}
                      heatNumber={match.heatNumber}
                      station={String.fromCharCode(64 + (match.stationId || 1))}
                      competitor1={getParticipantName(match.competitor1Id)}
                      competitor2={getParticipantName(match.competitor2Id)}
                      isWinner={match.winnerId !== null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Round 3 */}
            {round3Matches.length > 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">Round 3</h2>
                  <p className="text-sm text-muted-foreground">{round3Matches.length} Heats</p>
                </div>
                
                <div className="space-y-8">
                  {round3Matches.map((match) => (
                    <BracketHeat
                      key={match.heatNumber}
                      heatNumber={match.heatNumber}
                      station={String.fromCharCode(64 + (match.stationId || 1))}
                      competitor1={getParticipantName(match.competitor1Id)}
                      competitor2={getParticipantName(match.competitor2Id)}
                      isWinner={match.winnerId !== null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Round 4 */}
            {round4Matches.length > 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">Round 4</h2>
                  <p className="text-sm text-muted-foreground">{round4Matches.length} Heats</p>
                </div>
                
                <div className="space-y-12">
                  {round4Matches.map((match) => (
                    <BracketHeat
                      key={match.heatNumber}
                      heatNumber={match.heatNumber}
                      station={String.fromCharCode(64 + (match.stationId || 1))}
                      competitor1={getParticipantName(match.competitor1Id)}
                      competitor2={getParticipantName(match.competitor2Id)}
                      isWinner={match.winnerId !== null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Final */}
            {round5Matches.length > 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-primary mb-2">Final</h2>
                  <p className="text-sm text-muted-foreground">{round5Matches.length} Heat</p>
                </div>
                
                <div className="flex justify-center">
                  {round5Matches.map((match) => (
                    <BracketHeat
                      key={match.heatNumber}
                      heatNumber={match.heatNumber}
                      station={String.fromCharCode(64 + (match.stationId || 1))}
                      competitor1={getParticipantName(match.competitor1Id)}
                      competitor2={getParticipantName(match.competitor2Id)}
                      isWinner={match.winnerId !== null}
                      isFinal={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Station Legend */}
        <div className="mt-8 flex justify-center">
          <Card className="p-4">
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <span className="text-sm font-medium">Station A</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-chart-3"></div>
                  <span className="text-sm font-medium">Station B</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-chart-1"></div>
                  <span className="text-sm font-medium">Station C</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tournament Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Station Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Station A</span>
                  <Badge className="bg-primary text-white">11 Heats</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Station B</span>
                  <Badge className="bg-chart-3 text-white">10 Heats</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Station C</span>
                  <Badge className="bg-chart-1 text-white">10 Heats</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tournament Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Competitors</span>
                  <span className="font-bold">22</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Bye Entries</span>
                  <span className="font-bold">10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Direct Matches</span>
                  <span className="font-bold">6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Rounds</span>
                  <span className="font-bold">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
