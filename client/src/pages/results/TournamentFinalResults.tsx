import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findTournamentBySlug } from '@/utils/tournamentUtils';

interface Participant {
  id: number;
  userId: number;
  name: string;
  finalRank: number | null;
  seed: number | null;
}

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

const TournamentFinalResults: React.FC = () => {
  const { tournamentSlug } = useParams<{ tournamentSlug: string }>();
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(true);
  const [calculationProgress, setCalculationProgress] = useState(0);

  // Find tournament by slug - use the same utility as other results pages
  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Use findTournamentBySlug for consistent tournament identification
  const tournament = useMemo(() => {
    if (!tournamentSlug || !tournaments.length) return null;
    
    // Try findTournamentBySlug first (for WEC2025, etc.)
    const found = findTournamentBySlug(tournaments, tournamentSlug);
    if (found) return found;
    
    // Fallback to exact name match (for test tournaments, etc.)
    const exactMatch = tournaments.find(t => 
      t.name?.toLowerCase().replace(/\s+/g, '-') === tournamentSlug.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Last resort: find by ID if slug is numeric
    const numericId = parseInt(tournamentSlug);
    if (!isNaN(numericId)) {
      return tournaments.find(t => t.id === numericId) || null;
    }
    
    return null;
  }, [tournaments, tournamentSlug]);

  // Fetch tournament data with participants
  const { data: tournamentData, isLoading } = useQuery<{
    tournament: Tournament;
    participants: Participant[];
  }>({
    queryKey: [`/api/tournaments/${tournament?.id}`],
    enabled: !!tournament?.id,
    refetchInterval: isCalculating ? 2000 : false,
  });

  const participants = tournamentData?.participants || [];

  // Simulate calculation progress
  useEffect(() => {
    if (isCalculating) {
      const interval = setInterval(() => {
        setCalculationProgress(prev => {
          if (prev >= 100) {
            setIsCalculating(false);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isCalculating]);

  // Get top 3 participants
  const podium = React.useMemo(() => {
    const ranked = participants
      .filter(p => p.finalRank !== null && p.finalRank <= 3)
      .sort((a, b) => (a.finalRank || 999) - (b.finalRank || 999));

    return {
      first: ranked.find(p => p.finalRank === 1),
      second: ranked.find(p => p.finalRank === 2),
      third: ranked.find(p => p.finalRank === 3),
    };
  }, [participants]);

  // Check if we have all podium positions
  const hasAllPodium = podium.first && podium.second && podium.third;

  // Auto-complete calculation when we have all podium positions
  useEffect(() => {
    if (hasAllPodium && isCalculating) {
      setTimeout(() => {
        setIsCalculating(false);
        setCalculationProgress(100);
      }, 1000);
    }
  }, [hasAllPodium, isCalculating]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isCalculating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h1 className="text-4xl font-bold text-primary">Calculating Results</h1>
            <p className="text-lg text-muted-foreground">
              Finalizing tournament standings and determining winners...
            </p>
          </div>
          
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${calculationProgress}%` }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {calculationProgress}% Complete
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            🏆 Tournament Results
          </h1>
          <p className="text-xl text-muted-foreground">
            {tournament?.name || 'Tournament'}
          </p>
        </div>

        {/* Podium Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
          {/* 2nd Place */}
          <div className="order-2 md:order-1 flex flex-col items-center">
            <Card className="w-full bg-card border-2 border-muted dark:border-secondary">
              <CardHeader className="text-center pb-2">
                <Medal className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <CardTitle className="text-2xl font-bold text-card-foreground">2nd Place</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {podium.second ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-card-foreground">{podium.second.name}</p>
                    <p className="text-sm text-muted-foreground">Seed #{podium.second.seed}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">TBD</p>
                )}
              </CardContent>
            </Card>
            <div className="h-16 md:h-24 w-full bg-card border-2 border-muted dark:border-secondary rounded-b-lg"></div>
          </div>

          {/* 1st Place */}
          <div className="order-1 md:order-2 flex flex-col items-center">
            <Card className="w-full bg-primary/10 dark:bg-primary/20 border-4 border-primary shadow-2xl">
              <CardHeader className="text-center pb-2">
                <Trophy className="h-16 w-16 mx-auto text-primary mb-2" />
                <CardTitle className="text-3xl font-bold text-primary">1st Place</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {podium.first ? (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-primary">{podium.first.name}</p>
                    <p className="text-sm text-muted-foreground">Seed #{podium.first.seed}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">TBD</p>
                )}
              </CardContent>
            </Card>
            <div className="h-24 md:h-32 w-full bg-primary/10 dark:bg-primary/20 border-4 border-primary rounded-b-lg"></div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 flex flex-col items-center">
            <Card className="w-full bg-accent/20 dark:bg-accent/10 border-2 border-accent">
              <CardHeader className="text-center pb-2">
                <Award className="h-12 w-12 mx-auto text-accent-foreground mb-2" />
                <CardTitle className="text-2xl font-bold text-accent-foreground">3rd Place</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {podium.third ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-accent-foreground">{podium.third.name}</p>
                    <p className="text-sm text-muted-foreground">Seed #{podium.third.seed}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">TBD</p>
                )}
              </CardContent>
            </Card>
            <div className="h-12 md:h-16 w-full bg-accent/20 dark:bg-accent/10 border-2 border-accent rounded-b-lg"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(`/results/${tournamentSlug}`)}
            variant="default"
            size="lg"
          >
            View Full Results
          </Button>
          <Button
            onClick={() => navigate('/results')}
            variant="outline"
            size="lg"
          >
            Back to Results
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TournamentFinalResults;

