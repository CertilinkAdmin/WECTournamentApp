import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock, MapPin, Printer, Download } from 'lucide-react';
import type { Tournament, User, TournamentParticipant, Match, Station } from '@shared/schema';

export default function BracketPrintout() {
  // Fetch tournaments
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournament = tournaments[0];
  
  // Fetch participants
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', currentTournament?.id, 'participants'],
    enabled: !!currentTournament?.id,
  });
  
  // Fetch matches
  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['/api/tournaments', currentTournament?.id, 'matches'],
    enabled: !!currentTournament?.id,
  });
  
  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });
  
  // Get competitor name by ID
  const getCompetitorName = (userId: number | null) => {
    if (!userId) return 'TBD';
    const user = users.find(u => u.id === userId);
    return user?.name || `Competitor ${userId}`;
  };
  
  // Get station name by ID
  const getStationName = (stationId: number | null) => {
    if (!stationId) return 'TBD';
    const station = stations.find(s => s.id === stationId);
    return station?.name || 'TBD';
  };
  
  // Group participants by role
  const baristas = participants.filter(p => p.role === 'BARISTA');
  const judges = participants.filter(p => p.role === 'JUDGE');
  const stationLeads = participants.filter(p => p.role === 'STATION_LEAD');
  
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);
  
  // Sort matches within each round
  Object.keys(matchesByRound).forEach(round => {
    matchesByRound[round].sort((a, b) => a.heatNumber - b.heatNumber);
  });
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    const content = document.getElementById('bracket-printout');
    if (content) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Tournament Bracket - ${currentTournament?.name || 'Tournament'}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 30px; }
                .match { border: 1px solid #ccc; margin: 10px 0; padding: 10px; }
                .competitor { font-weight: bold; }
                .winner { color: #28a745; font-weight: bold; }
                .station { color: #6c757d; font-size: 0.9em; }
                .status { padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
                .status-DONE { background: #d4edda; color: #155724; }
                .status-RUNNING { background: #fff3cd; color: #856404; }
                .status-READY { background: #cce5ff; color: #004085; }
                .round-header { background: #f8f9fa; padding: 10px; font-weight: bold; margin: 20px 0 10px 0; }
              </style>
            </head>
            <body>
              ${content.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };
  
  if (!currentTournament) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Tournament Found</h3>
          <p className="text-muted-foreground">
            Please create a tournament first to view the bracket.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{currentTournament.name}</CardTitle>
                <p className="text-muted-foreground">
                  Created: {new Date(currentTournament.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Tournament Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">{participants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Baristas</p>
                <p className="text-2xl font-bold">{baristas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Judges</p>
                <p className="text-2xl font-bold">{judges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Stations</p>
                <p className="text-2xl font-bold">{stations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Baristas */}
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">🥤 Baristas ({baristas.length})</h4>
              <div className="space-y-2">
                {baristas.map((barista, index) => (
                  <div key={barista.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="font-medium">{barista.name}</span>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                ))}
                {baristas.length === 0 && (
                  <p className="text-muted-foreground text-sm">No baristas registered</p>
                )}
              </div>
            </div>
            
            {/* Judges */}
            <div>
              <h4 className="font-semibold mb-3 text-green-600">⚖️ Judges ({judges.length})</h4>
              <div className="space-y-2">
                {judges.map((judge, index) => (
                  <div key={judge.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="font-medium">{judge.name}</span>
                    <Badge variant="outline">Judge</Badge>
                  </div>
                ))}
                {judges.length === 0 && (
                  <p className="text-muted-foreground text-sm">No judges assigned</p>
                )}
              </div>
            </div>
            
            {/* Station Leads */}
            <div>
              <h4 className="font-semibold mb-3 text-purple-600">🎛️ Station Leads ({stationLeads.length})</h4>
              <div className="space-y-2">
                {stationLeads.map((lead, index) => (
                  <div key={lead.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <span className="font-medium">{lead.name}</span>
                    <Badge variant="outline">Lead</Badge>
                  </div>
                ))}
                {stationLeads.length === 0 && (
                  <p className="text-muted-foreground text-sm">No station leads assigned</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bracket Matches */}
      <div id="bracket-printout">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Tournament Bracket ({matches.length} matches)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Bracket Generated</h3>
                <p className="text-muted-foreground">
                  Please generate the tournament bracket first.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b)).map(round => {
                  const roundMatches = matchesByRound[round];
                  return (
                    <div key={round} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">Round {round}</h3>
                        <Badge variant="outline">{roundMatches.length} matches</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roundMatches.map(match => {
                          const competitor1Name = getCompetitorName(match.competitor1Id);
                          const competitor2Name = getCompetitorName(match.competitor2Id);
                          const winnerName = getCompetitorName(match.winnerId);
                          const stationName = getStationName(match.stationId);
                          
                          return (
                            <Card key={match.id} className="border-2">
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">Heat {match.heatNumber}</span>
                                    <Badge 
                                      className={`status-${match.status}`}
                                      variant={match.status === 'DONE' ? 'default' : 'secondary'}
                                    >
                                      {match.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className={`p-2 rounded ${match.winnerId === match.competitor1Id ? 'bg-green-100 font-bold' : 'bg-gray-50'}`}>
                                      {competitor1Name}
                                    </div>
                                    <div className="text-center text-muted-foreground">vs</div>
                                    <div className={`p-2 rounded ${match.winnerId === match.competitor2Id ? 'bg-green-100 font-bold' : 'bg-gray-50'}`}>
                                      {competitor2Name}
                                    </div>
                                  </div>
                                  
                                  {match.winnerId && (
                                    <div className="text-center">
                                      <Badge className="bg-green-600 text-white">
                                        Winner: {winnerName}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  <div className="text-sm text-muted-foreground">
                                    <div>Station: {stationName}</div>
                                    {match.startTime && (
                                      <div>Start: {new Date(match.startTime).toLocaleString()}</div>
                                    )}
                                    {match.endTime && (
                                      <div>End: {new Date(match.endTime).toLocaleString()}</div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
