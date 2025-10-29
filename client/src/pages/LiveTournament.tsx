import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, MapPin, Clock, Eye, Settings } from 'lucide-react';
import TournamentBracket from '@/components/TournamentBracket';
import WEC25BracketDisplay from '@/components/WEC25BracketDisplay';
import StationsManagement from '@/components/StationsManagement';
import PublicDisplay from '@/components/PublicDisplay';
import type { Tournament } from '@shared/schema';

export default function LiveTournament() {
  const [activeView, setActiveView] = useState<'bracket' | 'stations' | 'public' | 'wec25'>('bracket');

  // Fetch current tournament
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournament = tournaments[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Tournament Status Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/TROPHY.png" 
                alt="WEC Trophy" 
                className="h-12 w-12 object-contain"
                data-testid="img-trophy"
              />
              <div>
                <h2 className="text-xl font-bold" data-testid="text-live-tournament-title">Live Tournament</h2>
                <p className="text-sm text-muted-foreground" data-testid="text-tournament-info">
                  {currentTournament?.name || 'World Espresso Championships'} - Round {currentTournament?.currentRound || 1}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600" data-testid="badge-live">
                <Eye className="h-4 w-4 mr-1" />
                LIVE
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bracket" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Live Bracket</span>
              <span className="sm:hidden">Bracket</span>
            </TabsTrigger>
            <TabsTrigger value="stations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Stations</span>
              <span className="sm:hidden">Stations</span>
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Public Display</span>
              <span className="sm:hidden">Public</span>
            </TabsTrigger>
            <TabsTrigger value="wec25" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">WEC25 Display</span>
              <span className="sm:hidden">WEC25</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Live Tournament Bracket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TournamentBracket />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stations" className="mt-6">
            <StationsManagement />
          </TabsContent>

          <TabsContent value="public" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-6 w-6" />
                  Public Display View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    This is how the public display appears to spectators. Use this for projectors and large displays.
                  </p>
                </div>
                <PublicDisplay />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wec25" className="mt-6">
            <WEC25BracketDisplay />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
