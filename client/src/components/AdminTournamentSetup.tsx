import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Trophy, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminTournamentSetup() {
  const { toast } = useToast();
  const [tournamentName, setTournamentName] = useState("World Espresso Championships");
  const [totalCompetitors, setTotalCompetitors] = useState(32);

  // todo: remove mock functionality
  const mockCompetitors = Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    name: `Competitor ${i + 1}`,
    seed: i + 1
  }));

  const mockJudges = [
    { id: "1", name: "Sarah Johnson", role: "Head Judge" },
    { id: "2", name: "Mike Chen", role: "Technical" },
    { id: "3", name: "Emma Davis", role: "Sensory" }
  ];

  const handleCreateTournament = () => {
    console.log("Creating tournament:", { tournamentName, totalCompetitors });
    toast({
      title: "Tournament Created",
      description: `${tournamentName} has been initialized with ${totalCompetitors} competitors.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-primary/10">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Trophy className="h-6 w-6" />
            Tournament Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                data-testid="input-tournament-name"
              />
            </div>
            <div>
              <Label htmlFor="total-competitors">Total Competitors</Label>
              <Input
                id="total-competitors"
                type="number"
                value={totalCompetitors}
                onChange={(e) => setTotalCompetitors(Number(e.target.value))}
                data-testid="input-total-competitors"
              />
            </div>
          </div>
          <Button onClick={handleCreateTournament} className="w-full" data-testid="button-create-tournament">
            <Plus className="h-4 w-4 mr-2" />
            Initialize Tournament
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="competitors" data-testid="tab-competitors">
            <Users className="h-4 w-4 mr-2" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="judges" data-testid="tab-judges">
            <Trophy className="h-4 w-4 mr-2" />
            Judges
          </TabsTrigger>
          <TabsTrigger value="stations" data-testid="tab-stations">
            <MapPin className="h-4 w-4 mr-2" />
            Stations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Competitor Registration</span>
                <Badge variant="secondary">{mockCompetitors.length} registered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockCompetitors.map((competitor) => (
                  <div
                    key={competitor.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        #{competitor.seed}
                      </Badge>
                      <span className="font-medium">{competitor.name}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4" data-testid="button-add-competitor">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competitor
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judges" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Judge Assignments</span>
                <Badge variant="secondary">{mockJudges.length} judges</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockJudges.map((judge) => (
                  <div
                    key={judge.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{judge.name}</span>
                      <Badge variant="secondary">{judge.role}</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      Reassign
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4" data-testid="button-add-judge">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Judge
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Station Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["A", "B", "C"].map((station) => (
                  <div
                    key={station}
                    className="flex items-center justify-between p-4 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-heading font-bold">Station {station}</div>
                      <Badge variant="secondary">Available</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
