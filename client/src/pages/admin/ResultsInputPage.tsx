import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ClipboardList } from "lucide-react";
import HeatResultsInput from "@/components/HeatResultsInput";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertJudgeDetailedScore } from "@shared/schema";

export default function ResultsInputPage() {
  const { toast } = useToast();
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const { data: tournaments, isLoading: tournamentsLoading } = useQuery<any[]>({
    queryKey: ["/api/tournaments"],
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<any[]>({
    queryKey: ["/api/tournaments", selectedTournamentId, "matches"],
    enabled: !!selectedTournamentId,
  });

  const submitMutation = useMutation({
    mutationFn: async (scores: InsertJudgeDetailedScore[]) => {
      const response = await fetch("/api/detailed-scores/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores),
      });
      if (!response.ok) throw new Error("Failed to submit scores");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Judge scorecards submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches", selectedMatchId, "detailed-scores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches", selectedMatchId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit scorecards",
        variant: "destructive",
      });
    },
  });

  const selectedMatch = matches?.find((m: any) => m.id === selectedMatchId);

  if (tournamentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl" data-testid="page-results-input">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Results Input
        </h1>
        <p className="text-muted-foreground">
          Input judge scorecards for tournament heats
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Heat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tournament-select">Tournament</Label>
              <Select
                value={selectedTournamentId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedTournamentId(parseInt(value));
                  setSelectedMatchId(null);
                }}
              >
                <SelectTrigger id="tournament-select" data-testid="select-tournament">
                  <SelectValue placeholder="Select a tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments?.map((tournament: any) => (
                    <SelectItem key={tournament.id} value={tournament.id.toString()}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTournamentId && (
              <div>
                <Label htmlFor="heat-select">Heat</Label>
                {matchesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={selectedMatchId?.toString() || ""}
                    onValueChange={(value) => setSelectedMatchId(parseInt(value))}
                  >
                    <SelectTrigger id="heat-select" data-testid="select-heat">
                      <SelectValue placeholder="Select a heat" />
                    </SelectTrigger>
                    <SelectContent>
                      {matches?.map((match: any) => (
                        <SelectItem key={match.id} value={match.id.toString()}>
                          Heat {match.heatNumber} - Round {match.round}
                          {match.competitor1Id && match.competitor2Id && " (Ready)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedMatch && (
          <HeatResultsInput
            matchId={selectedMatch.id}
            heatNumber={selectedMatch.heatNumber}
            onSubmit={(scores) => submitMutation.mutate(scores)}
          />
        )}

        {selectedMatchId && submitMutation.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
