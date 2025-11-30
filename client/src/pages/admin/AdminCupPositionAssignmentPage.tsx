import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AdminCupPositionAssignment from '@/components/AdminCupPositionAssignment';
import type { Match } from '@shared/schema';

export default function AdminCupPositionAssignmentPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const matchIdNum = matchId ? parseInt(matchId) : null;

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: [`/api/matches/${matchIdNum}`],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchIdNum}`);
      if (!response.ok) throw new Error('Failed to fetch match');
      return response.json();
    },
    enabled: !!matchIdNum,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading match...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match || !matchIdNum) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Match not found</p>
            <Button onClick={() => navigate('/admin/tournaments')} className="mt-4">
              Back to Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/tournaments')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>
        <h1 className="text-3xl font-bold mb-2">
          Assign Cup Positions
        </h1>
        <p className="text-muted-foreground">
          Round {match.round}, Heat {match.heatNumber}
        </p>
      </div>

      <AdminCupPositionAssignment
        matchId={matchIdNum}
        tournamentId={match.tournamentId}
        onSuccess={() => {
          // Optionally navigate back or show success
        }}
      />
    </div>
  );
}

