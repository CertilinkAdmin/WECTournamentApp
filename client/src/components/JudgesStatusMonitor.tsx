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
  role: 'ESPRESSO' | 'CAPPUCCINO';
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
      role: 'ESPRESSO' | 'CAPPUCCINO';
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

  const getRoleLabel = (role: 'ESPRESSO' | 'CAPPUCCINO') => {
    switch (role) {
      case 'ESPRESSO':
        return 'Espresso Judge';
      case 'CAPPUCCINO':
        return 'Cappuccino Judge';
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
        <CardHeader className="pb-2 sm:pb-3">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto hover:bg-transparent min-h-[2.75rem] sm:min-h-[2.5rem]"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0">
                  <Gavel className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Judges Status Monitor</span>
                  {segmentType && (
                    <Badge variant="outline" className="ml-1 sm:ml-2 text-xs flex-shrink-0">
                      {segmentType}
                    </Badge>
                  )}
                </CardTitle>
                {!isOpen && summaryStatus && (
                  <div className="ml-1 sm:ml-2 flex-shrink-0">
                    {summaryStatus}
                  </div>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ml-2 ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 sm:space-y-4 pt-0 p-4 sm:p-6">
        {judgeStatuses.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No judges assigned to this match
          </div>
        ) : (
          judgeStatuses.map((judge) => {
            const overallStatus = getOverallStatus(judge);
            const statusColor = overallStatus === 'green' ? 'bg-green-500' : overallStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={judge.judgeId} className="space-y-2 p-2.5 sm:p-3 border rounded-lg min-h-[4rem]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${statusColor} flex-shrink-0`} />
                    <span className="font-medium text-xs sm:text-sm truncate">{judge.judgeName}</span>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {getRoleLabel(judge.role)}
                    </Badge>
                  </div>
                  {judge.completed && (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 mt-1 sm:mt-2">
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
          <div className="pt-2 sm:pt-3 border-t mt-2 sm:mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Overall Status:</span>
              <Badge variant={completionStatus.allComplete ? 'default' : 'secondary'} className="text-xs w-fit">
                {completionStatus.allComplete ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                    All Complete
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
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

