import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Coffee, Award, Trophy } from 'lucide-react';
import SensoryEvaluationCard from './SensoryEvaluationCard';

interface JudgeScore {
  judgeName: string;
  visualLatteArt: 'left' | 'right';
  sensoryBeverage: 'Espresso' | 'Cappuccino';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
  leftCupCode: string;
  rightCupCode: string;
}

interface HeatJudgesDisplayProps {
  heatNumber: number;
  station: string;
  leftCompetitor: string;
  rightCompetitor: string;
  leftCupCode?: string;
  rightCupCode?: string;
  leftScore?: number;
  rightScore?: number;
  winner?: string;
  judges?: JudgeScore[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

function JudgeScorecard({ judge, heatNumber }: { judge: JudgeScore; heatNumber: number }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Judge: {judge.judgeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cup Codes */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="font-semibold text-slate-600">Left Cup</div>
            <div className="text-2xl font-bold text-primary">{judge.leftCupCode}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-600">Right Cup</div>
            <div className="text-2xl font-bold text-primary">{judge.rightCupCode}</div>
          </div>
        </div>

        {/* Scoring Categories */}
        <div className="space-y-3">
          {/* Visual Latte Art */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Visual Latte Art</span>
            </div>
            <Badge variant={judge.visualLatteArt === 'left' ? 'default' : 'secondary'}>
              {judge.visualLatteArt === 'left' ? 'Left' : 'Right'}
            </Badge>
          </div>

          {/* Sensory Beverage */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">Sensory Beverage</span>
            </div>
            <Badge variant="outline" className="text-green-700">
              {judge.sensoryBeverage}
            </Badge>
          </div>

          {/* Taste */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <span className="font-medium text-orange-900">Taste</span>
            <Badge variant={judge.taste === 'left' ? 'default' : 'secondary'}>
              {judge.taste === 'left' ? 'Left' : 'Right'}
            </Badge>
          </div>

          {/* Tactile */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="font-medium text-purple-900">Tactile</span>
            <Badge variant={judge.tactile === 'left' ? 'default' : 'secondary'}>
              {judge.tactile === 'left' ? 'Left' : 'Right'}
            </Badge>
          </div>

          {/* Flavour */}
          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
            <span className="font-medium text-pink-900">Flavour</span>
            <Badge variant={judge.flavour === 'left' ? 'default' : 'secondary'}>
              {judge.flavour === 'left' ? 'Left' : 'Right'}
            </Badge>
          </div>

          {/* Overall */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <span className="font-medium text-red-900">Overall</span>
            <Badge variant={judge.overall === 'left' ? 'default' : 'secondary'}>
              {judge.overall === 'left' ? 'Left' : 'Right'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HeatJudgesDisplay({
  heatNumber,
  station,
  leftCompetitor,
  rightCompetitor,
  leftCupCode,
  rightCupCode,
  leftScore,
  rightScore,
  winner,
  judges = [],
  isExpanded = false,
  onToggle
}: HeatJudgesDisplayProps) {
  const hasJudges = judges.length > 0;
  const hasScores = leftScore !== undefined && rightScore !== undefined;

  return (
    <Card className="w-full heat-card">
      <CardHeader 
        className={`cursor-pointer ${hasJudges ? 'hover:bg-opacity-80' : ''}`}
        onClick={hasJudges ? onToggle : undefined}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <span>Heat {heatNumber}</span>
            <Badge className={
              station === 'A' ? 'station-badge-a' :
              station === 'B' ? 'station-badge-b' :
              'station-badge-c'
            }>
              Station {station}
            </Badge>
          </div>
          {hasJudges && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {judges.length} Judges
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Competitors */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={`p-3 rounded-lg border-2 ${
            winner === leftCompetitor ? 'border-green-400 bg-green-50' : 'border-gray-200'
          }`}>
            <div className="font-medium text-sm text-gray-600">Left Competitor</div>
            <div className="font-bold text-lg">{leftCompetitor}</div>
            {leftCupCode && (
              <div className="text-sm text-gray-500 mt-1">Cup: {leftCupCode}</div>
            )}
            {hasScores && (
              <div className="text-sm font-semibold text-primary mt-1">
                Score: {leftScore}
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-lg border-2 ${
            winner === rightCompetitor ? 'border-green-400 bg-green-50' : 'border-gray-200'
          }`}>
            <div className="font-medium text-sm text-gray-600">Right Competitor</div>
            <div className="font-bold text-lg">{rightCompetitor}</div>
            {rightCupCode && (
              <div className="text-sm text-gray-500 mt-1">Cup: {rightCupCode}</div>
            )}
            {hasScores && (
              <div className="text-sm font-semibold text-primary mt-1">
                Score: {rightScore}
              </div>
            )}
          </div>
        </div>

        {/* Winner Display */}
        {winner && (
          <div className="text-center p-3 bg-yellow-50 rounded-lg mb-4">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="font-bold text-yellow-800">Winner: {winner}</span>
            </div>
          </div>
        )}

        {/* Sensory Evaluation - Always Show */}
        <div className="mt-4">
          <SensoryEvaluationCard 
            judges={judges}
            leftCompetitor={leftCompetitor}
            rightCompetitor={rightCompetitor}
          />
        </div>
      </CardContent>
    </Card>
  );
}
