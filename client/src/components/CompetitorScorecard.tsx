import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award } from "lucide-react";

interface JudgeScore {
  judgeName: string;
  sensoryBeverage: string;
  cupCode: string;
  visualLatteArt: number;
  taste: number;
  tactile: number;
  flavour: number;
  overall: number;
  subtotal: number;
}

interface CompetitorScorecardProps {
  competitorName: string;
  position: "left" | "right";
  judges: Array<{
    judgeName: string;
    sensoryBeverage: string;
    leftCupCode: string;
    rightCupCode: string;
    visualLatteArt: "left" | "right" | null;
    taste: "left" | "right" | null;
    tactile: "left" | "right" | null;
    flavour: "left" | "right" | null;
    overall: "left" | "right" | null;
  }>;
  isWinner?: boolean;
  isBye?: boolean;
}

export default function CompetitorScorecard({
  competitorName,
  position,
  judges,
  isWinner = false,
  isBye = false
}: CompetitorScorecardProps) {
  // Calculate scores for this competitor
  const judgeScores: JudgeScore[] = judges.map(judge => {
    const cupCode = position === "left" ? judge.leftCupCode : judge.rightCupCode;
    const visualLatteArt = judge.visualLatteArt === position ? 3 : 0;
    const taste = judge.taste === position ? 1 : 0;
    const tactile = judge.tactile === position ? 1 : 0;
    const flavour = judge.flavour === position ? 1 : 0;
    const overall = judge.overall === position ? 5 : 0;
    const subtotal = visualLatteArt + taste + tactile + flavour + overall;

    return {
      judgeName: judge.judgeName,
      sensoryBeverage: judge.sensoryBeverage,
      cupCode,
      visualLatteArt,
      taste,
      tactile,
      flavour,
      overall,
      subtotal
    };
  });

  const totalScore = judgeScores.reduce((sum, score) => sum + score.subtotal, 0);

  return (
    <Card className="w-full" data-testid={`card-competitor-scorecard-${position}`}>
      <CardHeader className={`pb-3 ${isWinner ? 'bg-chart-2/10' : 'bg-slate-50 dark:bg-slate-900'}`}>
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <span className={isWinner ? 'text-chart-2' : 'text-cinnamon-brown'}>
              {competitorName}
            </span>
            {isWinner && <Trophy className="h-4 w-4 text-chart-2" />}
            {isBye && <Badge variant="outline" className="text-xs">BYE</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Total:</span>
            <Badge className={`text-base font-bold ${isWinner ? 'bg-chart-2' : 'bg-cinnamon-brown'}`}>
              {totalScore}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-900">
                <th className="p-2 text-left font-medium">Judge</th>
                <th className="p-2 text-left font-medium">Beverage</th>
                <th className="p-2 text-center font-medium">Cup Code</th>
                <th className="p-2 text-center font-medium">Visual (3)</th>
                <th className="p-2 text-center font-medium">Taste (1)</th>
                <th className="p-2 text-center font-medium">Tactile (1)</th>
                <th className="p-2 text-center font-medium">Flavour (1)</th>
                <th className="p-2 text-center font-medium">Overall (5)</th>
                <th className="p-2 text-center font-medium bg-amber-50 dark:bg-amber-950">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {judgeScores.map((score, idx) => (
                <tr key={idx} className="border-b hover-elevate" data-testid={`row-judge-${idx}`}>
                  <td className="p-2 font-medium">{score.judgeName}</td>
                  <td className="p-2 text-muted-foreground">{score.sensoryBeverage}</td>
                  <td className="p-2 text-center font-mono text-xs">{score.cupCode}</td>
                  <td className="p-2 text-center font-bold text-primary">{score.visualLatteArt || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary">{score.taste || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary">{score.tactile || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary">{score.flavour || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary">{score.overall || '—'}</td>
                  <td className="p-2 text-center font-bold bg-amber-50 dark:bg-amber-950">
                    {score.subtotal}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 font-bold">
                <td colSpan={8} className="p-3 text-right">TOTAL SCORE:</td>
                <td className="p-3 text-center text-lg bg-amber-100 dark:bg-amber-900" data-testid={`text-competitor-total-${position}`}>
                  {totalScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {judgeScores.map((score, idx) => (
            <Card key={idx} className="border-l-4 border-l-golden" data-testid={`card-judge-${idx}`}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{score.judgeName}</div>
                    <div className="text-xs text-muted-foreground">{score.sensoryBeverage}</div>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {score.cupCode}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visual:</span>
                    <span className="font-bold text-primary">{score.visualLatteArt || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taste:</span>
                    <span className="font-bold text-primary">{score.taste || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tactile:</span>
                    <span className="font-bold text-primary">{score.tactile || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flavour:</span>
                    <span className="font-bold text-primary">{score.flavour || '—'}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Overall:</span>
                    <span className="font-bold text-primary">{score.overall || '—'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t bg-amber-50 dark:bg-amber-950 -mx-3 px-3 py-2">
                  <span className="font-semibold text-xs">Judge Subtotal:</span>
                  <Badge className="bg-golden">{score.subtotal}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-between items-center p-3 bg-amber-100 dark:bg-amber-900 rounded-md border-2 border-amber-200 dark:border-amber-800">
            <span className="font-bold">TOTAL SCORE:</span>
            <Badge className="text-lg bg-cinnamon-brown" data-testid={`text-competitor-total-mobile-${position}`}>
              {totalScore}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
