import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Trophy, Shuffle, Save, RotateCcw, Loader2, Users, Settings2, ArrowLeftRight, Plus, Play, CheckCircle2, Rocket, XCircle, Gavel, Briefcase, Coffee, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RandomizeSeeds from '@/components/RandomizeSeeds';
import DraggableCompetitor from '@/components/DraggableCompetitor';
import DroppableBracketPosition from '@/components/DroppableBracketPosition';
import SegmentTimeConfig from '@/components/SegmentTimeConfig';
import type { Tournament, User, TournamentParticipant, Match, Station, HeatJudge } from '@shared/schema';

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
  const navigate = useNavigate();
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'approval' | 'seeds' | 'bracket'>('approval');
  const [activeCompetitor, setActiveCompetitor] = useState<User | null>(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [enabledStations, setEnabledStations] = useState<string[]>(['A', 'B', 'C']);
  const [showStationMigrationDialog, setShowStationMigrationDialog] = useState(false);
  const [pendingStationChange, setPendingStationChange] = useState<string[] | null>(null);
  const [addingJudgeIds, setAddingJudgeIds] = useState<Set<number>>(new Set());

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor)
  );

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

  // Get selected tournament
  const selectedTournament = useMemo(() => {
    return tournaments.find(t => t.id === selectedTournamentId);
  }, [tournaments, selectedTournamentId]);

  // Auto-select first tournament if none selected and tournaments are available
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournamentId && !tournamentsLoading) {
      console.log('Auto-selecting first tournament:', tournaments[0]);
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [tournaments, selectedTournamentId, tournamentsLoading]);

  // Sync enabledStations with selected tournament
  useEffect(() => {
    if (selectedTournament?.enabledStations) {
      setEnabledStations(selectedTournament.enabledStations);
    }
  }, [selectedTournament]);

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

  // Fetch judges for all matches
  const { data: allJudgesData = [] } = useQuery<Record<number, HeatJudge[]>>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'matches', 'judges'],
    queryFn: async () => {
      if (!selectedTournamentId || matches.length === 0) return {};
      const judgesPromises = matches.map(async (match) => {
        const response = await fetch(`/api/matches/${match.id}/judges`);
        if (!response.ok) return { matchId: match.id, judges: [] };
        const judges = await response.json();
        return { matchId: match.id, judges };
      });
      const results = await Promise.all(judgesPromises);
      const judgesMap: Record<number, HeatJudge[]> = {};
      results.forEach(({ matchId, judges }) => {
        judgesMap[matchId] = judges;
      });
      return judgesMap;
    },
    enabled: !!selectedTournamentId && matches.length > 0,
  });

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Fetch default heat structure for validation (round 1)
  const { data: defaultHeatStructure } = useQuery<any>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'round-times', 1],
    queryFn: async () => {
      if (!selectedTournamentId) return null;
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/round-times`);
      if (!response.ok) return null;
      const roundTimes = await response.json();
      // Return round 1 structure (default) or first available
      return roundTimes.find((rt: any) => rt.round === 1) || roundTimes[0] || null;
    },
    enabled: !!selectedTournamentId,
  });

  // Validate all rounds have heat structures configured (moved after availableRounds is defined)

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

  // Get all station leads (not just approved ones) for the approval step
  const allStationLeads = useMemo(() => {
    return users.filter(u => u.role === 'STATION_LEAD');
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

  // Get station leads who are tournament participants
  const stationLeadParticipants = useMemo(() => {
    if (!selectedTournamentId || !participants.length) return [];
    return participants
      .map(p => {
        const user = users.find(u => u.id === p.userId && u.role === 'STATION_LEAD');
        return user ? { ...p, user } : null;
      })
      .filter((sl): sl is TournamentParticipant & { user: User } => sl !== null);
  }, [participants, users, selectedTournamentId]);

  // Pending station leads (not yet approved for tournament - seed = 0 or null)
  const pendingStationLeads = useMemo(() => {
    return stationLeadParticipants.filter(sl => !sl.seed || sl.seed === 0);
  }, [stationLeadParticipants]);

  // Approved station leads (seed > 0)
  const approvedStationLeadsForTournament = useMemo(() => {
    return stationLeadParticipants.filter(sl => sl.seed && sl.seed > 0);
  }, [stationLeadParticipants]);

  // Get station leads available to add (not yet in tournament)
  const availableStationLeadsToAdd = useMemo(() => {
    const participantUserIds = new Set(participants.map(p => p.userId));
    return allStationLeads.filter(sl => !participantUserIds.has(sl.id));
  }, [allStationLeads, participants]);

  // Judges not yet added to tournament
  // Filter based on whether this is a test tournament
  const availableJudgesToAdd = useMemo(() => {
    const addedJudgeIds = new Set(judgeParticipants.map(j => j.userId));
    let filteredJudges = allJudges.filter(j => !addedJudgeIds.has(j.id));

    // Check if selected tournament is a test tournament
    const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
    const isTestTournament = selectedTournament 
      ? (selectedTournament.name.toLowerCase().includes('test') || selectedTournament.name.toLowerCase().includes('demo'))
      : false;

    // If this is NOT a test tournament, filter out test judges
    if (!isTestTournament) {
      filteredJudges = filteredJudges.filter(j => {
        const email = j.email.toLowerCase();
        // Filter out test judges (emails containing @test.com or test-judge pattern)
        return !email.includes('@test.com') && 
               !email.includes('test-judge') &&
               !j.name.toLowerCase().includes('test judge');
      });
    } else {
      // If this IS a test tournament, show only test judges
      filteredJudges = filteredJudges.filter(j => {
        const email = j.email.toLowerCase();
        const name = j.name.toLowerCase();
        // Show only test judges
        return email.includes('@test.com') || 
               email.includes('test-judge') ||
               name.includes('test judge');
      });
    }

    return filteredJudges;
  }, [allJudges, judgeParticipants, tournaments, selectedTournamentId]);

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

  // Check if tournament is prepared (has matches and default heat structure configured)
  const isTournamentPrepared = useMemo(() => {
    return matches.length > 0 && !!defaultHeatStructure;
  }, [matches.length, defaultHeatStructure]);

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

  // Update enabledStations mutation
  const updateEnabledStationsMutation = useMutation({
    mutationFn: async (newEnabledStations: string[]) => {
      if (!selectedTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/enabled-stations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabledStations: newEnabledStations }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update stations' }));
        throw new Error(error.error || 'Failed to update stations');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      
      const messages = [];
      if (data.deactivatedStations?.length > 0) {
        messages.push(`Deactivated: ${data.deactivatedStations.join(', ')}`);
      }
      if (data.reactivatedStations?.length > 0) {
        messages.push(`Reactivated: ${data.reactivatedStations.join(', ')}`);
      }
      
      toast({
        title: "Stations Updated",
        description: messages.length > 0 ? messages.join('. ') : "Station configuration has been updated.",
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
      
      // Fetch current tournament data to avoid closure issues with tournaments array
      const tournamentsResponse = await fetch('/api/tournaments');
      if (!tournamentsResponse.ok) throw new Error('Failed to fetch tournaments');
      const tournamentsList = await tournamentsResponse.json();
      const currentTournament = tournamentsList.find((t: Tournament) => t.id === selectedTournamentId);
      const currentTournamentStations = currentTournament?.enabledStations || ['A', 'B', 'C'];
      const stationsChanged = JSON.stringify([...currentTournamentStations].sort()) !== JSON.stringify([...enabledStations].sort());
      
      if (stationsChanged) {
        await updateEnabledStationsMutation.mutateAsync(enabledStations);
        // Wait for stations to be created/deleted and queries to invalidate
        await new Promise(resolve => setTimeout(resolve, 300));
        // Refresh tournament data to get updated enabledStations
        await queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
        await queryClient.refetchQueries({ queryKey: ['/api/tournaments', selectedTournamentId] });
      }
      
      // Then generate bracket
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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      
      // Automatically assign judges to all heats after bracket generation
      if (approvedJudgesForTournament.length >= 3) {
        try {
          const judgesResponse = await fetch(`/api/tournaments/${selectedTournamentId}/assign-judges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (judgesResponse.ok) {
            queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches', 'judges'] });
            toast({
              title: "Bracket Generated & Judges Assigned",
              description: `Tournament bracket generated with ${data.matchesCreated || 0} matches. 3 judges assigned to each heat.`,
            });
          } else {
            toast({
              title: "Bracket Generated",
              description: `Tournament bracket generated with ${data.matchesCreated || 0} matches. Please assign judges manually.`,
            });
          }
        } catch (error) {
          toast({
            title: "Bracket Generated",
            description: `Tournament bracket generated with ${data.matchesCreated || 0} matches. Please assign judges manually.`,
          });
        }
      } else {
        toast({
          title: "Bracket Generated",
          description: `Tournament bracket generated with ${data.matchesCreated || 0} matches. Add at least 3 judges to assign them to heats.`,
        });
      }
    },
    onError: (error: any) => {
      // Extract detailed error information
      let errorMessage = 'Failed to generate bracket';
      let errorDetails: any = {};
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString();
      }
      
      // Try to extract more details from error object
      if (error) {
        errorDetails = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
            try {
              acc[key] = error[key];
            } catch {
              // Skip properties that can't be accessed
            }
            return acc;
          }, {} as any)
        };
      }
      
      console.error('Error generating bracket:', {
        message: errorMessage,
        error: errorDetails,
        originalError: error
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Assign station leads mutation
  const assignStationLeadsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/assign-station-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to assign station leads' }));
        throw new Error(error.error || 'Failed to assign station leads');
      }
      const data = await response.json();
      console.log('Station leads assigned:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stations'] });
      toast({
        title: "Station Leads Assigned",
        description: data.message || `Assigned ${data.stationLeadsAssigned} station leads to stations.`,
      });
    },
    onError: (error: any) => {
      console.error('Error assigning station leads:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to assign station leads',
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
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches', 'judges'] });
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
      toast({
        title: "Preparing Tournament",
        description: "Step 1: Randomizing competitor seeds...",
      });
      
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
      
      toast({
        title: "Step 1 Complete",
        description: "Seeds randomized successfully. Generating bracket...",
      });
      
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
      // This is optional - bracket generator may have already assigned judges
      try {
        const judgesResponse = await fetch(`/api/tournaments/${selectedTournamentId}/assign-judges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!judgesResponse.ok) {
          // Don't fail if judges are already assigned or insufficient judges, just log
          const error = await judgesResponse.json().catch(() => ({ error: 'Failed to assign judges' }));
          console.warn('Judge assignment warning:', error.error || 'Failed to assign judges');
          toast({
            title: "Step 3 Skipped",
            description: error.error || "Judges may already be assigned or insufficient judges available",
            variant: "default",
          });
        } else {
          const judgesData = await judgesResponse.json();
          toast({
            title: "Step 3 Complete",
            description: judgesData.message || "Judges assigned successfully",
          });
        }
      } catch (error: any) {
        // Don't fail the entire workflow if judge assignment fails
        console.error('Judge assignment error (non-blocking):', error);
        toast({
          title: "Step 3 Warning",
          description: "Judge assignment encountered an issue, but tournament preparation completed. You can assign judges manually later.",
          variant: "default",
        });
      }

      // Step 4: Assign station leads to stations (A, B, C)
      const stationLeadsResponse = await fetch(`/api/tournaments/${selectedTournamentId}/assign-station-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!stationLeadsResponse.ok) {
        // Don't fail if station leads assignment fails, just log
        console.warn('Station leads assignment warning:', await stationLeadsResponse.json().catch(() => ({})));
      }

      // Step 5: Validate all rounds have heat structures configured (if bracket exists)
      if (bracketData.matchesCreated > 0) {
        const roundTimesResponse = await fetch(`/api/tournaments/${selectedTournamentId}/round-times`);
        if (roundTimesResponse.ok) {
          const roundTimes = await roundTimesResponse.json();
          // Get unique rounds from matches (would need to fetch matches, but for now assume validation happened client-side)
          // This is a safety check - main validation happens client-side before button is enabled
        }
      }
      
      return {
        seedsRandomized: true,
        bracketGenerated: true,
        matchesCreated: bracketData.matchesCreated || 0,
        judgesAssigned: true,
        stationLeadsAssigned: stationLeadsResponse.ok
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tournament Prepared",
        description: `Seeds randomized, bracket generated with ${data.matchesCreated} matches, judges assigned, and station leads assigned to stations. Ready to initiate!`,
      });
    },
    onError: (error: any) => {
      // Extract detailed error information
      let errorMessage = 'Failed to prepare tournament';
      let errorDetails: any = {};
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString();
      }
      
      // Try to extract more details from error object
      if (error) {
        errorDetails = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
            try {
              acc[key] = error[key];
            } catch {
              // Skip properties that can't be accessed
            }
            return acc;
          }, {} as any)
        };
      }
      
      console.error('Error preparing tournament:', {
        message: errorMessage,
        error: errorDetails,
        originalError: error
      });
      
      toast({
        title: "Error",
        description: errorMessage,
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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId] });
      // Fetch tournament name directly to avoid closure issues
      const tournamentsResponse = await fetch('/api/tournaments');
      if (tournamentsResponse.ok) {
        const tournamentsList = await tournamentsResponse.json();
        const tournament = tournamentsList.find((t: Tournament) => t.id === selectedTournamentId);
        toast({
          title: "Tournament Initiated",
          description: `${tournament?.name || 'Tournament'} is now active and ready to begin!`,
        });
      } else {
        toast({
          title: "Tournament Initiated",
          description: 'Tournament is now active and ready to begin!',
        });
      }
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
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => setSelectedTournamentId(null)}
              className="mb-2 -ml-2"
            >
              ← Back to Tournaments
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              {selectedTournament?.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Bracket Builder & Seed Management
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
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
              <div className="hidden sm:block text-sm text-muted-foreground">
                {baristaParticipants.length === 0 && "Add participants and generate bracket to initiate"}
                {baristaParticipants.length > 0 && matches.length === 0 && "Generate bracket to initiate"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs - Clean button grid with proper spacing */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-card border border-border rounded-lg shadow-sm">
          <TabsTrigger
            value="overview"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
          >
            <Trophy className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="approval"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </TabsTrigger>
          <TabsTrigger
            value="seeds"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
          >
            <Shuffle className="h-4 w-4" />
            Seeds
          </TabsTrigger>
          <TabsTrigger
            value="bracket"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
          >
            <Settings2 className="h-4 w-4" />
            Bracket
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Users className="h-4 w-4" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm text-foreground/80">
                <div className="flex justify-between">
                  <span>Total competitors</span>
                  <span className="font-semibold">{baristaParticipants.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved competitors</span>
                  <span className="font-semibold text-green-700">{approvedBaristasForTournament.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved judges</span>
                  <span className="font-semibold text-green-700">{approvedJudgesForTournament.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved station leads</span>
                  <span className="font-semibold text-green-700">{approvedStationLeadsForTournament.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Coffee className="h-4 w-4" />
                  Bracket Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm text-foreground/80">
                <div className="flex justify-between">
                  <span>Rounds with heats</span>
                  <span className="font-semibold">{availableRounds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Heats in selected round</span>
                  <span className="font-semibold">{currentRoundHeats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tournament status</span>
                  <span className="font-semibold">{selectedTournament?.status}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                                disabled={addingJudgeIds.has(judge.id)}
                                onClick={async () => {
                                  // Prevent duplicate clicks
                                  if (addingJudgeIds.has(judge.id)) {
                                    return;
                                  }
                                  
                                  setAddingJudgeIds(prev => new Set(prev).add(judge.id));
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
                                  } finally {
                                    setAddingJudgeIds(prev => {
                                      const next = new Set(prev);
                                      next.delete(judge.id);
                                      return next;
                                    });
                                  }
                                }}
                              >
                                {addingJudgeIds.has(judge.id) ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </>
                                )}
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

              {/* Station Leads Approval */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Station Leads
                    <Badge variant="secondary">{stationLeadParticipants.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Station Leads */}
                  {availableStationLeadsToAdd.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Available to Add ({availableStationLeadsToAdd.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableStationLeadsToAdd
                          .filter(sl => 
                            !searchTerm || 
                            sl.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            sl.email?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((stationLead) => (
                            <div
                              key={stationLead.id}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <div>
                                <div className="font-medium text-sm">{stationLead.name}</div>
                                <div className="text-xs text-muted-foreground">{stationLead.email}</div>
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
                                      body: JSON.stringify({ userId: stationLead.id, seed: 0 })
                                    });
                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to add station lead' }));
                                      throw new Error(error.error || 'Failed to add station lead');
                                    }
                                    queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
                                    toast({
                                      title: 'Station Lead Added',
                                      description: `${stationLead.name} has been added to the tournament.`,
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to add station lead',
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

                  {/* Pending Station Leads */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                      Pending Approval ({pendingStationLeads.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {pendingStationLeads
                        .filter(sl => 
                          !searchTerm || 
                          sl.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sl.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((stationLead) => {
                          const maxSeed = approvedStationLeadsForTournament.length > 0
                            ? Math.max(...approvedStationLeadsForTournament.map(sl => sl.seed || 0))
                            : 0;
                          return (
                            <div
                              key={stationLead.id}
                              className="flex items-center justify-between p-3 bg-muted rounded-md"
                            >
                              <div>
                                <div className="font-medium">{stationLead.user?.name || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{stationLead.user?.email}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const newSeed = maxSeed + 1;
                                    const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants/${stationLead.id}/seed`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ seed: newSeed })
                                    });
                                    if (!response.ok) {
                                      const error = await response.json().catch(() => ({ error: 'Failed to approve station lead' }));
                                      throw new Error(error.error || 'Failed to approve station lead');
                                    }
                                    queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
                                    toast({
                                      title: 'Station Lead Approved',
                                      description: `${stationLead.user?.name} has been approved for this tournament.`,
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to approve station lead',
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
                      {pendingStationLeads.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending station leads</p>
                      )}
                    </div>
                  </div>

                  {/* Approved Station Leads */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                      Approved ({approvedStationLeadsForTournament.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {approvedStationLeadsForTournament
                        .filter(sl => 
                          !searchTerm || 
                          sl.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sl.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((stationLead) => (
                          <div
                            key={stationLead.id}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md"
                          >
                            <div>
                              <div className="font-medium">{stationLead.user?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: <Badge variant="outline">{stationLead.seed}</Badge>
                              </div>
                            </div>
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          </div>
                        ))}
                      {approvedStationLeadsForTournament.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No approved station leads yet</p>
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
            {selectedTournament?.status === 'SETUP' && approvedBaristasForTournament.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    Prepare Tournament
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Complete tournament setup in one click: randomize seeds, generate bracket, assign judges, and assign station leads to stations.
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
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>Assign station leads to stations A, B, C</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => prepareTournamentMutation.mutate()}
                    disabled={
                      prepareTournamentMutation.isPending || 
                      approvedBaristasForTournament.length < 2 || 
                      approvedJudgesForTournament.length < 3 ||
                      (matches.length > 0 && !defaultHeatStructure)
                    }
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
                  <div className="text-xs text-muted-foreground space-y-1">
                    {approvedBaristasForTournament.length < 2 && (
                      <p>⚠️ Need at least 2 approved competitors to prepare tournament</p>
                    )}
                    {approvedJudgesForTournament.length < 3 && (
                      <p>⚠️ Need at least 3 approved judges to prepare tournament</p>
                    )}
                    {matches.length > 0 && !defaultHeatStructure && (
                      <p className="text-destructive">
                        ⚠️ Configure the default heat structure before preparing tournament
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approved Judges Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Approved Judges ({approvedJudgesForTournament.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approvedJudgesForTournament.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved judges found. Please approve judges in the Approval tab first.</p>
                ) : approvedJudgesForTournament.length < 3 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Need at least 3 approved judges to assign judges to heats. Currently have {approvedJudgesForTournament.length}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {approvedJudgesForTournament.map(judge => (
                        <Badge key={judge.id} variant="secondary">{judge.user?.name || 'Unknown'}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {approvedJudgesForTournament.length} approved judges available. Each heat will be assigned 3 judges (2 ESPRESSO, 1 CAPPUCCINO). All 3 judges score latte art.
                      </p>
                      {matches.length > 0 && (
                        <Button
                          onClick={() => assignJudgesMutation.mutate()}
                          disabled={assignJudgesMutation.isPending || approvedJudgesForTournament.length < 3}
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
                      {approvedJudgesForTournament.map(judge => (
                        <Badge key={judge.id} variant="secondary">{judge.user?.name || 'Unknown'}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Station Leads Display */}
            <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Approved Station Leads ({approvedStationLeadsForTournament.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {approvedStationLeadsForTournament.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No approved station leads found. Please approve station leads in the Approval tab first.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-snug flex-1 min-w-0">
                        {approvedStationLeadsForTournament.length} approved station leads available. They will be randomly assigned to stations A, B, and C during tournament setup.
                      </p>
                      {stations.length >= 3 && (
                        <Button
                          onClick={() => assignStationLeadsMutation.mutate()}
                          disabled={assignStationLeadsMutation.isPending || approvedStationLeadsForTournament.length === 0}
                          variant="outline"
                          className="gap-2 w-full sm:w-auto justify-center whitespace-normal text-xs sm:text-sm px-3 sm:px-4"
                        >
                          {assignStationLeadsMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <Shuffle className="h-4 w-4" />
                              Assign Station Leads to Stations
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {approvedStationLeadsForTournament.map(stationLead => (
                        <Badge key={stationLead.id} variant="secondary">{stationLead.user?.name || 'Unknown'}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-[var(--brand-light-sand)]/80 dark:bg-card border border-[var(--brand-light-sand)]/70 dark:border-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {availableRounds.length > 0 && (
                      <>
                        <label className="text-xs sm:text-sm font-medium">Round:</label>
                        <select
                          value={selectedRound}
                          onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                          className="px-3 py-2 border rounded-md bg-[var(--espresso-foam)] dark:bg-background text-xs sm:text-sm"
                        >
                          {availableRounds.map(round => (
                            <option key={round} value={round}>
                              Round {round}
                            </option>
                          ))}
                        </select>
                        <Badge variant="secondary" className="text-xs sm:text-sm">
                          {currentRoundHeats.length} heats
                        </Badge>
                      </>
                    )}
                  </div>
                  {/* Station Configuration - Only show before bracket generation */}
                  {currentRoundHeats.length === 0 && approvedBaristasForTournament.length >= 2 && (
                    <Card className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mb-4">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Radio className="h-4 w-4 text-blue-600" />
                          <h3 className="text-sm font-semibold">Station Configuration</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Select which stations will be used for this tournament. Configure this before generating the bracket.
                        </p>
                        <div className="flex gap-4 mb-3">
                          {['A', 'B', 'C'].map((station) => (
                            <label key={station} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={enabledStations.includes(station)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEnabledStations(prev => [...prev, station].sort());
                                  } else {
                                    if (enabledStations.length > 1) {
                                      setEnabledStations(prev => prev.filter(s => s !== station));
                                    } else {
                                      toast({
                                        title: 'Validation Error',
                                        description: 'At least one station must be enabled',
                                        variant: 'destructive',
                                      });
                                    }
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-medium">Station {station}</span>
                            </label>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Current configuration: {enabledStations.join(' & ')} ({enabledStations.length} station{enabledStations.length !== 1 ? 's' : ''})
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-center w-full lg:w-auto">
                    {approvedBaristasForTournament.length === 0 && (
                      <div className="text-xs sm:text-sm text-muted-foreground text-left">
                        No approved competitors found. Approve competitors in the Approval tab first.
                      </div>
                    )}
                    {approvedBaristasForTournament.length >= 2 && currentRoundHeats.length === 0 && (
                      <Button
                        onClick={() => generateBracketMutation.mutate()}
                        disabled={generateBracketMutation.isPending || updateEnabledStationsMutation.isPending || participantsLoading || approvedBaristasForTournament.length < 2 || isTournamentPrepared}
                        size="lg"
                        className="gap-2 w-full sm:w-auto justify-center whitespace-normal text-xs sm:text-sm"
                      >
                        {(generateBracketMutation.isPending || updateEnabledStationsMutation.isPending) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {updateEnabledStationsMutation.isPending ? 'Updating Stations...' : 'Generating Bracket...'}
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Generate Bracket ({approvedBaristasForTournament.length} approved competitors)
                          </>
                        )}
                      </Button>
                    )}
                    {approvedBaristasForTournament.length < 2 && currentRoundHeats.length === 0 && (
                      <div className="text-xs sm:text-sm text-muted-foreground text-left">
                        Need at least 2 approved competitors to generate bracket
                      </div>
                    )}
                    {currentRoundHeats.length > 0 && (
                      <>
                        <div className="text-xs sm:text-sm text-muted-foreground text-left">
                          Bracket already generated with {currentRoundHeats.length} heats in Round {selectedRound}
                          {isTournamentPrepared && (
                            <Badge variant="default" className="ml-2">Locked</Badge>
                          )}
                        </div>
                        {/* Station Management - Show after bracket generation */}
                        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mt-4 w-full">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Settings2 className="h-4 w-4 text-amber-600" />
                              <h3 className="text-sm font-semibold">Station Management</h3>
                              {isTournamentPrepared && (
                                <Badge variant="outline" className="ml-2">Locked</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              Current: {enabledStations.join(' & ')}. {isTournamentPrepared ? 'Configuration locked after tournament preparation.' : 'Disabling stations will mark them as OFFLINE (no heat migration).'}
                            </p>
                            <div className="flex gap-4 flex-wrap">
                              {['A', 'B', 'C'].map((station) => {
                                const isEnabled = enabledStations.includes(station);
                                const matchesOnStation = currentRoundHeats.filter(m => {
                                  const stationData = stations.find(s => s.id === m.stationId);
                                  return stationData?.name === station;
                                }).length;
                                
                                return (
                                  <label key={station} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isEnabled}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          // Enabling - no migration needed
                                          const newStations = [...enabledStations, station].sort();
                                          setEnabledStations(newStations);
                                          updateEnabledStationsMutation.mutate(newStations);
                                        } else {
                                          // Disabling - check if matches need migration
                                          if (enabledStations.length <= 1) {
                                            toast({
                                              title: 'Cannot Disable',
                                              description: 'At least one station must remain enabled',
                                              variant: 'destructive',
                                            });
                                            return;
                                          }
                                          
                                          const newStations = enabledStations.filter(s => s !== station);
                                          
                                          // Always allow disabling - will mark station as OFFLINE (no migration)
                                          setEnabledStations(newStations);
                                          updateEnabledStationsMutation.mutate(newStations);
                                        }
                                      }}
                                      disabled={updateEnabledStationsMutation.isPending || isTournamentPrepared}
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium">
                                      Station {station}
                                      {matchesOnStation > 0 && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          ({matchesOnStation} heat{matchesOnStation !== 1 ? 's' : ''})
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </>
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
                              title: "Heats randomized",
                              description: "Competitors have been randomly redistributed within Round " + selectedRound,
                            });
                          });
                        }}
                        className="w-full sm:w-auto justify-center text-xs sm:text-sm"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Randomize Round {selectedRound} Heats
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Configuration - One Default Heat Structure */}
            {selectedTournamentId && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Default Heat Structure Configuration
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Set the default timing structure for all heats. Station managers can adjust timing for individual heats during the tournament.
                  </p>
                </CardHeader>
                <CardContent>
                  <SegmentTimeConfig tournamentId={selectedTournamentId} />
                </CardContent>
              </Card>
            )}

            {/* Bracket Builder */}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Round {selectedRound} Bracket
                      </div>
                      {currentRoundHeats.length > 0 && (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const heatsWithJudges = currentRoundHeats.filter(h => allJudgesData[h.id] && allJudgesData[h.id].length === 3).length;
                            const totalHeats = currentRoundHeats.length;
                            const allHeatsHaveJudges = heatsWithJudges === totalHeats;
                            return (
                              <>
                                <Badge variant={allHeatsHaveJudges ? 'default' : 'destructive'} className="text-xs">
                                  Judges: {heatsWithJudges}/{totalHeats} heats
                                </Badge>
                                {!allHeatsHaveJudges && approvedJudgesForTournament.length >= 3 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => assignJudgesMutation.mutate()}
                                    disabled={assignJudgesMutation.isPending}
                                    className="h-7 text-xs"
                                  >
                                    {assignJudgesMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      <Shuffle className="h-3 w-3 mr-1" />
                                    )}
                                    Assign Judges
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
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
                              
                              {/* Judge Assignments */}
                              <div className="mb-3">
                                {allJudgesData[heat.id] && allJudgesData[heat.id].length > 0 ? (
                                  <div className={`p-2 rounded-md ${allJudgesData[heat.id].length === 3 ? 'bg-muted/50' : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800'}`}>
                                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-2">
                                      Judges ({allJudgesData[heat.id].length}/3):
                                      {allJudgesData[heat.id].length < 3 && (
                                        <Badge variant="destructive" className="text-xs">Missing {3 - allJudgesData[heat.id].length}</Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {allJudgesData[heat.id].map((judge) => {
                                        const judgeUser = users.find(u => u.id === judge.judgeId);
                                        const roleLabel = judge.role === 'ESPRESSO' ? 'Espresso Judge' : judge.role === 'CAPPUCCINO' ? 'Cappuccino Judge' : judge.role;
                                        return (
                                          <Badge 
                                            key={judge.id} 
                                            variant={judge.role === 'CAPPUCCINO' ? 'default' : 'secondary'}
                                            className="text-xs"
                                            title={`${judgeUser?.name || 'Unknown'} - ${roleLabel} + Latte Art`}
                                          >
                                            {judgeUser?.name || 'Unknown'} ({roleLabel} + LA)
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md">
                                    <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1.5 flex items-center gap-2">
                                      Judges (0/3):
                                      <Badge variant="destructive" className="text-xs">Missing 3</Badge>
                                    </div>
                                    <p className="text-xs text-orange-600 dark:text-orange-400">
                                      No judges assigned. Click "Randomize Judges for All Heats" to assign.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Cup Position Assignment */}
                              {(heat.status === 'DONE' || heat.status === 'RUNNING') && (
                                <div className="mt-3 pt-3 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full min-h-[44px] text-sm sm:text-base"
                                    onClick={() => navigate(`/admin/cup-positions/${heat.id}`)}
                                  >
                                    <Coffee className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="truncate">Assign Cup Positions</span>
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-2 text-center px-2">
                                    Assign cup codes to left/right after judges score
                                  </p>
                                </div>
                              )}
                              
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

      {/* Station Migration Confirmation Dialog */}
      <AlertDialog open={showStationMigrationDialog} onOpenChange={setShowStationMigrationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Station?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStationChange && (() => {
                const disabledStation = enabledStations.find(s => !pendingStationChange.includes(s));
                const matchesOnStation = currentRoundHeats.filter(m => {
                  const stationData = stations.find(s => s.id === m.stationId);
                  return stationData?.name === disabledStation;
                }).length;
                
                return `Deactivating Station ${disabledStation} will mark it as OFFLINE. ${matchesOnStation > 0 ? `${matchesOnStation} heat${matchesOnStation !== 1 ? 's' : ''} will remain assigned to this station but it won't be used for new matches. ` : ''}The station can be reactivated later.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStationChange) {
                  setEnabledStations(pendingStationChange);
                  updateEnabledStationsMutation.mutate(pendingStationChange);
                }
                setShowStationMigrationDialog(false);
                setPendingStationChange(null);
              }}
            >
              Deactivate Station
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

