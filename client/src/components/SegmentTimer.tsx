import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import SevenSegmentTimer from "./SevenSegmentTimer";

interface SegmentTimerProps {
  startTime: Date;
  durationMinutes: number;
  isPaused?: boolean;
  onComplete?: () => void;
  /**
   * Optional externally controlled remaining time (in seconds).
   * When provided, the timer display (and warnings/completion) will follow this value
   * instead of maintaining its own internal countdown.
   */
  externalTimeRemaining?: number;
}

export default function SegmentTimer({
  startTime,
  durationMinutes,
  isPaused = false,
  onComplete,
  externalTimeRemaining,
}: SegmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [warningsShown, setWarningsShown] = useState({ oneMinute: false, thirtySeconds: false });
  const timeRemainingRef = useRef(timeRemaining);
  
  // Keep ref in sync with state
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  // When an external time source is provided (e.g. StationLeadView header timer),
  // mirror it into local state so both displays stay perfectly in sync.
  useEffect(() => {
    if (externalTimeRemaining === undefined) return;
    setTimeRemaining(externalTimeRemaining);
  }, [externalTimeRemaining]);

  // Handle warnings and completion when using an external time source
  useEffect(() => {
    if (externalTimeRemaining === undefined) return;

    // Use functional updates to avoid dependency on warningsShown
    setWarningsShown((previousWarnings) => {
      const updates: Partial<typeof previousWarnings> = {};
      if (externalTimeRemaining === 60 && !previousWarnings.oneMinute) {
        updates.oneMinute = true;
      }
      if (externalTimeRemaining === 30 && !previousWarnings.thirtySeconds) {
        updates.thirtySeconds = true;
      }
      return Object.keys(updates).length > 0 ? { ...previousWarnings, ...updates } : previousWarnings;
    });

    if (externalTimeRemaining === 0 && onComplete) {
      onComplete();
    }
  }, [externalTimeRemaining, onComplete]); // Removed warningsShown from deps - using functional updates

  // Default internal countdown behaviour when no external time source is provided
  useEffect(() => {
    if (externalTimeRemaining !== undefined) {
      return;
    }

    if (isPaused) {
      // When pausing, store the current time remaining
      setPausedAt(prev => {
        if (prev === null) {
          // Use ref to get current timeRemaining without adding it to dependencies
          return timeRemainingRef.current;
        }
        return prev;
      });
      return;
    }

    // When resuming from pause, use the pausedAt value as the new baseline
    const effectiveStartTime =
      pausedAt !== null
        ? new Date(Date.now() - ((durationMinutes * 60 - pausedAt) * 1000))
        : startTime;

    // Clear pausedAt when resuming
    if (pausedAt !== null) {
      setPausedAt(null);
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - effectiveStartTime.getTime()) / 1000);
      const remaining = Math.max(0, durationMinutes * 60 - elapsed);
      setTimeRemaining(remaining);

      // Show warnings at 1 minute and 30 seconds - use functional updates
      setWarningsShown((previousWarnings) => {
        const updates: Partial<typeof previousWarnings> = {};
        if (remaining === 60 && !previousWarnings.oneMinute) {
          updates.oneMinute = true;
        }
        if (remaining === 30 && !previousWarnings.thirtySeconds) {
          updates.thirtySeconds = true;
        }
        return Object.keys(updates).length > 0 ? { ...previousWarnings, ...updates } : previousWarnings;
      });

      if (remaining === 0 && onComplete) {
        onComplete();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    startTime,
    durationMinutes,
    isPaused,
    pausedAt,
    onComplete,
    externalTimeRemaining,
    // Removed timeRemaining and warningsShown from deps - using functional updates
  ]);

  return (
    <div className="text-center space-y-4">
      {/* Warning Messages */}
      {timeRemaining === 60 && warningsShown.oneMinute && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
          <div className="text-yellow-800 dark:text-yellow-200 font-semibold">⚠️ 1 MINUTE WARNING</div>
        </div>
      )}

      {timeRemaining === 30 && warningsShown.thirtySeconds && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
          <div className="text-red-800 dark:text-red-200 font-semibold">🚨 30 SECONDS WARNING</div>
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

