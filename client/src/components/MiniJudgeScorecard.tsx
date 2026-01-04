/**
 * Mini Judge Scorecard Component
 * Displays a compact scorecard view for a single judge's scoring of a competitor
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Award } from "lucide-react";
import type { JudgeDetailedScore } from "@shared/schema";

interface MiniJudgeScorecardProps {
  judgeScore: JudgeDetailedScore;
  competitorCupCode: string;
  competitorPosition: 'left' | 'right';
  competitorName: string;
}

const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

export default function MiniJudgeScorecard({
  judgeScore,
  competitorCupCode,
  competitorPosition,
  competitorName
}: MiniJudgeScorecardProps) {
  // Calculate points for this competitor from this judge
  const calculatePoints = () => {
    let points = 0;
    
    // Visual Latte Art (only for Cappuccino judge)
    if (judgeScore.sensoryBeverage === 'Cappuccino' && judgeScore.visualLatteArt === competitorPosition) {
      points += CATEGORY_POINTS.visualLatteArt;
    }
    
    // Taste
    if (judgeScore.taste === competitorPosition) {
      points += CATEGORY_POINTS.taste;
    }
    
    // Tactile
    if (judgeScore.tactile === competitorPosition) {
      points += CATEGORY_POINTS.tactile;
    }
    
    // Flavour
    if (judgeScore.flavour === competitorPosition) {
      points += CATEGORY_POINTS.flavour;
    }
    
    // Overall
    if (judgeScore.overall === competitorPosition) {
      points += CATEGORY_POINTS.overall;
    }
    
    return points;
  };

  const points = calculatePoints();
  const cupCode = competitorPosition === 'left' ? judgeScore.leftCupCode : judgeScore.rightCupCode;

  return (
    <Card className="border border-primary/20 bg-[#f2e6d3] dark:bg-card/50">
      <CardContent className="p-2 sm:p-3">
        <div className="space-y-1.5">
          {/* Judge Name and Cup Code */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold text-foreground truncate min-w-0">{judgeScore.judgeName}</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 flex-shrink-0">
              {cupCode}
            </Badge>
          </div>

          {/* Sensory Beverage */}
          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
            <span className="text-muted-foreground">Beverage:</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 flex-shrink-0">
              {judgeScore.sensoryBeverage || '—'}
            </Badge>
          </div>

          {/* Scoring Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {/* Visual Latte Art (only for Cappuccino) */}
            {judgeScore.sensoryBeverage === 'Cappuccino' && judgeScore.visualLatteArt && (
              <div className="flex items-center justify-between p-1.5 bg-blue-100 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1.5">
                  <Coffee className="h-3 w-3 text-blue-700 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Latte Art</span>
                </div>
                <Badge 
                  variant={judgeScore.visualLatteArt === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1.5 py-0.5 flex-shrink-0"
                >
                  {judgeScore.visualLatteArt === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Taste */}
            {judgeScore.taste && (
              <div className="flex items-center justify-between p-1.5 bg-orange-100 dark:bg-orange-950/30 rounded-md border border-orange-200 dark:border-orange-800">
                <span className="text-xs sm:text-sm font-medium text-orange-900 dark:text-orange-100">Taste</span>
                <Badge 
                  variant={judgeScore.taste === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1.5 py-0.5 flex-shrink-0"
                >
                  {judgeScore.taste === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Tactile */}
            {judgeScore.tactile && (
              <div className="flex items-center justify-between p-1.5 bg-purple-100 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800">
                <span className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">Tactile</span>
                <Badge 
                  variant={judgeScore.tactile === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1.5 py-0.5 flex-shrink-0"
                >
                  {judgeScore.tactile === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Flavour */}
            {judgeScore.flavour && (
              <div className="flex items-center justify-between p-1.5 bg-pink-100 dark:bg-pink-950/30 rounded-md border border-pink-200 dark:border-pink-800">
                <span className="text-xs sm:text-sm font-medium text-pink-900 dark:text-pink-100">Flavour</span>
                <Badge 
                  variant={judgeScore.flavour === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1.5 py-0.5 flex-shrink-0"
                >
                  {judgeScore.flavour === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Overall */}
            {judgeScore.overall && (
              <div className="flex items-center justify-between p-1.5 bg-green-100 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800 col-span-2">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-green-700 dark:text-green-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100">Overall</span>
                </div>
                <Badge 
                  variant={judgeScore.overall === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1.5 py-0.5 flex-shrink-0"
                >
                  {judgeScore.overall === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}
          </div>

          {/* Total Points from this Judge */}
          <div className="flex items-center justify-between pt-1.5 border-t border-primary/20 dark:border-primary/10">
            <span className="text-xs sm:text-sm font-semibold text-foreground">Points:</span>
            <span className="text-sm sm:text-base font-bold text-primary">{points}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

