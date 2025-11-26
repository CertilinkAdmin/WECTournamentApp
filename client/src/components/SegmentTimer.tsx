import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import SevenSegmentTimer from "./SevenSegmentTimer";

interface SegmentTimerProps {
  startTime: Date;
  durationMinutes: number;
  isPaused?: boolean;
  onComplete?: () => void;
}

export default function SegmentTimer({ startTime, durationMinutes, isPaused = false, onComplete }: SegmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [warningsShown, setWarningsShown] = useState({ oneMinute: false, thirtySeconds: false });

  useEffect(() => {
    if (isPaused) {
      // When pausing, store the current time remaining
      if (pausedAt === null) {
        setPausedAt(timeRemaining);
      }
      return;
    }

    // When resuming from pause, use the pausedAt value as the new baseline
    const effectiveStartTime = pausedAt !== null 
      ? new Date(Date.now() - ((durationMinutes * 60 - pausedAt) * 1000))
      : startTime;

    // Clear pausedAt when resuming
    if (pausedAt !== null) {
      setPausedAt(null);
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - effectiveStartTime.getTime()) / 1000);
      const remaining = Math.max(0, (durationMinutes * 60) - elapsed);
      setTimeRemaining(remaining);

      // Show warnings at 1 minute and 30 seconds
      if (remaining === 60 && !warningsShown.oneMinute) {
        setWarningsShown(prev => ({ ...prev, oneMinute: true }));
        // You could add a toast notification here
      }
      if (remaining === 30 && !warningsShown.thirtySeconds) {
        setWarningsShown(prev => ({ ...prev, thirtySeconds: true }));
        // You could add a toast notification here
      }

      if (remaining === 0 && onComplete) {
        onComplete();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, isPaused, pausedAt, onComplete, timeRemaining]);

  return (
    <div className="text-center space-y-4">
      {/* Warning Messages */}
      {timeRemaining === 60 && warningsShown.oneMinute && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
          <div className="text-yellow-800 dark:text-yellow-200 font-semibold">
            ⚠️ 1 MINUTE WARNING
          </div>
        </div>
      )}
      
      {timeRemaining === 30 && warningsShown.thirtySeconds && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
          <div className="text-red-800 dark:text-red-200 font-semibold">
            🚨 30 SECONDS WARNING
          </div>
        </div>
      )}

      {/* 7-Segment Display Timer */}
      <SevenSegmentTimer timeRemaining={timeRemaining} isPaused={isPaused} />
      
      {timeRemaining === 0 && (
        <Badge variant="destructive" className="text-sm animate-pulse">
          TIME'S UP!
        </Badge>
      )}
    </div>
  );
}

