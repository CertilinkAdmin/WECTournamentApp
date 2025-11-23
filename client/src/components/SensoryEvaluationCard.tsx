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
    <Card className="w-full border-2 border-primary/20 shadow-lg" data-testid="card-sensory-evaluation">
      <CardHeader className="bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20 dark:from-primary/10 dark:via-primary/5 dark:to-primary/10 pb-3 border-b-2 border-primary/30">
        <CardTitle className="text-base sm:text-lg text-primary dark:text-primary-foreground font-bold">
          SENSORY EVALUATION
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop View - Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Judges Header Row */}
              <tr className="bg-primary/20 dark:bg-primary/10 border-b border-primary/30">
                <th className="p-2 text-xs font-medium text-left w-32"></th>
                {displayJudges.map((judge, idx) => (
                  <th key={idx} className="p-2 text-center border-l border-primary/20" colSpan={2}>
                    <div className="font-semibold text-xs sm:text-sm text-primary dark:text-primary-foreground">
                      {judge.sensoryBeverage}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Judge: {judge.judgeName}
                    </div>
                  </th>
                ))}
              </tr>
              {/* LEFT/RIGHT Headers */}
              <tr className="border-b border-primary/20">
                <th className="p-2 bg-secondary/50 dark:bg-card"></th>
                {displayJudges.map((_, idx) => (
                  <th key={idx} className="p-2 text-center text-xs font-medium bg-secondary/50 dark:bg-card border-l border-primary/20" colSpan={2}>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="border-r border-primary/20 pr-2 text-primary dark:text-primary-foreground">LEFT</span>
                      <span className="text-primary dark:text-primary-foreground">RIGHT</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Taste Row */}
              <tr className="border-b bg-chart-2/10 dark:bg-chart-2/5 hover:bg-chart-2/15 transition-colors">
                <td className="p-3 text-xs sm:text-sm font-medium bg-chart-2/20 dark:bg-chart-2/10 text-chart-2 dark:text-chart-2 border-r border-chart-2/30">
                  Taste (1 point)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`taste-left-${idx}`} className={`p-3 text-center text-sm font-semibold border-l border-r border-chart-2/20 ${getCellValue(judge.taste, "left") ? 'bg-chart-2/20 dark:bg-chart-2/15 text-chart-2 dark:text-chart-2 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.taste, "left")}
                  </td>,
                  <td key={`taste-right-${idx}`} className={`p-3 text-center text-sm font-semibold ${getCellValue(judge.taste, "right") ? 'bg-chart-2/20 dark:bg-chart-2/15 text-chart-2 dark:text-chart-2 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.taste, "right")}
                  </td>
                ])}
              </tr>
              {/* Tactile Row */}
              <tr className="border-b bg-chart-1/10 dark:bg-chart-1/5 hover:bg-chart-1/15 transition-colors">
                <td className="p-3 text-xs sm:text-sm font-medium bg-chart-1/20 dark:bg-chart-1/10 text-chart-1 dark:text-chart-1 border-r border-chart-1/30">
                  Tactile (1 point)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`tactile-left-${idx}`} className={`p-3 text-center text-sm font-semibold border-l border-r border-chart-1/20 ${getCellValue(judge.tactile, "left") ? 'bg-chart-1/20 dark:bg-chart-1/15 text-chart-1 dark:text-chart-1 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.tactile, "left")}
                  </td>,
                  <td key={`tactile-right-${idx}`} className={`p-3 text-center text-sm font-semibold ${getCellValue(judge.tactile, "right") ? 'bg-chart-1/20 dark:bg-chart-1/15 text-chart-1 dark:text-chart-1 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.tactile, "right")}
                  </td>
                ])}
              </tr>
              {/* Flavour Row */}
              <tr className="border-b bg-chart-3/10 dark:bg-chart-3/5 hover:bg-chart-3/15 transition-colors">
                <td className="p-3 text-xs sm:text-sm font-medium bg-chart-3/20 dark:bg-chart-3/10 text-chart-3 dark:text-chart-3 border-r border-chart-3/30">
                  Flavour (1 point)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`flavour-left-${idx}`} className={`p-3 text-center text-sm font-semibold border-l border-r border-chart-3/20 ${getCellValue(judge.flavour, "left") ? 'bg-chart-3/20 dark:bg-chart-3/15 text-chart-3 dark:text-chart-3 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.flavour, "left")}
                  </td>,
                  <td key={`flavour-right-${idx}`} className={`p-3 text-center text-sm font-semibold ${getCellValue(judge.flavour, "right") ? 'bg-chart-3/20 dark:bg-chart-3/15 text-chart-3 dark:text-chart-3 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.flavour, "right")}
                  </td>
                ])}
              </tr>
              {/* Overall Row */}
              <tr className="border-b bg-primary/10 dark:bg-primary/5 hover:bg-primary/15 transition-colors">
                <td className="p-3 text-xs sm:text-sm font-medium bg-primary/20 dark:bg-primary/10 text-primary dark:text-primary-foreground border-r border-primary/30 font-bold">
                  Overall (5 points)
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`overall-left-${idx}`} className={`p-3 text-center text-sm font-semibold border-l border-r border-primary/20 ${getOverallCellValue(judge.overall, "left") ? 'bg-primary/20 dark:bg-primary/15 text-primary dark:text-primary-foreground font-bold' : 'text-muted-foreground'}`}>
                    {getOverallCellValue(judge.overall, "left")}
                  </td>,
                  <td key={`overall-right-${idx}`} className={`p-3 text-center text-sm font-semibold ${getOverallCellValue(judge.overall, "right") ? 'bg-primary/20 dark:bg-primary/15 text-primary dark:text-primary-foreground font-bold' : 'text-muted-foreground'}`}>
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
              <tr className="bg-muted/50 dark:bg-muted border-t-2 border-primary/20">
                <td className="p-3 text-xs sm:text-sm font-bold text-foreground">
                  Cup Code
                </td>
                {displayJudges.map((judge, idx) => [
                  <td key={`cup-left-${idx}`} className="p-3 text-center border-l border-r border-primary/20">
                    <Badge variant="secondary" className="font-mono text-xs bg-secondary dark:bg-card text-foreground" data-testid={`badge-left-cup-${idx}`}>
                      {judge.leftCupCode}
                    </Badge>
                  </td>,
                  <td key={`cup-right-${idx}`} className="p-3 text-center">
                    <Badge variant="secondary" className="font-mono text-xs bg-secondary dark:bg-card text-foreground" data-testid={`badge-right-cup-${idx}`}>
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
              <div className="p-3 bg-primary/20 dark:bg-primary/10 border-b border-primary/30">
                <div className="font-semibold text-sm text-primary dark:text-primary-foreground">
                  {judge.sensoryBeverage}
                </div>
                <div className="text-xs text-muted-foreground">
                  Judge: {judge.judgeName}
                </div>
              </div>

              {/* Score Table for this Judge */}
              <div className="p-3 space-y-2">
                {/* Headers */}
                <div className="grid grid-cols-3 gap-2 pb-2 border-b border-primary/20">
                  <div className="text-xs font-medium text-muted-foreground"></div>
                  <div className="text-xs font-medium text-center text-primary dark:text-primary-foreground">LEFT</div>
                  <div className="text-xs font-medium text-center text-primary dark:text-primary-foreground">RIGHT</div>
                </div>

                {/* Taste */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 rounded-lg bg-chart-2/10 dark:bg-chart-2/5">
                  <div className="text-xs font-medium text-chart-2 dark:text-chart-2">Taste (1)</div>
                  <div className={`text-center text-sm font-semibold ${getCellValue(judge.taste, "left") ? 'text-chart-2 dark:text-chart-2 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.taste, "left")}
                  </div>
                  <div className={`text-center text-sm font-semibold ${getCellValue(judge.taste, "right") ? 'text-chart-2 dark:text-chart-2 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.taste, "right")}
                  </div>
                </div>

                {/* Tactile */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 rounded-lg bg-chart-1/10 dark:bg-chart-1/5">
                  <div className="text-xs font-medium text-chart-1 dark:text-chart-1">Tactile (1)</div>
                  <div className={`text-center text-sm font-semibold ${getCellValue(judge.tactile, "left") ? 'text-chart-1 dark:text-chart-1 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.tactile, "left")}
                  </div>
                  <div className={`text-center text-sm font-semibold ${getCellValue(judge.tactile, "right") ? 'text-chart-1 dark:text-chart-1 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.tactile, "right")}
                  </div>
                </div>

                {/* Flavour */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 rounded-lg bg-chart-3/10 dark:bg-chart-3/5">
                  <div className="text-xs font-medium text-chart-3 dark:text-chart-3">Flavour (1)</div>
                  <div className={`text-center text-sm font-semibold ${getCellValue(judge.flavour, "left") ? 'text-chart-3 dark:text-chart-3 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.flavour, "left")}
                  </div>
                  <div className={`text-center text-sm font-semibold ${getCellValue(judge.flavour, "right") ? 'text-chart-3 dark:text-chart-3 font-bold' : 'text-muted-foreground'}`}>
                    {getCellValue(judge.flavour, "right")}
                  </div>
                </div>

                {/* Overall */}
                <div className="grid grid-cols-3 gap-2 items-center p-2 rounded-lg bg-primary/10 dark:bg-primary/5">
                  <div className="text-xs font-medium text-primary dark:text-primary-foreground font-bold">Overall (5)</div>
                  <div className={`text-center text-sm font-semibold ${getOverallCellValue(judge.overall, "left") ? 'text-primary dark:text-primary-foreground font-bold' : 'text-muted-foreground'}`}>
                    {getOverallCellValue(judge.overall, "left")}
                  </div>
                  <div className={`text-center text-sm font-semibold ${getOverallCellValue(judge.overall, "right") ? 'text-primary dark:text-primary-foreground font-bold' : 'text-muted-foreground'}`}>
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
                <div className="grid grid-cols-3 gap-2 items-center pt-2 border-t border-primary/20 bg-muted/50 dark:bg-muted -mx-3 px-3 py-2">
                  <div className="text-xs font-bold text-foreground">Cup Code</div>
                  <div className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs bg-secondary dark:bg-card text-foreground" data-testid={`badge-left-cup-${judgeIdx}`}>
                      {judge.leftCupCode}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="font-mono text-xs bg-secondary dark:bg-card text-foreground" data-testid={`badge-right-cup-${judgeIdx}`}>
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
