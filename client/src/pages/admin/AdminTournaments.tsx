import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { Trophy, Shuffle, Save, RotateCcw, Loader2, Users, Settings2, ArrowLeftRight, Plus, Play, CheckCircle2, Rocket, XCircle, Gavel } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'approval' | 'seeds' | 'bracket'>('approval');
  const [activeCompetitor, setActiveCompetitor] = useState<User | null>(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    queryFn: async () => {
      const response = await fetch('/api/tournaments');
      if (!response.ok) {
        console.error('Failed to fetch tournaments:', response.status, response.statusText);
        throw new Error('Failed to fetch tournaments');
      }
      const data = await response.json();
      console.log('Fetched tournaments:', data);
      return data;
    },
  });

  // Auto-select first tournament if none selected and tournaments are available
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId && !tournamentsLoading) {
      console.log('Auto-selecting first tournament:', tournaments[0]);
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [tournaments, selectedTournamentId, tournamentsLoading]);

  // Fetch participants for selected tournament
  const { data: participants = [], isLoading: participantsLoading } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'participants'],
    queryFn: async () => {
      if (!selectedTournamentId) return [];
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants?includeJudges=true`);
      if (!response.ok) {
        console.error('Failed to fetch participants:', response.status, response.statusText);
        throw new Error('Failed to fetch participants');
      }
      const data = await response.json();
      console.log('Fetched participants:', data);
      return data;
    },
    enabled: !!selectedTournamentId,
  });

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch matches for selected tournament
  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'matches'],
    queryFn: async () => {
      if (!selectedTournamentId) return [];
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/matches`);
      if (!response.ok) {
        console.error('Failed to fetch matches:', response.status, response.statusText);
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      console.log('Fetched matches:', data);
      return data;
    },
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
          user,
        } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.seed - b.seed);
  }, [participants, users]);

  // Pending baristas (not yet approved for tournament - seed = 0 or null)
  const pendingBaristas = useMemo(() => {
    return baristaParticipants.filter(b => !b.seed || b.seed === 0);
  }, [baristaParticipants]);

  // Approved baristas (seed > 0)
  const approvedBaristasForTournament = useMemo(() => {
    return baristaParticipants.filter(b => b.seed && b.seed > 0);
  }, [baristaParticipants]);

  // Get all judges (not just approved ones) for the approval step
  const allJudges = useMemo(() => {
    return users.filter(u => u.role === 'JUDGE');
  }, [users]);

  // Get judges who are tournament participants
  const judgeParticipants = useMemo(() => {
    if (!selectedTournamentId || !participants.length) return [];
    return participants
      .map(p => {
        const user = users.find(u => u.id === p.userId && u.role === 'JUDGE');
        return user ? { ...p, user } : null;
      })
      .filter((j): j is TournamentParticipant & { user: User } => j !== null);
  }, [participants, users, selectedTournamentId]);

  // Pending judges (not yet approved for tournament - seed = 0 or null)
  const pendingJudges = useMemo(() => {
    return judgeParticipants.filter(j => !j.seed || j.seed === 0);
  }, [judgeParticipants]);

  // Approved judges (seed > 0)
  const approvedJudgesForTournament = useMemo(() => {
    return judgeParticipants.filter(j => j.seed && j.seed > 0);
  }, [judgeParticipants]);

  // Judges not yet added to tournament
  const availableJudgesToAdd = useMemo(() => {
    const addedJudgeIds = new Set(judgeParticipants.map(j => j.userId));
    return allJudges.filter(j => !addedJudgeIds.has(j.id));
  }, [allJudges, judgeParticipants]);

  // Get approved judges (for judge assignment - these are system-approved judges)
  const approvedJudges = useMemo(() => {
    return users.filter(u => u.role === 'JUDGE' && u.approved);
  }, [users]);

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
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate bracket' }));
        throw new Error(error.error || 'Failed to generate bracket');
      }
      const data = await response.json();
      console.log('Bracket generated:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      toast({
        title: "Bracket Generated",
        description: `Tournament bracket generated with ${data.matchesCreated || 0} matches.`,
      });
    },
    onError: (error: any) => {
      console.error('Error generating bracket:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to generate bracket',
        variant: "destructive"
      });
    }
  });

  // Assign judges mutation
  const assignJudgesMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/assign-judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to assign judges' }));
        throw new Error(error.error || 'Failed to assign judges');
      }
      const data = await response.json();
      console.log('Judges assigned:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      toast({
        title: "Judges Assigned",
        description: data.message || `Assigned 3 judges to ${data.judgesAssigned / 3} heats.`,
      });
    },
    onError: (error: any) => {
      console.error('Error assigning judges:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to assign judges',
        variant: "destructive"
      });
    }
  });

  // Prepare Tournament - Complete workflow: randomize seeds, generate bracket, assign judges
  const prepareTournamentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournamentId) throw new Error("No tournament selected");
      
      // Step 1: Randomize seeds
      const randomizeResponse = await fetch(`/api/tournaments/${selectedTournamentId}/randomize-seeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!randomizeResponse.ok) {
        const error = await randomizeResponse.json().catch(() => ({ error: 'Failed to randomize seeds' }));
        throw new Error(error.error || 'Failed to randomize seeds');
      }
      
      // Step 2: Generate bracket (this also auto-assigns judges)
      const bracketResponse = await fetch(`/api/tournaments/${selectedTournamentId}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!bracketResponse.ok) {
        const error = await bracketResponse.json().catch(() => ({ error: 'Failed to generate bracket' }));
        throw new Error(error.error || 'Failed to generate bracket');
      }
      const bracketData = await bracketResponse.json();
      
      // Step 3: Assign judges to all heats (if not already assigned by bracket generator)
      const judgesResponse = await fetch(`/api/tournaments/${selectedTournamentId}/assign-judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!judgesResponse.ok) {
        // Don't fail if judges are already assigned, just log
        console.warn('Judge assignment warning:', await judgesResponse.json().catch(() => ({})));
      }
      
      return {
        seedsRandomized: true,
        bracketGenerated: true,
        matchesCreated: bracketData.matchesCreated || 0,
        judgesAssigned: true
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament Prepared",
        description: `Seeds randomized, bracket generated with ${data.matchesCreated} matches, and judges assigned. Ready to initiate!`,
      });
    },
    onError: (error: any) => {
      console.error('Error preparing tournament:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to prepare tournament',
        variant: "destructive"
      });
    }
  });

  // Initiate tournament mutation
  const initiateTournamentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournament-mode/${selectedTournamentId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to initiate tournament' }));
        throw new Error(error.error || 'Failed to initiate tournament');
      }
      const data = await response.json();
      console.log('Tournament initiated:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId] });
      toast({
        title: "Tournament Initiated",
        description: `${selectedTournament?.name} is now active and ready to begin!`,
      });
    },
    onError: (error: any) => {
      console.error('Error initiating tournament:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to initiate tournament',
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
          <div className="flex items-center gap-3">
            <Badge variant={selectedTournament?.status === 'ACTIVE' ? 'default' : selectedTournament?.status === 'COMPLETED' ? 'secondary' : 'outline'}>
              {selectedTournament?.status}
            </Badge>
            {selectedTournament?.status === 'SETUP' && baristaParticipants.length > 0 && matches.length > 0 && (
              <Button
                onClick={() => initiateTournamentMutation.mutate()}
                disabled={initiateTournamentMutation.isPending}
                size="lg"
                className="gap-2"
              >
                {initiateTournamentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Initiate Tournament
                  </>
                )}
              </Button>
            )}
            {selectedTournament?.status === 'SETUP' && (baristaParticipants.length === 0 || matches.length === 0) && (
              <div className="text-sm text-muted-foreground">
                {baristaParticipants.length === 0 && "Add participants and generate bracket to initiate"}
                {baristaParticipants.length > 0 && matches.length === 0 && "Generate bracket to initiate"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approve Participants
          </TabsTrigger>
          <TabsTrigger value="seeds" className="flex items-center gap-2">
            <Shuffle className="h-4 w-4" />
            Randomize Seeds
          </TabsTrigger>
          <TabsTrigger value="bracket" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Bracket Builder
          </TabsTrigger>
        </TabsList>

        {/* Approval Tab */}
        <TabsContent value="approval" className="mt-6">
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Competitors Approval */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Competitors (Baristas)
                    <Badge variant="secondary">{baristaParticipants.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pending Competitors */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                      Pending Approval ({pendingBaristas.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {pendingBaristas
                        .filter(b => 
                          !searchTerm || 
                          b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((barista) => {
                          const maxSeed = approvedBaristasForTournament.length > 0
                            ? Math.max(...approvedBaristasForTournament.map(b => b.seed || 0))
                            : 0;
                          return (
                            <div
                              key={barista.id}
                              className="flex items-center justify-between p-3 bg-muted rounded-md"
                            >
                              <div>
                                <div className="font-medium">{barista.name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{barista.email}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const newSeed = maxSeed + 1;
                                    const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants/${barista.id}/seed`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ seed: newSeed })
                                    });
                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to approve competitor' }));
                                      throw new Error(error.error || 'Failed to approve competitor');
                                    }
                                    queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
                                    toast({
                                      title: 'Competitor Approved',
                                      description: `${barista.name} has been approved for this tournament.`,
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to approve competitor',
                                      variant: 'destructive'
                                    });
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          );
                        })}
                      {pendingBaristas.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending competitors</p>
                      )}
                    </div>
                  </div>

                  {/* Approved Competitors */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                      Approved ({approvedBaristasForTournament.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {approvedBaristasForTournament
                        .filter(b => 
                          !searchTerm || 
                          b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((barista) => (
                          <div
                            key={barista.id}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md"
                          >
                            <div>
                              <div className="font-medium">{barista.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                Seed: <Badge variant="outline">{barista.seed}</Badge>
                              </div>
                            </div>
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          </div>
                        ))}
                      {approvedBaristasForTournament.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No approved competitors yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Judges Approval */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Judges
                    <Badge variant="secondary">{judgeParticipants.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Judges */}
                  {availableJudgesToAdd.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Available to Add ({availableJudgesToAdd.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableJudgesToAdd
                          .filter(j => 
                            !searchTerm || 
                            j.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            j.email?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((judge) => (
                            <div
                              key={judge.id}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <div>
                                <div className="font-medium text-sm">{judge.name}</div>
                                <div className="text-xs text-muted-foreground">{judge.email}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ userId: judge.id, seed: 0 })
                                    });
                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to add judge' }));
                                      throw new Error(error.error || 'Failed to add judge');
                                    }
                                    queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
                                    toast({
                                      title: 'Judge Added',
                                      description: `${judge.name} has been added to the tournament.`,
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to add judge',
                                      variant: 'destructive'
                                    });
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Judges */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                      Pending Approval ({pendingJudges.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {pendingJudges
                        .filter(j => 
                          !searchTerm || 
                          j.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((judge) => {
                          const maxSeed = approvedJudgesForTournament.length > 0
                            ? Math.max(...approvedJudgesForTournament.map(j => j.seed || 0))
                            : 0;
                          return (
                            <div
                              key={judge.id}
                              className="flex items-center justify-between p-3 bg-muted rounded-md"
                            >
                              <div>
                                <div className="font-medium">{judge.user?.name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{judge.user?.email}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const newSeed = maxSeed + 1;
                                    const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants/${judge.id}/seed`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ seed: newSeed })
                                    });
                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to approve judge' }));
                                      throw new Error(error.error || 'Failed to approve judge');
                                    }
                                    queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
                                    toast({
                                      title: 'Judge Approved',
                                      description: `${judge.user?.name} has been approved for this tournament.`,
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to approve judge',
                                      variant: 'destructive'
                                    });
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          );
                        })}
                      {pendingJudges.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending judges</p>
                      )}
                    </div>
                  </div>

                  {/* Approved Judges */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                      Approved ({approvedJudgesForTournament.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {approvedJudgesForTournament
                        .filter(j => 
                          !searchTerm || 
                          j.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          j.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((judge) => (
                          <div
                            key={judge.id}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md"
                          >
                            <div>
                              <div className="font-medium">{judge.user?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: <Badge variant="outline">{judge.seed}</Badge>
                              </div>
                            </div>
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          </div>
                        ))}
                      {approvedJudgesForTournament.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No approved judges yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

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
            {/* Prepare Tournament - Complete Workflow */}
            {selectedTournament?.status === 'SETUP' && baristaParticipants.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    Prepare Tournament
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Complete tournament setup in one click: randomize seeds, generate bracket, and assign judges.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>Randomize competitor seeds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>Generate tournament bracket with matches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>Assign 3 judges per heat (2 ESPRESSO, 1 CAPPUCCINO)</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => prepareTournamentMutation.mutate()}
                    disabled={prepareTournamentMutation.isPending || baristaParticipants.length < 2 || approvedJudges.length < 3}
                    size="lg"
                    className="w-full gap-2"
                  >
                    {prepareTournamentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparing Tournament...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        Prepare Tournament
                      </>
                    )}
                  </Button>
                  {(baristaParticipants.length < 2 || approvedJudges.length < 3) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {baristaParticipants.length < 2 && (
                        <p>⚠️ Need at least 2 participants to prepare tournament</p>
                      )}
                      {approvedJudges.length < 3 && (
                        <p>⚠️ Need at least 3 approved judges to prepare tournament</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Approved Judges Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Approved Judges ({approvedJudges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approvedJudges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved judges found. Please approve judges first.</p>
                ) : approvedJudges.length < 3 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Need at least 3 approved judges to assign judges to heats. Currently have {approvedJudges.length}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {approvedJudges.map(judge => (
                        <Badge key={judge.id} variant="secondary">{judge.name}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {approvedJudges.length} approved judges available. Each heat will be assigned 3 judges (2 ESPRESSO, 1 CAPPUCCINO). All 3 judges score latte art.
                      </p>
                      {matches.length > 0 && (
                        <Button
                          onClick={() => assignJudgesMutation.mutate()}
                          disabled={assignJudgesMutation.isPending || approvedJudges.length < 3}
                          variant="outline"
                          className="gap-2"
                        >
                          {assignJudgesMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <Shuffle className="h-4 w-4" />
                              Randomize Judges for All Heats
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {approvedJudges.map(judge => (
                        <Badge key={judge.id} variant="secondary">{judge.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <div className="flex gap-2 items-center">
                    {baristaParticipants.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No barista participants found. Add participants first.
                      </div>
                    )}
                    {baristaParticipants.length > 0 && currentRoundHeats.length === 0 && (
                      <Button
                        onClick={() => generateBracketMutation.mutate()}
                        disabled={generateBracketMutation.isPending || participantsLoading}
                      >
                        {generateBracketMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating Bracket...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Generate Bracket ({baristaParticipants.length} participants)
                          </>
                        )}
                      </Button>
                    )}
                    {currentRoundHeats.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Bracket already generated with {currentRoundHeats.length} heats in Round {selectedRound}
                      </div>
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

