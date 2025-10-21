import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function TimerPanel() {
  const [segment, setSegment] = useState<"dialIn" | "brew" | "serve">("dialIn");
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);

  const segmentTimes = {
    dialIn: 120,
    brew: 120,
    serve: 60
  };

  const segmentLabels = {
    dialIn: "DIAL IN",
    brew: "BREW TIME",
    serve: "SERVE TIME"
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      setIsRunning(false);
    }
  }, [isRunning, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    console.log(isRunning ? "Timer paused" : "Timer started");
  };

  const handleReset = () => {
    setTimeRemaining(segmentTimes[segment]);
    setIsRunning(false);
    console.log("Timer reset");
  };

  const handleSegmentChange = (newSegment: "dialIn" | "brew" | "serve") => {
    setSegment(newSegment);
    setTimeRemaining(segmentTimes[newSegment]);
    setIsRunning(false);
    console.log("Segment changed to", newSegment);
  };

  const progress = ((segmentTimes[segment] - timeRemaining) / segmentTimes[segment]) * 100;

  return (
    <Card data-testid="card-timer">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Competition Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Segment Selector */}
        <div className="grid grid-cols-3 gap-2">
          {(["dialIn", "brew", "serve"] as const).map((seg) => (
            <Button
              key={seg}
              variant={segment === seg ? "default" : "outline"}
              onClick={() => handleSegmentChange(seg)}
              className="text-xs"
              data-testid={`button-segment-${seg}`}
            >
              {segmentLabels[seg]}
            </Button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-center space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              {segmentLabels[segment]}
            </div>
            <div 
              className={`text-6xl font-mono font-bold ${timeRemaining < 60 ? "text-destructive" : ""}`}
              data-testid="text-timer-display"
            >
              {formatTime(timeRemaining)}
            </div>
          </div>
          <Progress value={progress} className="h-3" />
          
          {timeRemaining === 0 && (
            <Badge variant="destructive" className="text-sm">
              TIME'S UP!
            </Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartPause}
            className="flex-1"
            variant={isRunning ? "secondary" : "default"}
            size="lg"
            data-testid="button-timer-start-pause"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            data-testid="button-timer-reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
