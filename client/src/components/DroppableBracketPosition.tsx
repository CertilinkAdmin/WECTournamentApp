import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, UserPlus, X } from 'lucide-react';
import type { User as UserType } from '@shared/schema';

interface DroppableBracketPositionProps {
  position: 'competitor1' | 'competitor2';
  heatNumber: number;
  station: string;
  competitor?: UserType | null;
  onRemove?: () => void;
  isActive?: boolean;
}

export default function DroppableBracketPosition({
  position,
  heatNumber,
  station,
  competitor,
  onRemove,
  isActive = false
}: DroppableBracketPositionProps) {
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: `heat-${heatNumber}-${position}`,
    data: {
      type: 'bracket-position',
      heatNumber,
      position,
      station,
    },
  });

  const getPositionLabel = () => {
    return position === 'competitor1' ? 'Competitor 1' : 'Competitor 2';
  };

  const getStationColor = (station: string) => {
    switch (station) {
      case 'A': return 'bg-primary';
      case 'B': return 'bg-chart-3';
      case 'C': return 'bg-chart-1';
      default: return 'bg-muted';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      className={`min-h-[80px] transition-all duration-200 ${
        isOver 
          ? 'ring-2 ring-primary bg-primary/10 scale-105' 
          : isActive 
            ? 'ring-2 ring-primary bg-primary/10' 
            : 'hover:shadow-md'
      }`}
    >
      <div className="p-3 h-full flex flex-col justify-center">
        {competitor ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {getPositionLabel()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStationColor(station)} text-white text-xs`}>
                  {station}
                </Badge>
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="font-medium truncate">{competitor.name}</div>
            <div className="text-sm text-muted-foreground truncate">{competitor.email}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <UserPlus className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              {getPositionLabel()}
            </div>
            <div className="text-xs text-muted-foreground">
              Drop competitor here
            </div>
            <Badge className={`${getStationColor(station)} text-white text-xs`}>
              Station {station}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
