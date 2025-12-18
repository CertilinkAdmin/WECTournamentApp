import { useState, useEffect } from "react";
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

  // When an external time source is provided (e.g. StationLeadView header timer),
  // mirror it into local state so both displays stay perfectly in sync.
  useEffect(() => {
    if (externalTimeRemaining === undefined) return;
    setTimeRemaining(externalTimeRemaining);
  }, [externalTimeRemaining]);

  // Handle warnings and completion when using an external time source
  useEffect(() => {
    if (externalTimeRemaining === undefined) return;

    if (externalTimeRemaining === 60 && !warningsShown.oneMinute) {
      setWarningsShown((previousWarnings) => ({ ...previousWarnings, oneMinute: true }));
    }
    if (externalTimeRemaining === 30 && !warningsShown.thirtySeconds) {
      setWarningsShown((previousWarnings) => ({ ...previousWarnings, thirtySeconds: true }));
    }

    if (externalTimeRemaining === 0 && onComplete) {
      onComplete();
    }
  }, [externalTimeRemaining, warningsShown.oneMinute, warningsShown.thirtySeconds, onComplete]);

  // Default internal countdown behaviour when no external time source is provided
  useEffect(() => {
    if (externalTimeRemaining !== undefined) {
      return;
    }

    if (isPaused) {
      // When pausing, store the current time remaining
      if (pausedAt === null) {
        setPausedAt(timeRemaining);
      }
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

      // Show warnings at 1 minute and 30 seconds
      if (remaining === 60 && !warningsShown.oneMinute) {
        setWarningsShown((previousWarnings) => ({ ...previousWarnings, oneMinute: true }));
        // You could add a toast notification here
      }
      if (remaining === 30 && !warningsShown.thirtySeconds) {
        setWarningsShown((previousWarnings) => ({ ...previousWarnings, thirtySeconds: true }));
        // You could add a toast notification here
      }

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
    timeRemaining,
    warningsShown.oneMinute,
    warningsShown.thirtySeconds,
    externalTimeRemaining,
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

