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
    <Card className="w-full dark:bg-[hsl(17_59%_38%)] dark:border-[hsl(40_50%_72%)]" data-testid={`card-competitor-scorecard-${position}`}>
      <CardHeader className={`pb-3 ${isWinner ? 'bg-chart-2/10 dark:bg-[hsl(40_50%_65%)]' : 'bg-[#f2e6d3] dark:bg-[hsl(17_59%_35%)]'}`}>
        <CardTitle className="flex items-center justify-between text-base sm:text-lg dark:text-[hsl(40_30%_95%)]">
          <div className="flex items-center gap-2">
            <span className={isWinner ? 'text-chart-2 dark:text-[hsl(40_50%_72%)]' : 'text-cinnamon-brown dark:text-[hsl(40_50%_72%)]'}>
              {competitorName}
            </span>
            {isWinner && <Trophy className="h-4 w-4 text-chart-2 dark:text-[hsl(40_50%_72%)]" />}
            {isBye && <Badge variant="outline" className="text-xs dark:text-[hsl(40_50%_72%)]">BYE</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground dark:text-[hsl(40_30%_85%)]">Total:</span>
            <Badge className={`text-base font-bold ${isWinner ? 'bg-chart-2' : 'dark:bg-[hsl(40_50%_72%)] dark:text-[#2D1B12]'}`}>
              {totalScore}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 dark:text-[hsl(40_30%_95%)]">
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-sm dark:text-[hsl(40_30%_90%)]">
            <thead>
              <tr className="border-b bg-[#f2e6d3] dark:bg-[hsl(17_59%_35%)] dark:border-[hsl(40_50%_65%)]">
                <th className="p-2 text-left font-medium dark:text-[hsl(40_50%_72%)]">Judge</th>
                <th className="p-2 text-left font-medium dark:text-[hsl(40_50%_72%)]">Beverage</th>
                <th className="p-2 text-center font-medium dark:text-[hsl(40_50%_72%)]">Cup Code</th>
                <th className="p-2 text-center font-medium dark:text-[hsl(40_50%_72%)]">Visual (3)</th>
                <th className="p-2 text-center font-medium dark:text-[hsl(40_50%_72%)]">Taste (1)</th>
                <th className="p-2 text-center font-medium dark:text-[hsl(40_50%_72%)]">Tactile (1)</th>
                <th className="p-2 text-center font-medium dark:text-[hsl(40_50%_72%)]">Flavour (1)</th>
                <th className="p-2 text-center font-medium dark:text-[hsl(40_50%_72%)]">Overall (5)</th>
                <th className="p-2 text-center font-medium bg-amber-50 dark:bg-[hsl(40_50%_68%)] text-amber-900 dark:text-[#2D1B12]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {judgeScores.map((score, idx) => (
                <tr key={idx} className="border-b hover-elevate dark:border-[hsl(40_50%_50%)]" data-testid={`row-judge-${idx}`}>
                  <td className="p-2 font-medium dark:text-[hsl(40_50%_72%)]">{score.judgeName}</td>
                  <td className="p-2 text-muted-foreground dark:text-[hsl(40_30%_85%)]">{score.sensoryBeverage}</td>
                  <td className="p-2 text-center font-mono text-xs dark:text-[hsl(40_50%_72%)]">{score.cupCode}</td>
                  <td className="p-2 text-center font-bold text-primary dark:text-[hsl(40_50%_72%)]">{score.visualLatteArt || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary dark:text-[hsl(40_50%_72%)]">{score.taste || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary dark:text-[hsl(40_50%_72%)]">{score.tactile || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary dark:text-[hsl(40_50%_72%)]">{score.flavour || '—'}</td>
                  <td className="p-2 text-center font-bold text-primary dark:text-[hsl(40_50%_72%)]">{score.overall || '—'}</td>
                  <td className="p-2 text-center font-bold bg-amber-50 dark:bg-[hsl(40_50%_68%)] text-amber-900 dark:text-[#2D1B12]">
                    {score.subtotal}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 font-bold dark:border-[hsl(40_50%_65%)]">
                <td colSpan={8} className="p-3 text-right text-foreground dark:text-[hsl(40_50%_72%)]">TOTAL SCORE:</td>
                <td className="p-3 text-center text-lg bg-amber-100 dark:bg-[hsl(40_50%_68%)] text-amber-900 dark:text-[#2D1B12] font-bold" data-testid={`text-competitor-total-${position}`}>
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
                  <span className="font-semibold text-xs text-amber-900 dark:text-amber-100">Judge Subtotal:</span>
                  <Badge className="bg-golden text-white dark:text-amber-950 font-bold">{score.subtotal}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-between items-center p-3 bg-amber-100 dark:bg-amber-900 rounded-md border-2 border-amber-200 dark:border-amber-800">
            <span className="font-bold text-amber-900 dark:text-amber-50">TOTAL SCORE:</span>
            <Badge className="text-lg bg-cinnamon-brown text-white dark:text-amber-50 font-bold" data-testid={`text-competitor-total-mobile-${position}`}>
              {totalScore}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
