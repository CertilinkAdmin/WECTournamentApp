import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save } from "lucide-react";
import type { TournamentRoundTime } from "@shared/schema";

interface SegmentTimeConfigProps {
  tournamentId: number;
}

export default function SegmentTimeConfig({ tournamentId }: SegmentTimeConfigProps) {
  const { toast } = useToast();
  const [round, setRound] = useState(1);
  const [dialInMinutes, setDialInMinutes] = useState(10);
  const [cappuccinoMinutes, setCappuccinoMinutes] = useState(3);
  const [espressoMinutes, setEspressoMinutes] = useState(2);

  // Fetch existing round times
  const { data: roundTimes = [] } = useQuery<TournamentRoundTime[]>({
    queryKey: ['/api/tournaments', tournamentId, 'round-times'],
  });

  const saveTimesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/round-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round,
          dialInMinutes,
          cappuccinoMinutes,
          espressoMinutes
        })
      });
      if (!response.ok) throw new Error('Failed to save segment times');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'round-times'] });
      toast({
        title: "Segment Times Saved",
        description: `Round ${round} times have been configured successfully.`,
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
    saveTimesMutation.mutate();
  };

  return (
    <Card>
      <CardHeader className="bg-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Clock className="h-5 w-5" />
          Heat Segment Time Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="round">Round</Label>
            <Input
              id="round"
              type="number"
              min={1}
              max={5}
              value={round}
              onChange={(e) => setRound(Number(e.target.value))}
              data-testid="input-round"
            />
          </div>
          <div>
            <Label htmlFor="dial-in">Dial-In (min)</Label>
            <Input
              id="dial-in"
              type="number"
              min={1}
              value={dialInMinutes}
              onChange={(e) => setDialInMinutes(Number(e.target.value))}
              data-testid="input-dial-in"
            />
          </div>
          <div>
            <Label htmlFor="cappuccino">Cappuccino (min)</Label>
            <Input
              id="cappuccino"
              type="number"
              min={1}
              value={cappuccinoMinutes}
              onChange={(e) => setCappuccinoMinutes(Number(e.target.value))}
              data-testid="input-cappuccino"
            />
          </div>
          <div>
            <Label htmlFor="espresso">Espresso (min)</Label>
            <Input
              id="espresso"
              type="number"
              min={1}
              value={espressoMinutes}
              onChange={(e) => setEspressoMinutes(Number(e.target.value))}
              data-testid="input-espresso"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-md">
          <div className="text-sm">
            <span className="text-muted-foreground">Total Time:</span>
            <span className="ml-2 font-bold text-lg">
              {dialInMinutes + cappuccinoMinutes + espressoMinutes} minutes
            </span>
          </div>
          <Button onClick={handleSave} data-testid="button-save-times" disabled={saveTimesMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>

        {roundTimes.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Configured Rounds</h3>
            <div className="space-y-2">
              {roundTimes.map((rt) => (
                <div
                  key={rt.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm"
                  data-testid={`round-time-${rt.round}`}
                >
                  <span className="font-medium">Round {rt.round}</span>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>Dial-In: {rt.dialInMinutes}min</span>
                    <span>Cappuccino: {rt.cappuccinoMinutes}min</span>
                    <span>Espresso: {rt.espressoMinutes}min</span>
                    <span className="font-medium text-foreground">Total: {rt.totalMinutes}min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
