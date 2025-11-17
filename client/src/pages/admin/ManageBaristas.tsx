import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CheckCircle2, XCircle, Loader2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, Tournament, TournamentParticipant } from '@shared/schema';

const ManageBaristas: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);

  // Fetch upcoming tournaments (SETUP status)
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const upcomingTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'SETUP');
  }, [tournaments]);

  // Fetch all users
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch participants for selected tournament
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'participants'],
    enabled: !!selectedTournamentId,
  });

  // Get barista participants for selected tournament
  const tournamentBaristas = useMemo(() => {
    if (!selectedTournamentId || !participants.length) return [];
    
    return participants.map(p => {
      const user = allUsers.find(u => u.id === p.userId && u.role === 'BARISTA');
      return user ? { ...p, user } : null;
    }).filter((b): b is TournamentParticipant & { user: User } => b !== null);
  }, [participants, allUsers, selectedTournamentId]);

  // Pending baristas are those with seed = 0 or null (not yet seeded)
  const pendingBaristas = useMemo(() => {
    return tournamentBaristas.filter(b => !b.seed || b.seed === 0);
  }, [tournamentBaristas]);

  const approvedBaristas = useMemo(() => {
    return tournamentBaristas.filter(b => b.seed && b.seed > 0);
  }, [tournamentBaristas]);

  const filteredPendingBaristas = pendingBaristas.filter(b =>
    b.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApprovedBaristas = approvedBaristas.filter(b =>
    b.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approveMutation = useMutation({
    mutationFn: async ({ participantId, maxSeed }: { participantId: number; maxSeed: number }) => {
      // Assign next available seed
      const newSeed = maxSeed + 1;
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants/${participantId}/seed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seed: newSeed })
      });
      if (!response.ok) throw new Error('Failed to approve barista');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      toast({
        title: 'Barista Approved',
        description: 'The barista has been approved for this tournament.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve barista.',
        variant: 'destructive'
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (participantId: number) => {
      // Remove participant from tournament
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants/${participantId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove barista');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      toast({
        title: 'Registration Removed',
        description: 'The barista registration has been removed from this tournament.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove registration.',
        variant: 'destructive'
      });
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxSeed = approvedBaristas.length > 0 
    ? Math.max(...approvedBaristas.map(b => b.seed || 0))
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Manage Baristas
        </h1>
        <p className="text-muted-foreground">
          Approve barista registrations for upcoming tournaments
        </p>
      </div>

      {/* Tournament Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Select Tournament
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedTournamentId?.toString() || ''}
            onValueChange={(value) => setSelectedTournamentId(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose an upcoming tournament..." />
            </SelectTrigger>
            <SelectContent>
              {upcomingTournaments.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No upcoming tournaments</div>
              ) : (
                upcomingTournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id.toString()}>
                    {tournament.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedTournamentId ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Please select a tournament to view registrations</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <Input
              placeholder="Search baristas by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approval */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pending Approval</span>
                  <Badge variant="secondary">{filteredPendingBaristas.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPendingBaristas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending baristas for this tournament</p>
                ) : (
                  filteredPendingBaristas.map((barista) => (
                    <Card key={barista.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{barista.user.name}</div>
                            <div className="text-sm text-muted-foreground">{barista.user.email}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveMutation.mutate({ participantId: barista.id, maxSeed })}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMutation.mutate(barista.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Approved Baristas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Approved Baristas</span>
                  <Badge variant="default">{filteredApprovedBaristas.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredApprovedBaristas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No approved baristas yet</p>
                ) : (
                  filteredApprovedBaristas.map((barista) => (
                    <Card key={barista.id} className="border border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {barista.user.name}
                              <Badge variant="default" className="text-xs">Seed #{barista.seed}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{barista.user.email}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(barista.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageBaristas;

