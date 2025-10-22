import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, Users, Shuffle, Save, RotateCcw, Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DraggableCompetitor from './DraggableCompetitor';
import DroppableBracketPosition from './DroppableBracketPosition';
import { WEC25_COMPETITORS, WEC25_BRACKET_POSITIONS } from './WEC25BracketData';
import type { User, Match, Station } from '@shared/schema';

interface BracketPosition {
  heatNumber: number;
  station: string;
  competitor1?: User | null;
  competitor2?: User | null;
}

interface WEC25BracketProps {
  tournamentId: number | null;
  onBracketGenerated?: () => void;
}

export default function WEC25Bracket({ tournamentId, onBracketGenerated }: WEC25BracketProps) {
  const { toast } = useToast();
  const [activeCompetitor, setActiveCompetitor] = useState<User | null>(null);
  const [bracketPositions, setBracketPositions] = useState<BracketPosition[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<User[]>([]);

  // Fetch tournaments to get current one
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournamentId = tournamentId || tournaments[0]?.id || 1;

  // Fetch stations
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Convert WEC25 data to User objects
  const wec25Users: User[] = WEC25_COMPETITORS.map(comp => ({
    id: comp.id,
    name: comp.name,
    email: comp.email,
    role: comp.role,
    createdAt: new Date(),
  }));

  // Initialize bracket positions with WEC25 data
  useEffect(() => {
    if (stations.length > 0 && !bracketPositions.length) {
      const positions: BracketPosition[] = [];
      
      WEC25_BRACKET_POSITIONS.forEach(pos => {
        const competitor1 = pos.competitor1 === "BUY" ? null : 
          wec25Users.find(u => u.name === pos.competitor1) || null;
        const competitor2 = pos.competitor2 === "BUY" ? null : 
          wec25Users.find(u => u.name === pos.competitor2) || null;
        
        positions.push({
          heatNumber: pos.heatNumber,
          station: pos.station,
          competitor1,
          competitor2,
        });
      });
      
      setBracketPositions(positions);
    }
  }, [stations]);

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
        title: "WEC25 Bracket Generated",
        description: "Tournament bracket has been created with WEC25 competitors.",
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

  const handleResetToWEC25 = () => {
    const positions: BracketPosition[] = [];
    
    WEC25_BRACKET_POSITIONS.forEach(pos => {
      const competitor1 = pos.competitor1 === "BUY" ? null : 
        wec25Users.find(u => u.name === pos.competitor1) || null;
      const competitor2 = pos.competitor2 === "BUY" ? null : 
        wec25Users.find(u => u.name === pos.competitor2) || null;
      
      positions.push({
        heatNumber: pos.heatNumber,
        station: pos.station,
        competitor1,
        competitor2,
      });
    });
    
    setBracketPositions(positions);
    toast({
      title: "WEC25 Bracket Reset",
      description: "Bracket has been reset to original WEC25 positions.",
    });
  };

  const handleSaveBracket = () => {
    generateBracketMutation.mutate();
  };

  const getUnassignedCompetitors = () => {
    const assignedIds = new Set(
      bracketPositions.flatMap(pos => [
        pos.competitor1?.id,
        pos.competitor2?.id
      ]).filter(Boolean)
    );
    
    return wec25Users.filter(user => !assignedIds.has(user.id));
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
              WEC25 Tournament Bracket
            </span>
            <Badge variant="secondary">
              {stats.filled}/{stats.total} positions filled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Drag and drop WEC25 competitors into bracket positions. Each heat needs 2 competitors.
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleResetToWEC25}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to WEC25 Positions
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
                  Generate WEC25 Bracket
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
              WEC25 Competitors ({unassignedCompetitors.length})
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
              WEC25 Bracket Positions
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
          <AlertTitle>WEC25 Bracket Status</AlertTitle>
          <AlertDescription>
            {stats.filled} of {stats.total} positions filled. 
            {stats.filled === stats.total ? ' WEC25 bracket is complete and ready to generate!' : 
             ` ${stats.total - stats.filled} positions remaining.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
