import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Trophy, ArrowLeft } from 'lucide-react';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from '../../components/WEC25BracketData';

interface CategoryScores {
  latteArt: number;
  taste: number;
  tactile: number;
  flavor: number;
  overall: number;
}

interface HeatScore {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner: string;
  cupCode: string;
  categoryScores: CategoryScores;
  totalPoints: number;
}

const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

const JUDGES_COUNT = 3;

// Helper function to determine category result
const getCategoryResult = (earnedPoints: number, maxPointsPerJudge: number): 'WIN' | 'LOSS' | 'TIE' => {
  const maxPossible = maxPointsPerJudge * JUDGES_COUNT;
  const winThreshold = maxPointsPerJudge * (JUDGES_COUNT / 2); // More than half the judges
  
  if (earnedPoints > winThreshold) return 'WIN';
  if (earnedPoints === 0) return 'LOSS';
  if (earnedPoints < winThreshold) return 'LOSS';
  return 'TIE'; // Exactly half (rare with odd number of judges)
};

const BaristaDetail: React.FC = () => {
  const { baristaName, tournamentSlug } = useParams<{ baristaName: string; tournamentSlug?: string }>();
  const navigate = useNavigate();
  const tournament = tournamentSlug || 'WEC2025';
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);
  
  // Get heat number from URL query params if navigating from a heat
  const searchParams = new URLSearchParams(window.location.search);
  const heatNumberParam = searchParams.get('heat');

  const decodedBaristaName = baristaName ? decodeURIComponent(baristaName) : '';

  const allHeats = [
    ...WEC25_BRACKET_POSITIONS,
    ...WEC25_ROUND2_POSITIONS,
    ...WEC25_ROUND3_POSITIONS,
    ...WEC25_ROUND4_POSITIONS,
    ...WEC25_FINAL_POSITION
  ];

  // Get all heats where this barista participated
  const baristaHeats = allHeats
    .filter(heat => {
      const comp1 = heat.competitor1?.trim();
      const comp2 = heat.competitor2?.trim();
      const baristaNameLower = decodedBaristaName.toLowerCase();
      
      // Check if barista matches by first name or full name
      const matchesComp1 = comp1 && (
        comp1.toLowerCase() === baristaNameLower ||
        comp1.toLowerCase().startsWith(baristaNameLower) ||
        comp1.split(' ')[0].toLowerCase() === baristaNameLower
      );
      const matchesComp2 = comp2 && comp2 !== 'BYE' && (
        comp2.toLowerCase() === baristaNameLower ||
        comp2.toLowerCase().startsWith(baristaNameLower) ||
        comp2.split(' ')[0].toLowerCase() === baristaNameLower
      );
      
      return matchesComp1 || matchesComp2;
    })
    .map(heat => {
      // Determine which position the barista was in (left/right)
      const comp1 = heat.competitor1?.trim() || '';
      const comp2 = heat.competitor2?.trim() || '';
      const baristaNameLower = decodedBaristaName.toLowerCase();
      
      const isCompetitor1 = comp1 && (
        comp1.toLowerCase() === baristaNameLower ||
        comp1.toLowerCase().startsWith(baristaNameLower) ||
        comp1.split(' ')[0].toLowerCase() === baristaNameLower
      );
      const isCompetitor2 = comp2 && comp2 !== 'BYE' && (
        comp2.toLowerCase() === baristaNameLower ||
        comp2.toLowerCase().startsWith(baristaNameLower) ||
        comp2.split(' ')[0].toLowerCase() === baristaNameLower
      );
      
      // Determine cup code and position
      let cupCode = '';
      let competitorPosition: 'left' | 'right' = 'left';
      
      if (isCompetitor1) {
        cupCode = heat.leftCupCode || '';
        competitorPosition = 'left';
      } else if (isCompetitor2) {
        cupCode = heat.rightCupCode || '';
        competitorPosition = 'right';
      }
      
      // Calculate category scores from judges
      const categoryScores: CategoryScores = {
        latteArt: 0,
        taste: 0,
        tactile: 0,
        flavor: 0,
        overall: 0,
      };
      
      if (heat.judges) {
        heat.judges.forEach(judge => {
          const wonLatteArt = judge.visualLatteArt === competitorPosition;
          const wonTaste = judge.taste === competitorPosition;
          const wonTactile = judge.tactile === competitorPosition;
          const wonFlavor = judge.flavour === competitorPosition;
          const wonOverall = judge.overall === competitorPosition;
          
          if (wonLatteArt) categoryScores.latteArt += CATEGORY_POINTS.visualLatteArt;
          if (wonTaste) categoryScores.taste += CATEGORY_POINTS.taste;
          if (wonTactile) categoryScores.tactile += CATEGORY_POINTS.tactile;
          if (wonFlavor) categoryScores.flavor += CATEGORY_POINTS.flavour;
          if (wonOverall) categoryScores.overall += CATEGORY_POINTS.overall;
        });
      }
      
      const totalPoints = categoryScores.latteArt + categoryScores.taste + 
                         categoryScores.tactile + categoryScores.flavor + 
                         categoryScores.overall;
      
      return {
        heatNumber: heat.heatNumber,
        station: heat.station,
        competitor1: heat.competitor1,
        competitor2: heat.competitor2,
        winner: heat.winner,
        cupCode: cupCode || '',
        categoryScores,
        totalPoints,
      } as HeatScore;
    });

  // Set initial heat index if navigating from a specific heat
  useEffect(() => {
    if (heatNumberParam && baristaHeats.length > 0) {
      const heatNum = parseInt(heatNumberParam, 10);
      const heatIndex = baristaHeats.findIndex(h => h.heatNumber === heatNum);
      if (heatIndex !== -1) {
        setCurrentHeatIndex(heatIndex);
      }
    }
  }, [heatNumberParam, baristaHeats.length]);

  const currentHeat = baristaHeats[currentHeatIndex];

  const nextHeat = () => {
    if (currentHeatIndex < baristaHeats.length - 1) {
      setCurrentHeatIndex(prev => prev + 1);
    }
  };

  const prevHeat = () => {
    if (currentHeatIndex > 0) {
      setCurrentHeatIndex(prev => prev - 1);
    }
  };

  if (!decodedBaristaName || baristaHeats.length === 0) {
    return (
      <div className="min-h-screen tournament-bracket-bg p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Barista Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">No heats found for this barista.</p>
            <Button onClick={() => navigate(`/results/${tournament}/baristas`)}>Back to Baristas</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate overall totals across all heats
  const overallTotals = baristaHeats.reduce((totals, heat) => {
    totals.latteArt += heat.categoryScores.latteArt;
    totals.taste += heat.categoryScores.taste;
    totals.tactile += heat.categoryScores.tactile;
    totals.flavor += heat.categoryScores.flavor;
    totals.overall += heat.categoryScores.overall;
    return totals;
  }, { latteArt: 0, taste: 0, tactile: 0, flavor: 0, overall: 0 });

  const overallTotalPoints = overallTotals.latteArt + overallTotals.taste + 
                             overallTotals.tactile + overallTotals.flavor + 
                             overallTotals.overall;

  return (
    <div className="min-h-screen tournament-bracket-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/results/${tournament}/baristas`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Baristas
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <User className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-primary">{decodedBaristaName}'s Scores</h1>
              <User className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl text-muted-foreground">
              {baristaHeats.length} heat{baristaHeats.length !== 1 ? 's' : ''} competed
            </p>
          </div>
        </div>

        {/* Overall Summary Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-chart-3/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Overall Tournament Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Latte Art</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.latteArt}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Taste</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.taste}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Tactile</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.tactile}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Flavor</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.flavor}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Overall</div>
                <div className="text-2xl font-bold text-primary">{overallTotals.overall}</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Points</div>
              <div className="text-4xl font-bold text-primary">{overallTotalPoints}</div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        {baristaHeats.length > 0 && (
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
                Heat {currentHeatIndex + 1} of {baristaHeats.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Heat {currentHeat?.heatNumber} - Station {currentHeat?.station}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={nextHeat}
              disabled={currentHeatIndex === baristaHeats.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <img src="/icons/arrow_r.png" alt="Next" className="h-4 w-4 object-contain" />
            </Button>
          </div>
        )}

        {/* Current Heat Scores */}
        {currentHeat && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Heat {currentHeat.heatNumber} Details</CardTitle>
                <Badge variant="default" className="text-lg px-4 py-1">
                  Station {currentHeat.station}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Matchup */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className={`text-center p-4 rounded-lg ${
                  (() => {
                    const comp1Lower = currentHeat.competitor1.toLowerCase();
                    const baristaNameLower = decodedBaristaName.toLowerCase();
                    return comp1Lower === baristaNameLower || 
                           comp1Lower.startsWith(baristaNameLower) ||
                           comp1Lower.split(' ')[0] === baristaNameLower;
                  })() ? 'bg-primary/20 border-2 border-primary' : ''
                }`}>
                  <div className="text-sm text-muted-foreground mb-2">Competitor 1</div>
                  <div className="font-semibold text-lg">{currentHeat.competitor1}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cup: {(() => {
                      const comp1Lower = currentHeat.competitor1.toLowerCase();
                      const baristaNameLower = decodedBaristaName.toLowerCase();
                      const isThisBarista = comp1Lower === baristaNameLower || 
                                          comp1Lower.startsWith(baristaNameLower) ||
                                          comp1Lower.split(' ')[0] === baristaNameLower;
                      return isThisBarista ? (currentHeat.cupCode || 'N/A') : (currentHeat.competitor1 === 'BYE' ? 'BYE' : 'N/A');
                    })()}
                  </div>
                </div>
                <div className={`text-center p-4 rounded-lg ${
                  (() => {
                    const comp2Lower = currentHeat.competitor2.toLowerCase();
                    const baristaNameLower = decodedBaristaName.toLowerCase();
                    return comp2Lower !== 'BYE' && (
                      comp2Lower === baristaNameLower || 
                      comp2Lower.startsWith(baristaNameLower) ||
                      comp2Lower.split(' ')[0] === baristaNameLower
                    );
                  })() ? 'bg-primary/20 border-2 border-primary' : ''
                }`}>
                  <div className="text-sm text-muted-foreground mb-2">Competitor 2</div>
                  <div className="font-semibold text-lg">{currentHeat.competitor2}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cup: {(() => {
                      const comp2Lower = currentHeat.competitor2.toLowerCase();
                      const baristaNameLower = decodedBaristaName.toLowerCase();
                      const isThisBarista = comp2Lower !== 'BYE' && (
                        comp2Lower === baristaNameLower || 
                        comp2Lower.startsWith(baristaNameLower) ||
                        comp2Lower.split(' ')[0] === baristaNameLower
                      );
                      return isThisBarista ? (currentHeat.cupCode || 'N/A') : (currentHeat.competitor2 === 'BYE' ? 'BYE' : 'N/A');
                    })()}
                  </div>
                </div>
              </div>

              {/* Category Scores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-center">Scores by Category</h3>
                
                {/* Cappuccino Section */}
                <div className="space-y-3">
                  <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-center font-bold text-lg" data-testid="section-cappuccino">
                    CAPPUCCINO
                  </div>
                  
                  {/* Latte Art */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-latte-art">
                    <span className="font-semibold">Latte Art:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.latteArt} / {CATEGORY_POINTS.visualLatteArt * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.latteArt, CATEGORY_POINTS.visualLatteArt)}
                    </span>
                  </div>
                </div>

                {/* Espresso Section */}
                <div className="space-y-3 mt-6">
                  <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-center font-bold text-lg" data-testid="section-espresso">
                    ESPRESSO
                  </div>
                  
                  {/* Taste */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-taste">
                    <span className="font-semibold">Taste:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.taste} / {CATEGORY_POINTS.taste * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.taste, CATEGORY_POINTS.taste)}
                    </span>
                  </div>
                  
                  {/* Tactile */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-tactile">
                    <span className="font-semibold">Tactile:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.tactile} / {CATEGORY_POINTS.tactile * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.tactile, CATEGORY_POINTS.tactile)}
                    </span>
                  </div>
                  
                  {/* Flavour */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-flavour">
                    <span className="font-semibold">Flavour:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.flavor} / {CATEGORY_POINTS.flavour * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.flavor, CATEGORY_POINTS.flavour)}
                    </span>
                  </div>
                  
                  {/* Overall */}
                  <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center justify-between" data-testid="score-overall">
                    <span className="font-semibold">Overall:</span>
                    <span className="font-semibold">{currentHeat.categoryScores.overall} / {CATEGORY_POINTS.overall * JUDGES_COUNT} points</span>
                    <span className="font-bold">
                      {getCategoryResult(currentHeat.categoryScores.overall, CATEGORY_POINTS.overall)}
                    </span>
                  </div>
                </div>

                {/* Total Score */}
                <div className="bg-secondary text-secondary-foreground rounded-lg px-6 py-4 text-center mt-6" data-testid="total-score">
                  <div className="text-3xl font-bold">
                    {currentHeat.totalPoints} / 33 <span className="ml-4">
                      {currentHeat.totalPoints > 16 ? 'WIN' : currentHeat.totalPoints === 16 ? 'TIE' : 'LOSS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Points for Heat */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Heat Total Points</div>
                  <div className="text-3xl font-bold text-primary">{currentHeat.totalPoints}</div>
                </div>
              </div>

              {/* Winner Badge */}
              {currentHeat.winner && (
                <div className="flex items-center justify-center gap-2">
                  {(() => {
                    const winnerLower = currentHeat.winner.toLowerCase();
                    const baristaNameLower = decodedBaristaName.toLowerCase();
                    const won = winnerLower === baristaNameLower || 
                               winnerLower.startsWith(baristaNameLower) ||
                               winnerLower.split(' ')[0] === baristaNameLower ||
                               winnerLower.includes(baristaNameLower);
                    return won ? (
                      <Badge variant="default" className="text-lg px-6 py-2">
                        <Trophy className="h-4 w-4 mr-2" />
                        Won this Heat
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-lg px-6 py-2">
                        Runner-up
                      </Badge>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Heats Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Heats Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Heat</th>
                    <th className="text-center p-2">Station</th>
                    <th className="text-center p-2">Latte Art</th>
                    <th className="text-center p-2">Taste</th>
                    <th className="text-center p-2">Tactile</th>
                    <th className="text-center p-2">Flavor</th>
                    <th className="text-center p-2">Overall</th>
                    <th className="text-center p-2">Total</th>
                    <th className="text-center p-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {baristaHeats.map((heat, idx) => (
                    <tr 
                      key={heat.heatNumber} 
                      className={`border-b cursor-pointer hover:bg-muted/50 ${idx === currentHeatIndex ? 'bg-primary/10' : ''}`}
                      onClick={() => setCurrentHeatIndex(idx)}
                    >
                      <td className="p-2 font-semibold">{heat.heatNumber}</td>
                      <td className="p-2 text-center">{heat.station}</td>
                      <td className="p-2 text-center">{heat.categoryScores.latteArt}</td>
                      <td className="p-2 text-center">{heat.categoryScores.taste}</td>
                      <td className="p-2 text-center">{heat.categoryScores.tactile}</td>
                      <td className="p-2 text-center">{heat.categoryScores.flavor}</td>
                      <td className="p-2 text-center">{heat.categoryScores.overall}</td>
                      <td className="p-2 text-center font-semibold">{heat.totalPoints}</td>
                      <td className="p-2 text-center">
                        {(() => {
                          const winnerLower = heat.winner.toLowerCase();
                          const baristaNameLower = decodedBaristaName.toLowerCase();
                          const won = winnerLower === baristaNameLower || 
                                     winnerLower.startsWith(baristaNameLower) ||
                                     winnerLower.split(' ')[0] === baristaNameLower ||
                                     winnerLower.includes(baristaNameLower);
                          return won ? (
                            <Badge variant="default" className="text-xs">
                              <Trophy className="h-3 w-3 mr-1" />
                              Won
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Loss</Badge>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BaristaDetail;

