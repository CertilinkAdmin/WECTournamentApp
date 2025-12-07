import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, Settings, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface PerRoundHeatStructureConfigProps {
  tournamentId: number;
  rounds: number[];
  isLocked?: boolean;
}

interface RoundHeatStructure {
  round: number;
  dialInMinutes: number;
  cappuccinoMinutes: number;
  espressoMinutes: number;
  totalMinutes: number;
}

export default function PerRoundHeatStructureConfig({ 
  tournamentId, 
  rounds,
  isLocked = false
}: PerRoundHeatStructureConfigProps) {
  const { toast } = useToast();
  
  // State for each round's heat structure
  const [roundStructures, setRoundStructures] = useState<Record<number, {
    dialInMinutes: number;
    cappuccinoMinutes: number;
    espressoMinutes: number;
  }>>({});

  // Fetch all existing round heat structures
  const { data: existingStructures = [] } = useQuery<RoundHeatStructure[]>({
    queryKey: ['/api/tournaments', tournamentId, 'round-times'],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/round-times`);
      if (!response.ok) throw new Error('Failed to fetch heat structures');
      return await response.json();
    },
    enabled: !!tournamentId && rounds.length > 0,
  });

  // Initialize state from existing structures
  useEffect(() => {
    if (existingStructures.length > 0) {
      const structures: Record<number, {
        dialInMinutes: number;
        cappuccinoMinutes: number;
        espressoMinutes: number;
      }> = {};
      
      existingStructures.forEach(structure => {
        structures[structure.round] = {
          dialInMinutes: structure.dialInMinutes,
          cappuccinoMinutes: structure.cappuccinoMinutes,
          espressoMinutes: structure.espressoMinutes,
        };
      });

      // Fill in defaults for rounds that don't have structures yet
      rounds.forEach(round => {
        if (!structures[round]) {
          structures[round] = {
            dialInMinutes: 10,
            cappuccinoMinutes: 3,
            espressoMinutes: 2,
          };
        }
      });

      setRoundStructures(structures);
    } else {
      // Initialize with defaults for all rounds
      const defaults: Record<number, {
        dialInMinutes: number;
        cappuccinoMinutes: number;
        espressoMinutes: number;
      }> = {};
      
      rounds.forEach(round => {
        defaults[round] = {
          dialInMinutes: 10,
          cappuccinoMinutes: 3,
          espressoMinutes: 2,
        };
      });
      
      setRoundStructures(defaults);
    }
  }, [existingStructures, rounds]);

  // Ensure all rounds have structure initialized
  useEffect(() => {
    setRoundStructures(prev => {
      const updated = { ...prev };
      rounds.forEach(round => {
        if (!updated[round]) {
          updated[round] = {
            dialInMinutes: 10,
            cappuccinoMinutes: 3,
            espressoMinutes: 2,
          };
        }
      });
      return updated;
    });
  }, [rounds]);

  const updateRoundStructure = (
    round: number,
    field: 'dialInMinutes' | 'cappuccinoMinutes' | 'espressoMinutes',
    value: number
  ) => {
    setRoundStructures(prev => ({
      ...prev,
      [round]: {
        ...prev[round],
        [field]: value,
      },
    }));
  };

  const saveRoundStructureMutation = useMutation({
    mutationFn: async ({ round, structure }: { round: number; structure: typeof roundStructures[number] }) => {
      const response = await fetch(`/api/tournaments/${tournamentId}/round-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round,
          dialInMinutes: structure.dialInMinutes,
          cappuccinoMinutes: structure.cappuccinoMinutes,
          espressoMinutes: structure.espressoMinutes,
        }),
      });
      if (!response.ok) throw new Error('Failed to save heat structure');
      return await response.json();
    },
    onSuccess: async (_, variables) => {
      // Invalidate all round-times queries for this tournament
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/tournaments', tournamentId, 'round-times'],
        exact: false
      });
      // Force a refetch to ensure data is fresh
      await queryClient.refetchQueries({ 
        queryKey: ['/api/tournaments', tournamentId, 'round-times'],
        exact: false
      });
      
      toast({
        title: "Heat Structure Saved",
        description: `Round ${variables.round} heat structure saved successfully.`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveAllRoundsMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        rounds.map(async (round) => {
          const structure = roundStructures[round];
          if (!structure) {
            throw new Error(`No structure defined for Round ${round}`);
          }
          
          const response = await fetch(`/api/tournaments/${tournamentId}/round-times`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              round,
              dialInMinutes: structure.dialInMinutes,
              cappuccinoMinutes: structure.cappuccinoMinutes,
              espressoMinutes: structure.espressoMinutes,
            }),
          });
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Failed to save heat structure' }));
            throw new Error(error.error || `Failed to save Round ${round} heat structure`);
          }
          
          return await response.json();
        })
      );

      // Check if any failed
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        const errorMessages = failures.map((f: any) => f.reason?.message || 'Unknown error').join('; ');
        throw new Error(`Failed to save ${failures.length} round(s): ${errorMessages}`);
      }

      return results.map((r: any) => r.value);
    },
    onSuccess: async () => {
      // Invalidate all round-times queries for this tournament (catches both parent and child queries)
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/tournaments', tournamentId, 'round-times'],
        exact: false
      });
      // Also invalidate with pattern matching to catch any variations
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && 
                 key[0] === '/api/tournaments' && 
                 key[1] === tournamentId && 
                 key[2] === 'round-times';
        }
      });
      // Force a refetch to ensure data is fresh
      await queryClient.refetchQueries({ 
        queryKey: ['/api/tournaments', tournamentId, 'round-times'],
        exact: false
      });
      
      toast({
        title: "All Heat Structures Saved",
        description: `Heat structures for all ${rounds.length} rounds have been saved and locked in. The validation status will update automatically.`,
        duration: 4000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Saving Heat Structures",
        description: error.message || 'Failed to save some heat structures',
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const getRoundTotal = (round: number) => {
    const structure = roundStructures[round];
    if (!structure) return 0;
    return structure.dialInMinutes + structure.cappuccinoMinutes + structure.espressoMinutes;
  };

  const isRoundConfigured = (round: number) => {
    return existingStructures.some(s => s.round === round);
  };

  if (rounds.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="bg-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Settings className="h-5 w-5" />
          Per-Round Heat Structure Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Configure the timing structure for each round. Each round can have different heat durations.
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {rounds.map(round => {
          const structure = roundStructures[round];
          const total = getRoundTotal(round);
          const configured = isRoundConfigured(round);
          
          if (!structure) return null;

          return (
            <div key={round} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Round {round}</h3>
                  {configured && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Configured
                    </Badge>
                  )}
                  {!configured && (
                    <Badge variant="outline" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Configured
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Duration</div>
                  <div className="text-xl font-bold text-primary">{total} minutes</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`dial-in-${round}`}>Dial-In Segment (min)</Label>
                  <Input
                    id={`dial-in-${round}`}
                    type="number"
                    min={1}
                    value={structure.dialInMinutes}
                    onChange={(e) => updateRoundStructure(round, 'dialInMinutes', Number(e.target.value))}
                    disabled={isLocked}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Setup and preparation time</p>
                </div>
                <div>
                  <Label htmlFor={`cappuccino-${round}`}>Cappuccino Segment (min)</Label>
                  <Input
                    id={`cappuccino-${round}`}
                    type="number"
                    min={1}
                    value={structure.cappuccinoMinutes}
                    onChange={(e) => updateRoundStructure(round, 'cappuccinoMinutes', Number(e.target.value))}
                    disabled={isLocked}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Sensory evaluation time</p>
                </div>
                <div>
                  <Label htmlFor={`espresso-${round}`}>Espresso Segment (min)</Label>
                  <Input
                    id={`espresso-${round}`}
                    type="number"
                    min={1}
                    value={structure.espressoMinutes}
                    onChange={(e) => updateRoundStructure(round, 'espressoMinutes', Number(e.target.value))}
                    disabled={isLocked}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Technical evaluation time</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveRoundStructureMutation.mutate({ round, structure })}
                  disabled={saveRoundStructureMutation.isPending || isLocked}
                  size="sm"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveRoundStructureMutation.isPending ? 'Saving...' : 'Save Round ' + round}
                </Button>
              </div>
            </div>
          );
        })}

        {/* Summary of configuration status */}
        <div className="pt-4 border-t">
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Configuration Status</span>
              <span className="text-sm text-muted-foreground">
                {existingStructures.length} of {rounds.length} rounds configured
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {rounds.map(round => {
                const configured = isRoundConfigured(round);
                return (
                  <Badge 
                    key={round} 
                    variant={configured ? "default" : "outline"}
                    className="gap-1"
                  >
                    {configured ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Round {round}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Round {round}
                      </>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          <Button
            onClick={() => saveAllRoundsMutation.mutate()}
            disabled={saveAllRoundsMutation.isPending || isLocked}
            size="lg"
            className="w-full gap-2"
          >
            {saveAllRoundsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving All Round Structures...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save All Round Structures
              </>
            )}
          </Button>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Heat Segment Flow</h4>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Each heat follows this sequence: <strong>Dial-In</strong> → <strong>Cappuccino</strong> → <strong>Espresso</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Configure different timing structures for each round as needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

