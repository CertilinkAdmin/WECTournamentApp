import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Gavel, CheckCircle2, Clock, XCircle, ChevronDown } from 'lucide-react';
import type { Match, JudgeDetailedScore, HeatJudge } from '@shared/schema';

interface JudgesStatusMonitorProps {
  matchId: number | null;
  segmentType?: 'CAPPUCCINO' | 'ESPRESSO';
}

interface JudgeStatus {
  judgeId: number;
  judgeName: string;
  role: 'HEAD' | 'TECHNICAL' | 'SENSORY';
  completed: boolean;
  categories: {
    visualLatteArt?: 'complete' | 'incomplete';
    taste: 'complete' | 'incomplete';
    tactile: 'complete' | 'incomplete';
    flavour: 'complete' | 'incomplete';
    overall: 'complete' | 'incomplete';
  };
}

export default function JudgesStatusMonitor({ matchId, segmentType }: JudgesStatusMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch judge completion status
  const { data: completionStatus, isLoading } = useQuery<{
    allComplete: boolean;
    judges: Array<{
      judgeId: number;
      judgeName: string;
      role: 'HEAD' | 'TECHNICAL' | 'SENSORY';
      completed: boolean;
    }>;
  }>({
    queryKey: [`/api/matches/${matchId}/segments/${segmentType || 'CAPPUCCINO'}/judges-completion`],
    enabled: !!matchId && !!segmentType,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch detailed scores to get category-level status
  const { data: detailedScores = [] } = useQuery<JudgeDetailedScore[]>({
    queryKey: [`/api/matches/${matchId}/detailed-scores`],
    enabled: !!matchId,
    refetchInterval: 5000,
  });

  // Fetch match judges to get all assigned judges
  const { data: matchJudges = [] } = useQuery<HeatJudge[]>({
    queryKey: [`/api/matches/${matchId}/judges`],
    enabled: !!matchId,
  });

  // Calculate category-level status for each judge
  const judgeStatuses: JudgeStatus[] = React.useMemo(() => {
    if (!completionStatus || !detailedScores || !matchJudges) return [];

    const expectedBeverage = segmentType === 'CAPPUCCINO' ? 'Cappuccino' : 'Espresso';
    
    return matchJudges.map(judge => {
      const judgeCompletion = completionStatus.judges.find(j => j.judgeId === judge.judgeId);
      const judgeScore = detailedScores.find(
        score => score.judgeName === judgeCompletion?.judgeName && score.sensoryBeverage === expectedBeverage
      );

      const categories = {
        ...(segmentType === 'CAPPUCCINO' && {
          visualLatteArt: judgeScore?.visualLatteArt ? 'complete' as const : 'incomplete' as const,
        }),
        taste: judgeScore?.taste ? 'complete' as const : 'incomplete' as const,
        tactile: judgeScore?.tactile ? 'complete' as const : 'incomplete' as const,
        flavour: judgeScore?.flavour ? 'complete' as const : 'incomplete' as const,
        overall: judgeScore?.overall ? 'complete' as const : 'incomplete' as const,
      };

      return {
        judgeId: judge.judgeId,
        judgeName: judgeCompletion?.judgeName || `Judge ${judge.judgeId}`,
        role: judge.role,
        completed: judgeCompletion?.completed || false,
        categories: categories as any,
      };
    });
  }, [completionStatus, detailedScores, matchJudges, segmentType]);

  if (!matchId) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          No match selected
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: 'complete' | 'incomplete') => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'incomplete':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getOverallStatus = (judge: JudgeStatus): 'green' | 'yellow' | 'red' => {
    const categoryCount = Object.keys(judge.categories).length;
    const completedCount = Object.values(judge.categories).filter(c => c === 'complete').length;
    
    if (completedCount === categoryCount) return 'green';
    if (completedCount > 0) return 'yellow';
    return 'red';
  };

  const getRoleLabel = (role: 'HEAD' | 'TECHNICAL' | 'SENSORY') => {
    switch (role) {
      case 'HEAD':
        return 'Head Judge';
      case 'TECHNICAL':
        return 'Technical Judge';
      case 'SENSORY':
        return 'Sensory Judge';
      default:
        return role;
    }
  };

  // Calculate summary for collapsed state
  const summaryStatus = completionStatus ? (
    completionStatus.allComplete ? (
      <Badge variant="default" className="text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        All Complete
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {completionStatus.judges.filter(j => j.completed).length} / {completionStatus.judges.length} Complete
      </Badge>
    )
  ) : null;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Gavel className="h-4 w-4" />
                  Judges Status Monitor
                  {segmentType && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {segmentType}
                    </Badge>
                  )}
                </CardTitle>
                {!isOpen && summaryStatus && (
                  <div className="ml-2">
                    {summaryStatus}
                  </div>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
        {judgeStatuses.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No judges assigned to this match
          </div>
        ) : (
          judgeStatuses.map((judge) => {
            const overallStatus = getOverallStatus(judge);
            const statusColor = overallStatus === 'green' ? 'bg-green-500' : overallStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={judge.judgeId} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                    <span className="font-medium text-sm">{judge.judgeName}</span>
                    <Badge variant="outline" className="text-xs">
                      {getRoleLabel(judge.role)}
                    </Badge>
                  </div>
                  {judge.completed && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {segmentType === 'CAPPUCCINO' && judge.categories.visualLatteArt && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(judge.categories.visualLatteArt)}`} />
                      <span className="text-muted-foreground">Visual Art</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(judge.categories.taste)}`} />
                    <span className="text-muted-foreground">Taste</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(judge.categories.tactile)}`} />
                    <span className="text-muted-foreground">Tactile</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(judge.categories.flavour)}`} />
                    <span className="text-muted-foreground">Flavour</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(judge.categories.overall)}`} />
                    <span className="text-muted-foreground font-medium">Overall</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {completionStatus && (
          <div className="pt-2 border-t mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall Status:</span>
              <Badge variant={completionStatus.allComplete ? 'default' : 'secondary'}>
                {completionStatus.allComplete ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    All Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    In Progress
                  </span>
                )}
              </Badge>
            </div>
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

