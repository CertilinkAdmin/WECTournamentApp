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

  return (
    <Card className="w-full" data-testid="card-sensory-evaluation">
      <CardHeader className="bg-cinnamon-brown/10 pb-3">
        <CardTitle className="text-base sm:text-lg text-cinnamon-brown">
          SENSORY EVALUATION
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile-optimized table */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Judges Header Row - Stacks on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 p-3 sm:p-2 bg-slate-100 dark:bg-slate-800 border-b">
              {displayJudges.map((judge, idx) => (
                <div key={idx} className="text-center">
                  <div className="font-semibold text-xs sm:text-sm text-foreground">
                    {judge.sensoryBeverage}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Judge: {judge.judgeName}
                  </div>
                </div>
              ))}
            </div>

            {/* Judge Columns - LEFT/RIGHT headers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 border-b">
              {displayJudges.map((_, idx) => (
                <div key={idx} className="grid grid-cols-2 text-center text-xs font-medium p-2 bg-slate-50 dark:bg-slate-900">
                  <div className="border-r">LEFT</div>
                  <div>RIGHT</div>
                </div>
              ))}
            </div>

            {/* Taste Row (1 point) */}
            <div className="border-b">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center">
                <div className="text-xs sm:text-sm font-medium p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 sm:border-r">
                  Taste (1 point)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {displayJudges.map((judge, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-b sm:border-b-0 sm:border-r last:border-r-0">
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary border-r">
                        {getCellValue(judge.taste, "left")}
                      </div>
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary">
                        {getCellValue(judge.taste, "right")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tactile Row (1 point) */}
            <div className="border-b">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center">
                <div className="text-xs sm:text-sm font-medium p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 sm:border-r">
                  Tactile (1 point)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {displayJudges.map((judge, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-b sm:border-b-0 sm:border-r last:border-r-0">
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary border-r">
                        {getCellValue(judge.tactile, "left")}
                      </div>
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary">
                        {getCellValue(judge.tactile, "right")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Flavour Row (1 point) */}
            <div className="border-b">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center">
                <div className="text-xs sm:text-sm font-medium p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 sm:border-r">
                  Flavour (1 point)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {displayJudges.map((judge, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-b sm:border-b-0 sm:border-r last:border-r-0">
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary border-r">
                        {getCellValue(judge.flavour, "left")}
                      </div>
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary">
                        {getCellValue(judge.flavour, "right")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall Row (5 points) */}
            <div className="border-b">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center">
                <div className="text-xs sm:text-sm font-medium p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 sm:border-r">
                  Overall (5 points)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {displayJudges.map((judge, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-b sm:border-b-0 sm:border-r last:border-r-0">
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary border-r">
                        {getOverallCellValue(judge.overall, "left")}
                      </div>
                      <div className="text-center p-2 sm:p-3 text-sm font-semibold text-primary">
                        {getOverallCellValue(judge.overall, "right")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sensory Subtotal Row */}
            <div className="border-b bg-amber-50 dark:bg-amber-950">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center">
                <div className="text-xs sm:text-sm font-bold p-2 sm:p-3 sm:border-r">
                  Sensory Subtotal (B)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {displayJudges.map((judge, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-b sm:border-b-0 sm:border-r last:border-r-0">
                      <div className="text-center p-2 sm:p-3 text-sm font-bold text-foreground border-r">
                        {judges.length > 0 && judges[idx] ? (
                          calculateSubtotal("left") > 0 ? 
                          ((judges[idx].taste === "left" ? 1 : 0) +
                           (judges[idx].tactile === "left" ? 1 : 0) +
                           (judges[idx].flavour === "left" ? 1 : 0) +
                           (judges[idx].overall === "left" ? 5 : 0)) : ""
                        ) : ""}
                      </div>
                      <div className="text-center p-2 sm:p-3 text-sm font-bold text-foreground">
                        {judges.length > 0 && judges[idx] ? (
                          calculateSubtotal("right") > 0 ?
                          ((judges[idx].taste === "right" ? 1 : 0) +
                           (judges[idx].tactile === "right" ? 1 : 0) +
                           (judges[idx].flavour === "right" ? 1 : 0) +
                           (judges[idx].overall === "right" ? 5 : 0)) : ""
                        ) : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cup Code Row */}
            <div className="bg-slate-100 dark:bg-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center">
                <div className="text-xs sm:text-sm font-bold p-2 sm:p-3 sm:border-r">
                  Cup Code
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {displayJudges.map((judge, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-b sm:border-b-0 sm:border-r last:border-r-0">
                      <div className="text-center p-2 sm:p-3 border-r">
                        <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-left-cup-${idx}`}>
                          {judge.leftCupCode}
                        </Badge>
                      </div>
                      <div className="text-center p-2 sm:p-3">
                        <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-right-cup-${idx}`}>
                          {judge.rightCupCode}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Score Summary */}
            {judges.length > 0 && (
              <div className="p-4 bg-cinnamon-brown/5 border-t-2 border-cinnamon-brown">
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {leftCompetitor}
                    </div>
                    <div className="text-2xl font-bold text-cinnamon-brown" data-testid="text-left-total">
                      {leftSubtotal}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {rightCompetitor}
                    </div>
                    <div className="text-2xl font-bold text-cinnamon-brown" data-testid="text-right-total">
                      {rightSubtotal}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
