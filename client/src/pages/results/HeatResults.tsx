import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Coffee, Award, ArrowLeft, Clock, MapPin } from 'lucide-react';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from '../../components/WEC25BracketData';

const HeatResults: React.FC = () => {
  const { heatId } = useParams<{ heatId: string }>();
  const heatNumber = heatId ? parseInt(heatId) : 0;

  const allHeats = [
    ...WEC25_BRACKET_POSITIONS,
    ...WEC25_ROUND2_POSITIONS,
    ...WEC25_ROUND3_POSITIONS,
    ...WEC25_ROUND4_POSITIONS,
    ...WEC25_FINAL_POSITION
  ];

  const heat = allHeats.find(h => h.heatNumber === heatNumber);

  if (!heat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center p-8">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-600 mb-2">Heat Not Found</h1>
              <p className="text-gray-500 mb-4">The requested heat could not be found.</p>
              <Link to="/results/bracket">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Bracket
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getRoundInfo = (heatNumber: number) => {
    if (heatNumber <= 16) return { round: 1, title: "Round 1 - Preliminary Heats" };
    if (heatNumber <= 24) return { round: 2, title: "Round 2 - Quarterfinals" };
    if (heatNumber <= 28) return { round: 3, title: "Round 3 - Semifinals" };
    if (heatNumber <= 30) return { round: 4, title: "Round 4 - Finals" };
    return { round: 5, title: "Final - Championship" };
  };

  const roundInfo = getRoundInfo(heatNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/results/bracket">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bracket
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Trophy className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-primary">Heat {heatNumber}</h1>
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl text-muted-foreground">{roundInfo.title}</p>
          </div>
        </div>

        {/* Heat Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Heat Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">Heat {heatNumber}</div>
                <div className="text-sm text-muted-foreground">Heat Number</div>
              </div>
              <div className="text-center p-4 bg-chart-1/10 rounded-lg">
                <div className="text-2xl font-bold text-chart-1">Station {heat.station}</div>
                <div className="text-sm text-muted-foreground">Station</div>
              </div>
              <div className="text-center p-4 bg-chart-3/10 rounded-lg">
                <div className="text-2xl font-bold text-chart-3">{roundInfo.round}</div>
                <div className="text-sm text-muted-foreground">Round</div>
              </div>
              <div className="text-center p-4 bg-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{heat.winner || "TBD"}</div>
                <div className="text-sm text-muted-foreground">Winner</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitors */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-lg border-2 ${
                heat.winner === heat.competitor1 ? 'border-green-400 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium text-sm text-gray-600">Left Competitor</div>
                  {heat.winner === heat.competitor1 && (
                    <Badge className="bg-green-100 text-green-800">Winner</Badge>
                  )}
                </div>
                <div className="font-bold text-2xl mb-2">{heat.competitor1}</div>
                {heat.leftCupCode && (
                  <div className="text-sm text-gray-500 mb-2">Cup Code: {heat.leftCupCode}</div>
                )}
                {heat.score1 !== undefined && (
                  <div className="text-lg font-semibold text-primary">
                    Score: {heat.score1}
                  </div>
                )}
              </div>
              
              <div className={`p-6 rounded-lg border-2 ${
                heat.winner === heat.competitor2 ? 'border-green-400 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium text-sm text-gray-600">Right Competitor</div>
                  {heat.winner === heat.competitor2 && (
                    <Badge className="bg-green-100 text-green-800">Winner</Badge>
                  )}
                </div>
                <div className="font-bold text-2xl mb-2">{heat.competitor2}</div>
                {heat.rightCupCode && (
                  <div className="text-sm text-gray-500 mb-2">Cup Code: {heat.rightCupCode}</div>
                )}
                {heat.score2 !== undefined && (
                  <div className="text-lg font-semibold text-primary">
                    Score: {heat.score2}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Judge Scorecards */}
        {heat.judges && heat.judges.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Judge Scorecards ({heat.judges.length} judges)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {heat.judges.map((judge, index) => (
                  <Card key={`judge-${index}`} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {judge.judgeName}
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
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Visual Latte Art</span>
                          </div>
                          <Badge variant={judge.visualLatteArt === 'left' ? 'default' : 'secondary'}>
                            {judge.visualLatteArt === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-900">Sensory Beverage</span>
                          </div>
                          <Badge variant="outline" className="text-green-700">
                            {judge.sensoryBeverage}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span className="font-medium text-orange-900">Taste</span>
                          <Badge variant={judge.taste === 'left' ? 'default' : 'secondary'}>
                            {judge.taste === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <span className="font-medium text-purple-900">Tactile</span>
                          <Badge variant={judge.tactile === 'left' ? 'default' : 'secondary'}>
                            {judge.tactile === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <span className="font-medium text-pink-900">Flavour</span>
                          <Badge variant={judge.flavour === 'left' ? 'default' : 'secondary'}>
                            {judge.flavour === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="font-medium text-red-900">Overall</span>
                          <Badge variant={judge.overall === 'left' ? 'default' : 'secondary'}>
                            {judge.overall === 'left' ? 'Left' : 'Right'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center p-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Judge Scorecards</h3>
              <p className="text-gray-500">No judge scorecards are available for this heat.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HeatResults;
