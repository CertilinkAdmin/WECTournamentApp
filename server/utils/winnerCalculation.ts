/**
 * Winner Calculation Utility
 * Automatically calculates match winners based on detailed scores and cup positions
 */

import { storage } from '../storage';
import { calculateCompetitorScore } from '../../client/src/utils/scoreCalculation';
import type { Match, JudgeDetailedScore, MatchCupPosition } from '@shared/schema';

export interface WinnerCalculationResult {
  winnerId: number | null;
  competitor1Score: number;
  competitor2Score: number;
  tie: boolean;
  tieBreakerReason?: string;
  error?: string;
}

/**
 * Calculate the winner of a match based on detailed scores
 * Returns the competitor ID with the higher score, or null if tied
 */
export async function calculateMatchWinner(matchId: number): Promise<WinnerCalculationResult> {
  try {
    // Get match details
    const match = await storage.getMatch(matchId);
    if (!match) {
      return {
        winnerId: null,
        competitor1Score: 0,
        competitor2Score: 0,
        tie: false,
        error: 'Match not found'
      };
    }

    // Validate match has both competitors
    if (!match.competitor1Id || !match.competitor2Id) {
      return {
        winnerId: null,
        competitor1Score: 0,
        competitor2Score: 0,
        tie: false,
        error: 'Match must have both competitors to calculate winner'
      };
    }

    // Get detailed scores
    const detailedScores = await storage.getMatchDetailedScores(matchId);
    if (detailedScores.length === 0) {
      return {
        winnerId: null,
        competitor1Score: 0,
        competitor2Score: 0,
        tie: false,
        error: 'No detailed scores found for this match'
      };
    }

    // Get cup positions
    const cupPositions = await storage.getMatchCupPositions(matchId);
    if (cupPositions.length === 0) {
      return {
        winnerId: null,
        competitor1Score: 0,
        competitor2Score: 0,
        tie: false,
        error: 'Cup positions must be assigned before calculating winner'
      };
    }

    // Get competitor cup codes
    const participants = await storage.getTournamentParticipants(match.tournamentId);
    const competitor1 = participants.find(p => p.userId === match.competitor1Id);
    const competitor2 = participants.find(p => p.userId === match.competitor2Id);

    if (!competitor1 || !competitor2) {
      return {
        winnerId: null,
        competitor1Score: 0,
        competitor2Score: 0,
        tie: false,
        error: 'Could not find competitor participants'
      };
    }

    const cupCode1 = competitor1.cupCode || '';
    const cupCode2 = competitor2.cupCode || '';

    if (!cupCode1 || !cupCode2) {
      return {
        winnerId: null,
        competitor1Score: 0,
        competitor2Score: 0,
        tie: false,
        error: 'Both competitors must have cup codes assigned'
      };
    }

    // Calculate scores for both competitors
    const competitor1Score = calculateCompetitorScore(
      cupCode1,
      detailedScores,
      cupPositions.map(p => ({ cupCode: p.cupCode, position: p.position }))
    );

    const competitor2Score = calculateCompetitorScore(
      cupCode2,
      detailedScores,
      cupPositions.map(p => ({ cupCode: p.cupCode, position: p.position }))
    );

    // Determine winner
    if (competitor1Score > competitor2Score) {
      return {
        winnerId: match.competitor1Id,
        competitor1Score,
        competitor2Score,
        tie: false
      };
    } else if (competitor2Score > competitor1Score) {
      return {
        winnerId: match.competitor2Id,
        competitor1Score,
        competitor2Score,
        tie: false
      };
    } else {
      // Tied scores - use tie-breaker
      return await breakTie(match, detailedScores, cupPositions, cupCode1, cupCode2, competitor1Score);
    }
  } catch (error: any) {
    return {
      winnerId: null,
      competitor1Score: 0,
      competitor2Score: 0,
      tie: false,
      error: error.message || 'Error calculating winner'
    };
  }
}

/**
 * Break tie using tie-breaker rules:
 * 1. Most overall wins (5pt category)
 * 2. Most latte art wins (3pt category)
 * 3. Most sensory category wins (1pt each: taste, tactile, flavour)
 * 4. If still tied, return null (requires manual resolution)
 */
