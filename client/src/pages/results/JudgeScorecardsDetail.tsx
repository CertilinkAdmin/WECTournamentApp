import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Trophy, ArrowLeft } from 'lucide-react';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from '../../components/WEC25BracketData';

const JudgeScorecardsDetail: React.FC = () => {
  const { judgeName } = useParams<{ judgeName: string }>();
  const navigate = useNavigate();
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);

  const decodedJudgeName = judgeName ? decodeURIComponent(judgeName) : '';

  const allHeats = [
    ...WEC25_BRACKET_POSITIONS,
    ...WEC25_ROUND2_POSITIONS,
    ...WEC25_ROUND3_POSITIONS,
    ...WEC25_ROUND4_POSITIONS,
    ...WEC25_FINAL_POSITION
  ];

  // Get all heats where this judge participated
  const judgeHeats = allHeats.filter(heat => 
    heat.judges?.some(judge => judge.judgeName === decodedJudgeName)
  );

  const currentHeat = judgeHeats[currentHeatIndex];
  const currentJudgeScorecard = currentHeat?.judges?.find(j => j.judgeName === decodedJudgeName);

  const nextHeat = () => {
    if (currentHeatIndex < judgeHeats.length - 1) {
      setCurrentHeatIndex(prev => prev + 1);
    }
  };

  const prevHeat = () => {
    if (currentHeatIndex > 0) {
      setCurrentHeatIndex(prev => prev - 1);
    }
  };

  if (!decodedJudgeName || judgeHeats.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Judge Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">No scorecards found for this judge.</p>
            <Button onClick={() => navigate('/results/judges')}>Back to Judges</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen tournament-bracket-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/results/judges')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Judges
            </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Users className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-primary">{decodedJudgeName}'s Scorecards</h1>
              <Users className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl text-muted-foreground">
              {judgeHeats.length} heats judged
            </p>
          </div>
        </div>

        {/* Navigation */}
        {judgeHeats.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={prevHeat}
              disabled={currentHeatIndex === 0}
              className="flex items-center gap-2"
            >
              <img src="/icons/arrow_l.png" alt="Previous" className="h-4 w-4 object-contain" />
              Previous
            </Button>
            
            <div className="text-center px-6 py-3 bg-gradient-to-r from-primary/10 to-chart-3/10 rounded-xl border border-primary/20 backdrop-blur-sm">
              <div className="text-lg font-semibold text-primary">
                Heat {currentHeatIndex + 1} of {judgeHeats.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Heat {currentHeat?.heatNumber} - {currentHeat?.competitor1} vs {currentHeat?.competitor2}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={nextHeat}
              disabled={currentHeatIndex === judgeHeats.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <img src="/icons/arrow_r.png" alt="Next" className="h-4 w-4 object-contain" />
            </Button>
          </div>
        )}

        {/* Judge Scorecard Display */}
        {currentHeat && currentJudgeScorecard && (
          <Card className="min-h-[600px] relative border border-primary/30 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    Heat {currentHeat.heatNumber}
                  </span>
                  <Badge>
                    Station {currentHeat.station}
                  </Badge>
                </div>
                {currentHeat.winner && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-secondary">
                    <Trophy className="h-4 w-4 mr-1" />
                    Winner: {currentHeat.winner}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {/* Competitors */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className={`p-6 rounded-xl border-2 ${
                  currentHeat.winner === currentHeat.competitor1 
                    ? 'border-primary bg-secondary' 
                    : 'border-border bg-card'
                }`}>
                  <div className="font-medium text-sm text-gray-600 mb-2">Left Competitor</div>
                  <div className="font-bold text-xl mb-3">
                    {currentHeat.competitor1}
                  </div>
                  {currentHeat.leftCupCode && (
                    <div className="text-sm text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
                      Cup: {currentHeat.leftCupCode}
                    </div>
                  )}
                </div>
                
                <div className={`p-6 rounded-xl border-2 ${
                  currentHeat.winner === currentHeat.competitor2 
                    ? 'border-primary bg-secondary' 
                    : 'border-border bg-card'
                }`}>
                  <div className="font-medium text-sm text-gray-600 mb-2">Right Competitor</div>
                  <div className="font-bold text-xl mb-3">
                    {currentHeat.competitor2}
                  </div>
                  {currentHeat.rightCupCode && (
                    <div className="text-sm text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
                      Cup: {currentHeat.rightCupCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Judge Scorecard */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-3 bg-secondary/30 p-4 rounded-xl border border-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="text-primary">
                    {decodedJudgeName}'s Scorecard
                  </span>
                </h3>
                
                <Card className="border-l-4 border-l-primary bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-bold">{decodedJudgeName}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cup Codes */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/40">
                      <div className="text-center">
                        <div className="text-xs text-slate-600 font-medium">Left Cup</div>
                        <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded mt-1">
                          {currentJudgeScorecard.leftCupCode}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-600 font-medium">Right Cup</div>
                        <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded mt-1">
                          {currentJudgeScorecard.rightCupCode}
                        </div>
                      </div>
                    </div>

                    {/* Scoring Categories */}
                    <div className="space-y-3">
                      {/* Visual Latte Art */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-amber-500 bg-card text-foreground">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard.visualLatteArt === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold">Visual Latte Art</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard.visualLatteArt === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Sensory */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-secondary/20">
                        <div></div>
                        <div className="text-center font-semibold text-primary">{`Sensory ${currentJudgeScorecard.sensoryBeverage}`}</div>
                        <div></div>
                      </div>

                      {/* Taste */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-amber-500 bg-card text-foreground">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard.taste === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold">Taste</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard.taste === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Tactile */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-secondary/20">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard.tactile === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold text-primary">Tactile</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard.tactile === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Flavour */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-amber-500 bg-card text-foreground">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard.flavour === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold">Flavour</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard.flavour === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>

                      {/* Overall */}
                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-secondary/20">
                        <label className="flex items-center gap-2 justify-start">
                          <input type="checkbox" checked={currentJudgeScorecard.overall === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                          <span className="text-xs text-muted-foreground">Left</span>
                        </label>
                        <div className="text-center font-semibold text-primary">Overall</div>
                        <label className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">Right</span>
                          <input type="checkbox" checked={currentJudgeScorecard.overall === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default JudgeScorecardsDetail;

