import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, MapPin, Clock, Eye, Settings, Hammer } from 'lucide-react';
import TournamentBracket from '@/components/TournamentBracket';
import WEC25BracketDisplay from '@/components/WEC25BracketDisplay';
import WEC25Bracket from '@/components/WEC25Bracket';
import StationsManagement from '@/components/StationsManagement';
import PublicDisplay from '@/components/PublicDisplay';
import BracketPrintout from '@/components/BracketPrintout';
import type { Tournament } from '@shared/schema';

export default function LiveTournament() {
  const [activeView, setActiveView] = useState<'bracket' | 'stations' | 'public' | 'wec25' | 'wec25builder' | 'printout'>('bracket');
  const queryClient = useQueryClient();

  // Fetch current tournament
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournament = tournaments[0];

  const generateWec25 = async () => {
    if (!currentTournament?.id) return;
    await fetch(`/api/tournaments/${currentTournament.id}/generate-wec25`, { method: 'POST' });
    // Refresh bracket-related queries so Live Bracket populates immediately
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', currentTournament.id, 'matches'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', currentTournament.id, 'participants'] })
    ]);
  };

  const quickStartWEC25 = async () => {
    try {
      // Ensure a tournament exists
      let tournamentId = currentTournament?.id;
      if (!tournamentId) {
        const createRes = await fetch('/api/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'WEC 2025 Tournament' })
        });
        const created = await createRes.json();
        tournamentId = created.id;
      }

      if (!tournamentId) return;

      // Generate WEC25 bracket (also ensures stations A/B/C)
      await fetch(`/api/tournaments/${tournamentId}/generate-wec25`, { method: 'POST' });

      // Activate tournament mode for live views
      await fetch(`/api/tournament-mode/${tournamentId}/activate`, { method: 'POST' });

      // Refresh all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'matches'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'participants'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/stations'] })
      ]);

      // Switch to Live Bracket view
      setActiveView('bracket');
    } catch (_) {
      // noop UI-level error handling for now
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Tournament Status Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold">Live Tournament</h2>
                <p className="text-sm text-muted-foreground">
                  {currentTournament?.name || 'World Espresso Championships'} - Round {currentTournament?.currentRound || 1}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Eye className="h-4 w-4 mr-1" />
                LIVE
              </Badge>
              <button onClick={quickStartWEC25} className="inline-flex items-center px-3 py-2 rounded bg-primary text-primary-foreground text-sm">
                <Hammer className="h-4 w-4 mr-2" /> Quick Start WEC2025
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="wec25builder" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">WEC25 Builder</span>
              <span className="sm:hidden">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="printout" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Print Bracket</span>
              <span className="sm:hidden">Print</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6" />
                    Live Tournament Bracket
                  </CardTitle>
                  <button onClick={generateWec25} className="inline-flex items-center px-3 py-2 rounded bg-primary text-primary-foreground text-sm">
                    <Hammer className="h-4 w-4 mr-2" /> Generate WEC25 Bracket
                  </button>
                </div>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">WEC25 Bracket</h3>
              <button onClick={generateWec25} className="inline-flex items-center px-3 py-2 rounded bg-primary text-primary-foreground text-sm">
                <Hammer className="h-4 w-4 mr-2" /> Generate WEC25 Bracket
              </button>
            </div>
            <WEC25BracketDisplay />
          </TabsContent>

          <TabsContent value="wec25builder" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  WEC25 Drag & Drop Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WEC25Bracket tournamentId={currentTournament?.id || null} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printout" className="mt-6">
            <BracketPrintout />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
