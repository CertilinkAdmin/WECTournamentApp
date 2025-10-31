import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Tournament = {
  id: number;
  name: string;
};

type Participant = {
  id: number;
  name: string;
};

type Score = {
  matchId: number;
  judgeId: number;
  competitorId: number;
  score: number;
};

type FullTournamentResponse = {
  tournament: Tournament;
  participants: Participant[];
  matches: any[];
  scores: Score[];
};

export default function Standings() {
  const [error, setError] = useState<string | null>(null);

  // Fetch all tournaments, then full data for the WEC 2025 Milano tournament
  const { data: tournaments = [] } = useQuery<any[]>({ queryKey: ['/api/tournaments'] });

  const currentTournament = useMemo(() => {
    return tournaments.find((t) => t.name === 'World Espresso Championships 2025 Milano');
  }, [tournaments]);

  const { data: fullData } = useQuery<FullTournamentResponse>({
    queryKey: ['/api/tournaments', currentTournament?.id],
    enabled: !!currentTournament?.id,
  });

  useEffect(() => {
    if (tournaments && tournaments.length > 0 && !currentTournament) {
      setError('WEC 2025 Milano tournament not found');
    }
  }, [tournaments, currentTournament]);

  const standings = useMemo(() => {
    if (!fullData) return [] as Array<{ participantId: number; name: string; total: number }>
    const participantIdToName = new Map<number, string>();
    fullData.participants.forEach((p) => participantIdToName.set(p.id, p.name || 'Unknown'));

    const totals = new Map<number, number>();
    (fullData.scores || []).forEach((s) => {
      totals.set(s.competitorId, (totals.get(s.competitorId) || 0) + (s.score || 0));
    });

    const rows: Array<{ participantId: number; name: string; total: number }> = [];
    participantIdToName.forEach((name, id) => {
      rows.push({ participantId: id, name, total: totals.get(id) || 0 });
    });

    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [fullData]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading tournaments…</p>
      </div>
    );
  }

  if (!fullData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading standings…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Final Standings</span>
              <Badge variant="secondary">{standings.length} competitors</Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {standings.map((row, idx) => (
                <div key={row.participantId} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-right font-mono text-sm text-muted-foreground">{idx + 1}</div>
                    <div className="font-medium">{row.name}</div>
                  </div>
                  <div className="font-bold text-primary">{row.total}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


