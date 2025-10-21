import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, SkipForward } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Heat {
  heatNumber: number;
  competitors: string[];
  scheduledTime: string;
}

interface StationDashboardProps {
  station: "A" | "B" | "C";
  currentHeat?: Heat;
  upcomingHeats?: Heat[];
}

export default function StationDashboard({ 
  station, 
  currentHeat,
  upcomingHeats = []
}: StationDashboardProps) {
  const [segment, setSegment] = useState<"dialIn" | "brew" | "serve">("dialIn");
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes default

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

  const stationColors = {
    A: "bg-primary text-primary-foreground",
    B: "bg-chart-3 text-white",
    C: "bg-chart-1 text-white"
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
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

  const handleNextSegment = () => {
    const nextSegment = segment === "dialIn" ? "brew" : segment === "brew" ? "serve" : "dialIn";
    setSegment(nextSegment);
    setTimeRemaining(segmentTimes[nextSegment]);
    setIsRunning(false);
    console.log("Advanced to", nextSegment);
  };

  const progress = ((segmentTimes[segment] - timeRemaining) / segmentTimes[segment]) * 100;

  return (
    <div className="space-y-6">
      {/* Station Header */}
      <Card>
        <CardHeader className={stationColors[station]}>
          <CardTitle className="text-2xl font-heading">
            Station {station}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Current Heat */}
      {currentHeat ? (
        <Card data-testid="card-current-heat">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Heat {currentHeat.heatNumber}</span>
              <Badge variant="secondary" className="font-mono">
                {currentHeat.scheduledTime}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Segment Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{segmentLabels[segment]}</span>
                <span className={`text-3xl font-mono font-bold ${timeRemaining < 60 ? "text-destructive" : ""}`} data-testid="text-timer">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Segment Indicators */}
            <div className="flex gap-2">
              {(["dialIn", "brew", "serve"] as const).map((seg) => (
                <Badge
                  key={seg}
                  variant={segment === seg ? "default" : "secondary"}
                  className="flex-1 justify-center"
                  data-testid={`badge-segment-${seg}`}
                >
                  {segmentLabels[seg]}
                </Badge>
              ))}
            </div>

            {/* Competitors */}
            <div className="space-y-2">
              {currentHeat.competitors.map((competitor, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <span className="text-xs font-medium text-muted-foreground">{idx + 1}</span>
                  <span className="font-medium">{competitor}</span>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button
                onClick={handleStartPause}
                className="flex-1"
                variant={isRunning ? "secondary" : "default"}
                data-testid="button-start-pause"
              >
                {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isRunning ? "Pause" : "Start"}
              </Button>
              <Button
                onClick={handleNextSegment}
                variant="outline"
                data-testid="button-next-segment"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No active heat at this station
          </CardContent>
        </Card>
      )}

      {/* Upcoming Heats Queue */}
      {upcomingHeats.length > 0 && (
        <Card data-testid="card-queue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingHeats.map((heat) => (
                <div key={heat.heatNumber} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold">Heat {heat.heatNumber}</span>
                    <span className="text-sm text-muted-foreground">
                      {heat.competitors.join(" vs ")}
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {heat.scheduledTime}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
