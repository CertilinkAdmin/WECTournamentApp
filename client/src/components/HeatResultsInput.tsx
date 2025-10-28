import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Trophy, Users, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InsertJudgeDetailedScore } from "@shared/schema";

interface JudgeScoreEntry {
  judgeName: string;
  leftCupCode: string;
  rightCupCode: string;
  sensoryBeverage: "Cappuccino" | "Espresso";
  visualLatteArt: "left" | "right";
  taste: "left" | "right";
  tactile: "left" | "right";
  flavour: "left" | "right";
  overall: "left" | "right";
}

interface CompetitorScores {
  cupCode: string;
  competitorName: string;
  totalPoints: number;
}

interface HeatResultsInputProps {
  matchId: number;
  heatNumber: number;
  onSubmit?: (scores: InsertJudgeDetailedScore[]) => void;
}

const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

export default function HeatResultsInput({ matchId, heatNumber, onSubmit }: HeatResultsInputProps) {
  const { toast } = useToast();
  const [judges, setJudges] = useState<JudgeScoreEntry[]>([
    {
      judgeName: "",
      leftCupCode: "",
      rightCupCode: "",
      sensoryBeverage: "Cappuccino",
      visualLatteArt: "left",
      taste: "left",
      tactile: "left",
      flavour: "left",
      overall: "left",
    },
  ]);

  const addJudge = () => {
    setJudges([
      ...judges,
      {
        judgeName: "",
        leftCupCode: "",
        rightCupCode: "",
        sensoryBeverage: "Espresso",
        visualLatteArt: "left",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
      },
    ]);
  };

  const removeJudge = (index: number) => {
    setJudges(judges.filter((_, i) => i !== index));
  };

  const updateJudge = (index: number, field: keyof JudgeScoreEntry, value: any) => {
    const newJudges = [...judges];
    newJudges[index] = { ...newJudges[index], [field]: value };
    setJudges(newJudges);
  };

  const calculateScores = (): CompetitorScores[] => {
    const scoreMap = new Map<string, { competitorName: string; points: number }>();

    judges.forEach((judge) => {
      // Initialize cup codes if not in map
      if (!scoreMap.has(judge.leftCupCode) && judge.leftCupCode) {
        scoreMap.set(judge.leftCupCode, { competitorName: "", points: 0 });
      }
      if (!scoreMap.has(judge.rightCupCode) && judge.rightCupCode) {
        scoreMap.set(judge.rightCupCode, { competitorName: "", points: 0 });
      }

      // Award points based on which cup won each category
      Object.entries(CATEGORY_POINTS).forEach(([category, points]) => {
        const winner = judge[category as keyof typeof CATEGORY_POINTS];
        const cupCode = winner === "left" ? judge.leftCupCode : judge.rightCupCode;
        
        if (cupCode && scoreMap.has(cupCode)) {
          scoreMap.get(cupCode)!.points += points;
        }
      });
    });

    return Array.from(scoreMap.entries()).map(([cupCode, data]) => ({
      cupCode,
      competitorName: data.competitorName,
      totalPoints: data.points,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    for (let i = 0; i < judges.length; i++) {
      const judge = judges[i];
      if (!judge.judgeName || !judge.leftCupCode || !judge.rightCupCode) {
        toast({
          title: "Validation Error",
          description: `Judge ${i + 1}: Please fill in judge name and both cup codes`,
          variant: "destructive",
        });
        return;
      }
    }

    const detailedScores: InsertJudgeDetailedScore[] = judges.map((judge) => ({
      matchId,
      judgeName: judge.judgeName,
      leftCupCode: judge.leftCupCode,
      rightCupCode: judge.rightCupCode,
      sensoryBeverage: judge.sensoryBeverage,
      visualLatteArt: judge.visualLatteArt,
      taste: judge.taste,
      tactile: judge.tactile,
      flavour: judge.flavour,
      overall: judge.overall,
    }));

    onSubmit?.(detailedScores);
  };

  const scores = calculateScores();
  const winner = scores.length === 2 
    ? scores[0].totalPoints > scores[1].totalPoints 
      ? scores[0] 
      : scores[1]
    : null;

  return (
    <div className="space-y-6" data-testid="heat-results-input">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Heat {heatNumber} Results Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {judges.map((judge, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Judge {index + 1}
                  </CardTitle>
                  {judges.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeJudge(index)}
                      data-testid={`button-remove-judge-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Judge Name and Cup Codes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`judge-name-${index}`}>Judge Name</Label>
                    <Input
                      id={`judge-name-${index}`}
                      value={judge.judgeName}
                      onChange={(e) => updateJudge(index, "judgeName", e.target.value)}
                      placeholder="Enter judge name"
                      data-testid={`input-judge-name-${index}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`left-cup-${index}`}>Left Cup Code</Label>
                    <Input
                      id={`left-cup-${index}`}
                      value={judge.leftCupCode}
                      onChange={(e) => updateJudge(index, "leftCupCode", e.target.value.toUpperCase())}
                      placeholder="e.g., Q5"
                      maxLength={3}
                      data-testid={`input-left-cup-${index}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`right-cup-${index}`}>Right Cup Code</Label>
                    <Input
                      id={`right-cup-${index}`}
                      value={judge.rightCupCode}
                      onChange={(e) => updateJudge(index, "rightCupCode", e.target.value.toUpperCase())}
                      placeholder="e.g., B1"
                      maxLength={3}
                      data-testid={`input-right-cup-${index}`}
                    />
                  </div>
                </div>

                {/* Sensory Beverage Type */}
                <div>
                  <Label htmlFor={`sensory-beverage-${index}`}>Sensory Beverage</Label>
                  <Select
                    value={judge.sensoryBeverage}
                    onValueChange={(value: "Cappuccino" | "Espresso") =>
                      updateJudge(index, "sensoryBeverage", value)
                    }
                  >
                    <SelectTrigger id={`sensory-beverage-${index}`} data-testid={`select-sensory-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cappuccino">Cappuccino</SelectItem>
                      <SelectItem value="Espresso">Espresso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scoring Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visual/Latte Art (3 points) */}
                  <div>
                    <Label>Visual/Latte Art (3 points)</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={judge.visualLatteArt === "left" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "visualLatteArt", "left")}
                        className="flex-1"
                        data-testid={`button-visual-left-${index}`}
                      >
                        Left
                      </Button>
                      <Button
                        type="button"
                        variant={judge.visualLatteArt === "right" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "visualLatteArt", "right")}
                        className="flex-1"
                        data-testid={`button-visual-right-${index}`}
                      >
                        Right
                      </Button>
                    </div>
                  </div>

                  {/* Taste (1 point) */}
                  <div>
                    <Label>Taste (1 point)</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={judge.taste === "left" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "taste", "left")}
                        className="flex-1"
                        data-testid={`button-taste-left-${index}`}
                      >
                        Left
                      </Button>
                      <Button
                        type="button"
                        variant={judge.taste === "right" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "taste", "right")}
                        className="flex-1"
                        data-testid={`button-taste-right-${index}`}
                      >
                        Right
                      </Button>
                    </div>
                  </div>

                  {/* Tactile (1 point) */}
                  <div>
                    <Label>Tactile (1 point)</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={judge.tactile === "left" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "tactile", "left")}
                        className="flex-1"
                        data-testid={`button-tactile-left-${index}`}
                      >
                        Left
                      </Button>
                      <Button
                        type="button"
                        variant={judge.tactile === "right" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "tactile", "right")}
                        className="flex-1"
                        data-testid={`button-tactile-right-${index}`}
                      >
                        Right
                      </Button>
                    </div>
                  </div>

                  {/* Flavour (1 point) */}
                  <div>
                    <Label>Flavour (1 point)</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={judge.flavour === "left" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "flavour", "left")}
                        className="flex-1"
                        data-testid={`button-flavour-left-${index}`}
                      >
                        Left
                      </Button>
                      <Button
                        type="button"
                        variant={judge.flavour === "right" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "flavour", "right")}
                        className="flex-1"
                        data-testid={`button-flavour-right-${index}`}
                      >
                        Right
                      </Button>
                    </div>
                  </div>

                  {/* Overall (5 points) */}
                  <div className="md:col-span-2">
                    <Label>Overall (5 points)</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={judge.overall === "left" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "overall", "left")}
                        className="flex-1"
                        data-testid={`button-overall-left-${index}`}
                      >
                        Left
                      </Button>
                      <Button
                        type="button"
                        variant={judge.overall === "right" ? "default" : "outline"}
                        onClick={() => updateJudge(index, "overall", "right")}
                        className="flex-1"
                        data-testid={`button-overall-right-${index}`}
                      >
                        Right
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addJudge} variant="outline" className="w-full" data-testid="button-add-judge">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Judge
          </Button>
        </CardContent>
      </Card>

      {/* Score Summary */}
      {scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scores.map((score) => (
                <Card key={score.cupCode} className={winner?.cupCode === score.cupCode ? "ring-2 ring-primary" : ""}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <div className="text-sm text-muted-foreground">Cup Code</div>
                      <div className="text-3xl font-bold text-primary" data-testid={`text-cup-${score.cupCode}`}>
                        {score.cupCode}
                      </div>
                      <div className="text-4xl font-bold" data-testid={`text-points-${score.cupCode}`}>
                        {score.totalPoints} points
                      </div>
                      {winner?.cupCode === score.cupCode && (
                        <Badge className="mt-2" data-testid={`badge-winner-${score.cupCode}`}>
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button onClick={handleSubmit} size="lg" data-testid="button-submit-results">
          <Save className="h-5 w-5 mr-2" />
          Submit Results
        </Button>
      </div>
    </div>
  );
}
