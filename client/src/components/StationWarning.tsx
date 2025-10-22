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
  const [warningsShown, setWarningsShown] = useState({ 
    fiveMinutes: false, 
    twoMinutes: false, 
    oneMinute: false 
  });

  // Update target time ref when prop changes
  useEffect(() => {
    targetTimeRef.current = targetStartTime;
  }, [targetStartTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((targetTimeRef.current.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      // Show warnings at 5 minutes, 2 minutes, and 1 minute
      if (remaining === 300 && !warningsShown.fiveMinutes) {
        setWarningsShown(prev => ({ ...prev, fiveMinutes: true }));
      }
      if (remaining === 120 && !warningsShown.twoMinutes) {
        setWarningsShown(prev => ({ ...prev, twoMinutes: true }));
      }
      if (remaining === 60 && !warningsShown.oneMinute) {
        setWarningsShown(prev => ({ ...prev, oneMinute: true }));
      }
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [warningsShown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (timeRemaining === 0) {
    return null;
  }

  // Determine warning level and styling
  const getWarningLevel = () => {
    if (timeRemaining <= 60) return { 
      bg: "bg-red-500/10", 
      border: "border-red-500/50", 
      icon: "text-red-600 dark:text-red-400",
      text: "text-red-900 dark:text-red-100",
      subtext: "text-red-700 dark:text-red-300",
      badge: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-500/50"
    };
    if (timeRemaining <= 120) return { 
      bg: "bg-orange-500/10", 
      border: "border-orange-500/50", 
      icon: "text-orange-600 dark:text-orange-400",
      text: "text-orange-900 dark:text-orange-100",
      subtext: "text-orange-700 dark:text-orange-300",
      badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-500/50"
    };
    return { 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/50", 
      icon: "text-amber-600 dark:text-amber-400",
      text: "text-amber-900 dark:text-amber-100",
      subtext: "text-amber-700 dark:text-amber-300",
      badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-500/50"
    };
  };

  const warningLevel = getWarningLevel();

  return (
    <Card className={`${warningLevel.bg} ${warningLevel.border}`} data-testid={`warning-station-${currentStationName}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className={`h-5 w-5 ${warningLevel.icon} flex-shrink-0`} />
          <div className="flex-1">
            <div className={`text-sm font-medium ${warningLevel.text}`}>
              Station {currentStationName} Starting Soon
            </div>
            <div className={`text-xs ${warningLevel.subtext} mt-1`}>
              {referenceStationName && `Station ${referenceStationName} started. `}Prepare for your start in {formatTime(timeRemaining)}
            </div>
          </div>
          <Badge variant="outline" className={`${warningLevel.badge}`}>
            {formatTime(timeRemaining)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
