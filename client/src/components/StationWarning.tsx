import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface StationWarningProps {
  currentStationName: string;
  referenceStationName: string;
  targetStartTime: Date;
}

export default function StationWarning({ currentStationName, referenceStationName, targetStartTime }: StationWarningProps) {
  const targetTimeRef = useRef(targetStartTime);
  const [timeRemaining, setTimeRemaining] = useState(() => {
    return Math.max(0, Math.ceil((targetStartTime.getTime() - Date.now()) / 1000));
  });

  // Update target time ref when prop changes
  useEffect(() => {
    targetTimeRef.current = targetStartTime;
  }, [targetStartTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((targetTimeRef.current.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (timeRemaining === 0) {
    return null;
  }

  return (
    <Card className="bg-amber-500/10 border-amber-500/50" data-testid={`warning-station-${currentStationName}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Station {currentStationName} Starting Soon
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {referenceStationName && `Station ${referenceStationName} started. `}Prepare for your start in {formatTime(timeRemaining)}
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-500/50">
            {formatTime(timeRemaining)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
