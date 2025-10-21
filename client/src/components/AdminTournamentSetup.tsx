import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Trophy, MapPin, Shuffle, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tournament, User, TournamentParticipant } from "@shared/schema";
import SegmentTimeConfig from "./SegmentTimeConfig";

export default function AdminTournamentSetup() {
  const { toast } = useToast();
  const [tournamentName, setTournamentName] = useState("World Espresso Championships");
  const [totalCompetitors, setTotalCompetitors] = useState(32);
  const [currentTournamentId, setCurrentTournamentId] = useState<number | null>(null);

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
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tournamentName,
          status: 'SETUP',
          totalRounds: 5,
          currentRound: 1
        })
      });
      if (!response.ok) throw new Error('Failed to create tournament');
      return await response.json();
    },
    onSuccess: (data: Tournament) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      setCurrentTournamentId(data.id);
      toast({
        title: "Tournament Created",
        description: `${tournamentName} has been initialized.`,
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

  const generateBracketMutation = useMutation({
    mutationFn: async () => {
      if (!currentTournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${currentTournamentId}/generate-bracket`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to generate bracket');
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

  // Get judges and baristas from users
  const judges = users.filter(u => u.role === 'JUDGE');
  const baristas = users.filter(u => u.role === 'BARISTA');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Trophy className="h-6 w-6" />
            Tournament Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                data-testid="input-tournament-name"
              />
            </div>
            <div>
              <Label htmlFor="total-competitors">Total Competitors</Label>
              <Input
                id="total-competitors"
                type="number"
                value={totalCompetitors}
                onChange={(e) => setTotalCompetitors(Number(e.target.value))}
                data-testid="input-total-competitors"
              />
            </div>
          </div>
          <Button 
            onClick={handleCreateTournament} 
            className="w-full" 
            disabled={createTournamentMutation.isPending}
            data-testid="button-create-tournament"
          >
            {createTournamentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Initialize Tournament
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="competitors" data-testid="tab-competitors">
            <Users className="h-4 w-4 mr-2" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            <Clock className="h-4 w-4 mr-2" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="judges" data-testid="tab-judges">
            <Trophy className="h-4 w-4 mr-2" />
            Judges
          </TabsTrigger>
          <TabsTrigger value="stations" data-testid="tab-stations">
            <MapPin className="h-4 w-4 mr-2" />
            Stations
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
                  <Button variant="outline" data-testid="button-add-competitor">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Competitor
                  </Button>
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
                    disabled={!currentTournamentId || participants.length === 0 || generateBracketMutation.isPending}
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
