import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Users, CheckCircle, ArrowRight, Loader2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, TournamentParticipant } from '@shared/schema';

interface BaristaUploadProps {
  tournamentId: number | null;
  onBaristasComplete: () => void;
}

export default function BaristaUpload({ tournamentId, onBaristasComplete }: BaristaUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch users and competitors
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: competitors = [] } = useQuery<TournamentParticipant[]>({
    queryKey: ['/api/tournaments', tournamentId, 'participants'],
    enabled: !!tournamentId,
  });

  // Get available baristas (users with role BARISTA)
  const availableBaristas = users.filter(u => u.role === 'BARISTA');
  const registeredBaristas = competitors; // API already filters to baristas only

  // Add all baristas mutation
  const addAllBaristasMutation = useMutation({
    mutationFn: async () => {
      if (!tournamentId) throw new Error("No tournament selected");
      
      // Add all available baristas as participants
      const promises = availableBaristas.map(barista => 
        fetch(`/api/tournaments/${tournamentId}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: barista.id, seed: 0 })
        })
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'participants'] });
      setIsCompleted(true);
      toast({
        title: "Baristas Added Successfully",
        description: `${availableBaristas.length} baristas have been added to the tournament.`,
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

  const handleAddAllBaristas = () => {
    addAllBaristasMutation.mutate();
  };

  const handleProceedToJudges = () => {
    onBaristasComplete();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Step 1: Upload Baristas (Competitors)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Add baristas who will compete in the tournament. These are the competitors who will be matched against each other.
          </p>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Barista Registration Status</span>
            <Badge variant={registeredBaristas.length > 0 ? "default" : "secondary"}>
              {registeredBaristas.length} baristas registered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registeredBaristas.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No baristas registered yet.</p>
              <p className="text-sm">Add baristas to start the tournament setup.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 font-medium">
                  ✅ {registeredBaristas.length} baristas (competitors) registered with automatic bye handling.
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Bracket will be generated with byes for any odd numbers. No limit on number of baristas.
                </p>
              </div>
              
              {/* Show registered baristas */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {registeredBaristas.map((participant) => {
                  const barista = users.find(u => u.id === participant.userId);
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          #{participant.seed}
                        </Badge>
                        <span className="font-medium">
                          {barista?.name || 'Unknown'}
                        </span>
                      </div>
                      <Badge variant="secondary">Barista</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {registeredBaristas.length === 0 && (
              <div className="space-y-4">
                <Alert>
                  <AlertTitle>Available Baristas</AlertTitle>
                  <AlertDescription>
                    {availableBaristas.length} baristas are available to be added to the tournament.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  variant="default"
                  size="lg"
                  onClick={handleAddAllBaristas}
                  disabled={!tournamentId || availableBaristas.length === 0 || addAllBaristasMutation.isPending}
                  className="w-full"
                >
                  {addAllBaristasMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Adding Baristas...
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5 mr-2" />
                      Add All Baristas ({availableBaristas.length})
                    </>
                  )}
                </Button>
              </div>
            )}

            {registeredBaristas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Baristas Successfully Added!</span>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Barista registration is complete. You can now proceed to assign judges.
                  </p>
                  
                  <Button 
                    variant="default"
                    size="lg"
                    onClick={handleProceedToJudges}
                    className="w-full"
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Proceed to Judge Assignment
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
