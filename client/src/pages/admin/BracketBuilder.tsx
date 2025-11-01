import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Plus, ChevronRight, Users, Settings2 } from 'lucide-react';

// Types matching server/bracket/types.ts
type CompetitorStatus = 'active' | 'no-show' | 'bye';

interface Competitor {
  id: string;
  name: string;
  signupOrder: number;
  status?: CompetitorStatus;
}

interface Heat {
  id: string;
  round: number;
  slot: number;
  competitorA?: Competitor;
  competitorB?: Competitor;
  winnerId?: string;
  note?: string;
}

interface Round {
  roundNumber: number;
  heats: Heat[];
}

const BracketBuilder: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  // Fetch competitors from API (users with BARISTA role)
  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      const users = await response.json();
      const baristas = users
        .filter((u: any) => u.role === 'BARISTA')
        .map((u: any, index: number) => ({
          id: String(u.id),
          name: u.name,
          signupOrder: index + 1,
          status: 'active' as CompetitorStatus
        }));
      setCompetitors(baristas);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    }
  };

  const addCompetitor = () => {
    if (!newCompetitorName.trim()) return;
    
    const newCompetitor: Competitor = {
      id: `comp-${Date.now()}`,
      name: newCompetitorName.trim(),
      signupOrder: competitors.length + 1,
      status: 'active'
    };
    
    setCompetitors([...competitors, newCompetitor]);
    setNewCompetitorName('');
  };

  const generateRound1 = async () => {
    try {
      const response = await fetch('/api/bracket/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors: competitors.sort((a, b) => a.signupOrder - b.signupOrder) }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to generate bracket');
      
      const data = await response.json();
      setRounds([data.round]);
      setSelectedRoundIndex(0);
    } catch (error) {
      console.error('Error generating Round 1:', error);
      alert('Failed to generate bracket. Check console for details.');
    }
  };

  const buildNextRound = async () => {
    if (rounds.length === 0) return;
    
    try {
      // Use buildNextRound logic from server
      const lastRound = rounds[rounds.length - 1];
      const nextRoundNumber = lastRound.roundNumber + 1;
      
      // Collect winners
      const winners: (Competitor | null)[] = [];
      for (const heat of lastRound.heats) {
        if (!heat.winnerId) {
          winners.push({
            id: `BYE-${heat.id}`,
            name: 'NO OPPONENT',
            signupOrder: -1,
            status: 'bye'
          });
        } else {
          const winner = heat.competitorA?.id === heat.winnerId 
            ? heat.competitorA 
            : heat.competitorB?.id === heat.winnerId 
              ? heat.competitorB 
              : null;
          winners.push(winner);
        }
      }
      
      // Pair winners into heats
      const nextRoundHeats: Heat[] = [];
      const numHeats = winners.length / 2;
      for (let i = 0; i < numHeats; i++) {
        const indexA = i * 2;
        const indexB = i * 2 + 1;
        nextRoundHeats.push({
          id: `R${nextRoundNumber}-H${i}`,
          round: nextRoundNumber,
          slot: i,
          competitorA: winners[indexA] || undefined,
          competitorB: winners[indexB] || undefined,
          winnerId: undefined,
          note: undefined
        });
      }
      
      const nextRound: Round = {
        roundNumber: nextRoundNumber,
        heats: nextRoundHeats
      };
      
      setRounds([...rounds, nextRound]);
      setSelectedRoundIndex(rounds.length);
    } catch (error) {
      console.error('Error building next round:', error);
    }
  };

  const resolveHeat = (roundIndex: number, heatIndex: number) => {
    const updatedRounds = [...rounds];
    const heat = updatedRounds[roundIndex].heats[heatIndex];
    
    const { competitorA, competitorB } = heat;
    
    // Apply resolve logic
    if (competitorA?.status === 'bye' && !competitorB) {
      heat.winnerId = competitorA.id;
      heat.note = 'BYE advances';
    } else if (competitorB?.status === 'bye' && !competitorA) {
      heat.winnerId = competitorB.id;
      heat.note = 'BYE advances';
    } else if (competitorA?.status === 'no-show' && competitorB && competitorB.status !== 'no-show') {
      heat.winnerId = competitorB.id;
      heat.note = `${competitorA.name} NO SHOW`;
    } else if (competitorB?.status === 'no-show' && competitorA && competitorA.status !== 'no-show') {
      heat.winnerId = competitorA.id;
      heat.note = `${competitorB.name} NO SHOW`;
    } else if (competitorA?.status === 'no-show' && competitorB?.status === 'no-show') {
      heat.winnerId = undefined;
      heat.note = 'DOUBLE NO SHOW';
    }
    
    setRounds(updatedRounds);
  };

  const setHeatWinner = (roundIndex: number, heatIndex: number, winnerId: string) => {
    const updatedRounds = [...rounds];
    updatedRounds[roundIndex].heats[heatIndex].winnerId = winnerId;
    updatedRounds[roundIndex].heats[heatIndex].note = undefined;
    setRounds(updatedRounds);
  };

  const markNoShow = (roundIndex: number, heatIndex: number, side: 'A' | 'B') => {
    const updatedRounds = [...rounds];
    const heat = updatedRounds[roundIndex].heats[heatIndex];
    
    if (side === 'A' && heat.competitorA) {
      heat.competitorA.status = 'no-show';
    } else if (side === 'B' && heat.competitorB) {
      heat.competitorB.status = 'no-show';
    }
    
    // Auto-resolve after marking no-show
    resolveHeat(roundIndex, heatIndex);
  };

  const currentRound = rounds[selectedRoundIndex];

  return (
    <div className="bracket-builder p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          Bracket Builder
        </h1>
        <p className="text-muted-foreground">Generate and manage tournament brackets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Competitors */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Competitors ({competitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add competitor name"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
              />
              <Button onClick={addCompetitor} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {competitors.map((comp) => (
                <div
                  key={comp.id}
                  className="p-2 bg-muted rounded flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{comp.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Signup #{comp.signupOrder}
                      {comp.status && comp.status !== 'active' && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {comp.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={generateRound1} 
              className="w-full"
              disabled={competitors.length < 2}
            >
              Generate Round 1 Bracket
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Bracket Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Tournament Bracket
              </CardTitle>
              {rounds.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedRoundIndex}
                    onChange={(e) => setSelectedRoundIndex(Number(e.target.value))}
                    className="px-3 py-1 border rounded bg-background"
                  >
                    {rounds.map((r, i) => (
                      <option key={i} value={i}>
                        Round {r.roundNumber}
                      </option>
                    ))}
                  </select>
                  {currentRound && currentRound.heats.every(h => h.winnerId) && (
                    <Button onClick={buildNextRound} size="sm">
                      Build Next Round
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentRound ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Round {currentRound.roundNumber} - {currentRound.heats.length} heats
                </div>
                
                <div className="grid gap-4">
                  {currentRound.heats.map((heat, heatIndex) => (
                    <Card key={heat.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Competitor A */}
                          <div className={`p-3 rounded border-2 ${
                            heat.winnerId === heat.competitorA?.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Competitor A</Label>
                              {heat.competitorA && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markNoShow(selectedRoundIndex, heatIndex, 'A')}
                                    className="text-xs"
                                  >
                                    Mark No-Show
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={heat.winnerId === heat.competitorA.id ? 'default' : 'outline'}
                                    onClick={() => setHeatWinner(selectedRoundIndex, heatIndex, heat.competitorA!.id)}
                                  >
                                    Win
                                  </Button>
                                </div>
                              )}
                            </div>
                            {heat.competitorA ? (
                              <div>
                                <div className="font-semibold">{heat.competitorA.name}</div>
                                {heat.competitorA.status && heat.competitorA.status !== 'active' && (
                                  <Badge variant="secondary" className="mt-1">
                                    {heat.competitorA.status}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-muted-foreground italic">Empty</div>
                            )}
                          </div>
                          
                          {/* VS */}
                          <div className="flex items-center justify-center">
                            <ChevronRight className="h-6 w-6 text-muted-foreground" />
                          </div>
                          
                          {/* Competitor B */}
                          <div className={`p-3 rounded border-2 ${
                            heat.winnerId === heat.competitorB?.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Competitor B</Label>
                              {heat.competitorB && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => markNoShow(selectedRoundIndex, heatIndex, 'B')}
                                    className="text-xs"
                                  >
                                    Mark No-Show
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={heat.winnerId === heat.competitorB.id ? 'default' : 'outline'}
                                    onClick={() => setHeatWinner(selectedRoundIndex, heatIndex, heat.competitorB!.id)}
                                  >
                                    Win
                                  </Button>
                                </div>
                              )}
                            </div>
                            {heat.competitorB ? (
                              <div>
                                <div className="font-semibold">{heat.competitorB.name}</div>
                                {heat.competitorB.status && heat.competitorB.status !== 'active' && (
                                  <Badge variant="secondary" className="mt-1">
                                    {heat.competitorB.status}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-muted-foreground italic">Empty</div>
                            )}
                          </div>
                        </div>
                        
                        {heat.note && (
                          <div className="mt-2 text-sm text-muted-foreground italic">
                            Note: {heat.note}
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          Heat {heat.slot + 1} - ID: {heat.id}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No bracket generated yet. Add competitors and generate Round 1.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BracketBuilder;

