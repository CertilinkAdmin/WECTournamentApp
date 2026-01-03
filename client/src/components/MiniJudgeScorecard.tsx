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
    <Card className="border border-primary/20 bg-card/50">
      <CardContent className="p-2 sm:p-3">
        <div className="space-y-1.5">
          {/* Judge Name and Cup Code */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground truncate">{judgeScore.judgeName}</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {cupCode}
            </Badge>
          </div>

          {/* Sensory Beverage */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Beverage:</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {judgeScore.sensoryBeverage || '—'}
            </Badge>
          </div>

          {/* Scoring Categories */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            {/* Visual Latte Art (only for Cappuccino) */}
            {judgeScore.sensoryBeverage === 'Cappuccino' && judgeScore.visualLatteArt && (
              <div className="flex items-center justify-between p-1 bg-blue-50 dark:bg-blue-950/30 rounded">
                <div className="flex items-center gap-1">
                  <Coffee className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-900 dark:text-blue-100">Latte Art</span>
                </div>
                <Badge 
                  variant={judgeScore.visualLatteArt === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0"
                >
                  {judgeScore.visualLatteArt === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Taste */}
            {judgeScore.taste && (
              <div className="flex items-center justify-between p-1 bg-orange-50 dark:bg-orange-950/30 rounded">
                <span className="text-orange-900 dark:text-orange-100">Taste</span>
                <Badge 
                  variant={judgeScore.taste === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0"
                >
                  {judgeScore.taste === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Tactile */}
            {judgeScore.tactile && (
              <div className="flex items-center justify-between p-1 bg-purple-50 dark:bg-purple-950/30 rounded">
                <span className="text-purple-900 dark:text-purple-100">Tactile</span>
                <Badge 
                  variant={judgeScore.tactile === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0"
                >
                  {judgeScore.tactile === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Flavour */}
            {judgeScore.flavour && (
              <div className="flex items-center justify-between p-1 bg-pink-50 dark:bg-pink-950/30 rounded">
                <span className="text-pink-900 dark:text-pink-100">Flavour</span>
                <Badge 
                  variant={judgeScore.flavour === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0"
                >
                  {judgeScore.flavour === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}

            {/* Overall */}
            {judgeScore.overall && (
              <div className="flex items-center justify-between p-1 bg-green-50 dark:bg-green-950/30 rounded col-span-2">
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">Overall</span>
                </div>
                <Badge 
                  variant={judgeScore.overall === competitorPosition ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0"
                >
                  {judgeScore.overall === competitorPosition ? '✓' : '✗'}
                </Badge>
              </div>
            )}
          </div>

          {/* Total Points from this Judge */}
          <div className="flex items-center justify-between pt-1 border-t border-primary/10">
            <span className="text-xs font-semibold text-foreground">Points:</span>
            <span className="text-sm font-bold text-primary">{points}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

