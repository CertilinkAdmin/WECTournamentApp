import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Trophy, Users, Shuffle, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DraggableCompetitor from './DraggableCompetitor';
import DroppableBracketPosition from './DroppableBracketPosition';
import type { User, Match, Station } from '@shared/schema';

interface BracketPosition {
  heatNumber: number;
  station: string;
  competitor1?: User | null;
  competitor2?: User | null;
}

interface BracketBuilderProps {
  tournamentId: number | null;
  onBracketGenerated?: () => void;
}

export default function BracketBuilder({ tournamentId, onBracketGenerated }: BracketBuilderProps) {
  const { toast } = useToast();
  const [activeCompetitor, setActiveCompetitor] = useState<User | null>(null);
  const [bracketPositions, setBracketPositions] = useState<BracketPosition[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<User[]>([]);

  // Fetch tournaments to get current one
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournamentId = tournamentId || tournaments[0]?.id || 1;

  // Fetch barista participants
  const { data: participants = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments', currentTournamentId, 'participants'],
    enabled: !!currentTournamentId,
  });

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Get barista users
  const baristaUsers = users.filter(user => user.role === 'BARISTA');

  // Initialize bracket positions
  useEffect(() => {
    if (stations.length > 0 && !bracketPositions.length) {
      const positions: BracketPosition[] = [];
      let heatNumber = 1;
      
      // Create initial bracket positions for Round 1
      const totalCompetitors = baristaUsers.length;
      const matchesNeeded = Math.ceil(totalCompetitors / 2);
      
      // Distribute matches across stations
      const matchesPerStation = Math.ceil(matchesNeeded / 3);
      
      for (let i = 0; i < matchesNeeded; i++) {
        const stationIndex = Math.floor(i / matchesPerStation);
        const station = stations[stationIndex]?.name || 'A';
        
        positions.push({
          heatNumber: heatNumber++,
          station,
          competitor1: null,
          competitor2: null,
        });
      }
      
      setBracketPositions(positions);
    }
  }, [stations, baristaUsers.length]);

  // Generate bracket mutation
  const generateBracketMutation = useMutation({
    mutationFn: async () => {
      if (!currentTournamentId) throw new Error("Tournament ID is missing");
      
      const response = await fetch(`/api/tournaments/${currentTournamentId}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate bracket');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bracket Generated",
        description: "Tournament bracket has been created successfully.",
      });
      onBracketGenerated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'competitor') {
      setActiveCompetitor(active.data.current.competitor);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCompetitor(null);

    if (!over) return;

    const competitor = active.data.current?.competitor;
    const dropData = over.data.current;

    if (competitor && dropData?.type === 'bracket-position') {
      const { heatNumber, position } = dropData;
      
      setBracketPositions(prev => 
        prev.map(pos => 
          pos.heatNumber === heatNumber 
            ? { ...pos, [position]: competitor }
            : pos
        )
      );

      toast({
        title: "Competitor Placed",
        description: `${competitor.name} assigned to Heat ${heatNumber}`,
      });
    }
  };

  const handleRemoveCompetitor = (heatNumber: number, position: 'competitor1' | 'competitor2') => {
    setBracketPositions(prev => 
      prev.map(pos => 
        pos.heatNumber === heatNumber 
          ? { ...pos, [position]: null }
          : pos
      )
    );
  };

  const handleAutoFill = () => {
    const availableCompetitors = baristaUsers.filter(
      user => !bracketPositions.some(pos => 
        pos.competitor1?.id === user.id || pos.competitor2?.id === user.id
      )
    );

    const newPositions = [...bracketPositions];
    let competitorIndex = 0;

    for (const position of newPositions) {
      if (!position.competitor1 && availableCompetitors[competitorIndex]) {
        position.competitor1 = availableCompetitors[competitorIndex++];
      }
      if (!position.competitor2 && availableCompetitors[competitorIndex]) {
        position.competitor2 = availableCompetitors[competitorIndex++];
      }
    }

    setBracketPositions(newPositions);
    toast({
      title: "Auto-Fill Complete",
      description: "Remaining competitors have been automatically assigned.",
    });
  };

  const handleClearBracket = () => {
    setBracketPositions(prev => 
      prev.map(pos => ({
        ...pos,
        competitor1: null,
        competitor2: null,
      }))
    );
    toast({
      title: "Bracket Cleared",
      description: "All competitor assignments have been removed.",
    });
  };

  const handleSaveBracket = () => {
    // This would save the bracket configuration
    // For now, we'll use the existing generate bracket API
    generateBracketMutation.mutate();
  };

  const getUnassignedCompetitors = () => {
    const assignedIds = new Set(
      bracketPositions.flatMap(pos => [
        pos.competitor1?.id,
        pos.competitor2?.id
      ]).filter(Boolean)
    );
    
    return baristaUsers.filter(user => !assignedIds.has(user.id));
  };

  const getCompletionStats = () => {
    const totalPositions = bracketPositions.length * 2;
    const filledPositions = bracketPositions.reduce(
      (count, pos) => count + (pos.competitor1 ? 1 : 0) + (pos.competitor2 ? 1 : 0),
      0
    );
    
    return { filled: filledPositions, total: totalPositions };
  };

  const stats = getCompletionStats();
  const unassignedCompetitors = getUnassignedCompetitors();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Bracket Builder
            </span>
            <Badge variant="secondary">
              {stats.filled}/{stats.total} positions filled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Drag and drop competitors into bracket positions. Each heat needs 2 competitors.
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleAutoFill}
              disabled={unassignedCompetitors.length === 0}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Auto-Fill Remaining ({unassignedCompetitors.length})
            </Button>
            <Button
              variant="outline"
              onClick={handleClearBracket}
              disabled={stats.filled === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              onClick={handleSaveBracket}
              disabled={stats.filled < 2 || generateBracketMutation.isPending}
              className="ml-auto"
            >
              {generateBracketMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Generate Bracket
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Competitors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Competitors ({unassignedCompetitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unassignedCompetitors.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All competitors have been assigned</p>
                </div>
              ) : (
                unassignedCompetitors.map(competitor => (
                  <DraggableCompetitor
                    key={competitor.id}
                    competitor={competitor}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bracket Positions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Bracket Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bracketPositions.map(position => (
                  <div key={position.heatNumber} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Heat {position.heatNumber}</Badge>
                      <Badge className={
                        position.station === 'A' ? 'bg-primary' :
                        position.station === 'B' ? 'bg-chart-3' :
                        'bg-chart-1'
                      }>
                        Station {position.station}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <DroppableBracketPosition
                        position="competitor1"
                        heatNumber={position.heatNumber}
                        station={position.station}
                        competitor={position.competitor1}
                        onRemove={() => handleRemoveCompetitor(position.heatNumber, 'competitor1')}
                      />
                      <DroppableBracketPosition
                        position="competitor2"
                        heatNumber={position.heatNumber}
                        station={position.station}
                        competitor={position.competitor2}
                        onRemove={() => handleRemoveCompetitor(position.heatNumber, 'competitor2')}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <DragOverlay>
                {activeCompetitor ? (
                  <DraggableCompetitor competitor={activeCompetitor} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      {stats.filled > 0 && (
        <Alert>
          <AlertTitle>Bracket Status</AlertTitle>
          <AlertDescription>
            {stats.filled} of {stats.total} positions filled. 
            {stats.filled === stats.total ? ' Bracket is complete and ready to generate!' : 
             ` ${stats.total - stats.filled} positions remaining.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
