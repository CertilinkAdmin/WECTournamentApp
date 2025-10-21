import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Trophy, MapPin, Shuffle, Loader2, Clock, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tournament, User, TournamentParticipant } from "@shared/schema";
import SegmentTimeConfig from "./SegmentTimeConfig";
import ParticipantSelection from "./ParticipantSelection";

interface SelectedParticipants {
  competitors: Array<{ id: string; name: string; role: string; experience?: string; location?: string; specialty?: string; }>;
  judges: Array<{ id: string; name: string; role: string; experience?: string; location?: string; specialty?: string; }>;
}

export default function AdminTournamentSetup() {
  const { toast } = useToast();
  const [tournamentName, setTournamentName] = useState("World Espresso Championships");
  const [totalCompetitors, setTotalCompetitors] = useState(32);
  const [currentTournamentId, setCurrentTournamentId] = useState<number | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipants>({
    competitors: [],
    judges: []
  });
  const [showParticipantSelection, setShowParticipantSelection] = useState(false);

  // Helper functions for power-of-2 validation
  const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
  const getNextPowerOfTwo = (n: number) => {
    if (n <= 0) return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };

  // Fetch tournaments
  const { data: tournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch participants for current tournament
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', currentTournamentId, 'participants'],
    enabled: !!currentTournamentId,
  });

  // Use latest tournament as current
  useEffect(() => {
    if (tournaments && tournaments.length > 0 && !currentTournamentId) {
      setCurrentTournamentId(tournaments[0].id);
    }
  }, [tournaments, currentTournamentId]);

  const createTournamentMutation = useMutation({
    mutationFn: async () => {
      // First create the tournament
      const tournamentResponse = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tournamentName,
          status: 'SETUP',
          totalRounds: 5,
          currentRound: 1
        })
      });
      if (!tournamentResponse.ok) throw new Error('Failed to create tournament');
      const tournament = await tournamentResponse.json();

      // Then create participants from selected participants
      const participantPromises = [];
      
      // Add competitors
      for (let i = 0; i < selectedParticipants.competitors.length; i++) {
        const competitor = selectedParticipants.competitors[i];
        participantPromises.push(
          fetch(`/api/tournaments/${tournament.id}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: competitor.id, // This would need to be mapped to actual user IDs
              seed: i + 1
            })
          })
        );
      }

      // All participants are competitors - no separate barista handling needed

      // Wait for all participants to be created
      try {
        await Promise.all(participantPromises);
      } catch (error) {
        console.error('Error creating participants:', error);
        // Tournament was created but participants failed - this is still a partial success
        throw new Error('Tournament created but some participants failed to be added. Please check the tournament and add participants manually.');
      }

      return tournament;
    },
    onSuccess: (data: Tournament) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', data.id, 'participants'] });
      setCurrentTournamentId(data.id);
      setShowParticipantSelection(false);
      toast({
        title: "Tournament Created",
        description: `${tournamentName} has been initialized with ${selectedParticipants.competitors.length} competitors and ${selectedParticipants.judges.length} judges.`,
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

  const randomizeSeedsMutation = useMutation({
    mutationFn: async () => {
      if (!currentTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${currentTournamentId}/randomize-seeds`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to randomize seeds');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', currentTournamentId, 'participants'] });
      toast({
        title: "Seeds Randomized",
        description: "Competitor seeds have been randomized successfully.",
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

  const addAllBaristasMutation = useMutation({
    mutationFn: async () => {
      if (!currentTournamentId) throw new Error("No tournament selected");
      
      // Add all competitors with sequential seeds (max 16 for power-of-2 bracket)
      const competitorsToAdd = users.filter(u => u.role === 'BARISTA').slice(0, 16);
      const promises = competitorsToAdd.map((competitor, index) => 
        fetch(`/api/tournaments/${currentTournamentId}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: competitor.id,
            seed: index + 1
          })
        })
      );
      
      const responses = await Promise.all(promises);
      const failedResponses = responses.filter(r => !r.ok);
      if (failedResponses.length > 0) {
        throw new Error(`Failed to add ${failedResponses.length} competitors`);
      }
      
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', currentTournamentId, 'participants'] });
      toast({
        title: "Competitors Added",
        description: `Successfully added competitors to the tournament.`,
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

  const generateBracketMutation = useMutation({
    mutationFn: async () => {
      if (!currentTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${currentTournamentId}/generate-bracket`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate bracket');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', currentTournamentId, 'matches'] });
      toast({
        title: "Bracket Generated",
        description: "Tournament bracket has been created with all rounds.",
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

  const handleCreateTournament = () => {
    createTournamentMutation.mutate();
  };

  const handleRandomizeSeeds = () => {
    randomizeSeedsMutation.mutate();
  };

  const handleGenerateBracket = () => {
    generateBracketMutation.mutate();
  };

  const handleAddAllBaristas = () => {
    addAllBaristasMutation.mutate();
  };

  // Removed power-of-2 validation - tournaments can handle any number of participants

  const clearTournamentMutation = useMutation({
    mutationFn: async () => {
      if (!currentTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${currentTournamentId}/clear`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to clear tournament');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', currentTournamentId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', currentTournamentId, 'matches'] });
      setSelectedParticipants({ competitors: [], judges: [] });
      setCurrentTournamentId(null);
      toast({
        title: "Tournament Cleared",
        description: "All tournament data has been cleared. You can start fresh.",
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

  const handleClearTournament = () => {
    if (window.confirm("Are you sure you want to clear all tournament data? This action cannot be undone.")) {
      clearTournamentMutation.mutate();
    }
  };

  const handleParticipantSelectionChange = (selection: SelectedParticipants) => {
    setSelectedParticipants(selection);
  };

  const handleCreateTournamentWithParticipants = () => {
    // Validate tournament name
    if (!tournamentName.trim()) {
      toast({
        title: "Tournament Name Required",
        description: "Please enter a tournament name.",
        variant: "destructive"
      });
      return;
    }

    // Validate participant counts
    if (selectedParticipants.competitors.length < 2) {
      toast({
        title: "Insufficient Competitors",
        description: "Please select at least 2 competitors for the tournament.",
        variant: "destructive"
      });
      return;
    }
    // Removed barista validation - all participants are competitors
    if (selectedParticipants.judges.length < 3) {
      toast({
        title: "Insufficient Judges",
        description: "Please select at least 3 judges for the tournament.",
        variant: "destructive"
      });
      return;
    }

    // Validate total competitors count
    if (selectedParticipants.competitors.length > totalCompetitors) {
      toast({
        title: "Too Many Competitors",
        description: `You have selected ${selectedParticipants.competitors.length} competitors, but the tournament is set for ${totalCompetitors} competitors.`,
        variant: "destructive"
      });
      return;
    }

    createTournamentMutation.mutate();
  };

  // Get judges and baristas from users
  const judges = users.filter(u => u.role === 'JUDGE');
  const baristas = users.filter(u => u.role === 'BARISTA');

  return (
    <div className="space-y-6">
      {/* Tournament Creation/Management */}
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Trophy className="h-6 w-6" />
            Tournament Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="tournament-name" className="text-sm font-medium">Tournament Name</Label>
              <Input
                id="tournament-name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                data-testid="input-tournament-name"
                className="mt-1"
                placeholder="Enter tournament name"
              />
            </div>
            <div>
              <Label htmlFor="total-competitors" className="text-sm font-medium">Total Competitors</Label>
              <Input
                id="total-competitors"
                type="number"
                value={totalCompetitors}
                onChange={(e) => setTotalCompetitors(Number(e.target.value))}
                data-testid="input-total-competitors"
                className="mt-1"
                min="2"
                max="64"
              />
            </div>
          </div>
          
          {/* Participant Selection Summary */}
          {selectedParticipants.competitors.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="font-medium text-sm sm:text-base">Selected Participants</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowParticipantSelection(!showParticipantSelection)}
                    className="w-full sm:w-auto"
                  >
                    {showParticipantSelection ? 'Hide' : 'Edit'} Selection
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                  <Badge variant="secondary" className="flex items-center gap-1 justify-center sm:justify-start">
                    <Users className="h-3 w-3" />
                    {selectedParticipants.competitors.length} Competitors
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1 justify-center sm:justify-start">
                    <Trophy className="h-3 w-3" />
                    {selectedParticipants.judges.length} Judges
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleCreateTournamentWithParticipants} 
              className="flex-1" 
              disabled={createTournamentMutation.isPending || selectedParticipants.competitors.length < 2}
              data-testid="button-create-tournament"
              size="lg"
            >
              {createTournamentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Creating Tournament & Adding Participants...</span>
                  <span className="sm:hidden">Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Create Tournament</span>
                  <span className="sm:hidden">Create</span>
                </>
              )}
            </Button>
            
            {currentTournamentId && (
              <Button 
                variant="destructive"
                onClick={handleClearTournament}
                disabled={clearTournamentMutation.isPending}
                data-testid="button-clear-tournament"
                size="lg"
                className="w-full sm:w-auto"
              >
                {clearTournamentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Clearing...</span>
                    <span className="sm:hidden">Clear...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Clear Tournament</span>
                    <span className="sm:hidden">Clear</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {selectedParticipants.competitors.length < 2 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Please select participants before creating the tournament.</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowParticipantSelection(true)}
                className="w-full"
                data-testid="button-select-participants"
                size="lg"
              >
                <Users className="h-4 w-4 mr-2" />
                Select Participants
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participant Selection Interface */}
      {showParticipantSelection && (
        <ParticipantSelection 
          onSelectionChange={handleParticipantSelectionChange}
          initialSelection={selectedParticipants}
        />
      )}

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="competitors" data-testid="tab-competitors" className="flex-col sm:flex-row h-auto py-2">
            <Users className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
            <span className="text-xs sm:text-sm">Competitors</span>
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments" className="flex-col sm:flex-row h-auto py-2">
            <Clock className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
            <span className="text-xs sm:text-sm">Segments</span>
          </TabsTrigger>
          <TabsTrigger value="judges" data-testid="tab-judges" className="flex-col sm:flex-row h-auto py-2">
            <Trophy className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
            <span className="text-xs sm:text-sm">Judges</span>
          </TabsTrigger>
          <TabsTrigger value="stations" data-testid="tab-stations" className="flex-col sm:flex-row h-auto py-2">
            <MapPin className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
            <span className="text-xs sm:text-sm">Stations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Competitor Registration</span>
                <Badge variant="secondary">{participants.length} registered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    No competitors registered yet. Add baristas to the tournament.
                  </div>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          #{participant.seed}
                        </Badge>
                        <span className="font-medium">
                          {users.find(u => u.id === participant.userId)?.name || 'Unknown'}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  ))
                )}
                <div className="flex flex-col gap-2 mt-4">
                   {participants.length === 0 && (
                     <Button 
                       variant="outline"
                       onClick={handleAddAllBaristas}
                       disabled={!currentTournamentId || baristas.length === 0 || addAllBaristasMutation.isPending}
                       data-testid="button-add-all-baristas"
                     >
                       {addAllBaristasMutation.isPending ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           Adding Baristas...
                         </>
                       ) : (
                         <>
                           <Users className="h-4 w-4 mr-2" />
                           Add All Baristas ({Math.min(baristas.length, 16)})
                         </>
                       )}
                     </Button>
                   )}
                  
                  {/* Power-of-2 validation message */}
                  {participants.length > 0 && !isPowerOfTwo(participants.length) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800 font-medium">
                        Bracket requires power-of-2 participants (8, 16, 32...)
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Current: {participants.length} participants. Need {getNextPowerOfTwo(participants.length) - participants.length} more to reach {getNextPowerOfTwo(participants.length)}.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="secondary" 
                    onClick={handleRandomizeSeeds}
                    disabled={!currentTournamentId || participants.length === 0 || randomizeSeedsMutation.isPending}
                    data-testid="button-randomize-seeds"
                  >
                    {randomizeSeedsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Randomizing...
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-4 w-4 mr-2" />
                        Randomize Seeds
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={handleGenerateBracket}
                    disabled={!currentTournamentId || participants.length === 0 || !isPowerOfTwo(participants.length) || generateBracketMutation.isPending}
                    data-testid="button-generate-bracket"
                  >
                    {generateBracketMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Trophy className="h-4 w-4 mr-2" />
                        Generate Bracket
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="mt-6">
          {currentTournamentId ? (
            <SegmentTimeConfig tournamentId={currentTournamentId} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Please create a tournament first.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="judges" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Judge Assignments</span>
                <Badge variant="secondary">{judges.length} judges</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {judges.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    No judges assigned yet.
                  </div>
                ) : (
                  judges.map((judge) => (
                    <div
                      key={judge.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{judge.name}</span>
                        <Badge variant="secondary">{judge.role}</Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        Reassign
                      </Button>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full mt-4" data-testid="button-add-judge">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Judge
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Station Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["A", "B", "C"].map((station) => (
                  <div
                    key={station}
                    className="flex items-center justify-between p-4 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-heading font-bold">Station {station}</div>
                      <Badge variant="secondary">Available</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
