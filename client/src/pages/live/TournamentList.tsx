import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, ChevronRight, Home } from 'lucide-react';
import { format } from 'date-fns';
import ThemeToggle from '../../components/ThemeToggle';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  totalRounds: number;
  currentRound: number;
}

export default function TournamentList() {
  const navigate = useNavigate();

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const sortedTournaments = tournaments?.sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateA - dateB;
  });

  const handleTournamentClick = (tournament: Tournament) => {
    if (tournament.status === 'ACTIVE') {
      navigate(`/live/${tournament.id}`);
    } else if (tournament.status === 'COMPLETED') {
      navigate(`/results/${tournament.id}`);
    }
  };

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600 text-white" data-testid={`badge-status-active`}>LIVE</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary" data-testid={`badge-status-completed`}>Completed</Badge>;
      case 'SETUP':
        return <Badge variant="outline" className="text-muted-foreground" data-testid={`badge-status-setup`}>Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const getShortName = (name: string): string => {
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Global Header */}
      <header className="bg-primary/80 backdrop-blur-sm text-primary-foreground border-b border-primary-border/50">
        <div className="px-4 py-4 flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-20"></div>
          
          {/* Center: WEC Logo */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 text-primary-foreground">
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold tracking-wider">WEC</div>
                <div className="text-xs opacity-80">CHAMPIONSHIPS</div>
              </div>
            </div>
          </div>
          
          {/* Right: Home + Theme Toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="p-2 hover-elevate active-elevate-2 rounded-md"
              data-testid="link-home"
            >
              <Home className="w-4 h-4" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      {/* Page Title */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Tournaments</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">Select a tournament to view live or completed results</p>
        </div>
      </div>

      {/* Tournament List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-3">
          {sortedTournaments?.map((tournament) => {
            const isClickable = tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED';
            
            return (
              <Card
                key={tournament.id}
                className={`
                  ${isClickable ? 'hover-elevate active-elevate-2 cursor-pointer' : 'opacity-60'}
                  transition-all
                `}
                onClick={() => handleTournamentClick(tournament)}
                data-testid={`card-tournament-${tournament.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">
                          {tournament.name}
                        </CardTitle>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getShortName(tournament.name)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tournament.status)}
                      {isClickable && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {tournament.status === 'SETUP' || !tournament.startDate ? (
                      <span>Coming Soon</span>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(tournament.startDate), 'MMMM d, yyyy')}
                          {tournament.endDate && 
                            ` - ${format(new Date(tournament.endDate), 'MMMM d, yyyy')}`
                          }
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
