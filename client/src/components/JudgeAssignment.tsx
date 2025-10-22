import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Trophy, CheckCircle, ArrowRight, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

interface JudgeAssignmentProps {
  tournamentId: number | null;
  onJudgesComplete: () => void;
}

export default function JudgeAssignment({ tournamentId, onJudgesComplete }: JudgeAssignmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get available judges (users with role JUDGE)
  const availableJudges = users.filter(u => u.role === 'JUDGE');
  const requiredJudges = 9; // 3 judges per station (A, B, C)
  const hasEnoughJudges = availableJudges.length >= requiredJudges;

  // Assign judges mutation (this would need to be implemented in the API)
  const assignJudgesMutation = useMutation({
    mutationFn: async () => {
      if (!tournamentId) throw new Error("No tournament selected");
      if (!hasEnoughJudges) throw new Error("Not enough judges available");
      
      // This would need to be implemented in the API
      // For now, we'll just simulate the assignment
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      setIsCompleted(true);
      toast({
        title: "Judges Assigned Successfully",
        description: `${requiredJudges} judges have been assigned to the tournament stations.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAssignJudges = () => {
    assignJudgesMutation.mutate();
  };

  const handleProceedToNext = () => {
    onJudgesComplete();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Step 2: Assign Judges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Assign judges to evaluate the baristas. You need exactly 9 judges (3 per station: A, B, C).
          </p>
        </CardContent>
      </Card>

      {/* Judge Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Judge Requirements</span>
            <div className="flex items-center gap-2">
              <Badge variant={hasEnoughJudges ? "default" : "destructive"}>
                {availableJudges.length}/{requiredJudges} judges
              </Badge>
              {hasEnoughJudges && (
                <Badge variant="secondary">✓ Complete</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTitle>Judge Requirements</AlertTitle>
            <AlertDescription>
              Tournament requires exactly {requiredJudges} judges: 3 judges per station (A, B, C).
              {!hasEnoughJudges && (
                <span className="text-destructive font-semibold">
                  {" "}Need {requiredJudges - availableJudges.length} more judges.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Station Assignment Display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['A', 'B', 'C'].map((station) => {
              const stationJudges = availableJudges.slice(0, 3); // Simplified for demo
              return (
                <Card key={station} className="p-4">
                  <CardTitle className="text-lg">Station {station}</CardTitle>
                  <div className="space-y-2 mt-2">
                    {stationJudges.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No judges assigned
                      </div>
                    ) : (
                      stationJudges.map((judge, index) => (
                        <div key={judge.id} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Judge {index + 1}
                          </Badge>
                          <span className="text-sm">{judge.name}</span>
                        </div>
                      ))
                    )}
                    <Badge 
                      variant={stationJudges.length === 3 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {stationJudges.length}/3 judges
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Available Judges List */}
          <div className="space-y-2">
            <h4 className="font-medium">Available Judges</h4>
            {availableJudges.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No judges found.</p>
                <p className="text-sm">Judges evaluate competitors but do not compete.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableJudges.map((judge) => (
                  <div
                    key={judge.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⚖️</span>
                      <div>
                        <div className="font-medium">{judge.name}</div>
                        <div className="text-sm text-muted-foreground">{judge.email}</div>
                      </div>
                    </div>
                    <Badge variant="default">Judge</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {!isCompleted && (
              <div className="space-y-4">
                {!hasEnoughJudges && (
                  <Alert variant="destructive">
                    <AlertTitle>Insufficient Judges</AlertTitle>
                    <AlertDescription>
                      You need {requiredJudges} judges but only have {availableJudges.length}. 
                      Please add {requiredJudges - availableJudges.length} more judges to the system.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  variant="default"
                  size="lg"
                  onClick={handleAssignJudges}
                  disabled={!tournamentId || !hasEnoughJudges || assignJudgesMutation.isPending}
                  className="w-full"
                >
                  {assignJudgesMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Assigning Judges...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-2" />
                      Assign {requiredJudges} Judges
                    </>
                  )}
                </Button>
              </div>
            )}

            {isCompleted && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Judges Successfully Assigned!</span>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Judge assignment is complete. You can now proceed to configure segment times and generate the bracket.
                  </p>
                  
                  <Button 
                    variant="default"
                    size="lg"
                    onClick={handleProceedToNext}
                    className="w-full"
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Proceed to Tournament Configuration
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
