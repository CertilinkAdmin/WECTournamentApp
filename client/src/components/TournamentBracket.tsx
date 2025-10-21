import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface BracketHeat {
  heatNumber: number;
  station: "A" | "B" | "C";
  competitor1?: string;
  competitor2?: string;
  winner?: string;
  nextHeat?: number;
}

export default function TournamentBracket() {
  // todo: remove mock functionality
  const round1: BracketHeat[] = [
    { heatNumber: 1, station: "A", competitor1: "1", competitor2: "2", winner: "1", nextHeat: 17 },
    { heatNumber: 2, station: "B", competitor1: "3", competitor2: "4", nextHeat: 17 },
    { heatNumber: 3, station: "C", competitor1: "5", competitor2: "6", winner: "5", nextHeat: 18 },
    { heatNumber: 4, station: "A", competitor1: "7", competitor2: "8", nextHeat: 18 },
    { heatNumber: 5, station: "B", competitor1: "9", competitor2: "10", nextHeat: 19 },
    { heatNumber: 6, station: "C", competitor1: "11", competitor2: "12", nextHeat: 19 },
    { heatNumber: 7, station: "A", competitor1: "13", competitor2: "14", nextHeat: 20 },
    { heatNumber: 8, station: "B", competitor1: "15", competitor2: "16", nextHeat: 20 },
  ];

  const round2: BracketHeat[] = [
    { heatNumber: 17, station: "B", competitor1: "H1", competitor2: "H2", nextHeat: 25 },
    { heatNumber: 18, station: "C", competitor1: "H3", competitor2: "H4", nextHeat: 25 },
    { heatNumber: 19, station: "A", competitor1: "H5", competitor2: "H6", nextHeat: 26 },
    { heatNumber: 20, station: "B", competitor1: "H7", competitor2: "H8", nextHeat: 26 },
  ];

  const round3: BracketHeat[] = [
    { heatNumber: 25, station: "A", competitor1: "H17", competitor2: "H18", nextHeat: 29 },
    { heatNumber: 26, station: "B", competitor1: "H19", competitor2: "H20", nextHeat: 29 },
  ];

  const round4: BracketHeat[] = [
    { heatNumber: 29, station: "B", competitor1: "H25", competitor2: "H26", nextHeat: 31 },
  ];

  const stationColors = {
    A: "bg-primary",
    B: "bg-chart-3",
    C: "bg-chart-1"
  };

  const renderHeat = (heat: BracketHeat, isSmall = false) => (
    <Card 
      key={heat.heatNumber} 
      className={`hover-elevate cursor-pointer ${isSmall ? "p-2" : "p-3"}`}
      data-testid={`bracket-heat-${heat.heatNumber}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`${isSmall ? "text-lg" : "text-xl"} font-heading font-bold`}>
            {heat.heatNumber}
          </span>
          <Badge className={`${stationColors[heat.station]} text-white text-xs`}>
            {heat.station}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className={`${isSmall ? "text-xs" : "text-sm"} ${heat.winner === heat.competitor1 ? "font-bold" : ""}`}>
            {heat.competitor1 || "—"}
          </div>
          <div className={`${isSmall ? "text-xs" : "text-sm"} text-muted-foreground`}>vs</div>
          <div className={`${isSmall ? "text-xs" : "text-sm"} ${heat.winner === heat.competitor2 ? "font-bold" : ""}`}>
            {heat.competitor2 || "—"}
          </div>
        </div>
      </div>
    </Card>
  );

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
          {/* Round 1 */}
          <div className="space-y-3">
            {round1.map(heat => renderHeat(heat))}
          </div>

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
            <Card className="p-6 bg-primary/10 border-primary">
              <div className="text-center space-y-3">
                <Trophy className="h-12 w-12 mx-auto text-primary" />
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">HEAT 31</div>
                  <div className="text-xs text-muted-foreground">H29 vs H30</div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium text-primary">CHAMPION</div>
                  <div className="text-xs text-muted-foreground">CROWNED</div>
                </div>
              </div>
            </Card>
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
