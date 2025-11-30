import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gavel, CheckCircle2, XCircle, Loader2, Trophy, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { User, Tournament, TournamentParticipant } from '@shared/schema';

const ManageJudges: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  // Fetch participants for selected tournament (including judges)
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', selectedTournamentId, 'participants'],
    queryFn: async () => {
      if (!selectedTournamentId) return [];
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants?includeJudges=true`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
    enabled: !!selectedTournamentId,
  });

  // Get judge participants for selected tournament
  const tournamentJudges = useMemo(() => {
    if (!selectedTournamentId || !participants.length) return [];
    
    return participants.map(p => {
      const user = allUsers.find(u => u.id === p.userId && u.role === 'JUDGE');
      return user ? { ...p, user } : null;
    }).filter((j): j is TournamentParticipant & { user: User } => j !== null);
  }, [participants, allUsers, selectedTournamentId]);

  // Pending judges are those with seed = 0 or null (not yet approved)
  const pendingJudges = useMemo(() => {
    return tournamentJudges.filter(j => !j.seed || j.seed === 0);
  }, [tournamentJudges]);

  // Approved judges are those with seed > 0 (or any non-zero seed)
  const approvedJudges = useMemo(() => {
    return tournamentJudges.filter(j => j.seed && j.seed > 0);
  }, [tournamentJudges]);

  const filteredPendingJudges = pendingJudges.filter(j =>
    j.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApprovedJudges = approvedJudges.filter(j =>
    j.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approveMutation = useMutation({
    mutationFn: async ({ participantId }: { participantId: number }) => {
      // Approve judge by setting seed to 1 (judges don't compete, but seed marks them as approved)
      const response = await fetch(`/api/tournaments/${selectedTournamentId}/participants/${participantId}/seed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seed: 1 }) // Set seed to 1 to mark as approved
      });
      if (!response.ok) throw new Error('Failed to approve judge');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      toast({
        title: 'Judge Approved',
        description: 'The judge has been approved for this tournament.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve judge.',
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
      if (!response.ok) throw new Error('Failed to remove judge');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', selectedTournamentId, 'participants'] });
      toast({
        title: 'Registration Removed',
        description: 'The judge registration has been removed from this tournament.',
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

  // Get all judges who registered but aren't yet approved (not in participants)
  const registeredJudgeIds = new Set(tournamentJudges.map(j => j.userId));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Gavel className="h-8 w-8 text-primary" />
          Manage Judges
        </h1>
        <p className="text-muted-foreground">
          Approve judge registrations for upcoming tournaments
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
              placeholder="Search judges by name or email..."
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
                  <Badge variant="secondary">{filteredPendingJudges.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPendingJudges.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending judges for this tournament</p>
                ) : (
                  filteredPendingJudges.map((judge) => (
                    <Card key={judge.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{judge.user.name}</div>
                            <div className="text-sm text-muted-foreground">{judge.user.email}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveMutation.mutate({ participantId: judge.id })}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMutation.mutate(judge.id)}
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

            {/* Approved Judges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Approved Judges</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{filteredApprovedJudges.length}</Badge>
                    {filteredApprovedJudges.length > 0 && selectedTournamentId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/judges/scoring/${selectedTournamentId}`)}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Score Heats
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredApprovedJudges.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No approved judges yet</p>
                ) : (
                  filteredApprovedJudges.map((judge) => (
                    <Card key={judge.id} className="border border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {judge.user.name}
                              <Badge variant="default" className="text-xs">Approved</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{judge.user.email}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(judge.id)}
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

export default ManageJudges;
