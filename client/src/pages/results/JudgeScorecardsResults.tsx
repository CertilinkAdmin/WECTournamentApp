import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Users, Coffee, Award, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from '../../components/WEC25BracketData';

const JudgeScorecardsResults: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHeat, setSelectedHeat] = useState<number | null>(null);
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const allHeats = [
    ...WEC25_BRACKET_POSITIONS,
    ...WEC25_ROUND2_POSITIONS,
    ...WEC25_ROUND3_POSITIONS,
    ...WEC25_ROUND4_POSITIONS,
    ...WEC25_FINAL_POSITION
  ];

  // Get all unique judges
  const allJudges = Array.from(new Set(
    allHeats.flatMap(heat => heat.judges?.map(judge => judge.judgeName) || [])
  ));

  // Filter heats based on search and filters
  const filteredHeats = allHeats.filter(heat => {
    const matchesSearch = !searchTerm || 
      heat.competitor1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      heat.competitor2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      heat.winner?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHeat = !selectedHeat || heat.heatNumber === selectedHeat;
    
    return matchesSearch && matchesHeat;
  });

  // Reset current index when filters change
  useEffect(() => {
    setCurrentHeatIndex(0);
  }, [searchTerm, selectedHeat]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentHeatIndex < filteredHeats.length - 1) {
      setCurrentHeatIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentHeatIndex > 0) {
      setCurrentHeatIndex(prev => prev - 1);
    }
  };

  const nextHeat = () => {
    if (currentHeatIndex < filteredHeats.length - 1) {
      setCurrentHeatIndex(prev => prev + 1);
    }
  };

  const prevHeat = () => {
    if (currentHeatIndex > 0) {
      setCurrentHeatIndex(prev => prev - 1);
    }
  };

  const currentHeat = filteredHeats[currentHeatIndex];

  const getJudgeStats = (judgeName: string) => {
    const judgeHeats = allHeats.filter(heat => 
      heat.judges?.some(judge => judge.judgeName === judgeName)
    );
    
    return {
      totalHeats: judgeHeats.length,
      totalRounds: new Set(judgeHeats.map(h => Math.ceil(h.heatNumber / 8))).size
    };
  };

  return (
    <div className="min-h-screen tournament-bracket-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Users className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">WEC25 Judge Scorecards</h1>
            <Users className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground">
            Complete judge scorecards and detailed scoring breakdown for all heats
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search competitors or heats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedHeat || ''}
                onChange={(e) => setSelectedHeat(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Heats</option>
                {allHeats.map(heat => (
                  <option key={heat.heatNumber} value={heat.heatNumber}>
                    Heat {heat.heatNumber}
                  </option>
                ))}
              </select>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedHeat(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Judge Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Judge Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {allJudges.map(judge => {
                const stats = getJudgeStats(judge);
                return (
                  <button
                    key={judge}
                    onClick={() => navigate(`/results/judges/${encodeURIComponent(judge)}`)}
                    className="text-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-primary/30"
                  >
                    <div className="font-semibold text-sm text-gray-600">{judge}</div>
                    <div className="text-2xl font-bold text-primary">{stats.totalHeats}</div>
                    <div className="text-xs text-gray-500">Heats Judged</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Heat Navigation */}
        {filteredHeats.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="outline" 
              onClick={prevHeat}
              disabled={currentHeatIndex === 0}
              className="flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <img src="/icons/arrow_l.png" alt="Previous" className="h-4 w-4 object-contain" />
              Previous
            </Button>
            
            <div className="text-center px-6 py-3 bg-gradient-to-r from-primary/10 to-chart-3/10 rounded-xl border border-primary/20 backdrop-blur-sm">
              <div className="text-lg font-semibold text-primary animate-pulse">
                Heat {currentHeatIndex + 1} of {filteredHeats.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {currentHeat?.competitor1} vs {currentHeat?.competitor2}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={nextHeat}
              disabled={currentHeatIndex === filteredHeats.length - 1}
              className="flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              Next
              <img src="/icons/arrow_r.png" alt="Next" className="h-4 w-4 object-contain" />
            </Button>
          </div>
        )}

        {/* Single Heat Display */}
        {filteredHeats.length > 0 && currentHeat ? (
          <div 
            className="heat-swipe-container group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Card className="min-h-[600px] relative border border-primary/30 bg-card">
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-primary animate-bounce" />
                    <span className="text-2xl font-bold text-primary">
                      Heat {currentHeat.heatNumber}
                    </span>
                    <Badge className={`transition-all duration-300 hover:scale-110 ${
                      currentHeat.station === 'A' ? 'bg-primary shadow-lg shadow-primary/25' :
                      currentHeat.station === 'B' ? 'bg-chart-3 shadow-lg shadow-chart-3/25' :
                      'bg-chart-1 shadow-lg shadow-chart-1/25'
                    }`}>
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
              
              <CardContent className="relative z-10">
                {/* Competitors */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className={`group/competitor p-6 rounded-xl border-2 ${
                    currentHeat.winner === currentHeat.competitor1 
                      ? 'border-primary bg-secondary' 
                      : 'border-border bg-card'
                  }`}>
                    <div className="font-medium text-sm text-gray-600 mb-2">Left Competitor</div>
                    <div className="font-bold text-xl text-gray-900 mb-3 group-hover/competitor:text-primary transition-colors duration-300">
                      {currentHeat.competitor1}
                    </div>
                    {currentHeat.leftCupCode && (
                      <div className="text-sm text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        Cup: {currentHeat.leftCupCode}
                      </div>
                    )}
                    {currentHeat.score1 !== undefined && (
                      <div className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg inline-block">
                        Score: {currentHeat.score1}
                      </div>
                    )}
                    {currentHeat.winner === currentHeat.competitor1 && (
                      <div className="absolute top-2 right-2">
                        <Trophy className="h-6 w-6 text-green-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  <div className={`group/competitor p-6 rounded-xl border-2 ${
                    currentHeat.winner === currentHeat.competitor2 
                      ? 'border-primary bg-secondary' 
                      : 'border-border bg-card'
                  }`}>
                    <div className="font-medium text-sm text-gray-600 mb-2">Right Competitor</div>
                    <div className="font-bold text-xl text-gray-900 mb-3 group-hover/competitor:text-primary transition-colors duration-300">
                      {currentHeat.competitor2}
                    </div>
                    {currentHeat.rightCupCode && (
                      <div className="text-sm text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        Cup: {currentHeat.rightCupCode}
                      </div>
                    )}
                    {currentHeat.score2 !== undefined && (
                      <div className="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg inline-block">
                        Score: {currentHeat.score2}
                      </div>
                    )}
                    {currentHeat.winner === currentHeat.competitor2 && (
                      <div className="absolute top-2 right-2">
                        <Trophy className="h-6 w-6 text-green-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Judge Scorecards */}
                {currentHeat.judges && currentHeat.judges.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-3 bg-secondary/30 p-4 rounded-xl border border-primary/20">
                      <Users className="h-6 w-6 text-primary animate-pulse" />
                      <span className="text-primary">
                        Judge Scorecards ({currentHeat.judges.length} judges)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentHeat.judges.map((judge, index) => (
                        <Card 
                          key={`${currentHeat.heatNumber}-judge-${index}`} 
                          className="border-l-4 border-l-primary bg-card"
                        >
                          
                          <CardHeader className="pb-3 relative z-10">
                            <CardTitle className="text-lg flex items-center gap-2 group-hover/judge:text-primary transition-colors duration-300">
                              <Users className="h-5 w-5 animate-bounce" />
                              <span className="font-bold">{judge.judgeName}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 relative z-10">
                            {/* Cup Codes */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-secondary/40">
                              <div className="text-center">
                                <div className="text-xs text-slate-600 font-medium">Left Cup</div>
                                <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded mt-1">
                                  {judge.leftCupCode}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-slate-600 font-medium">Right Cup</div>
                                <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded mt-1">
                                  {judge.rightCupCode}
                                </div>
                              </div>
                            </div>

                            {/* Scoring Categories (center label, checkboxes on sides) */}
                            <div className="space-y-3">
                              {/* Visual Latte Art */}
                              <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-amber-500 bg-card text-foreground">
                                <label className="flex items-center gap-2 justify-start">
                                  <input type="checkbox" checked={judge.visualLatteArt === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                  <span className="text-xs text-muted-foreground">Left</span>
                                </label>
                                <div className="text-center font-semibold">Visual Latte Art</div>
                                <label className="flex items-center gap-2 justify-end">
                                  <span className="text-xs text-muted-foreground">Right</span>
                                  <input type="checkbox" checked={judge.visualLatteArt === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                </label>
                              </div>

                              {/* Sensory Beverage (no left/right) */}
                              <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-secondary/20">
                                <div></div>
                                <div className="text-center font-semibold text-primary">{`Sensory ${judge.sensoryBeverage}`}</div>
                                <div></div>
                              </div>

                              {/* Taste */}
                              <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-amber-500 bg-card text-foreground">
                                <label className="flex items-center gap-2 justify-start">
                                  <input type="checkbox" checked={judge.taste === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                  <span className="text-xs text-muted-foreground">Left</span>
                                </label>
                                <div className="text-center font-semibold">Taste</div>
                                <label className="flex items-center gap-2 justify-end">
                                  <span className="text-xs text-muted-foreground">Right</span>
                                  <input type="checkbox" checked={judge.taste === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                </label>
                              </div>

                              {/* Tactile */}
                              <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-secondary/20">
                                <label className="flex items-center gap-2 justify-start">
                                  <input type="checkbox" checked={judge.tactile === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                  <span className="text-xs text-muted-foreground">Left</span>
                                </label>
                                <div className="text-center font-semibold text-primary">Tactile</div>
                                <label className="flex items-center gap-2 justify-end">
                                  <span className="text-xs text-muted-foreground">Right</span>
                                  <input type="checkbox" checked={judge.tactile === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                </label>
                              </div>

                              {/* Flavour */}
                              <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-amber-500 bg-card text-foreground">
                                <label className="flex items-center gap-2 justify-start">
                                  <input type="checkbox" checked={judge.flavour === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                  <span className="text-xs text-muted-foreground">Left</span>
                                </label>
                                <div className="text-center font-semibold">Flavour</div>
                                <label className="flex items-center gap-2 justify-end">
                                  <span className="text-xs text-muted-foreground">Right</span>
                                  <input type="checkbox" checked={judge.flavour === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                </label>
                              </div>

                              {/* Overall */}
                              <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-secondary/20">
                                <label className="flex items-center gap-2 justify-start">
                                  <input type="checkbox" checked={judge.overall === 'left'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                  <span className="text-xs text-muted-foreground">Left</span>
                                </label>
                                <div className="text-center font-semibold text-primary">Overall</div>
                                <label className="flex items-center gap-2 justify-end">
                                  <span className="text-xs text-muted-foreground">Right</span>
                                  <input type="checkbox" checked={judge.overall === 'right'} readOnly className="h-4 w-4 accent-[color:oklch(var(--foreground))]" />
                                </label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No judge scorecards available for this heat</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center p-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Heats Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeScorecardsResults;
