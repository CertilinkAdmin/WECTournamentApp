import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import TournamentBracket from "@/components/TournamentBracket";
import JudgeScorecard from "@/components/JudgeScorecard";
import StationDashboard from "@/components/StationDashboard";
import CompetitionRules from "@/components/CompetitionRules";
import HeatCard from "@/components/HeatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AdminView() {
  // todo: remove mock functionality
  const mockHeats = [
    {
      heatNumber: 1,
      station: "A" as const,
      round: 1,
      status: "completed" as const,
      competitors: [
        { id: "1", name: "John Smith", code: "PK", score: 18 },
        { id: "2", name: "Jane Doe", code: "TR", score: 15 }
      ] as [{ id: string; name: string; code: string; score?: number }, { id: string; name: string; code: string; score?: number }],
      winner: "1"
    },
    {
      heatNumber: 7,
      station: "B" as const,
      round: 1,
      status: "active" as const,
      competitors: [
        { id: "13", name: "Mike Johnson", code: "BR", score: 12 },
        { id: "14", name: "Sarah Williams", code: "GN", score: 15 }
      ] as [{ id: string; name: string; code: string; score?: number }, { id: string; name: string; code: string; score?: number }]
    },
    {
      heatNumber: 3,
      station: "C" as const,
      round: 1,
      status: "pending" as const,
      competitors: [
        { id: "5", name: "Alex Brown", code: "PK" },
        { id: "6", name: "Emily Davis", code: "TR" }
      ] as [{ id: string; name: string; code: string; score?: number }, { id: string; name: string; code: string; score?: number }]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg">
        <h2 className="text-2xl font-heading font-bold mb-4">Admin Control Center</h2>
        <p className="text-muted-foreground">
          Monitor and manage the tournament in real-time
        </p>
      </div>

      <Tabs defaultValue="bracket" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="bracket" data-testid="tab-bracket">Bracket</TabsTrigger>
          <TabsTrigger value="heats" data-testid="tab-heats">Heats</TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bracket" className="mt-6">
          <TournamentBracket />
        </TabsContent>

        <TabsContent value="heats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockHeats.map((heat) => (
              <HeatCard
                key={heat.heatNumber}
                {...heat}
                onClick={() => console.log(`Heat ${heat.heatNumber} clicked`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <CompetitionRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JudgeView() {
  return (
    <div className="max-w-4xl mx-auto">
      <JudgeScorecard
        heatNumber={7}
        competitors={[
          { name: "Mike Johnson", code: "BR" },
          { name: "Sarah Williams", code: "GN" }
        ]}
        onSubmit={(scores) => console.log("Scores submitted:", scores)}
      />
    </div>
  );
}

function BaristaView() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-heading font-bold mb-4">Your Heat Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Heat Number</div>
                <div className="text-2xl font-mono font-bold">7</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Station</div>
                <div className="text-2xl font-heading font-bold">B</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Scheduled Time</div>
                <div className="text-lg font-mono">2:00 PM</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Competitor Code</div>
                <div className="text-lg font-mono font-bold">BR</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CompetitionRules />
    </div>
  );
}

function StationView() {
  return (
    <div className="max-w-2xl mx-auto">
      <StationDashboard
        station="B"
        currentHeat={{
          heatNumber: 7,
          competitors: ["Mike Johnson", "Sarah Williams"],
          scheduledTime: "2:00 PM"
        }}
        upcomingHeats={[
          {
            heatNumber: 8,
            competitors: ["Alex Brown", "Emily Davis"],
            scheduledTime: "2:20 PM"
          }
        ]}
      />
    </div>
  );
}

function Router() {
  const [currentRole, setCurrentRole] = useState<"admin" | "judge" | "barista">("admin");

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentRole={currentRole} 
        onRoleChange={setCurrentRole}
        tournamentName="World Espresso Championships"
        currentRound={1}
      />
      <main className="container mx-auto py-6 px-4">
        {currentRole === "admin" && <AdminView />}
        {currentRole === "judge" && <JudgeView />}
        {currentRole === "barista" && <BaristaView />}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
