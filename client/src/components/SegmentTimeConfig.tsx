
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, Settings } from "lucide-react";
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

        <div className="flex items-center justify-between p-4 bg-muted rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <img src="/icons/stopwatch.png" alt="Stopwatch" className="h-4 w-4 opacity-70" />
            <span className="text-muted-foreground">Total Heat Duration:</span>
            <span className="ml-2 font-bold text-lg">
              {dialInMinutes + cappuccinoMinutes + espressoMinutes} minutes
            </span>
          </div>
          <Button onClick={handleSave} data-testid="button-save-structure" disabled={saveStructureMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Heat Structure
          </Button>
        </div>

        {heatStructure && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <img src="/icons/stopwatch.png" alt="Stopwatch" className="h-4 w-4" />
              <h3 className="text-sm font-medium">Current Heat Structure</h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <img src="/icons/stopwatch.png" alt="Stopwatch" className="h-3 w-3 opacity-60" />
                  <span className="font-medium text-green-800 dark:text-green-200">All Heats Structure</span>
                </div>
                <div className="flex gap-4 text-green-700 dark:text-green-300">
                  <span>Dial-In: {heatStructure.dialInMinutes}min</span>
                  <span>Cappuccino: {heatStructure.cappuccinoMinutes}min</span>
                  <span>Espresso: {heatStructure.espressoMinutes}min</span>
                  <span className="font-medium">Total: {heatStructure.totalMinutes}min</span>
                </div>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ This timing structure will be applied to all heats in the tournament
              </p>
            </div>
          </div>
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
