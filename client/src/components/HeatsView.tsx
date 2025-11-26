import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Clock, Trophy, Users } from "lucide-react";
import HeatCard from "./HeatCard";
import type { Station, Match, User } from '@shared/schema';
import { getStationLetter as getStationLetterUtil } from '@/utils/stationUtils';

interface Competitor {
  id: string;
  name: string;
  code: string;
  score?: number;
}

interface Heat {
  heatNumber: number;
  station: "A" | "B" | "C";
  round: number;
  status: "pending" | "active" | "completed";
  competitors: [Competitor, Competitor];
  winner?: string;
}

// Mock data for demonstration - in real app this would come from API
const mockHeats: Heat[] = [
  // Station A heats
  { heatNumber: 1, station: "A", round: 1, status: "completed", competitors: [{ id: "1", name: "John Smith", code: "PK", score: 18 }, { id: "2", name: "Jane Doe", code: "TR", score: 15 }], winner: "1" },
  { heatNumber: 4, station: "A", round: 1, status: "active", competitors: [{ id: "7", name: "Mike Johnson", code: "BR" }, { id: "8", name: "Sarah Williams", code: "GN" }] },
  { heatNumber: 7, station: "A", round: 1, status: "pending", competitors: [{ id: "13", name: "Alex Brown", code: "PK" }, { id: "14", name: "Emily Davis", code: "TR" }] },

  // Station B heats
  { heatNumber: 2, station: "B", round: 1, status: "completed", competitors: [{ id: "3", name: "David Wilson", code: "BR", score: 16 }, { id: "4", name: "Lisa Anderson", code: "GN", score: 14 }], winner: "3" },
  { heatNumber: 5, station: "B", round: 1, status: "active", competitors: [{ id: "9", name: "Chris Taylor", code: "PK" }, { id: "10", name: "Maria Garcia", code: "TR" }] },
  { heatNumber: 8, station: "B", round: 1, status: "pending", competitors: [{ id: "15", name: "Tom Wilson", code: "BR" }, { id: "16", name: "Anna Smith", code: "GN" }] },

  // Station C heats
  { heatNumber: 3, station: "C", round: 1, status: "completed", competitors: [{ id: "5", name: "Robert Davis", code: "PK", score: 17 }, { id: "6", name: "Jennifer Lee", code: "TR", score: 13 }], winner: "5" },
  { heatNumber: 6, station: "C", round: 1, status: "active", competitors: [{ id: "11", name: "James Brown", code: "BR" }, { id: "12", name: "Linda Johnson", code: "GN" }] },
  { heatNumber: 9, station: "C", round: 1, status: "pending", competitors: [{ id: "17", name: "Mark Wilson", code: "PK" }, { id: "18", name: "Susan Davis", code: "TR" }] },
];

// Mock stations data - in real app this would come from API
const stations: Station[] = [
  { id: 1, name: "Station A", code: "STA" },
  { id: 2, name: "Station B", code: "STB" },
  { id: 3, name: "Station C", code: "STC" },
];

export default function HeatsView() {
  const [currentStation, setCurrentStation] = useState<"A" | "B" | "C">("A");

  // Filter heats by current station
  const stationHeats = mockHeats.filter(heat => heat.station === currentStation);

  // Helper function to get station letter from station data
  const getStationLetter = (stationId: number | null): "A" | "B" | "C" | null => {
    if (!stationId) return null;
    const station = stations.find(s => s.id === stationId);
    if (!station) return null;
    return getStationLetterUtil(station.name);
  };


  // Get station statistics
  const getStationStats = (station: "A" | "B" | "C") => {
    const stationHeats = mockHeats.filter(heat => heat.station === station);
    const completed = stationHeats.filter(heat => heat.status === "completed").length;
    const active = stationHeats.filter(heat => heat.status === "active").length;
    const pending = stationHeats.filter(heat => heat.status === "pending").length;

    return { completed, active, pending, total: stationHeats.length };
  };

  const stationStats = getStationStats(currentStation);

  const handleStationChange = (station: "A" | "B" | "C") => {
    setCurrentStation(station);
  };

  const handleHeatClick = (heatNumber: number) => {
    console.log(`Heat ${heatNumber} clicked`);
    // In real app, this would navigate to heat details or open heat management
  };

  return (
    <div className="space-y-6">
      {/* Station Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Station Heats Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStation} onValueChange={(value) => handleStationChange(value as "A" | "B" | "C")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="A" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                Station A
                <Badge variant="secondary" className="ml-1">
                  {getStationStats("A").total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="B" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3"></div>
                Station B
                <Badge variant="secondary" className="ml-1">
                  {getStationStats("B").total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="C" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                Station C
                <Badge variant="secondary" className="ml-1">
                  {getStationStats("C").total}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Current Station Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${currentStation === "A" ? "bg-primary" : currentStation === "B" ? "bg-chart-3" : "bg-chart-1"}`}></div>
                <span className="font-semibold">Station {currentStation}</span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-green-600" />
                  {stationStats.completed} completed
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {stationStats.active} active
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-600" />
                  {stationStats.pending} pending
                </span>
              </div>
            </div>

            {/* Station Navigation Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const stations: ("A" | "B" | "C")[] = ["A", "B", "C"];
                  const currentIndex = stations.indexOf(currentStation);
                  const prevIndex = currentIndex === 0 ? stations.length - 1 : currentIndex - 1;
                  setCurrentStation(stations[prevIndex]);
                }}
                disabled={false}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const stations: ("A" | "B" | "C")[] = ["A", "B", "C"];
                  const currentIndex = stations.indexOf(currentStation);
                  const nextIndex = currentIndex === stations.length - 1 ? 0 : currentIndex + 1;
                  setCurrentStation(stations[nextIndex]);
                }}
                disabled={false}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station Heats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stationHeats.length > 0 ? (
          stationHeats.map((heat) => (
            <HeatCard
              key={heat.heatNumber}
              heatNumber={heat.heatNumber}
              station={heat.station}
              round={heat.round}
              status={heat.status}
              competitors={heat.competitors}
              winner={heat.winner}
              onClick={() => handleHeatClick(heat.heatNumber)}
            />
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Heats for Station {currentStation}</h3>
              <p className="text-muted-foreground">
                No heats are currently scheduled for this station.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Station Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Stations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["A", "B", "C"] as const).map((station) => {
              const stats = getStationStats(station);
              const isCurrentStation = station === currentStation;

              return (
                <Card
                  key={station}
                  className={`cursor-pointer transition-all ${isCurrentStation ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                  onClick={() => setCurrentStation(station)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${station === "A" ? "bg-primary" : station === "B" ? "bg-chart-3" : "bg-chart-1"}`}></div>
                        <span className="font-semibold">Station {station}</span>
                        {isCurrentStation && <Badge variant="default">Current</Badge>}
                      </div>
                      <Badge variant="secondary">{stats.total} heats</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-600">Completed:</span>
                        <span className="font-medium">{stats.completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Active:</span>
                        <span className="font-medium">{stats.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-medium">{stats.pending}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}