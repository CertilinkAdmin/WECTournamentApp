import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import TournamentBracket from "@/components/TournamentBracket";
import JudgeScorecard from "@/components/JudgeScorecard";
import CompetitionRules from "@/components/CompetitionRules";
import TimerPanel from "@/components/TimerPanel";
import AdminTournamentSetup from "@/components/AdminTournamentSetup";
import StationLeadView from "@/components/StationLeadView";
import HeatCard from "@/components/HeatCard";
import StationPage from "@/pages/StationPage";
import NotFound from "@/pages/not-found";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, Trophy, Settings } from "lucide-react";

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
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-heading font-bold mb-2">Admin Control Center</h2>
        <p className="text-muted-foreground">
          Complete tournament management and oversight
        </p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="setup" data-testid="tab-setup">
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="bracket" data-testid="tab-bracket">
            <Trophy className="h-4 w-4 mr-2" />
            Bracket
          </TabsTrigger>
          <TabsTrigger value="heats" data-testid="tab-heats">
            <Clock className="h-4 w-4 mr-2" />
            Heats
          </TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">
            <FileText className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="mt-6">
          <AdminTournamentSetup />
        </TabsContent>

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
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="scorecard" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="scorecard" data-testid="tab-scorecard">
            <Trophy className="h-4 w-4 mr-2" />
            Scorecard
          </TabsTrigger>
          <TabsTrigger value="timer" data-testid="tab-timer-rules">
            <Clock className="h-4 w-4 mr-2" />
            Timer & Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scorecard" className="mt-6">
          <JudgeScorecard
            heatNumber={7}
            competitors={[
              { name: "Mike Johnson", code: "BR" },
              { name: "Sarah Williams", code: "GN" }
            ]}
            onSubmit={(scores) => console.log("Scores submitted:", scores)}
          />
        </TabsContent>

        <TabsContent value="timer" className="mt-6 space-y-6">
          <TimerPanel readOnly={true} />
          <CompetitionRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BaristaView() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="timer" data-testid="tab-timer-rules">
            <Clock className="h-4 w-4 mr-2" />
            Timer & Rules
          </TabsTrigger>
          <TabsTrigger value="bracket" data-testid="tab-bracket-view">
            <Trophy className="h-4 w-4 mr-2" />
            Live Bracket
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="mt-6 space-y-6">
          <TimerPanel readOnly={true} />
          <CompetitionRules />
        </TabsContent>

        <TabsContent value="bracket" className="mt-6">
          <TournamentBracket />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Router() {
  const [currentRole, setCurrentRole] = useState<"admin" | "judge" | "barista" | "station_lead">("admin");

  return (
    <Switch>
      <Route path="/station/:stationId">
        {(params) => (
          <div className="min-h-screen bg-background">
            <Header 
              currentRole={currentRole} 
              onRoleChange={setCurrentRole}
              tournamentName="World Espresso Championships"
              currentRound={1}
            />
            <main className="container mx-auto py-6 px-4">
              <StationPage />
            </main>
          </div>
        )}
      </Route>
      <Route path="/">
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
            {currentRole === "station_lead" && <StationLeadView />}
          </main>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
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
