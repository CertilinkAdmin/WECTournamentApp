import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, Settings, CheckCircle } from "lucide-react"; // Import CheckCircle
import type { Tournament } from "@shared/schema";

interface SegmentTimeConfigProps {
  tournamentId: number;
}

export default function SegmentTimeConfig({ tournamentId }: SegmentTimeConfigProps) {
  const { toast } = useToast();
  const [dialInMinutes, setDialInMinutes] = useState(10);
  const [cappuccinoMinutes, setCappuccinoMinutes] = useState(3);
  const [espressoMinutes, setEspressoMinutes] = useState(2);

  // Fetch tournament
  const { data: tournament } = useQuery<Tournament>({
    queryKey: ['/api/tournaments', tournamentId],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) throw new Error('Failed to fetch tournament');
      return await response.json();
    },
    enabled: !!tournamentId,
  });

  // Fetch existing heat structure (use round 1 as the template)
  const { data: heatStructure } = useQuery<any>({
    queryKey: ['/api/tournaments', tournamentId, 'heat-structure'],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/round-times`);
      if (!response.ok) throw new Error('Failed to fetch heat structure');
      const roundTimes = await response.json();
      // Return the first configuration as the template, or null if none exists
      return roundTimes.length > 0 ? roundTimes[0] : null;
    },
    enabled: !!tournamentId,
  });

  // Load existing values when heat structure is fetched
  useEffect(() => {
    if (heatStructure) {
      setDialInMinutes(heatStructure.dialInMinutes);
      setCappuccinoMinutes(heatStructure.cappuccinoMinutes);
      setEspressoMinutes(heatStructure.espressoMinutes);
    }
  }, [heatStructure]);

  const saveStructureMutation = useMutation({
    mutationFn: async () => {
      // Save as round 1 configuration (will be used as template for all heats)
      const response = await fetch(`/api/tournaments/${tournamentId}/round-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round: 1,
          dialInMinutes,
          cappuccinoMinutes,
          espressoMinutes
        })
      });
      if (!response.ok) throw new Error('Failed to save heat structure');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'heat-structure'] });
      toast({
        title: "Heat Structure Saved",
        description: `All heats will use this timing structure: ${dialInMinutes + cappuccinoMinutes + espressoMinutes} minutes total.`,
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

  const handleSave = () => {
    saveStructureMutation.mutate();
  };

  // This is a placeholder for totalDuration and saveMutation.isPending, assuming they are defined elsewhere in the component.
  // In a real scenario, totalDuration would be calculated and saveMutation would be the one from useMutation.
  const totalDuration = dialInMinutes + cappuccinoMinutes + espressoMinutes;
  const saveMutation = saveStructureMutation; // Alias for clarity in the modified snippet
  const roundTimes = heatStructure; // Alias for clarity in the modified snippet

  return (
    <Card>
      <CardHeader className="bg-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <img src="/icons/stopwatch.png" alt="Stopwatch" className="h-5 w-5" />
          <Settings className="h-5 w-5" />
          Heat Structure Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Configure the timing structure that will be used for all heats in this tournament.
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dial-in">Dial-In Segment (min)</Label>
            <Input
              id="dial-in"
              type="number"
              min={1}
              value={dialInMinutes}
              onChange={(e) => setDialInMinutes(Number(e.target.value))}
              data-testid="input-dial-in"
            />
            <p className="text-xs text-muted-foreground mt-1">Setup and preparation time</p>
          </div>
          <div>
            <Label htmlFor="cappuccino">Cappuccino Segment (min)</Label>
            <Input
              id="cappuccino"
              type="number"
              min={1}
              value={cappuccinoMinutes}
              onChange={(e) => setCappuccinoMinutes(Number(e.target.value))}
              data-testid="input-cappuccino"
            />
            <p className="text-xs text-muted-foreground mt-1">Sensory evaluation time</p>
          </div>
          <div>
            <Label htmlFor="espresso">Espresso Segment (min)</Label>
            <Input
              id="espresso"
              type="number"
              min={1}
              value={espressoMinutes}
              onChange={(e) => setEspressoMinutes(Number(e.target.value))}
              data-testid="input-espresso"
            />
            <p className="text-xs text-muted-foreground mt-1">Technical evaluation time</p>
          </div>
        </div>

        {/* Start of modified section for Total Heat Duration */}
        <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm sm:text-base">Total Heat Duration:</h4>
                <p className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">
                  {totalDuration} minutes
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={handleSave}
                  disabled={saveStructureMutation.isPending}
                  className="gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                  {saveStructureMutation.isPending ? 'Saving...' : 'Save Heat Structure'}
                </Button>
              </div>
            </div>
          </div>
        {/* End of modified section for Total Heat Duration */}


        {heatStructure && (
          // Start of modified section for Current Heat Structure
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h3 className="text-base sm:text-lg font-semibold">Current Heat Structure</h3>
            </div>

            <div className="p-3 sm:p-4 bg-primary/10 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="bg-green-600 text-white p-3 rounded-md text-center min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Dial-In:</div>
                  <div className="text-base sm:text-lg font-bold whitespace-nowrap">{heatStructure.dialInMinutes}min</div>
                </div>
                <div className="bg-blue-600 text-white p-3 rounded-md text-center min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Cappuccino:</div>
                  <div className="text-base sm:text-lg font-bold whitespace-nowrap">{heatStructure.cappuccinoMinutes}min</div>
                </div>
                <div className="bg-orange-600 text-white p-3 rounded-md text-center min-w-0">
                  <div className="font-semibold text-sm sm:text-base">Espresso:</div>
                  <div className="text-base sm:text-lg font-bold whitespace-nowrap">{heatStructure.espressoMinutes}min</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">This timing structure will be applied to all heats in the tournament</span>
              </div>
            </div>
          </div>
          // End of modified section for Current Heat Structure
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Heat Segment Flow</h4>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Each heat follows this sequence: <strong>Dial-In</strong> → <strong>Cappuccino</strong> → <strong>Espresso</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            This structure applies to every heat across all rounds of the tournament.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}