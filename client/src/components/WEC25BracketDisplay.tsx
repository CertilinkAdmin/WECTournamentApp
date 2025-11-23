import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, MapPin, Clock } from 'lucide-react';
import { WEC25_BRACKET_POSITIONS, WEC25_ROUND2_POSITIONS, WEC25_ROUND3_POSITIONS, WEC25_ROUND4_POSITIONS, WEC25_FINAL_POSITION } from './WEC25BracketData';

interface BracketHeatProps {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner?: string;
  score1?: number;
  score2?: number;
  isWinner?: boolean;
  isFinal?: boolean;
}

function BracketHeat({ heatNumber, station, competitor1, competitor2, winner, score1, score2, isWinner = false, isFinal = false }: BracketHeatProps) {
  const getStationColor = (station: string) => {
    switch (station) {
      case 'A': return 'bg-primary text-white';
      case 'B': return 'bg-chart-3 text-white';
      case 'C': return 'bg-chart-1 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`min-h-[140px] transition-all duration-300 ${isFinal ? 'ring-4 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-xl' : isWinner ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' : 'hover:shadow-xl hover:scale-105'}`}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Heat {heatNumber}</span>
          </div>
          <Badge className={`${getStationColor(station)} text-sm font-medium`}>
            Station {station}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className={`p-3 rounded-lg border-2 transition-all duration-200 ${competitor1 === 'BYE' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-gradient-to-r from-secondary to-secondary/80 dark:from-white dark:to-slate-50 border-slate-200 shadow-sm'} ${winner === competitor1 ? 'ring-2 ring-green-400 bg-green-50 border-green-300 shadow-lg' : 'hover:shadow-md'}`}>
            <div className="flex justify-between items-center">
              <div className="font-semibold text-base text-slate-800">
                {competitor1}
              </div>
              {score1 !== undefined && (
                <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {score1}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center text-slate-600 font-bold text-sm tracking-wider">VS</div>
          
          <div className={`p-3 rounded-lg border-2 transition-all duration-200 ${competitor2 === 'BYE' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-gradient-to-r from-secondary to-secondary/80 dark:from-white dark:to-slate-50 border-slate-200 shadow-sm'} ${winner === competitor2 ? 'ring-2 ring-green-400 bg-green-50 border-green-300 shadow-lg' : 'hover:shadow-md'}`}>
            <div className="flex justify-between items-center">
              <div className="font-semibold text-base text-slate-800">
                {competitor2}
              </div>
              {score2 !== undefined && (
                <div className="text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {score2}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {winner && (
          <div className="mt-4 text-center">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-4 py-2 shadow-lg">
              🏆 Winner: {winner}
            </Badge>
          </div>
        )}
        
        {isFinal && (
          <div className="mt-4 text-center">
            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold px-4 py-2 shadow-lg animate-pulse">
              🏆 CHAMPIONSHIP FINAL
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WEC25BracketDisplay() {
  return (
    <div className="min-h-screen bg-background p-6" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">WEC25 Tournament Bracket</h1>
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground">
            World Espresso Championship 2025 - Complete Tournament Bracket
          </p>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">22</div>
              <div className="text-sm text-muted-foreground">Competitors</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">31</div>
              <div className="text-sm text-muted-foreground">Total Heats</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Stations</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm text-muted-foreground">Rounds</div>
            </CardContent>
          </Card>
        </div>

        {/* Bracket Display */}
        <div className="bg-secondary dark:bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Round 1 */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Round 1</h2>
                <p className="text-sm text-muted-foreground">16 Heats</p>
              </div>
              
              <div className="space-y-3">
                {WEC25_BRACKET_POSITIONS.map((heat, index) => (
                  <BracketHeat
                    key={heat.heatNumber}
                    heatNumber={heat.heatNumber}
                    station={heat.station}
                    competitor1={heat.competitor1}
                    competitor2={heat.competitor2}
                    winner={heat.winner}
                    score1={heat.score1}
                    score2={heat.score2}
                  />
                ))}
              </div>
            </div>

            {/* Round 2 */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Round 2</h2>
                <p className="text-sm text-muted-foreground">8 Heats</p>
              </div>
              
              <div className="space-y-6">
                {WEC25_ROUND2_POSITIONS.map((heat, index) => (
                  <BracketHeat
                    key={heat.heatNumber}
                    heatNumber={heat.heatNumber}
                    station={heat.station}
                    competitor1={heat.competitor1}
                    competitor2={heat.competitor2}
                    winner={heat.winner}
                    score1={heat.score1}
                    score2={heat.score2}
                  />
                ))}
              </div>
            </div>

            {/* Round 3 */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Round 3</h2>
                <p className="text-sm text-muted-foreground">4 Heats</p>
              </div>
              
              <div className="space-y-8">
                {WEC25_ROUND3_POSITIONS.map((heat, index) => (
                  <BracketHeat
                    key={heat.heatNumber}
                    heatNumber={heat.heatNumber}
                    station={heat.station}
                    competitor1={heat.competitor1}
                    competitor2={heat.competitor2}
                    winner={heat.winner}
                    score1={heat.score1}
                    score2={heat.score2}
                  />
                ))}
              </div>
            </div>

            {/* Semi-Finals */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Semi-Finals</h2>
                <p className="text-sm text-muted-foreground">2 Heats</p>
              </div>
              
              <div className="space-y-12">
                {WEC25_ROUND4_POSITIONS.map((heat, index) => (
                  <BracketHeat
                    key={heat.heatNumber}
                    heatNumber={heat.heatNumber}
                    station={heat.station}
                    competitor1={heat.competitor1}
                    competitor2={heat.competitor2}
                    winner={heat.winner}
                    score1={heat.score1}
                    score2={heat.score2}
                  />
                ))}
              </div>
            </div>

            {/* Finals */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <img src="/trophy.png" alt="Championship Trophy" className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">Finals</h2>
                <p className="text-sm text-muted-foreground">1 Heat</p>
              </div>
              
              <div className="flex justify-center">
                {WEC25_FINAL_POSITION.map((heat, index) => (
                  <BracketHeat
                    key={heat.heatNumber}
                    heatNumber={heat.heatNumber}
                    station={heat.station}
                    competitor1={heat.competitor1}
                    competitor2={heat.competitor2}
                    winner={heat.winner}
                    score1={heat.score1}
                    score2={heat.score2}
                    isFinal={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Station Legend */}
        <div className="mt-8 flex justify-center">
          <Card className="p-4">
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <span className="text-sm font-medium">Station A</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-chart-3"></div>
                  <span className="text-sm font-medium">Station B</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-chart-1"></div>
                  <span className="text-sm font-medium">Station C</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tournament Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Station Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Station A</span>
                  <Badge className="bg-primary text-white">11 Heats</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Station B</span>
                  <Badge className="bg-chart-3 text-white">10 Heats</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Station C</span>
                  <Badge className="bg-chart-1 text-white">10 Heats</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tournament Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Competitors</span>
                  <span className="font-bold">22</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Bye Entries</span>
                  <span className="font-bold">10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Direct Matches</span>
                  <span className="font-bold">6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Rounds</span>
                  <span className="font-bold">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
