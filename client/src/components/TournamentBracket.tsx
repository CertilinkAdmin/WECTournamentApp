import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/hooks/use-toast";
import type { Match, User, Station } from "@shared/schema";

interface BracketHeat {
  heatNumber: number;
  station: "A" | "B" | "C";
  competitor1?: string;
  competitor2?: string;
  winner?: string;
  nextHeat?: number;
  matchId?: number;
  status?: string;
  competitor1Name?: string;
  competitor2Name?: string;
  winnerName?: string;
}

interface SortableHeatProps {
  heat: BracketHeat;
  isSmall?: boolean;
  stationColors: Record<string, string>;
}

function SortableHeat({ heat, isSmall = false, stationColors }: SortableHeatProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: heat.heatNumber });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`hover-elevate cursor-grab active:cursor-grabbing ${isSmall ? "p-2" : "p-2.5"}`}
        data-testid={`bracket-heat-${heat.heatNumber}`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className={`${isSmall ? "text-sm" : "text-base"} font-heading font-bold`}>
              {heat.heatNumber}
            </span>
            <Badge className={`${stationColors[heat.station]} text-white text-[10px] px-1 py-0.5`}>
              {heat.station}
            </Badge>
          </div>
          <div className="space-y-0.5">
            <div className={`text-xs truncate ${heat.winner === heat.competitor1 ? "font-bold" : ""}`}>
              {heat.competitor1 || "—"}
            </div>
            <div className="text-[10px] text-muted-foreground text-center">vs</div>
            <div className={`text-xs truncate ${heat.winner === heat.competitor2 ? "font-bold" : ""}`}>
              {heat.competitor2 || "—"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function TournamentBracket() {
  const { toast } = useToast();
  
  // Fetch tournaments to get current one
  const { data: tournaments = [] } = useQuery<any[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const currentTournamentId = tournaments[0]?.id || 1;

  // Fetch all matches for the tournament
  const { data: allMatches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: [`/api/tournaments/${currentTournamentId}/matches`],
    enabled: !!currentTournamentId,
  });

  // Fetch users for competitor names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch stations for station names
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  // Get competitor name by ID
  const getCompetitorName = (userId: number | null) => {
    if (!userId) return "BYE";
    const user = users.find(u => u.id === userId);
    return user?.name || `User ${userId}`;
  };

  // Get station name by ID
  const getStationName = (stationId: number | null) => {
    if (!stationId) return "A";
    const station = stations.find(s => s.id === stationId);
    return station?.name || "A";
  };

  // Process matches into bracket structure
  const processBracketData = () => {
    const round1: BracketHeat[] = [];
    const round2: BracketHeat[] = [];
    const round3: BracketHeat[] = [];
    const round4: BracketHeat[] = [];

    // Group matches by round
    const matchesByRound = allMatches.reduce((acc, match) => {
      if (!acc[match.round]) acc[match.round] = [];
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    // Process Round 1
    if (matchesByRound[1]) {
      matchesByRound[1].forEach(match => {
        round1.push({
          heatNumber: match.heatNumber,
          station: getStationName(match.stationId) as "A" | "B" | "C",
          competitor1: match.competitor1Id?.toString(),
          competitor2: match.competitor2Id?.toString(),
          winner: match.winnerId?.toString(),
          competitor1Name: getCompetitorName(match.competitor1Id),
          competitor2Name: getCompetitorName(match.competitor2Id),
          winnerName: getCompetitorName(match.winnerId),
          matchId: match.id,
          status: match.status,
          nextHeat: match.heatNumber + 16 // Approximate next heat calculation
        });
      });
    }

    // Process Round 2
    if (matchesByRound[2]) {
      matchesByRound[2].forEach(match => {
        round2.push({
          heatNumber: match.heatNumber,
          station: getStationName(match.stationId) as "A" | "B" | "C",
          competitor1: `H${match.heatNumber - 16}`, // Reference to previous round
          competitor2: `H${match.heatNumber - 15}`,
          winner: match.winnerId?.toString(),
          competitor1Name: getCompetitorName(match.competitor1Id),
          competitor2Name: getCompetitorName(match.competitor2Id),
          winnerName: getCompetitorName(match.winnerId),
          matchId: match.id,
          status: match.status,
          nextHeat: match.heatNumber + 8
        });
      });
    }

    // Process Round 3
    if (matchesByRound[3]) {
      matchesByRound[3].forEach(match => {
        round3.push({
          heatNumber: match.heatNumber,
          station: getStationName(match.stationId) as "A" | "B" | "C",
          competitor1: `H${match.heatNumber - 8}`,
          competitor2: `H${match.heatNumber - 7}`,
          winner: match.winnerId?.toString(),
          competitor1Name: getCompetitorName(match.competitor1Id),
          competitor2Name: getCompetitorName(match.competitor2Id),
          winnerName: getCompetitorName(match.winnerId),
          matchId: match.id,
          status: match.status,
          nextHeat: match.heatNumber + 4
        });
      });
    }

    // Process Round 4
    if (matchesByRound[4]) {
      matchesByRound[4].forEach(match => {
        round4.push({
          heatNumber: match.heatNumber,
          station: getStationName(match.stationId) as "A" | "B" | "C",
          competitor1: `H${match.heatNumber - 4}`,
          competitor2: `H${match.heatNumber - 3}`,
          winner: match.winnerId?.toString(),
          competitor1Name: getCompetitorName(match.competitor1Id),
          competitor2Name: getCompetitorName(match.competitor2Id),
          winnerName: getCompetitorName(match.winnerId),
          matchId: match.id,
          status: match.status,
          nextHeat: match.heatNumber + 2
        });
      });
    }

    return { round1, round2, round3, round4 };
  };

  const { round1, round2, round3, round4 } = processBracketData();

  const stationColors = {
    A: "bg-primary",
    B: "bg-chart-3",
    C: "bg-chart-1"
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRound1((heats) => {
        const oldIndex = heats.findIndex((h) => h.heatNumber === active.id);
        const newIndex = heats.findIndex((h) => h.heatNumber === over.id);

        const newOrder = arrayMove(heats, oldIndex, newIndex);
        console.log("Bracket order updated:", newOrder);
        
        toast({
          title: "Bracket Updated",
          description: `Heat ${active.id} moved to new position`,
        });
        
        return newOrder;
      });
    }
  };

  const renderHeat = (heat: BracketHeat, isSmall = false) => (
    <Card 
      key={heat.heatNumber} 
      className={`min-h-[120px] transition-all duration-200 ${
        heat.status === 'RUNNING' ? 'ring-2 ring-primary bg-primary/10' : 
        heat.status === 'DONE' ? 'ring-2 ring-accent bg-accent/10' : 
        'hover:shadow-lg'
      }`}
      data-testid={`bracket-heat-${heat.heatNumber}`}
    >
      <div className="p-3 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Heat {heat.heatNumber}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className={`${stationColors[heat.station]} text-white text-xs font-medium px-1.5 py-0.5`}>
              {heat.station}
            </Badge>
            {heat.status && (
              <Badge variant={heat.status === 'RUNNING' ? 'default' : heat.status === 'DONE' ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0.5">
                {heat.status}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <div className={`p-1.5 rounded-md border ${
            heat.competitor1Name === 'BYE' || heat.competitor1 === 'BYE' ? 'bg-gray-100 text-gray-500' : 'bg-white'
          } ${heat.winner === heat.competitor1 ? 'ring-2 ring-green-400' : ''}`}>
            <div className="font-medium text-xs truncate">
              {heat.competitor1Name || heat.competitor1 || "—"}
            </div>
          </div>
          
          <div className="text-center text-muted-foreground font-bold text-xs">VS</div>
          
          <div className={`p-1.5 rounded-md border ${
            heat.competitor2Name === 'BYE' || heat.competitor2 === 'BYE' ? 'bg-gray-100 text-gray-500' : 'bg-white'
          } ${heat.winner === heat.competitor2 ? 'ring-2 ring-green-400' : ''}`}>
            <div className="font-medium text-xs truncate">
              {heat.competitor2Name || heat.competitor2 || "—"}
            </div>
          </div>
        </div>
        
        {heat.winnerName && (
          <div className="mt-2 text-center">
            <Badge className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5">
              🏆 {heat.winnerName}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );

  if (matchesLoading) {
    return (
      <div className="p-6 bg-primary/5 rounded-lg flex items-center justify-center" data-testid="tournament-bracket">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tournament bracket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-primary/5 rounded-lg overflow-x-auto" data-testid="tournament-bracket">
      <div className="min-w-max">
        {/* Rounds Header */}
        <div className="grid grid-cols-5 gap-8 mb-6">
          {["ROUND 1", "ROUND 2", "ROUND 3", "ROUND 4", "FINAL"].map((round, idx) => (
            <div key={round} className="text-center">
              <h3 className="text-xl font-heading font-bold text-primary">{round}</h3>
            </div>
          ))}
        </div>

        {/* Bracket Grid */}
        <div className="grid grid-cols-5 gap-8 items-center">
          {/* Round 1 - Draggable */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={round1.map(h => h.heatNumber)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {round1.map(heat => (
                  <SortableHeat 
                    key={heat.heatNumber} 
                    heat={heat} 
                    stationColors={stationColors}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Round 2 */}
          <div className="space-y-12 pt-8">
            {round2.map(heat => renderHeat(heat))}
          </div>

          {/* Round 3 */}
          <div className="space-y-24 pt-20">
            {round3.map(heat => renderHeat(heat))}
          </div>

          {/* Round 4 */}
          <div className="pt-32">
            {round4.map(heat => renderHeat(heat))}
          </div>

          {/* Final */}
          <div className="pt-32">
            {round4.length > 0 ? (
              <Card className="p-6 bg-primary/10 border-primary">
                <div className="text-center space-y-3">
                  <Trophy className="h-12 w-12 mx-auto text-primary" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">HEAT {round4[0].heatNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {round4[0].competitor1Name || round4[0].competitor1 || "TBD"} vs {round4[0].competitor2Name || round4[0].competitor2 || "TBD"}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs font-medium text-primary">
                      {round4[0].winnerName ? "CHAMPION: " + round4[0].winnerName : "CHAMPION"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {round4[0].status === 'DONE' ? "CROWNED" : "PENDING"}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-primary/10 border-primary">
                <div className="text-center space-y-3">
                  <Trophy className="h-12 w-12 mx-auto text-primary" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">FINAL</div>
                    <div className="text-xs text-muted-foreground">TBD vs TBD</div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs font-medium text-primary">CHAMPION</div>
                    <div className="text-xs text-muted-foreground">PENDING</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${stationColors.A}`} />
            <span className="text-sm">Station A</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${stationColors.B}`} />
            <span className="text-sm">Station B</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${stationColors.C}`} />
            <span className="text-sm">Station C</span>
          </div>
        </div>
      </div>
    </div>
  );
}

