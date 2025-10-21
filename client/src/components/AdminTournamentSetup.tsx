import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Trophy, MapPin, Shuffle, Loader2, Clock, Trash2, AlertTriangle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tournament, User, TournamentParticipant } from "@shared/schema";
import SegmentTimeConfig from "./SegmentTimeConfig";

interface SelectedCompetitors {
  competitors: Array<{ id: string; name: string; role: string; experience?: string; location?: string; specialty?: string; }>;
  judges: Array<{ id: string; name: string; role: string; experience?: string; location?: string; specialty?: string; }>;
}

export default function AdminTournamentSetup() {
  const { toast } = useToast();
  const [tournamentName, setTournamentName] = useState("World Espresso Championships");
  const [totalCompetitors, setTotalCompetitors] = useState(32);
  const [currentTournamentId, setCurrentTournamentId] = useState<number | null>(null);
  const [selectedCompetitors, setSelectedCompetitors] = useState<SelectedCompetitors>({
    competitors: [],
    judges: []
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'setup' | 'competitors' | 'judges' | 'segments' | 'seeds' | 'bracket'>('setup');

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

  // Fetch competitors for current tournament
  const { data: competitors = [] } = useQuery<TournamentParticipant[]>({
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

      // Tournament created - competitors will be added in next step

      return tournament;
    },
    onSuccess: (data: Tournament) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      setCurrentTournamentId(data.id);
      setCurrentStep('competitors');
      toast({
        title: "Tournament Created",
        description: `${tournamentName} has been created. Now select your competitors.`,
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
      setCurrentStep('bracket');
      toast({
        title: "Seeds Randomized",
        description: "Competitor seeds have been randomized successfully. Ready to generate bracket!",
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

  const addAllCompetitorsMutation = useMutation({
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
      setCurrentStep('setup'); // Reset to setup for next tournament
      toast({
        title: "Tournament Complete!",
        description: "Tournament bracket has been created with all rounds. Your tournament is ready to begin!",
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

  const handleAddAllCompetitors = () => {
    addAllCompetitorsMutation.mutate();
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

  // Get judges and baristas from users
  const judges = users.filter(u => u.role === 'JUDGE');
  const baristas = users.filter(u => u.role === 'BARISTA');

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep === 'setup' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'setup' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
                <span className="text-sm font-medium">Setup Tournament</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'competitors' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'competitors' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
                <span className="text-sm font-medium">Select Competitors</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'judges' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'judges' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
                <span className="text-sm font-medium">Select Judges</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'segments' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'segments' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>4</div>
                <span className="text-sm font-medium">Segment Times</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'seeds' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'seeds' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>5</div>
                <span className="text-sm font-medium">Randomize Seeds</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'bracket' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'bracket' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>6</div>
                <span className="text-sm font-medium">Generate Bracket</span>
              </div>
            </div>
            <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Tournament Creation Tutorial
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">🎯 Step-by-Step Tournament Creation</h3>
                    <p className="text-green-700 text-sm">
                      Follow these 6 steps to create a complete tournament with guided workflow.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Step 1: Setup Tournament</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Enter tournament name and number of competitors. Click "Create Tournament".
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Step 2: Select Competitors</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Choose your competitors (minimum 2). Click "Add Competitors".
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Step 3: Select Judges</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Choose your judges (minimum 3). Click "Add Judges".
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Step 4: Configure Segment Times</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Set up round times and segment durations. Click "Save Segment Times".
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Step 5: Randomize Seeds</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Shuffle competitor order randomly. Click "Randomize Seeds".
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Step 6: Generate Bracket</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Create the tournament bracket with matches. Click "Generate Bracket".
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-800 mb-2">⚠️ Common Issues & Solutions</h3>
                    <div className="space-y-2 text-sm text-gray-800">
                      <div><strong>Issue:</strong> "Insufficient Competitors" → <strong>Fix:</strong> Add at least 2 competitors</div>
                      <div><strong>Issue:</strong> "Insufficient Judges" → <strong>Fix:</strong> Add at least 3 judges</div>
                      <div><strong>Issue:</strong> "No tournament selected" → <strong>Fix:</strong> Create tournament first</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">🏆 Station Timing</h3>
                    <p className="text-sm text-blue-700">
                      Stations run independently: <strong>Station A</strong> (immediate), <strong>Station B</strong> (+10 minutes), <strong>Station C</strong> (+20 minutes)
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">💡 Pro Tips</h3>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• System handles any number of competitors (2, 6, 7, 12, 15, 22+)</li>
                      <li>• Odd competitor counts get automatic byes</li>
                      <li>• Use "Clear Tournament" to start over anytime</li>
                      <li>• Toast notifications guide you through each step</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Setup Form */}
      {!currentTournamentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Create New Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="total-competitors" className="text-sm font-medium">Number of Competitors</Label>
              <Input
                id="total-competitors"
                type="number"
                value={totalCompetitors}
                onChange={(e) => setTotalCompetitors(Number(e.target.value))}
                data-testid="input-total-competitors"
                className="mt-1"
                placeholder="Enter number of competitors"
                min="2"
                max="64"
              />
            </div>

            <Button 
              variant="default"
              onClick={handleCreateTournament}
              disabled={createTournamentMutation.isPending || !tournamentName.trim()}
              data-testid="button-create-tournament"
              size="lg"
              className="w-full"
            >
              {createTournamentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Tournament...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tournament Management - Only show after tournament is created */}
      {currentTournamentId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {tournaments?.find(t => t.id === currentTournamentId)?.name || 'Tournament'}
                </span>
                <Button 
                  variant="destructive"
                  onClick={handleClearTournament}
                  disabled={clearTournamentMutation.isPending}
                  data-testid="button-clear-tournament"
                  size="sm"
                >
                  {clearTournamentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Tournament
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>

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
                <Badge variant="secondary">{competitors.length} registered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {competitors.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    No competitors registered yet. Add competitors to the tournament.
                  </div>
                ) : (
                  competitors.map((competitor) => (
                    <div
                      key={competitor.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          #{competitor.seed}
                        </Badge>
                        <span className="font-medium">
                          {users.find(u => u.id === competitor.userId)?.name || 'Unknown'}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  ))
                )}
                <div className="flex flex-col gap-2 mt-4">
                   {competitors.length === 0 && (
                     <Button 
                       variant="outline"
                       onClick={handleAddAllCompetitors}
                       disabled={!currentTournamentId || baristas.length === 0 || addAllCompetitorsMutation.isPending}
                       data-testid="button-add-all-baristas"
                     >
                       {addAllCompetitorsMutation.isPending ? (
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
                  {competitors.length > 0 && !isPowerOfTwo(competitors.length) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800 font-medium">
                        Bracket requires power-of-2 participants (8, 16, 32...)
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Current: {competitors.length} participants. Need {getNextPowerOfTwo(competitors.length) - competitors.length} more to reach {getNextPowerOfTwo(competitors.length)}.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="secondary" 
                    onClick={handleRandomizeSeeds}
                    disabled={!currentTournamentId || competitors.length === 0 || randomizeSeedsMutation.isPending}
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
                    disabled={!currentTournamentId || competitors.length === 0 || !isPowerOfTwo(competitors.length) || generateBracketMutation.isPending}
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
        </>
      )}
    </div>
  );
}
