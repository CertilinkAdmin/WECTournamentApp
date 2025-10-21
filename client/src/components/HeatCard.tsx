import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock } from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  code: string;
  score?: number;
}

interface HeatCardProps {
  heatNumber: number;
  station: "A" | "B" | "C";
  competitors: [Competitor, Competitor];
  winner?: string;
  status?: "pending" | "active" | "completed";
  round: number;
  onClick?: () => void;
}

export default function HeatCard({ 
  heatNumber, 
  station, 
  competitors,
  winner,
  status = "pending",
  round,
  onClick
}: HeatCardProps) {
  const stationColors = {
    A: "bg-primary text-primary-foreground",
    B: "bg-chart-3 text-white",
    C: "bg-chart-1 text-white"
  };

  const statusColors = {
    pending: "bg-muted text-muted-foreground",
    active: "bg-chart-3 text-white",
    completed: "bg-chart-2 text-white"
  };

  return (
    <Card 
      className="hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-heat-${heatNumber}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-foreground">
              {heatNumber}
            </span>
            <Badge className={stationColors[station]} data-testid={`badge-station-${station}`}>
              {station}
            </Badge>
          </div>
          <Badge className={statusColors[status]} data-testid={`badge-status-${status}`}>
            {status === "active" && <Clock className="h-3 w-3 mr-1" />}
            {status === "active" ? "Live" : status}
          </Badge>
        </div>

        {/* Competitors */}
        <div className="space-y-2">
          {competitors.map((competitor, idx) => (
            <div 
              key={competitor.id}
              className={`flex items-center justify-between gap-2 p-2 rounded-md ${
                winner === competitor.id 
                  ? "bg-chart-2/10 border border-chart-2" 
                  : "bg-muted/50"
              }`}
              data-testid={`competitor-${idx + 1}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium truncate">
                  {competitor.name || `Competitor ${idx + 1}`}
                </span>
                {winner === competitor.id && (
                  <Trophy className="h-3 w-3 text-chart-2 flex-shrink-0" />
                )}
              </div>
              {competitor.score !== undefined && (
                <span className="text-lg font-mono font-bold" data-testid={`score-${idx + 1}`}>
                  {competitor.score}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* VS indicator for pending heats */}
        {status === "pending" && (
          <div className="text-center text-xs text-muted-foreground mt-2">
            vs
          </div>
        )}
      </div>
    </Card>
  );
}
