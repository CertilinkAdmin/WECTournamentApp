/**
 * Utility functions for transforming tournament API responses
 * Handles both camelCase and snake_case field names from the API
 */

export interface TransformedMatch {
  id: number;
  round: number;
  heatNumber: number;
  status: string;
  startTime: string | null;
  endTime: string | null;
  competitor1Id: number | null;
  competitor2Id: number | null;
  winnerId: number | null;
  competitor1Name: string;
  competitor2Name: string;
  stationId?: number | null;
}

export interface TransformedJudgeDetailedScore {
  matchId: number;
  judgeName: string;
  leftCupCode: string;
  rightCupCode: string;
  sensoryBeverage: string;
  visualLatteArt: 'left' | 'right';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}

export interface TransformedTournamentData {
  tournament: any;
  matches: TransformedMatch[];
  detailedScores: TransformedJudgeDetailedScore[];
}

/**
 * Transform API response to ensure consistent camelCase field names
 * Handles both camelCase (from drizzle) and snake_case (from raw DB queries)
 */
export function transformTournamentData(data: any): TransformedTournamentData {
  return {
    tournament: data.tournament,
    matches: (data.matches || []).map((m: any) => ({
      id: m.id,
      round: m.round,
      heatNumber: m.heatNumber || m.heat_number,
      status: m.status,
      startTime: m.startTime || m.start_time,
      endTime: m.endTime || m.end_time,
      competitor1Id: m.competitor1Id || m.competitor1_id,
      competitor2Id: m.competitor2Id || m.competitor2_id,
      winnerId: m.winnerId || m.winner_id,
      competitor1Name: m.competitor1Name || m.competitor1_name || '',
      competitor2Name: m.competitor2Name || m.competitor2_name || '',
      stationId: m.stationId || m.station_id,
    })),
    detailedScores: (data.detailedScores || []).map((s: any) => ({
      matchId: s.matchId || s.match_id,
      judgeName: s.judgeName || s.judge_name,
      leftCupCode: s.leftCupCode || s.left_cup_code,
      rightCupCode: s.rightCupCode || s.right_cup_code,
      sensoryBeverage: s.sensoryBeverage || s.sensory_beverage,
      visualLatteArt: (s.visualLatteArt || s.visual_latte_art) as 'left' | 'right',
      taste: (s.taste) as 'left' | 'right',
      tactile: (s.tactile) as 'left' | 'right',
      flavour: (s.flavour || s.flavor) as 'left' | 'right',
      overall: (s.overall) as 'left' | 'right',
    })),
  };
}

