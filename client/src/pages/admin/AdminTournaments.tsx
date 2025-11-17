import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { Trophy, Shuffle, Save, RotateCcw, Loader2, Users, Settings2, ArrowLeftRight, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RandomizeSeeds from '@/components/RandomizeSeeds';
import DraggableCompetitor from '@/components/DraggableCompetitor';
import DroppableBracketPosition from '@/components/DroppableBracketPosition';
import type { Tournament, User, TournamentParticipant, Match, Station } from '@shared/schema';

interface BracketHeat {
  id: number;
  heatNumber: number;
  round: number;
  stationId: number | null;
  stationName?: string;
  competitor1Id: number | null;
  competitor2Id: number | null;
  competitor1?: User | null;
  competitor2?: User | null;
  status: string;
}

export default function AdminTournaments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'seeds' | 'bracket'>('seeds');
  const [activeCompetitor, setActiveCompetitor] = useState<User | null>(null);
  const [selectedRound, setSelectedRound] = useState(1);

  // Fetch tournaments
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Fetch participants for selected tournament
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'participants'],
    enabled: !!selectedTournamentId,
  });

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch matches for selected tournament
  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'matches'],
    enabled: !!selectedTournamentId,
  });

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Get barista participants with user info
  const baristaParticipants = useMemo(() => {
    return participants
      .map(p => {
        const user = users.find(u => u.id === p.userId);
        return user && user.role === 'BARISTA' ? {
          id: p.id,
          userId: p.userId,
          seed: p.seed,
          name: user.name,
          email: user.email,
        } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.seed - b.seed);
  }, [participants, users]);

  // Group matches by round
  const matchesByRound = useMemo(() => {
    const grouped: Record<number, BracketHeat[]> = {};
    matches.forEach(match => {
      const round = match.round || 1;
      if (!grouped[round]) grouped[round] = [];
      
      const competitor1 = match.competitor1Id ? users.find(u => u.id === match.competitor1Id) : null;
      const competitor2 = match.competitor2Id ? users.find(u => u.id === match.competitor2Id) : null;
      const station = match.stationId ? stations.find(s => s.id === match.stationId) : null;
      
      grouped[round].push({
        id: match.id,
        heatNumber: match.heatNumber,
        round: match.round,
        stationId: match.stationId,
        stationName: station?.name,
        competitor1Id: match.competitor1Id,
        competitor2Id: match.competitor2Id,
        competitor1,
        competitor2,
        status: match.status,
      });
    });
    
    // Sort by heat number within each round
    Object.keys(grouped).forEach(round => {
      grouped[parseInt(round)].sort((a, b) => a.heatNumber - b.heatNumber);
    });
    
    return grouped;
  }, [matches, users, stations]);

  const availableRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const currentRoundHeats = matchesByRound[selectedRound] || [];

  // Get unassigned competitors (baristas not in any match)
  const unassignedCompetitors = useMemo(() => {
    const assignedIds = new Set(
      matches.flatMap(m => [m.competitor1Id, m.competitor2Id]).filter(Boolean)
    );
    return baristaParticipants
      .filter(p => !assignedIds.has(p.userId))
      .map(p => {
        const user = users.find(u => u.id === p.userId);
        return user ? { ...user, seed: p.seed } : null;
      })
      .filter((u): u is User & { seed: number } => u !== null)
      .sort((a, b) => a.seed - b.seed);
  }, [matches, baristaParticipants, users]);

  // Get assigned competitors with their seeds
  const assignedCompetitors = useMemo(() => {
    const assignedIds = new Set(
      matches.flatMap(m => [m.competitor1Id, m.competitor2Id]).filter(Boolean)
    );
    return baristaParticipants
      .filter(p => assignedIds.has(p.userId))
      .map(p => {
        const user = users.find(u => u.id === p.userId);
        return user ? { ...user, seed: p.seed } : null;
      })
      .filter((u): u is User & { seed: number } => u !== null)
      .sort((a, b) => a.seed - b.seed);
  }, [matches, baristaParticipants, users]);

  // Update match mutation
  const updateMatchMutation = useMutation({
    mutationFn: async ({ matchId, updates }: { matchId: number; updates: Partial<Match> }) => {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update match');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      toast({
        title: "Match Updated",
        description: "Competitor assignment has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Generate bracket mutation
  const generateBracketMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate bracket');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      toast({
        title: "Bracket Generated",
        description: "Tournament bracket has been generated from seeds.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (match: Partial<Match>) => {
      if (!selectedTournamentId) throw new Error("No tournament selected");
      // Note: Direct match creation may not be available, using bracket generation instead
      throw new Error("Use 'Generate Bracket' to create matches from seeds");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      toast({
        title: "Match Created",
        description: "New heat has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'competitor') {
      setActiveCompetitor(active.data.current.competitor);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCompetitor(null);

    if (!over || !selectedTournamentId) return;

    const competitor = active.data.current?.competitor as User | undefined;
    const dropData = over.data.current;

    if (competitor && dropData?.type === 'bracket-position') {
      const { heatNumber, position } = dropData;
      const heat = currentRoundHeats.find(h => h.heatNumber === heatNumber);
      
      if (heat) {
        // Update existing match
        const updates: Partial<Match> = {
          competitor1Id: position === 'competitor1' ? competitor.id : heat.competitor1Id,
          competitor2Id: position === 'competitor2' ? competitor.id : heat.competitor2Id,
        };
        updateMatchMutation.mutate({ matchId: heat.id, updates });
      } else {
        toast({
          title: "Heat Not Found",
          description: "Please generate bracket first or select an existing heat.",
          variant: "destructive"
        });
      }
    }
  };

  const handleRemoveCompetitor = (heatId: number, position: 'competitor1' | 'competitor2') => {
    const heat = currentRoundHeats.find(h => h.id === heatId);
    if (!heat) return;

    const updates: Partial<Match> = {
      competitor1Id: position === 'competitor1' ? null : heat.competitor1Id,
      competitor2Id: position === 'competitor2' ? null : heat.competitor2Id,
    };
    updateMatchMutation.mutate({ matchId: heat.id, updates });
  };

  const handleMoveCompetitor = (fromHeatId: number, fromPosition: 'competitor1' | 'competitor2', toHeatId: number, toPosition: 'competitor1' | 'competitor2') => {
    const fromHeat = currentRoundHeats.find(h => h.id === fromHeatId);
    const toHeat = currentRoundHeats.find(h => h.id === toHeatId);
    
    if (!fromHeat || !toHeat) return;

    const competitorId = fromPosition === 'competitor1' ? fromHeat.competitor1Id : fromHeat.competitor2Id;
    if (!competitorId) return;

    // Get the competitor being moved out
    const competitorBeingMovedOut = toPosition === 'competitor1' ? toHeat.competitor1Id : toHeat.competitor2Id;

    // Update both matches atomically
    Promise.all([
      fetch(`/api/matches/${fromHeat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          competitor1Id: fromPosition === 'competitor1' ? competitorBeingMovedOut : fromHeat.competitor1Id,
          competitor2Id: fromPosition === 'competitor2' ? competitorBeingMovedOut : fromHeat.competitor2Id,
        }),
      }),
      fetch(`/api/matches/${toHeat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          competitor1Id: toPosition === 'competitor1' ? competitorId : toHeat.competitor1Id,
          competitor2Id: toPosition === 'competitor2' ? competitorId : toHeat.competitor2Id,
        }),
      }),
    ]).then(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      toast({
        title: "Competitor Moved",
        description: "Competitor has been moved between heats.",
      });
    }).catch((error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    });
  };

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  if (!selectedTournamentId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Select Tournament
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <p className="text-muted-foreground">No tournaments found. Create a tournament first.</p>
            ) : (
              <Select
                value={selectedTournamentId?.toString() || ''}
                onValueChange={(value) => setSelectedTournamentId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a tournament..." />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{tournament.name}</span>
                        <Badge variant="outline" className="ml-2">{tournament.status}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => setSelectedTournamentId(null)}
              className="mb-2"
            >
              ← Back to Tournaments
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              {selectedTournament?.name}
            </h1>
            <p className="text-muted-foreground mt-1">Bracket Builder & Seed Management</p>
          </div>
          <Badge variant={selectedTournament?.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {selectedTournament?.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="seeds" className="flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            Randomize Seeds
          </TabsTrigger>
          <TabsTrigger value="bracket" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Bracket Builder
          </TabsTrigger>
        </TabsList>

        {/* Seeds Tab */}
        <TabsContent value="seeds" className="mt-6">
          <RandomizeSeeds
            tournamentId={selectedTournamentId}
            participants={baristaParticipants}
            onRandomized={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
            }}
          />
        </TabsContent>

        {/* Bracket Builder Tab */}
        <TabsContent value="bracket" className="mt-6">
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    {availableRounds.length > 0 && (
                      <>
                        <label className="text-sm font-medium">Round:</label>
                        <select
                          value={selectedRound}
                          onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                          className="px-3 py-2 border rounded-md bg-background"
                        >
                          {availableRounds.map(round => (
                            <option key={round} value={round}>
                              Round {round}
                            </option>
                          ))}
                        </select>
                        <Badge variant="secondary">
                          {currentRoundHeats.length} heats
                        </Badge>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {baristaParticipants.length > 0 && currentRoundHeats.length === 0 && (
                      <Button
                        onClick={() => generateBracketMutation.mutate()}
                        disabled={generateBracketMutation.isPending}
                      >
                        {generateBracketMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Bracket from Seeds
                          </>
                        )}
                      </Button>
                    )}
                    {currentRoundHeats.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Randomize competitor positions within current round
                          const shuffled = [...currentRoundHeats];
                          const allCompetitors = shuffled.flatMap(h => [
                            { heatId: h.id, position: 'competitor1' as const, competitorId: h.competitor1Id },
                            { heatId: h.id, position: 'competitor2' as const, competitorId: h.competitor2Id },
                          ]).filter(c => c.competitorId);
                          
                          // Shuffle competitors
                          for (let i = allCompetitors.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [allCompetitors[i], allCompetitors[j]] = [allCompetitors[j], allCompetitors[i]];
                          }
                          
                          // Redistribute
                          let compIndex = 0;
                          const updates = shuffled.map(heat => {
                            const comp1 = allCompetitors[compIndex++];
                            const comp2 = allCompetitors[compIndex++];
                            return {
                              matchId: heat.id,
                              updates: {
                                competitor1Id: comp1?.competitorId || null,
                                competitor2Id: comp2?.competitorId || null,
                              }
                            };
                          });
                          
                          Promise.all(
                            updates.map(({ matchId, updates }) =>
                              fetch(`/api/matches/${matchId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify(updates),
                              })
                            )
                          ).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
                            toast({
                              title: "Heats Randomized",
                              description: "Competitors have been randomly redistributed within Round " + selectedRound,
                            });
                          });
                        }}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Randomize Round {selectedRound} Heats
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bracket Builder */}
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available Competitors */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Available Competitors
                      <Badge variant="secondary">{unassignedCompetitors.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-3 bg-muted rounded-md">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-semibold">{baristaParticipants.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Assigned:</span>
                          <span className="font-semibold text-green-600">{assignedCompetitors.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unassigned:</span>
                          <span className="font-semibold text-orange-600">{unassignedCompetitors.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {unassignedCompetitors.length === 0 ? (
                        <div className="text-center p-6 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>All competitors assigned</p>
                        </div>
                      ) : (
                        unassignedCompetitors.map(competitor => (
                          <div key={competitor.id} className="relative">
                            <DraggableCompetitor competitor={competitor} />
                            <Badge 
                              variant="outline" 
                              className="absolute top-2 right-2 font-mono text-xs"
                            >
                              Seed #{competitor.seed}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bracket Heats */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Round {selectedRound} Bracket
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentRoundHeats.length === 0 ? (
                      <div className="text-center p-12 text-muted-foreground">
                        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No heats in Round {selectedRound}</p>
                        <p className="text-sm mt-2">Generate bracket or create heats manually</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {currentRoundHeats.map(heat => (
                          <Card key={heat.id} className="border-2">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Heat {heat.heatNumber}</Badge>
                                  {heat.stationName && (
                                    <Badge className={
                                      heat.stationName === 'A' ? 'bg-primary' :
                                      heat.stationName === 'B' ? 'bg-chart-3' :
                                      'bg-chart-1'
                                    }>
                                      Station {heat.stationName}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary">{heat.status}</Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                  <DroppableBracketPosition
                                    position="competitor1"
                                    heatNumber={heat.heatNumber}
                                    station={heat.stationName || 'A'}
                                    competitor={heat.competitor1}
                                    onRemove={() => handleRemoveCompetitor(heat.id, 'competitor1')}
                                  />
                                  {heat.competitor1 && (
                                    <>
                                      <Badge 
                                        variant="outline" 
                                        className="absolute top-1 left-1 font-mono text-xs"
                                      >
                                        #{baristaParticipants.find(p => p.userId === heat.competitor1Id)?.seed || '?'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-1 right-1 h-6 w-6 p-0"
                                        onClick={() => {
                                          // Allow dragging this competitor to another heat
                                          const competitor = users.find(u => u.id === heat.competitor1Id);
                                          if (competitor) setActiveCompetitor(competitor);
                                        }}
                                        title="Move competitor"
                                      >
                                        <ArrowLeftRight className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                                <div className="relative">
                                  <DroppableBracketPosition
                                    position="competitor2"
                                    heatNumber={heat.heatNumber}
                                    station={heat.stationName || 'A'}
                                    competitor={heat.competitor2}
                                    onRemove={() => handleRemoveCompetitor(heat.id, 'competitor2')}
                                  />
                                  {heat.competitor2 && (
                                    <>
                                      <Badge 
                                        variant="outline" 
                                        className="absolute top-1 left-1 font-mono text-xs"
                                      >
                                        #{baristaParticipants.find(p => p.userId === heat.competitor2Id)?.seed || '?'}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-1 right-1 h-6 w-6 p-0"
                                        onClick={() => {
                                          // Allow dragging this competitor to another heat
                                          const competitor = users.find(u => u.id === heat.competitor2Id);
                                          if (competitor) setActiveCompetitor(competitor);
                                        }}
                                        title="Move competitor"
                                      >
                                        <ArrowLeftRight className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DragOverlay>
                {activeCompetitor ? (
                  <DraggableCompetitor competitor={activeCompetitor} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

