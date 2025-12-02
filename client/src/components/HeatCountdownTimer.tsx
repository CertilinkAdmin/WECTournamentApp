import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface HeatCountdownTimerProps {
  totalSeconds: number;
  isActive: boolean;
}

export default function HeatCountdownTimer({ totalSeconds, isActive }: HeatCountdownTimerProps) {
  // Local display state so the clock visibly ticks every second,
  // even if the upstream value only updates intermittently.
  const [displaySeconds, setDisplaySeconds] = useState(totalSeconds);

  // Whenever the server/parent value jumps (new heat or resync), snap to it.
  useEffect(() => {
    setDisplaySeconds(totalSeconds);
  }, [totalSeconds]);

  // Smooth 1s ticking while active – purely visual, does not affect controls.
  useEffect(() => {
    if (!isActive) return;
    if (displaySeconds <= 0) return;

    const interval = setInterval(() => {
      setDisplaySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, displaySeconds]);

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const isLowTime = displaySeconds <= 60;

  return (
    <Card className={`bg-primary/10 border-primary/30 ${isLowTime ? 'border-destructive/50 bg-destructive/10' : ''}`}>
      <CardContent className="p-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground uppercase tracking-wide">
            <Clock className="h-4 w-4" />
            Total Heat Time Remaining
          </div>
          <div className={`text-5xl font-mono font-bold ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          {displaySeconds === 0 && (
            <div className="text-sm text-destructive font-semibold mt-2">
              Heat Time Complete
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

