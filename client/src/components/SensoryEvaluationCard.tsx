import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JudgeScore {
  judgeName: string;
  sensoryBeverage: string;
  leftCupCode: string;
  rightCupCode: string;
  taste: "left" | "right" | null;
  tactile: "left" | "right" | null;
  flavour: "left" | "right" | null;
  overall: "left" | "right" | null;
}

interface SensoryEvaluationCardProps {
  judges: JudgeScore[];
  leftCompetitor: string;
  rightCompetitor: string;
}

export default function SensoryEvaluationCard({
  judges = [],
  leftCompetitor,
  rightCompetitor
}: SensoryEvaluationCardProps) {
  const displayJudges = judges.length > 0 ? judges : [
    { judgeName: "—", sensoryBeverage: "—", leftCupCode: "—", rightCupCode: "—", taste: null, tactile: null, flavour: null, overall: null },
    { judgeName: "—", sensoryBeverage: "—", leftCupCode: "—", rightCupCode: "—", taste: null, tactile: null, flavour: null, overall: null },
    { judgeName: "—", sensoryBeverage: "—", leftCupCode: "—", rightCupCode: "—", taste: null, tactile: null, flavour: null, overall: null }
  ];

  const calculateSubtotal = (position: "left" | "right") => {
    if (judges.length === 0) return 0;
    
    return judges.reduce((total, judge) => {
      let points = 0;
      if (judge.taste === position) points += 1;
      if (judge.tactile === position) points += 1;
      if (judge.flavour === position) points += 1;
      if (judge.overall === position) points += 5;
      return total + points;
    }, 0);
  };

  const leftSubtotal = calculateSubtotal("left");
  const rightSubtotal = calculateSubtotal("right");

  const getCellValue = (value: "left" | "right" | null, position: "left" | "right") => {
    if (value === null) return "";
    return value === position ? "1" : "";
  };

  const getOverallCellValue = (value: "left" | "right" | null, position: "left" | "right") => {
    if (value === null) return "";
    return value === position ? "5" : "";
  };

  const getJudgeSubtotal = (judge: JudgeScore, position: "left" | "right") => {
    if (!judge.taste && !judge.tactile && !judge.flavour && !judge.overall) return "";
    
    let total = 0;
    if (judge.taste === position) total += 1;
    if (judge.tactile === position) total += 1;
    if (judge.flavour === position) total += 1;
    if (judge.overall === position) total += 5;
    
    return total > 0 ? total : "";
  };

  return (
    <Card className="w-full" data-testid="card-sensory-evaluation">
      <CardHeader className="bg-cinnamon-brown/10 pb-3">
        <CardTitle className="text-base sm:text-lg text-cinnamon-brown">
          SENSORY EVALUATION
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop View - Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Judges Header Row */}
              <tr className="bg-slate-100 dark:bg-slate-800 border-b">
                <th className="p-2 text-xs font-medium text-left w-32"></th>
                {displayJudges.map((judge, idx) => (
                  <th key={idx} className="p-2 text-center border-l" colSpan={2}>
                    <div className="font-semibold text-xs sm:text-sm text-foreground">
                      {judge.sensoryBeverage}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Judge: {judge.judgeName}
                    </div>
                  </th>
                ))}
              </tr>
              {/* LEFT/RIGHT Headers */}
              <tr className="border-b">
                <th className="p-2 bg-slate-50 dark:bg-slate-900"></th>
                {displayJudges.map((_, idx) => (
                  <th key={idx} className="p-2 text-center text-xs font-medium bg-slate-50 dark:bg-slate-900 border-l" colSpan={2}>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="border-r pr-2">LEFT</span>
                      <span>RIGHT</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Taste Row */}
              <tr className="border-b dark:bg-[hsl(20_14%_12%)]">
                <td className="p-3 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-[hsl(20_14%_12%)] dark:text-[hsl(40_30%_90%)]">
                  Taste (1 point)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`taste-left-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)] border-l border-r dark:border-[hsl(20_20%_20%)]">
                    {getCellValue(judge.taste, "left")}
                  </td>,
                  <td key={`taste-right-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)]">
                    {getCellValue(judge.taste, "right")}
                  </td>
                ])}
              </tr>
              {/* Tactile Row */}
              <tr className="border-b dark:bg-[hsl(20_14%_12%)]">
                <td className="p-3 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-[hsl(20_14%_12%)] dark:text-[hsl(40_30%_90%)]">
                  Tactile (1 point)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`tactile-left-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)] border-l border-r dark:border-[hsl(20_20%_20%)]">
                    {getCellValue(judge.tactile, "left")}
                  </td>,
                  <td key={`tactile-right-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)]">
                    {getCellValue(judge.tactile, "right")}
                  </td>
                ])}
              </tr>
              {/* Flavour Row */}
              <tr className="border-b dark:bg-[hsl(20_14%_12%)]">
                <td className="p-3 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-[hsl(20_14%_12%)] dark:text-[hsl(40_30%_90%)]">
                  Flavour (1 point)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`flavour-left-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)] border-l border-r dark:border-[hsl(20_20%_20%)]">
                    {getCellValue(judge.flavour, "left")}
                  </td>,
                  <td key={`flavour-right-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)]">
                    {getCellValue(judge.flavour, "right")}
                  </td>
                ])}
              </tr>
              {/* Overall Row */}
              <tr className="border-b dark:bg-[hsl(20_14%_12%)]">
                <td className="p-3 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-[hsl(20_14%_12%)] dark:text-[hsl(40_30%_90%)]">
                  Overall (5 points)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`overall-left-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)] border-l border-r dark:border-[hsl(20_20%_20%)]">
                    {getOverallCellValue(judge.overall, "left")}
                  </td>,
                  <td key={`overall-right-${idx}`} className="p-3 text-center text-sm font-semibold text-primary dark:text-[hsl(40_30%_90%)] dark:bg-[hsl(20_14%_12%)]">
                    {getOverallCellValue(judge.overall, "right")}
                  </td>
                ])}
              </tr>
              {/* Sensory Subtotal Row */}
              <tr className="border-b bg-amber-50 dark:bg-amber-950">
                <td className="p-3 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-100">
                  Sensory Subtotal (B)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`subtotal-left-${idx}`} className="p-3 text-center text-sm font-bold text-amber-900 dark:text-amber-100 border-l border-r">
                    {getJudgeSubtotal(judge, "left")}
                  </td>,
                  <td key={`subtotal-right-${idx}`} className="p-3 text-center text-sm font-bold text-amber-900 dark:text-amber-100">
                    {getJudgeSubtotal(judge, "right")}
                  </td>
                ])}
              </tr>
              {/* Cup Code Row */}
              <tr className="bg-slate-100 dark:bg-slate-800">
                <td className="p-3 text-xs sm:text-sm font-bold">
                  Cup Code
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`cup-left-${idx}`} className="p-3 text-center border-l border-r">
                    <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-left-cup-${idx}`}>
                      {judge.leftCupCode}
                    </Badge>
                  </td>,
                  <td key={`cup-right-${idx}`} className="p-3 text-center">
                    <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-right-cup-${idx}`}>
                      {judge.rightCupCode}
                    </Badge>
                  </td>
                ])}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile View - Card-based Layout */}
        <div className="md:hidden">
          {displayJudges.map((judge, judgeIdx) => (
            <div key={judgeIdx} className="border-b last:border-b-0">
              {/* Judge Header */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b">
                <div className="font-semibold text-sm text-foreground">
                  {judge.sensoryBeverage}
                </div>
                <div className="text-xs text-muted-foreground">
                  Judge: {judge.judgeName}
                </div>
              </div>

              {/* Score Table for this Judge */}
              <div className="p-3 space-y-2">
                {/* Headers */}
                <div className="grid grid-cols-3 gap-2 pb-2 border-b">
                  <div className="text-xs font-medium text-muted-foreground"></div>
                  <div className="text-xs font-medium text-center">LEFT</div>
                  <div className="text-xs font-medium text-center">RIGHT</div>
                </div>

                {/* Taste */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-xs font-medium">Taste (1)</div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getCellValue(judge.taste, "left")}
                  </div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getCellValue(judge.taste, "right")}
                  </div>
                </div>

                {/* Tactile */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-xs font-medium">Tactile (1)</div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getCellValue(judge.tactile, "left")}
                  </div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getCellValue(judge.tactile, "right")}
                  </div>
                </div>

                {/* Flavour */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-xs font-medium">Flavour (1)</div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getCellValue(judge.flavour, "left")}
                  </div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getCellValue(judge.flavour, "right")}
                  </div>
                </div>

                {/* Overall */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-xs font-medium">Overall (5)</div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getOverallCellValue(judge.overall, "left")}
                  </div>
                  <div className="text-center text-sm font-semibold text-primary">
                    {getOverallCellValue(judge.overall, "right")}
                  </div>
                </div>

                {/* Subtotal */}
                <div className="grid grid-cols-3 gap-2 items-center pt-2 border-t bg-amber-50 dark:bg-amber-950 -mx-3 px-3 py-2">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-100">Subtotal</div>
                  <div className="text-center text-sm font-bold text-amber-900 dark:text-amber-100">
                    {getJudgeSubtotal(judge, "left")}
                  </div>
                  <div className="text-center text-sm font-bold text-amber-900 dark:text-amber-100">
                    {getJudgeSubtotal(judge, "right")}
                  </div>
                </div>

                {/* Cup Codes */}
                <div className="grid grid-cols-3 gap-2 items-center pt-2 border-t bg-slate-100 dark:bg-slate-800 -mx-3 px-3 py-2">
                  <div className="text-xs font-bold">Cup Code</div>
                  <div className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-left-cup-${judgeIdx}`}>
                      {judge.leftCupCode}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-right-cup-${judgeIdx}`}>
                      {judge.rightCupCode}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Score Summary - Shared between mobile and desktop */}
        {judges.length > 0 && (
          <div className="p-4 bg-cinnamon-brown/10 dark:bg-cinnamon-brown/20 border-t-2 border-cinnamon-brown">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {leftCompetitor}
                </div>
                <div className="text-2xl font-bold text-cinnamon-brown dark:text-amber-200" data-testid="text-left-total">
                  {leftSubtotal}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {rightCompetitor}
                </div>
                <div className="text-2xl font-bold text-cinnamon-brown dark:text-amber-200" data-testid="text-right-total">
                  {rightSubtotal}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