async function breakTie(
  match: Match,
  detailedScores: JudgeDetailedScore[],
  cupPositions: MatchCupPosition[],
  cupCode1: string,
  cupCode2: string,
  tiedScore: number
): Promise<WinnerCalculationResult> {
  // Create position mapping
  const positionToCupCode: Record<'left' | 'right', string> = {
    left: '',
    right: ''
  };
  cupPositions.forEach(pos => {
    positionToCupCode[pos.position] = pos.cupCode;
  });

  const isLeft1 = positionToCupCode.left === cupCode1;
  const isRight1 = positionToCupCode.right === cupCode1;
  const isLeft2 = positionToCupCode.left === cupCode2;
  const isRight2 = positionToCupCode.right === cupCode2;

  // Count category wins for each competitor
  let competitor1OverallWins = 0;
  let competitor2OverallWins = 0;
  let competitor1LatteArtWins = 0;
  let competitor2LatteArtWins = 0;
  let competitor1SensoryWins = 0;
  let competitor2SensoryWins = 0;

  for (const score of detailedScores) {
    // Overall wins (5pt)
    if (score.overall === 'left' && isLeft1) competitor1OverallWins++;
    if (score.overall === 'right' && isRight1) competitor1OverallWins++;
    if (score.overall === 'left' && isLeft2) competitor2OverallWins++;
    if (score.overall === 'right' && isRight2) competitor2OverallWins++;

    // Latte Art wins (3pt) - only for Cappuccino judge
    if (score.sensoryBeverage === 'Cappuccino' && score.visualLatteArt) {
      if (score.visualLatteArt === 'left' && isLeft1) competitor1LatteArtWins++;
      if (score.visualLatteArt === 'right' && isRight1) competitor1LatteArtWins++;
      if (score.visualLatteArt === 'left' && isLeft2) competitor2LatteArtWins++;
      if (score.visualLatteArt === 'right' && isRight2) competitor2LatteArtWins++;
    }

    // Sensory category wins (1pt each)
    if (score.taste === 'left' && isLeft1) competitor1SensoryWins++;
    if (score.taste === 'right' && isRight1) competitor1SensoryWins++;
    if (score.taste === 'left' && isLeft2) competitor2SensoryWins++;
    if (score.taste === 'right' && isRight2) competitor2SensoryWins++;

    if (score.tactile === 'left' && isLeft1) competitor1SensoryWins++;
    if (score.tactile === 'right' && isRight1) competitor1SensoryWins++;
    if (score.tactile === 'left' && isLeft2) competitor2SensoryWins++;
    if (score.tactile === 'right' && isRight2) competitor2SensoryWins++;

    if (score.flavour === 'left' && isLeft1) competitor1SensoryWins++;
    if (score.flavour === 'right' && isRight1) competitor1SensoryWins++;
    if (score.flavour === 'left' && isLeft2) competitor2SensoryWins++;
    if (score.flavour === 'right' && isRight2) competitor2SensoryWins++;
  }

  // Tie-breaker 1: Most overall wins
  if (competitor1OverallWins > competitor2OverallWins) {
    return {
      winnerId: match.competitor1Id,
      competitor1Score: tiedScore,
      competitor2Score: tiedScore,
      tie: true,
      tieBreakerReason: `Tie broken by overall wins: ${competitor1OverallWins} vs ${competitor2OverallWins}`
    };
  } else if (competitor2OverallWins > competitor1OverallWins) {
    return {
      winnerId: match.competitor2Id,
      competitor1Score: tiedScore,
      competitor2Score: tiedScore,
      tie: true,
      tieBreakerReason: `Tie broken by overall wins: ${competitor2OverallWins} vs ${competitor1OverallWins}`
    };
  }

  // Tie-breaker 2: Most latte art wins
  if (competitor1LatteArtWins > competitor2LatteArtWins) {
    return {
      winnerId: match.competitor1Id,
      competitor1Score: tiedScore,
      competitor2Score: tiedScore,
      tie: true,
      tieBreakerReason: `Tie broken by latte art wins: ${competitor1LatteArtWins} vs ${competitor2LatteArtWins}`
    };
  } else if (competitor2LatteArtWins > competitor1LatteArtWins) {
    return {
      winnerId: match.competitor2Id,
      competitor1Score: tiedScore,
      competitor2Score: tiedScore,
      tie: true,
      tieBreakerReason: `Tie broken by latte art wins: ${competitor2LatteArtWins} vs ${competitor1LatteArtWins}`
    };
  }

  // Tie-breaker 3: Most sensory category wins
  if (competitor1SensoryWins > competitor2SensoryWins) {
    return {
      winnerId: match.competitor1Id,
      competitor1Score: tiedScore,
      competitor2Score: tiedScore,
      tie: true,
      tieBreakerReason: `Tie broken by sensory category wins: ${competitor1SensoryWins} vs ${competitor2SensoryWins}`
    };
  } else if (competitor2SensoryWins > competitor1SensoryWins) {
    return {
      winnerId: match.competitor2Id,
      competitor1Score: tiedScore,
      competitor2Score: tiedScore,
      tie: true,
      tieBreakerReason: `Tie broken by sensory category wins: ${competitor2SensoryWins} vs ${competitor1SensoryWins}`
    };
  }

  // Still tied after all tie-breakers - requires manual resolution
  return {
    winnerId: null,
    competitor1Score: tiedScore,
    competitor2Score: tiedScore,
    tie: true,
    tieBreakerReason: 'Complete tie after all tie-breakers - manual resolution required'
  };
}

