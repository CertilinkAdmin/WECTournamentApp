import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, ChevronLeft, ChevronRight, Users, Trophy } from "lucide-react";
import type { Match, User, Station, HeatJudge } from "@shared/schema";

const ITEMS_PER_PAGE = 5;

export default function StationPage() {
  const [, params] = useRoute("/station/:stationId");
  const stationId = params?.stationId ? parseInt(params.stationId) : null;
  const [currentPage, setCurrentPage] = useState(0);

  // Reset pagination when station changes
  useEffect(() => {
    setCurrentPage(0);
  }, [stationId]);

  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['/api/stations'],
  });

  const station = stations.find(s => s.id === stationId);

  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ['/api/stations', stationId, 'matches', { limit: ITEMS_PER_PAGE, offset: currentPage * ITEMS_PER_PAGE }],
    queryFn: async () => {
      const response = await fetch(`/api/stations/${stationId}/matches?limit=${ITEMS_PER_PAGE}&offset=${currentPage * ITEMS_PER_PAGE}`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    },
    enabled: !!stationId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const getUserById = (id: number | null | undefined) => {
    if (!id) return null;
    return users.find(u => u.id === id) || null;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!stationId || !station) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <CardContent className="text-center">
            <p className="text-muted-foreground">Station not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasNextPage = matches.length === ITEMS_PER_PAGE;
  const hasPrevPage = currentPage > 0;

  return (
    <div className="space-y-6 p-6">
      <Card className="bg-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-primary">
            <MapPin className="h-8 w-8" />
            <div>
              <div className="text-3xl font-bold">Station {station.name}</div>
              {station.location && (
                <div className="text-sm text-muted-foreground font-normal mt-1">
                  {station.location}
                </div>
              )}
            </div>
            <Badge 
              variant={station.status === 'AVAILABLE' ? 'default' : station.status === 'BUSY' ? 'secondary' : 'outline'}
              className="ml-auto"
              data-testid={`badge-station-status`}
            >
              {station.status}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold">Matches</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={!hasPrevPage || matchesLoading}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!hasNextPage || matchesLoading}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {matchesLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No matches scheduled for this station yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                users={users}
                getInitials={getInitials}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1}
        </p>
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  users: User[];
  getInitials: (name: string) => string;
}

function MatchCard({ match, users, getInitials }: MatchCardProps) {
  const { data: judges = [] } = useQuery<HeatJudge[]>({
    queryKey: ['/api/matches', match.id, 'judges'],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${match.id}/judges`);
      if (!response.ok) throw new Error('Failed to fetch judges');
      return response.json();
    },
  });

  const getUserById = (id: number | null | undefined) => {
    if (!id) return null;
    return users.find(u => u.id === id) || null;
  };

  const competitor1 = getUserById(match.competitor1Id);
  const competitor2 = getUserById(match.competitor2Id);
  const winner = getUserById(match.winnerId);

  const getJudgeUsers = () => {
    return judges.map(j => users.find(u => u.id === j.judgeId)).filter(Boolean) as User[];
  };

  const judgeUsers = getJudgeUsers();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'READY': return 'default';
      case 'RUNNING': return 'default';
      case 'DONE': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card data-testid={`card-match-${match.id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">
          Heat #{match.heatNumber} - Round {match.round}
        </CardTitle>
        <Badge variant={getStatusColor(match.status)} data-testid={`badge-match-status-${match.id}`}>
          {match.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Competitors</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CompetitorCard 
              competitor={competitor1} 
              getInitials={getInitials}
              isWinner={winner?.id === competitor1?.id}
              position="left"
              data-testid={`competitor-1-${match.id}`}
            />
            <CompetitorCard 
              competitor={competitor2} 
              getInitials={getInitials}
              isWinner={winner?.id === competitor2?.id}
              position="right"
              data-testid={`competitor-2-${match.id}`}
            />
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Judges ({judgeUsers.length})</h3>
          </div>
          {judgeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid={`no-judges-${match.id}`}>
              No judges assigned yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {judgeUsers.map((judge, idx) => (
                <JudgeCard 
                  key={judge.id} 
                  judge={judge} 
                  role={judges[idx]?.role}
                  getInitials={getInitials}
                  data-testid={`judge-${judge.id}-${match.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompetitorCardProps {
  competitor: User | null;
  getInitials: (name: string) => string;
  isWinner: boolean;
  position: 'left' | 'right';
}

function CompetitorCard({ competitor, getInitials, isWinner }: CompetitorCardProps) {
  if (!competitor) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
        <Avatar>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">TBD</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isWinner ? 'bg-primary/5 border-primary' : ''}`}>
      <Avatar>
        <AvatarFallback className={isWinner ? 'bg-primary text-primary-foreground' : ''}>
          {getInitials(competitor.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" data-testid={`text-competitor-name-${competitor.id}`}>
          {competitor.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{competitor.email}</p>
      </div>
      {isWinner && (
        <Trophy className="h-4 w-4 text-primary flex-shrink-0" data-testid={`icon-winner-${competitor.id}`} />
      )}
    </div>
  );
}

interface JudgeCardProps {
  judge: User;
  role?: 'HEAD' | 'TECHNICAL' | 'SENSORY';
  getInitials: (name: string) => string;
}

function JudgeCard({ judge, role, getInitials }: JudgeCardProps) {
  const getRoleColor = (r?: string) => {
    switch (r) {
      case 'HEAD': return 'default';
      case 'TECHNICAL': return 'secondary';
      case 'SENSORY': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getInitials(judge.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" data-testid={`text-judge-name-${judge.id}`}>
          {judge.name}
        </p>
        {role && (
          <Badge variant={getRoleColor(role)} className="text-xs mt-1" data-testid={`badge-judge-role-${judge.id}`}>
            {role}
          </Badge>
        )}
      </div>
    </div>
  );
}
