import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, GripVertical } from 'lucide-react';
import type { User as UserType } from '@shared/schema';

interface DraggableCompetitorProps {
  competitor: UserType;
  isSelected?: boolean;
  onSelect?: (competitor: UserType) => void;
}

export default function DraggableCompetitor({ 
  competitor, 
  isSelected = false, 
  onSelect 
}: DraggableCompetitorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `competitor-${competitor.id}`,
    data: {
      type: 'competitor',
      competitor,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary bg-primary/10' : 'hover:shadow-md'
      } ${isDragging ? 'z-50' : ''}`}
      onClick={() => onSelect?.(competitor)}
      {...attributes}
      {...listeners}
    >
      <div className="p-3 flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <User className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{competitor.name}</div>
          <div className="text-sm text-muted-foreground truncate">{competitor.email}</div>
        </div>
        <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
          {competitor.role}
        </Badge>
      </div>
    </Card>
  );
}
