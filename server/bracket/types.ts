// Bracket Domain Types
// Supports head-to-head, round-based bracket system with BYES in Round 1 only

export type CompetitorStatus = 'active' | 'no-show' | 'bye';

export interface Competitor {
  id: string;
  name: string;
  signupOrder: number;
  status?: CompetitorStatus;
}

export interface Heat {
  id: string;
  round: number;
  slot: number; // Position within the round (0-indexed)
  competitorA?: Competitor;
  competitorB?: Competitor;
  winnerId?: string;
  note?: string;
}

export interface Round {
  roundNumber: number;
  heats: Heat[];
}

export interface TournamentBracket {
  id: string;
  name: string;
  rounds: Round[];
}

