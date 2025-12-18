import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader2, AlertTriangle, Coffee, Users, ArrowLeftRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Match, TournamentParticipant, User, HeatSegment } from '@shared/schema';

interface CupPosition {
  cupCode: string;
  position: 'left' | 'right';
}

interface JudgeCompletionStatus {
  allComplete: boolean;
  judges: Array<{
    judgeId: number;
    judgeName: string;
    role: 'ESPRESSO' | 'CAPPUCCINO';
    completed: boolean;
  }>;
}

interface AdminCupPositionAssignmentProps {
  matchId: number;
  tournamentId: number;
  onSuccess?: () => void;
}

export default function AdminCupPositionAssignment({ 
  matchId, 
  tournamentId,
  onSuccess 
}: AdminCupPositionAssignmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [leftCupCode, setLeftCupCode] = useState<string>('');
  const [rightCupCode, setRightCupCode] = useState<string>('');

  // Fetch match details
  const { data: match } = useQuery<Match>({
    queryKey: [`/api/matches/${matchId}`],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      return response.json();
    },
  });

  // Fetch participants to get cup codes
  const { data: participants = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentId, 'participants'],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json();
    },
  });

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch segments for this match to know which timed segments actually exist
  const { data: segments = [] } = useQuery<HeatSegment[]>({
    queryKey: [`/api/matches/${matchId}/segments`],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/segments`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!matchId,
  });

  // Get competitor cup codes
  const competitor1 = match?.competitor1Id 
    ? participants.find(p => p.userId === match.competitor1Id)
    : null;
  const competitor2 = match?.competitor2Id 
    ? participants.find(p => p.userId === match.competitor2Id)
    : null;

  const cupCode1 = competitor1?.cupCode || '';
  const cupCode2 = competitor2?.cupCode || '';

  const competitor1User = competitor1 ? allUsers.find(u => u.id === competitor1.userId) : null;
  const competitor2User = competitor2 ? allUsers.find(u => u.id === competitor2.userId) : null;

  // Fetch judge completion status
  const { data: cappuccinoStatus } = useQuery<JudgeCompletionStatus>({
    queryKey: [`/api/matches/${matchId}/segments/CAPPUCCINO/judges-completion`],
    enabled: !!matchId,
  });

  const { data: espressoStatus } = useQuery<JudgeCompletionStatus>({
    queryKey: [`/api/matches/${matchId}/segments/ESPRESSO/judges-completion`],
    enabled: !!matchId,
  });

  // Fetch existing cup positions
  const { data: existingPositions = [] } = useQuery<Array<{ cupCode: string; position: 'left' | 'right' }>>({
    queryKey: [`/api/matches/${matchId}/cup-positions`],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/cup-positions`);
      if (!response.ok) return [];
      const positions = await response.json();
      return positions.map((p: any) => ({ cupCode: p.cupCode, position: p.position }));
    },
    enabled: !!matchId,
    onSuccess: (data) => {
      if (data.length === 2) {
        const left = data.find(p => p.position === 'left');
        const right = data.find(p => p.position === 'right');
        if (left) setLeftCupCode(left.cupCode);
        if (right) setRightCupCode(right.cupCode);
      }
    },
  });

  // Check if all judges have scored for the segments that actually exist in this heat
  const hasCappuccinoSegment = segments.some((segment) => segment.segment === 'CAPPUCCINO');
  const hasEspressoSegment = segments.some((segment) => segment.segment === 'ESPRESSO');
  const cappuccinoComplete = !hasCappuccinoSegment || cappuccinoStatus?.allComplete;
  const espressoComplete = !hasEspressoSegment || espressoStatus?.allComplete;
  const allJudgesScored = cappuccinoComplete && espressoComplete;
  const canAssign = allJudgesScored && cupCode1 && cupCode2;

  // Assign cup positions mutation
  const assignMutation = useMutation({
    mutationFn: async (positions: CupPosition[]) => {
      const response = await fetch(`/api/matches/${matchId}/cup-positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ positions }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign cup positions');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/cup-positions`] });
      toast({
        title: 'Cup Positions Assigned',
        description: 'Cup codes have been assigned to left/right positions successfully.',
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign cup positions',
        variant: 'destructive',
      });
    },
  });

  const handleAssign = () => {
    if (!leftCupCode || !rightCupCode) {
      toast({
        title: 'Validation Error',
        description: 'Please assign both left and right cup codes',
        variant: 'destructive',
      });
      return;
    }

    if (leftCupCode === rightCupCode) {
      toast({
        title: 'Validation Error',
        description: 'Left and right cup codes must be different',
        variant: 'destructive',
      });
      return;
    }

    assignMutation.mutate([
      { cupCode: leftCupCode, position: 'left' },
      { cupCode: rightCupCode, position: 'right' },
    ]);
  };

  const availableCupCodes = [cupCode1, cupCode2].filter(Boolean);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ArrowLeftRight className="h-4 w-4 sm:h-5 sm:w-5" />
          Assign Cup Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Judge Completion Status */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="text-sm font-semibold">Judge Completion Status</Label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">Cappuccino</span>
              </div>
              {cappuccinoStatus?.allComplete ? (
                <Badge variant="default" className="flex items-center gap-1 w-fit">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </Badge>
              ) : (
                <div className="space-y-1">
                  <Badge variant="outline" className="w-fit">
                    Pending
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {cappuccinoStatus?.judges.filter(j => !j.completed).length || 0} judge(s) remaining
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="h-4 w-4" />
                <span className="text-sm font-medium">Espresso</span>
              </div>
              {espressoStatus?.allComplete ? (
                <Badge variant="default" className="flex items-center gap-1 w-fit">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </Badge>
              ) : (
                <div className="space-y-1">
                  <Badge variant="outline" className="w-fit">
                    Pending
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {espressoStatus?.judges.filter(j => !j.completed).length || 0} judge(s) remaining
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning if judges haven't completed */}
        {!allJudgesScored && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cannot Assign Positions</AlertTitle>
            <AlertDescription>
              All judges must complete scoring for both Cappuccino and Espresso segments before assigning cup positions.
            </AlertDescription>
          </Alert>
        )}

        {/* Cup Code Assignment */}
        {canAssign && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-5 bg-muted rounded-lg">
              <Label className="text-sm font-semibold mb-3 block">Available Cup Codes</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-sm font-mono font-bold">{cupCode1}</div>
                  <div className="text-xs text-muted-foreground">{competitor1User?.name}</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold">{cupCode2}</div>
                  <div className="text-xs text-muted-foreground">{competitor2User?.name}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="left-cup-code" className="text-sm">Left Position</Label>
                <Select
                  value={leftCupCode}
                  onValueChange={setLeftCupCode}
                >
                  <SelectTrigger id="left-cup-code" className="w-full min-h-[44px]">
                    <SelectValue placeholder="Select cup code" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCupCodes.map(code => (
                      <SelectItem 
                        key={code} 
                        value={code}
                        disabled={code === rightCupCode}
                      >
                        {code} {code === cupCode1 ? `(${competitor1User?.name})` : `(${competitor2User?.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="right-cup-code" className="text-sm">Right Position</Label>
                <Select
                  value={rightCupCode}
                  onValueChange={setRightCupCode}
                >
                  <SelectTrigger id="right-cup-code" className="w-full min-h-[44px]">
                    <SelectValue placeholder="Select cup code" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCupCodes.map(code => (
                      <SelectItem 
                        key={code} 
                        value={code}
                        disabled={code === leftCupCode}
                      >
                        {code} {code === cupCode1 ? `(${competitor1User?.name})` : `(${competitor2User?.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {existingPositions.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Positions Already Assigned</AlertTitle>
                <AlertDescription>
                  Cup positions have been assigned. You can update them by selecting different positions.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleAssign}
              disabled={!leftCupCode || !rightCupCode || assignMutation.isPending}
              className="w-full min-h-[44px] text-base"
              size="lg"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : existingPositions.length > 0 ? (
                'Update Positions'
              ) : (
                'Assign Cup Positions'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

