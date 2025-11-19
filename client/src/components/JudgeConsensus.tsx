import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Users, TrendingUp } from 'lucide-react';

interface Judge {
  judgeName: string;
  visualLatteArt: 'left' | 'right' | null;
  taste: 'left' | 'right' | null;
  tactile: 'left' | 'right' | null;
  flavour: 'left' | 'right' | null;
  overall: 'left' | 'right' | null;
}

interface JudgeConsensusProps {
  judges: Judge[];
}

interface CategoryConsensus {
  category: string;
  leftVotes: number;
  rightVotes: number;
  majority: 'left' | 'right' | 'tie';
  majorityCount: number;
  totalJudges: number;
  judgeVotes: Array<{
    judgeName: string;
    vote: 'left' | 'right' | null;
    isInMajority: boolean;
  }>;
}

export default function JudgeConsensus({ judges }: JudgeConsensusProps) {
  const consensus = useMemo(() => {
    // Only show consensus for Visual Latte Art
    const categories: CategoryConsensus[] = [
      {
        category: 'Visual Latte Art',
        leftVotes: judges.filter(j => j.visualLatteArt === 'left').length,
        rightVotes: judges.filter(j => j.visualLatteArt === 'right').length,
        majority: 'left',
        majorityCount: 0,
        totalJudges: judges.length,
        judgeVotes: judges.map(j => ({
          judgeName: j.judgeName,
          vote: j.visualLatteArt,
          isInMajority: false,
        })),
      },
    ];

    // Calculate majority and mark judges
    return categories.map(cat => {
      let majority: 'left' | 'right' | 'tie' = 'tie';
      let majorityCount = 0;

      if (cat.leftVotes > cat.rightVotes) {
        majority = 'left';
        majorityCount = cat.leftVotes;
      } else if (cat.rightVotes > cat.leftVotes) {
        majority = 'right';
        majorityCount = cat.rightVotes;
      } else {
        majority = 'tie';
        majorityCount = cat.leftVotes; // Equal votes
      }

      // Mark which judges are in majority
      const judgeVotes = cat.judgeVotes.map(jv => ({
        ...jv,
        isInMajority: jv.vote === majority || (majority === 'tie' && jv.vote !== null),
      }));

      return {
        ...cat,
        majority,
        majorityCount,
        judgeVotes,
      };
    });
  }, [judges]);

  if (judges.length === 0) return null;

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Judge Consensus</span>
          <Badge variant="outline" className="ml-auto">
            {judges.length} judges
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {consensus.map((cat) => (
          <div key={cat.category} className="space-y-2">
            {/* Category Header with Vote Counts */}
            <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-primary text-sm">{cat.category}</span>
                {cat.majority !== 'tie' && (
                  <Badge 
                    variant="outline"
                    className="text-xs"
                  >
                    Majority: {cat.majority === 'left' ? 'Left' : 'Right'} ({cat.majorityCount}/{cat.totalJudges})
                  </Badge>
                )}
                {cat.majority === 'tie' && (
                  <Badge variant="outline" className="text-xs">
                    Tie ({cat.leftVotes}-{cat.rightVotes})
                  </Badge>
                )}
              </div>
            </div>

            {/* Judge Votes - Compact Layout */}
            <div className="flex flex-wrap gap-2">
              {cat.judgeVotes.map((jv) => (
                <div
                  key={`${cat.category}-${jv.judgeName}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-sm transition-all ${
                    jv.isInMajority
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700'
                  }`}
                >
                  <span className="font-medium text-xs">{jv.judgeName}</span>
                  {jv.vote ? (
                    jv.isInMajority ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <span className={`text-xs font-semibold ${
                        jv.vote === 'left' ? 'text-red-600 dark:text-red-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {jv.vote === 'left' ? 'L' : 'R'}
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

