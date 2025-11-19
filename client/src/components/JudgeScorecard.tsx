import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";

interface Competitor {
  name: string;
  code: string;
}

interface JudgeScorecardProps {
  heatNumber: number;
  competitors: [Competitor, Competitor];
  onSubmit?: (scores: any) => void;
}

const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

export default function JudgeScorecard({ heatNumber, competitors, onSubmit }: JudgeScorecardProps) {
  // Judge information
  const [judgeName, setJudgeName] = useState("");
  const [sensoryBeverage, setSensoryBeverage] = useState<"Cappuccino" | "Espresso">("Cappuccino");
  
  // Cup code selections
  const [leftCupCode, setLeftCupCode] = useState("");
  const [rightCupCode, setRightCupCode] = useState("");

  // Scoring selections - which cup won each category
  const [visualLatteArt, setVisualLatteArt] = useState<"left" | "right" | null>(null);
  const [taste, setTaste] = useState<"left" | "right" | null>(null);
  const [tactile, setTactile] = useState<"left" | "right" | null>(null);
  const [flavour, setFlavour] = useState<"left" | "right" | null>(null);
  const [overall, setOverall] = useState<"left" | "right" | null>(null);

  // Calculate scores based on which cup won each category
  const calculateScores = () => {
    let leftPoints = 0;
    let rightPoints = 0;

    if (visualLatteArt === "left") leftPoints += CATEGORY_POINTS.visualLatteArt;
    if (visualLatteArt === "right") rightPoints += CATEGORY_POINTS.visualLatteArt;

    if (taste === "left") leftPoints += CATEGORY_POINTS.taste;
    if (taste === "right") rightPoints += CATEGORY_POINTS.taste;

    if (tactile === "left") leftPoints += CATEGORY_POINTS.tactile;
    if (tactile === "right") rightPoints += CATEGORY_POINTS.tactile;

    if (flavour === "left") leftPoints += CATEGORY_POINTS.flavour;
    if (flavour === "right") rightPoints += CATEGORY_POINTS.flavour;

    if (overall === "left") leftPoints += CATEGORY_POINTS.overall;
    if (overall === "right") rightPoints += CATEGORY_POINTS.overall;

    return { leftPoints, rightPoints };
  };

  const { leftPoints, rightPoints } = calculateScores();
  const winner = leftPoints > rightPoints ? "left" : rightPoints > leftPoints ? "right" : null;

  const handleSubmit = () => {
    onSubmit?.({ 
      judgeName,
      sensoryBeverage,
      leftCupCode, 
      rightCupCode,
      visualLatteArt,
      taste,
      tactile,
      flavour,
      overall,
      leftPoints,
      rightPoints,
      winner 
    });
    console.log("Scorecard submitted", { 
      judgeName,
      sensoryBeverage,
      leftCupCode, 
      rightCupCode,
      visualLatteArt,
      taste,
      tactile,
      flavour,
      overall,
      leftPoints,
      rightPoints,
      winner 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Head Judge Score Sheet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Heat Number: <span className="font-mono font-bold text-foreground">{heatNumber}</span>
          </p>
        </div>
        <Trophy className="h-8 w-8 text-primary" />
      </div>

      {/* Judge Information and Cup Code Selection */}
      <Card>
        <CardHeader className="bg-secondary/10">
          <CardTitle className="text-sm">Judge Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="judge-name">Judge Name</Label>
            <Input
              id="judge-name"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              placeholder="Enter judge name"
              className="mt-1"
              data-testid="input-judge-name"
            />
          </div>
          <div>
            <Label htmlFor="sensory-beverage">Sensory Beverage</Label>
            <Select
              value={sensoryBeverage}
              onValueChange={(value: "Cappuccino" | "Espresso") => setSensoryBeverage(value)}
            >
              <SelectTrigger id="sensory-beverage" className="mt-1" data-testid="select-sensory-beverage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cappuccino">Cappuccino</SelectItem>
                <SelectItem value="Espresso">Espresso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="left-cup-code">Left Cup Code</Label>
              <Input
                id="left-cup-code"
                value={leftCupCode}
                onChange={(e) => setLeftCupCode(e.target.value.toUpperCase())}
                placeholder="e.g., C6"
                maxLength={3}
                className="font-mono mt-1"
                data-testid="input-left-cup-code"
              />
            </div>
            <div>
              <Label htmlFor="right-cup-code">Right Cup Code</Label>
              <Input
                id="right-cup-code"
                value={rightCupCode}
                onChange={(e) => setRightCupCode(e.target.value.toUpperCase())}
                placeholder="e.g., L4"
                maxLength={3}
                className="font-mono mt-1"
                data-testid="input-right-cup-code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Categories */}
      <Card data-testid="card-scoring">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-primary">Scoring Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Visual/Latte Art (3 points) */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Visual/Latte Art (3 points)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={visualLatteArt === "left"}
                  onCheckedChange={(checked) => {
                    setVisualLatteArt(checked ? "left" : null);
                  }}
                  data-testid="checkbox-visual-left"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setVisualLatteArt("left")}>Left</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={visualLatteArt === "right"}
                  onCheckedChange={(checked) => {
                    setVisualLatteArt(checked ? "right" : null);
                  }}
                  data-testid="checkbox-visual-right"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setVisualLatteArt("right")}>Right</Label>
              </div>
            </div>
          </div>

          {/* Sensory Beverage Header */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20">
            <div className="flex items-center gap-2">
              <span className="font-medium">Sensory {sensoryBeverage}</span>
            </div>
            <Badge variant="outline" className="font-medium">
              {sensoryBeverage}
            </Badge>
          </div>

          {/* Taste (1 point) */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Taste (1 point)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={taste === "left"}
                  onCheckedChange={(checked) => {
                    setTaste(checked ? "left" : null);
                  }}
                  data-testid="checkbox-taste-left"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setTaste("left")}>Left</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={taste === "right"}
                  onCheckedChange={(checked) => {
                    setTaste(checked ? "right" : null);
                  }}
                  data-testid="checkbox-taste-right"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setTaste("right")}>Right</Label>
              </div>
            </div>
          </div>

          {/* Tactile (1 point) */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Tactile (1 point)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={tactile === "left"}
                  onCheckedChange={(checked) => {
                    setTactile(checked ? "left" : null);
                  }}
                  data-testid="checkbox-tactile-left"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setTactile("left")}>Left</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={tactile === "right"}
                  onCheckedChange={(checked) => {
                    setTactile(checked ? "right" : null);
                  }}
                  data-testid="checkbox-tactile-right"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setTactile("right")}>Right</Label>
              </div>
            </div>
          </div>

          {/* Flavour (1 point) */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Flavour (1 point)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={flavour === "left"}
                  onCheckedChange={(checked) => {
                    setFlavour(checked ? "left" : null);
                  }}
                  data-testid="checkbox-flavour-left"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setFlavour("left")}>Left</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={flavour === "right"}
                  onCheckedChange={(checked) => {
                    setFlavour(checked ? "right" : null);
                  }}
                  data-testid="checkbox-flavour-right"
                />
                <Label className="text-sm cursor-pointer" onClick={() => setFlavour("right")}>Right</Label>
              </div>
            </div>
          </div>

          {/* Overall (5 points) */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Overall (5 points)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={overall === "left"}
                  onCheckedChange={(checked) => {
                    setOverall(checked ? "left" : null);
                  }}
                  data-testid="checkbox-overall-left"
                />
                <Label className="text-sm font-medium cursor-pointer" onClick={() => setOverall("left")}>Left</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={overall === "right"}
                  onCheckedChange={(checked) => {
                    setOverall(checked ? "right" : null);
                  }}
                  data-testid="checkbox-overall-right"
                />
                <Label className="text-sm font-medium cursor-pointer" onClick={() => setOverall("right")}>Right</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals and Winner */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="font-medium">Cup Code:</div>
            <div className="text-center">
              <Badge variant="secondary" className="font-mono">
                {leftCupCode || competitors[0].code}
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="font-mono">
                {rightCupCode || competitors[1].code}
              </Badge>
            </div>

            <div className="font-medium">Competitor Code:</div>
            <div className="text-center">
              <Badge variant="outline" className="font-mono text-xs">{competitors[0].code}</Badge>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="font-mono text-xs">{competitors[1].code}</Badge>
            </div>

            <div className="font-medium">Competitor Name:</div>
            <div className="text-center font-medium text-sm" data-testid="text-left-name">
              {competitors[0].name}
            </div>
            <div className="text-center font-medium text-sm" data-testid="text-right-name">
              {competitors[1].name}
            </div>

            <div className="font-medium">Total Score (A+B):</div>
            <div className={`text-center font-mono text-2xl font-bold ${winner === "left" ? "text-chart-2" : ""}`} data-testid="text-left-total">
              {leftTotal}
            </div>
            <div className={`text-center font-mono text-2xl font-bold ${winner === "right" ? "text-chart-2" : ""}`} data-testid="text-right-total">
              {rightTotal}
            </div>
          </div>

          {winner && (
            <div className="text-center p-4 bg-chart-2/10 border border-chart-2 rounded-md">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-chart-2" />
                <span className="font-heading font-bold text-lg" data-testid="text-winner">
                  WINNER: {winner === "left" ? competitors[0].name : competitors[1].name}
                </span>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit}
            className="w-full mt-4"
            size="lg"
            data-testid="button-submit-scores"
          >
            Submit Scores
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
