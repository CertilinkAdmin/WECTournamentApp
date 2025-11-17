import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Users, Coffee, Award, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from '../../components/WEC25BracketData';
import JudgeConsensus from '@/components/JudgeConsensus';

const JudgeScorecardsResults: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHeat, setSelectedHeat] = useState<number | null>(null);
  const [currentHeatIndex, setCurrentHeatIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showJudgeStats, setShowJudgeStats] = useState(false);
  const [selectedJudgeTab, setSelectedJudgeTab] = useState<string>('');

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

  // Reset judge tab when heat changes
  useEffect(() => {
    if (currentHeat?.judges && currentHeat.judges.length > 0) {
      setSelectedJudgeTab(currentHeat.judges[0].judgeName);
    } else {
      setSelectedJudgeTab('');
    }
  }, [currentHeat]);

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
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Users className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">WEC25 Judge Scorecards</h1>
            <Users className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground">
            Complete judge scorecards and detailed scoring breakdown for all heats
          </p>
        </div>

        {/* Streamlined Search and Filters - Inline */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-muted/30 rounded-lg border border-primary/10">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitors or heats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          <select
            value={selectedHeat || ''}
            onChange={(e) => setSelectedHeat(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 h-9 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All Heats</option>
            {allHeats.map(heat => (
              <option key={heat.heatNumber} value={heat.heatNumber}>
                Heat {heat.heatNumber}
              </option>
            ))}
          </select>
          
          {(searchTerm || selectedHeat) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedHeat(null);
              }}
              className="h-9"
            >
              Clear
            </Button>
          )}
        </div>

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
            
            <div className="text-center px-6 py-3 bg-gradient-to-r from-primary/10 to-chart-3/10 rounded-xl border-2 border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/10">
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
              
              <CardHeader className="relative z-10 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Heat Number - Prominent on left */}
                  <div className="flex items-center gap-3">
                    <Trophy className="h-7 w-7 text-primary animate-bounce" />
                    <span className="text-3xl sm:text-4xl font-bold text-primary">
                      Heat {currentHeat.heatNumber}
                    </span>
                  </div>
                  
                  {/* Station and Winner badges - Grouped on right */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Badge className={`text-base px-4 py-2 transition-all duration-300 hover:scale-105 ${
                      currentHeat.station === 'A' ? 'bg-primary shadow-lg shadow-primary/25' :
                      currentHeat.station === 'B' ? 'bg-chart-3 shadow-lg shadow-chart-3/25' :
                      'bg-chart-1 shadow-lg shadow-chart-1/25'
                    }`}>
                      Station {currentHeat.station}
                    </Badge>
                    {currentHeat.winner && (
                      <Badge variant="secondary" className="text-base px-4 py-2 bg-secondary text-secondary-foreground border-2 border-primary/30 shadow-lg">
                        <Trophy className="h-4 w-4 mr-2" />
                        Winner: {currentHeat.winner}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                {/* Judge Scorecards - Now First */}
                {currentHeat.judges && currentHeat.judges.length > 0 ? (
                  <div className="space-y-6 mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-3 bg-secondary/30 p-4 rounded-xl border border-primary/20">
                      <Users className="h-6 w-6 text-primary animate-pulse" />
                      <span className="text-primary">
                        Judge Scorecards ({currentHeat.judges.length} judges)
                      </span>
                    </h3>
                    
                    {/* Judge Consensus Overview */}
                    <JudgeConsensus judges={currentHeat.judges} />
                    
                    {/* Judge Details Tabs */}
                    {(() => {
                      if (!currentHeat.judges) return null;
                      
                      const getConsensus = (category: 'visualLatteArt' | 'taste' | 'tactile' | 'flavour' | 'overall'): 'left' | 'right' | 'tie' => {
                        const votes = currentHeat.judges!.map(j => j[category]);
                        const leftVotes = votes.filter(v => v === 'left').length;
                        const rightVotes = votes.filter(v => v === 'right').length;
                        if (leftVotes > rightVotes) return 'left';
                        if (rightVotes > leftVotes) return 'right';
                        return 'tie';
                      };
                      
                      const consensus: Record<'visualLatteArt' | 'taste' | 'tactile' | 'flavour' | 'overall', 'left' | 'right' | 'tie'> = {
                        visualLatteArt: getConsensus('visualLatteArt'),
                        taste: getConsensus('taste'),
                        tactile: getConsensus('tactile'),
                        flavour: getConsensus('flavour'),
                        overall: getConsensus('overall'),
                      };
                      
                      const isInMajority = (judgeVote: 'left' | 'right' | null, categoryConsensus: 'left' | 'right' | 'tie') => {
                        if (!judgeVote || categoryConsensus === 'tie') return true;
                        return judgeVote === categoryConsensus;
                      };
                      
                      return (
                        <Tabs value={selectedJudgeTab} onValueChange={setSelectedJudgeTab} className="w-full">
                          <TabsList 
                            className="grid w-full gap-2 h-auto p-2 bg-muted/70 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg shadow-primary/10"
                            style={{ gridTemplateColumns: `repeat(${currentHeat.judges.length}, 1fr)` }}
                          >
                            {currentHeat.judges.map((judge, index) => (
                              <TabsTrigger 
                                key={`judge-tab-${index}`}
                                value={judge.judgeName}
                                className="px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-md border border-transparent hover:border-primary/30 hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=active]:border-primary data-[state=active]:scale-105 data-[state=active]:font-bold"
                              >
                                {judge.judgeName}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          
                          {currentHeat.judges.map((judge, index) => {
                            const renderCategoryRow = (
                              category: 'visualLatteArt' | 'taste' | 'tactile' | 'flavour' | 'overall',
                              label: string
                            ) => {
                              const judgeVote = judge[category];
                              const categoryConsensus = consensus[category];
                              const inMajority = isInMajority(judgeVote, categoryConsensus);
                              
                              return (
                                <div 
                                  key={category}
                                  className={`grid grid-cols-3 items-center p-3 rounded-lg text-sm border transition-all ${
                                    inMajority
                                      ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20'
                                      : 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20'
                                  }`}
                                >
                                  <label className="flex items-center gap-2 justify-start">
                                    <input 
                                      type="checkbox" 
                                      checked={judgeVote === 'left'} 
                                      readOnly 
                                      className={`h-4 w-4 accent-[color:oklch(var(--foreground))] ${
                                        inMajority && judgeVote === 'left' ? 'ring-2 ring-green-500' : ''
                                      }`}
                                    />
                                    <span className="text-xs text-muted-foreground">Left</span>
                                    {judgeVote === 'left' && !inMajority && (
                                      <XCircle className="h-3 w-3 text-red-500" />
                                    )}
                                    {judgeVote === 'left' && inMajority && (
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    )}
                                  </label>
                                  <div className="text-center font-semibold text-primary flex items-center justify-center gap-1">
                                    {label}
                                    {categoryConsensus !== 'tie' && (
                                      <Badge variant="outline" className="text-xs">
                                        {categoryConsensus === 'left' ? 'L' : 'R'} Majority
                                      </Badge>
                                    )}
                                  </div>
                                  <label className="flex items-center gap-2 justify-end">
                                    <span className="text-xs text-muted-foreground">Right</span>
                                    <input 
                                      type="checkbox" 
                                      checked={judgeVote === 'right'} 
                                      readOnly 
                                      className={`h-4 w-4 accent-[color:oklch(var(--foreground))] ${
                                        inMajority && judgeVote === 'right' ? 'ring-2 ring-green-500' : ''
                                      }`}
                                    />
                                    {judgeVote === 'right' && !inMajority && (
                                      <XCircle className="h-3 w-3 text-red-500" />
                                    )}
                                    {judgeVote === 'right' && inMajority && (
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    )}
                                  </label>
                                </div>
                              );
                            };
                            
                            return (
                              <TabsContent 
                                key={`judge-content-${index}`}
                                value={judge.judgeName}
                                className="mt-4"
                              >
                                <Card className="border-l-4 border-l-primary bg-card">
                                  <CardHeader className="pb-3 relative z-10">
                                    <CardTitle className="text-lg flex items-center gap-2 group-hover/judge:text-primary transition-colors duration-300">
                                      <Users className="h-5 w-5" />
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

                                    {/* Scoring Categories with Consensus Indicators */}
                                    <div className="space-y-3">
                                      {renderCategoryRow('visualLatteArt', 'Visual Latte Art')}
                                      
                                      {/* Sensory Beverage (no left/right) */}
                                      <div className="grid grid-cols-3 items-center p-3 rounded-lg text-sm border border-primary/30 bg-secondary/20">
                                        <div></div>
                                        <div className="text-center font-semibold text-primary">{`Sensory ${judge.sensoryBeverage}`}</div>
                                        <div></div>
                                      </div>

                                      {renderCategoryRow('taste', 'Taste')}
                                      {renderCategoryRow('tactile', 'Tactile')}
                                      {renderCategoryRow('flavour', 'Flavour')}
                                      {renderCategoryRow('overall', 'Overall')}
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500 mb-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No judge scorecards available for this heat</p>
                  </div>
                )}

                {/* Competitors - Now After Judges */}
                <div className="grid grid-cols-2 gap-6">
                  <div className={`group/competitor p-6 rounded-xl border-2 relative ${
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
                  
                  <div className={`group/competitor p-6 rounded-xl border-2 relative ${
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

        {/* Judge Statistics - Moved to Bottom */}
        <Card className="mt-8">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setShowJudgeStats(!showJudgeStats)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <span>Judge Statistics</span>
                <Badge variant="outline" className="text-xs">
                  {allJudges.length} judges
                </Badge>
              </div>
              {showJudgeStats ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          {showJudgeStats && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {allJudges.map(judge => {
                  const stats = getJudgeStats(judge);
                  return (
                    <button
                      key={judge}
                      onClick={() => navigate(`/results/scorecards/${encodeURIComponent(judge)}`)}
                      className="text-center p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-primary/30"
                    >
                      <div className="font-semibold text-sm text-muted-foreground">{judge}</div>
                      <div className="text-2xl font-bold text-primary">{stats.totalHeats}</div>
                      <div className="text-xs text-muted-foreground">Heats Judged</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default JudgeScorecardsResults;
