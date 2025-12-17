import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Gavel, CheckCircle2, Clock, XCircle, ChevronDown } from 'lucide-react';
import type { HeatJudge, JudgeDetailedScore, User } from '@shared/schema';

interface JudgesStatusMonitorProps {
  matchId: number | null;
  // Kept for API compatibility / labelling, but completion is always based on all segments
  segmentId?: string;
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

interface GlobalLockStatus {
  isLocked: boolean;
  allSegmentsEnded: boolean;
  allJudgesSubmitted: boolean;
  missingSubmissions: Array<{
    judgeName: string;
    role: 'ESPRESSO' | 'CAPPUCCINO';
    // e.g. ['Latte Art', 'Cappuccino Sensory'] for an espresso judge who still owes both
    missing: string[];
  }>;
}

export default function JudgesStatusMonitor({ matchId, segmentId }: JudgesStatusMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch global judge/segment completion status (single source of truth)
  const { data: globalStatus, isLoading: globalLoading } = useQuery<GlobalLockStatus | null>({
    queryKey: [`/api/matches/${matchId}/global-lock-status`],
    queryFn: async () => {
      if (!matchId) return null;
      const res = await fetch(`/api/matches/${matchId}/global-lock-status`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!matchId,
    refetchInterval: 5000,
  });

  // Fetch detailed judge scorecards for this match
  const { data: detailedScores = [], isLoading: scoresLoading } = useQuery<JudgeDetailedScore[]>({
    queryKey: [`/api/matches/${matchId}/detailed-scores`],
    queryFn: async () => {
      if (!matchId) return [];
      const res = await fetch(`/api/matches/${matchId}/detailed-scores`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!matchId,
    refetchInterval: 5000,
  });

  // Fetch all judges on this match
  const { data: matchJudges = [], isLoading: judgesLoading } = useQuery<HeatJudge[]>({
    queryKey: [`/api/matches/${matchId}/judges`],
    queryFn: async () => {
      if (!matchId) return [];
      const res = await fetch(`/api/matches/${matchId}/judges`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!matchId,
  });

  // Fetch all users to resolve judge names
  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const judgeStatuses: JudgeStatus[] = useMemo(() => {
    if (!matchId || !matchJudges.length || !allUsers.length) return [];

    const missingMap = new Map<string, string[]>();
    globalStatus?.missingSubmissions?.forEach((m) => {
      const key = `${m.judgeName}|${m.role}`;
      missingMap.set(key, m.missing);
    });

    return matchJudges.map((judge) => {
      const user = allUsers.find((u) => u.id === judge.judgeId);
      const judgeName = user?.name || `Judge ${judge.id}`;

      const scoresForJudge = detailedScores.filter(
        (s) => s.matchId === matchId && s.judgeName === judgeName
      );

      const latteArtScore = scoresForJudge.find(
        (s) => s.visualLatteArt === 'left' || s.visualLatteArt === 'right'
      );

      const cappuccinoScore = scoresForJudge.find((s) => s.sensoryBeverage === 'Cappuccino');
      const espressoScore = scoresForJudge.find((s) => s.sensoryBeverage === 'Espresso');

      let visualLatteArt: 'complete' | 'incomplete' | undefined;
      let taste: 'complete' | 'incomplete';
      let tactile: 'complete' | 'incomplete';
      let flavour: 'complete' | 'incomplete';
      let overall: 'complete' | 'incomplete';

      if (judge.role === 'CAPPUCCINO') {
        // Cappuccino judge: latte art + cappuccino sensory
        const latteDone = latteArtScore && (latteArtScore.visualLatteArt === 'left' || latteArtScore.visualLatteArt === 'right');
        visualLatteArt = latteDone ? 'complete' : 'incomplete';

        const s = cappuccinoScore;
        const tasteDone = !!s && (s.taste === 'left' || s.taste === 'right');
        const tactileDone = !!s && (s.tactile === 'left' || s.tactile === 'right');
        const flavourDone = !!s && (s.flavour === 'left' || s.flavour === 'right');
        const overallDone = !!s && (s.overall === 'left' || s.overall === 'right');

        taste = tasteDone ? 'complete' : 'incomplete';
        tactile = tactileDone ? 'complete' : 'incomplete';
        flavour = flavourDone ? 'complete' : 'incomplete';
        overall = overallDone ? 'complete' : 'incomplete';
      } else {
        // Espresso judges: only espresso sensory
        visualLatteArt = undefined;

        const s = espressoScore;
        const tasteDone = !!s && (s.taste === 'left' || s.taste === 'right');
        const tactileDone = !!s && (s.tactile === 'left' || s.tactile === 'right');
        const flavourDone = !!s && (s.flavour === 'left' || s.flavour === 'right');
        const overallDone = !!s && (s.overall === 'left' || s.overall === 'right');

        taste = tasteDone ? 'complete' : 'incomplete';
        tactile = tactileDone ? 'complete' : 'incomplete';
        flavour = flavourDone ? 'complete' : 'incomplete';
        overall = overallDone ? 'complete' : 'incomplete';
      }

      const missing = missingMap.get(`${judgeName}|${judge.role}`) ?? [];
      const completed = missing.length === 0;

      return {
        judgeId: judge.judgeId,
        judgeName,
        role: judge.role,
        completed,
        categories: {
          ...(visualLatteArt ? { visualLatteArt } : {}),
          taste,
          tactile,
          flavour,
          overall,
        },
      };
    });
  }, [matchId, matchJudges, detailedScores, allUsers, globalStatus]);

  const isLoading = globalLoading || scoresLoading || judgesLoading || usersLoading;

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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
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
    const completedCount = Object.values(judge.categories).filter((c) => c === 'complete').length;

    if (completedCount === categoryCount) return 'green';
    if (completedCount > 0) return 'yellow';
    return 'red';
  };

  const getRoleLabel = (role: 'ESPRESSO' | 'CAPPUCCINO') => {
    switch (role) {
      case 'ESPRESSO':
        return 'Espresso Judge';
      case 'CAPPUCCINO':
        return 'Cappuccino';
      default:
        return role;
    }
  };

  const allComplete = judgeStatuses.length > 0 && judgeStatuses.every((j) => j.completed);
  const completedCount = judgeStatuses.filter((j) => j.completed).length;

  const summaryStatus =
    judgeStatuses.length > 0 ? (
      allComplete ? (
        <Badge variant="default" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          All Complete
        </Badge>
      ) : (
        <Badge className="text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {completedCount} / {judgeStatuses.length} Complete
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
                  <span className="truncate">Judges Status</span>
                  <Badge variant="outline" className="ml-1 sm:ml-2 text-xs flex-shrink-0">
                    All Judges
                  </Badge>
                </CardTitle>
                {!isOpen && summaryStatus && (
                  <div className="ml-1 sm:ml-2 flex-shrink-0">{summaryStatus}</div>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ml-2 ${
                  isOpen ? 'rotate-180' : ''
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
                const statusColor =
                  overallStatus === 'green'
                    ? 'bg-green-500'
                    : overallStatus === 'yellow'
                    ? 'bg-yellow-500'
                    : 'bg-red-500';

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
                      {typeof judge.categories.visualLatteArt !== 'undefined' && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(judge.categories.visualLatteArt!)}`} />
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
                        {judge.categories.overall === 'complete' ? (
                          <img
                            src="/icons/overall trophy.png"
                            alt="Overall winner trophy"
                            className="w-4 h-4 rounded-sm"
                          />
                        ) : (
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(
                              judge.categories.overall
                            )}`}
                          />
                        )}
                        <span className="text-muted-foreground font-medium">Overall</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {globalStatus && (
              <div className="pt-2 sm:pt-3 border-t mt-2 sm:mt-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Heat status</span>
                  <Badge variant={globalStatus.allJudgesSubmitted && globalStatus.allSegmentsEnded ? 'default' : 'secondary'}>
                    {globalStatus.allSegmentsEnded
                      ? globalStatus.allJudgesSubmitted
                        ? 'All segments + scores complete'
                        : 'Waiting for judges'
                      : 'Segments in progress'}
                  </Badge>
                </div>
                {!globalStatus.allJudgesSubmitted && globalStatus.missingSubmissions.length > 0 && (
                  <div className="flex items-start gap-2 text-red-600">
                    <Clock className="h-3 w-3 mt-0.5" />
                    <div>
                      <div className="font-semibold">Pending scores:</div>
                      <ul className="list-disc list-inside">
                        {globalStatus.missingSubmissions.map((m) => (
                          <li key={`${m.judgeName}-${m.role}`}>
                            {m.judgeName} ({m.role}) – {m.missing.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}


