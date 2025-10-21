import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export default function JudgeScorecard({ heatNumber, competitors, onSubmit }: JudgeScorecardProps) {
  // Latte Art scores (LEFT judge for cappuccino, RIGHT for espresso)
  const [latteArt, setLatteArt] = useState({
    cappuLeft: 0,
    cappuRight: 0,
    espresso1Left: 0,
    espresso1Right: 0,
    espresso2Left: 0,
    espresso2Right: 0,
  });

  // Sensory scores for LEFT competitor
  const [leftSensory, setLeftSensory] = useState({
    cappuTaste: 0,
    cappuTactile: 0,
    cappuFlavour: 0,
    cappuOverall: 0,
    esp1Taste: 0,
    esp1Tactile: 0,
    esp1Flavour: 0,
    esp1Overall: 0,
    esp2Taste: 0,
    esp2Overall: 0,
  });

  // Sensory scores for RIGHT competitor
  const [rightSensory, setRightSensory] = useState({
    cappuTaste: 0,
    cappuTactile: 0,
    cappuFlavour: 0,
    cappuOverall: 0,
    esp1Taste: 0,
    esp1Overall: 0,
    esp2Tactile: 0,
    esp2Flavour: 0,
    esp2Overall: 0,
  });

  const latteArtSubtotal = 
    latteArt.cappuLeft + latteArt.cappuRight + 
    latteArt.espresso1Left + latteArt.espresso1Right +
    latteArt.espresso2Left + latteArt.espresso2Right;

  const leftSensorySubtotal = Object.values(leftSensory).reduce((a, b) => a + b, 0);
  const rightSensorySubtotal = Object.values(rightSensory).reduce((a, b) => a + b, 0);

  const leftTotal = (latteArtSubtotal / 2) + leftSensorySubtotal;
  const rightTotal = (latteArtSubtotal / 2) + rightSensorySubtotal;

  const winner = leftTotal > rightTotal ? "left" : rightTotal > leftTotal ? "right" : null;

  const handleSubmit = () => {
    onSubmit?.({ latteArt, leftSensory, rightSensory, leftTotal, rightTotal, winner });
    console.log("Scorecard submitted", { leftTotal, rightTotal, winner });
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

      {/* Latte Art Section */}
      <Card data-testid="card-latte-art">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-primary">Latte Art</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium">Judge:</div>
            <div className="text-center text-sm font-medium">LEFT</div>
            <div className="text-center text-sm font-medium">RIGHT</div>

            <div className="text-sm">Cappuccino Judge:</div>
            <Input
              type="number"
              min="0"
              max="3"
              value={latteArt.cappuLeft}
              onChange={(e) => setLatteArt({ ...latteArt, cappuLeft: Number(e.target.value) })}
              className="text-center font-mono"
              data-testid="input-cappu-left"
            />
            <Input
              type="number"
              min="0"
              max="3"
              value={latteArt.cappuRight}
              onChange={(e) => setLatteArt({ ...latteArt, cappuRight: Number(e.target.value) })}
              className="text-center font-mono"
              data-testid="input-cappu-right"
            />

            <div className="text-sm">Espresso Judge 1:</div>
            <Input
              type="number"
              min="0"
              max="3"
              value={latteArt.espresso1Left}
              onChange={(e) => setLatteArt({ ...latteArt, espresso1Left: Number(e.target.value) })}
              className="text-center font-mono"
              data-testid="input-esp1-left"
            />
            <Input
              type="number"
              min="0"
              max="3"
              value={latteArt.espresso1Right}
              onChange={(e) => setLatteArt({ ...latteArt, espresso1Right: Number(e.target.value) })}
              className="text-center font-mono"
              data-testid="input-esp1-right"
            />

            <div className="text-sm">Espresso Judge 2:</div>
            <Input
              type="number"
              min="0"
              max="3"
              value={latteArt.espresso2Left}
              onChange={(e) => setLatteArt({ ...latteArt, espresso2Left: Number(e.target.value) })}
              className="text-center font-mono"
              data-testid="input-esp2-left"
            />
            <Input
              type="number"
              min="0"
              max="3"
              value={latteArt.espresso2Right}
              onChange={(e) => setLatteArt({ ...latteArt, espresso2Right: Number(e.target.value) })}
              className="text-center font-mono"
              data-testid="input-esp2-right"
            />
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium">
              Latte Art Sub-Total (A): <span className="font-mono text-lg ml-2" data-testid="text-latte-subtotal">{latteArtSubtotal}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensory Evaluation Section */}
      <Card data-testid="card-sensory">
        <CardHeader className="bg-primary/10">
          <CardTitle className="text-primary">Sensory Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="font-medium"></div>
            <div className="text-center font-medium">LEFT</div>
            <div className="text-center font-medium">RIGHT</div>

            <div>Taste (1 point)</div>
            <Input
              type="number"
              min="0"
              max="1"
              value={leftSensory.cappuTaste}
              onChange={(e) => setLeftSensory({ ...leftSensory, cappuTaste: Number(e.target.value) })}
              className="text-center font-mono"
            />
            <Input
              type="number"
              min="0"
              max="1"
              value={rightSensory.cappuTaste}
              onChange={(e) => setRightSensory({ ...rightSensory, cappuTaste: Number(e.target.value) })}
              className="text-center font-mono"
            />

            <div>Tactile (1 point)</div>
            <Input
              type="number"
              min="0"
              max="1"
              value={leftSensory.cappuTactile}
              onChange={(e) => setLeftSensory({ ...leftSensory, cappuTactile: Number(e.target.value) })}
              className="text-center font-mono"
            />
            <Input
              type="number"
              min="0"
              max="1"
              value={rightSensory.cappuTactile}
              onChange={(e) => setRightSensory({ ...rightSensory, cappuTactile: Number(e.target.value) })}
              className="text-center font-mono"
            />

            <div>Flavour (1 point)</div>
            <Input
              type="number"
              min="0"
              max="1"
              value={leftSensory.cappuFlavour}
              onChange={(e) => setLeftSensory({ ...leftSensory, cappuFlavour: Number(e.target.value) })}
              className="text-center font-mono"
            />
            <Input
              type="number"
              min="0"
              max="1"
              value={rightSensory.cappuFlavour}
              onChange={(e) => setRightSensory({ ...rightSensory, cappuFlavour: Number(e.target.value) })}
              className="text-center font-mono"
            />

            <div>Overall (5 points)</div>
            <Input
              type="number"
              min="0"
              max="5"
              value={leftSensory.cappuOverall}
              onChange={(e) => setLeftSensory({ ...leftSensory, cappuOverall: Number(e.target.value) })}
              className="text-center font-mono"
            />
            <Input
              type="number"
              min="0"
              max="5"
              value={rightSensory.cappuOverall}
              onChange={(e) => setRightSensory({ ...rightSensory, cappuOverall: Number(e.target.value) })}
              className="text-center font-mono"
            />
          </div>

          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
            <div className="font-medium">Sensory Subtotal (B):</div>
            <div className="text-center font-mono text-lg font-bold" data-testid="text-left-sensory">
              {leftSensorySubtotal}
            </div>
            <div className="text-center font-mono text-lg font-bold" data-testid="text-right-sensory">
              {rightSensorySubtotal}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals and Winner */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="font-medium">Competitor Code:</div>
            <div className="text-center">
              <Badge variant="secondary" className="font-mono">{competitors[0].code}</Badge>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="font-mono">{competitors[1].code}</Badge>
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
