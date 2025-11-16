import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shuffle, Loader2, Check, X, BarChart3, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Using CSS animations instead of framer-motion for broader compatibility

interface Participant {
  id: number;
  userId: number;
  seed: number;
  name?: string;
}

interface RandomizeSeedsProps {
  tournamentId: number | null;
  participants: Participant[];
  onRandomized?: () => void;
}

export default function RandomizeSeeds({ tournamentId, participants, onRandomized }: RandomizeSeedsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isShuffling, setIsShuffling] = useState(false);
  const [previewSeeds, setPreviewSeeds] = useState<Participant[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [shuffleCount, setShuffleCount] = useState(0);

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Calculate randomization statistics
  const calculateStats = (original: Participant[], shuffled: Participant[]) => {
    const originalSeeds = original.map(p => p.seed);
    const shuffledSeeds = shuffled.map(p => p.seed);
    
    // Calculate entropy (measure of randomness)
    const positionChanges = original.reduce((acc, p, idx) => {
      const newIdx = shuffled.findIndex(s => s.id === p.id);
      return acc + Math.abs(idx - newIdx);
    }, 0);
    
    const maxPossibleChanges = original.length * (original.length - 1) / 2;
    const entropy = (positionChanges / maxPossibleChanges) * 100;
    
    // Count how many stayed in same position
    const samePosition = original.filter((p, idx) => {
      const newIdx = shuffled.findIndex(s => s.id === p.id);
      return idx === newIdx;
    }).length;
    
    return {
      entropy: Math.round(entropy),
      positionChanges,
      samePosition,
      totalParticipants: original.length,
    };
  };

  const handlePreview = () => {
    setIsShuffling(true);
    setShuffleCount(prev => prev + 1);
    
    // Animate shuffle
    setTimeout(() => {
      const shuffled = shuffleArray(participants).map((p, index) => ({
        ...p,
        seed: index + 1
      }));
      setPreviewSeeds(shuffled);
      setIsShuffling(false);
      setShowPreview(true);
    }, 1500);
  };

  const randomizeMutation = useMutation({
    mutationFn: async (newSeeds: Participant[]) => {
      if (!tournamentId) throw new Error("No tournament selected");
      
      // Update seeds in database
      const promises = newSeeds.map(participant =>
        fetch(`/api/tournaments/${tournamentId}/participants`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            participantId: participant.id,
            seed: participant.seed 
          })
        }).then(res => {
          if (!res.ok) throw new Error('Failed to update seed');
          return res.json();
        })
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'participants'] });
      toast({
        title: "Seeds Randomized",
        description: "Competitor seeds have been shuffled successfully!",
      });
      setShowPreview(false);
      setPreviewSeeds(null);
      onRandomized?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Use the API endpoint - can accept specific seed assignments or randomize
  const randomizeSeedsMutation = useMutation({
    mutationFn: async (seedAssignments?: { participantId: number; seed: number }[]) => {
      if (!tournamentId) throw new Error("No tournament selected");
      const response = await fetch(`/api/tournaments/${tournamentId}/randomize-seeds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(seedAssignments ? { seedAssignments } : {}),
      });
      if (!response.ok) throw new Error('Failed to randomize seeds');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'participants'] });
      toast({
        title: "Seeds Randomized",
        description: "Competitor seeds have been shuffled successfully!",
      });
      setShowPreview(false);
      setPreviewSeeds(null);
      onRandomized?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleApply = () => {
    if (previewSeeds) {
      // Send specific seed assignments to match the preview
      const seedAssignments = previewSeeds.map(p => ({
        participantId: p.id,
        seed: p.seed
      }));
      randomizeSeedsMutation.mutate(seedAssignments);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPreviewSeeds(null);
  };

  const stats = previewSeeds ? calculateStats(participants, previewSeeds) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              <span>Randomize Seeds</span>
            </div>
            <Badge variant="secondary">{participants.length} competitors</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {participants.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              No competitors registered yet. Add competitors to randomize seeds.
            </div>
          ) : (
            <>
              {/* Current Seeds Display */}
              {!showPreview && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Current Seeds</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {participants.map((participant, idx) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 p-2 bg-muted rounded-md animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <Badge variant="outline" className="font-mono min-w-[3rem]">
                          #{participant.seed}
                        </Badge>
                        <span className="text-sm truncate">{participant.name || `Competitor ${participant.id}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Display */}
              {showPreview && previewSeeds && stats && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-semibold">Randomization Preview</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Entropy</div>
                          <div className="text-lg font-bold text-primary">{stats.entropy}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Position Changes</div>
                          <div className="text-lg font-bold">{stats.positionChanges}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Same Position</div>
                          <div className="text-lg font-bold">{stats.samePosition}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Shuffle #</div>
                          <div className="text-lg font-bold">{shuffleCount}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">New Seeds</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {previewSeeds.map((participant, idx) => {
                          const originalIdx = participants.findIndex(p => p.id === participant.id);
                          const originalSeed = participants[originalIdx]?.seed;
                          const seedChanged = originalSeed !== participant.seed;
                          
                          return (
                            <div
                              key={participant.id}
                              className={`flex items-center gap-2 p-2 rounded-md transition-all duration-300 ${
                                seedChanged ? 'bg-green-50 border border-green-200 animate-pulse' : 'bg-muted'
                              }`}
                              style={{ animationDelay: `${idx * 20}ms` }}
                            >
                              <Badge 
                                variant={seedChanged ? "default" : "outline"} 
                                className="font-mono min-w-[3rem]"
                              >
                                #{participant.seed}
                              </Badge>
                              <span className="text-sm truncate flex-1">{participant.name || `Competitor ${participant.id}`}</span>
                              {seedChanged && (
                                <span className="text-xs text-green-600 font-semibold animate-in fade-in">
                                  {originalSeed}→{participant.seed}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleApply}
                        disabled={randomizeSeedsMutation.isPending}
                        className="flex-1"
                      >
                        {randomizeSeedsMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Apply Randomization
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={randomizeSeedsMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handlePreview}
                        disabled={isShuffling}
                      >
                        {isShuffling ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Shuffling...
                          </>
                        ) : (
                          <>
                            <Shuffle className="h-4 w-4 mr-2" />
                            Reshuffle
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              {!showPreview && (
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreview}
                    disabled={isShuffling || participants.length === 0}
                    className="flex-1"
                    size="lg"
                  >
                    {isShuffling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Shuffling...
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-4 w-4 mr-2" />
                        Preview Randomization
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => randomizeSeedsMutation.mutate()}
                    disabled={randomizeSeedsMutation.isPending || participants.length === 0}
                  >
                    {randomizeSeedsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Randomizing...
                      </>
                    ) : (
                      <>
                        <Shuffle className="h-4 w-4 mr-2" />
                        Randomize Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

