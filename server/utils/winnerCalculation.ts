/**
 * Winner Calculation Utility
 * Automatically calculates match winners based on detailed scores and cup positions
 * Supports per-judge cup positions for blind judging integrity
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

// Helper to get judge ID from judge name
async function getJudgeIdFromName(judgeName: string): Promise<number | null> {
  const users = await storage.getAllUsers();
  const judge = users.find(u => u.name === judgeName && u.role === 'JUDGE');
  return judge?.id || null;
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

    // Get all cup positions (both legacy and per-judge)
    const allCupPositions = await storage.getAllJudgeCupPositions(matchId);

    // Check if we have per-judge positions (judgeId is not null)
    const hasPerJudgePositions = allCupPositions.some(p => p.judgeId !== null);

    let competitor1Score = 0;
    let competitor2Score = 0;

    if (hasPerJudgePositions) {
      // Use per-judge cup positions for calculation
      // Group scores by judge and calculate using each judge's own cup positions
      const uniqueJudgeNames = [...new Set(detailedScores.map(s => s.judgeName))];

      for (const judgeName of uniqueJudgeNames) {
        const judgeId = await getJudgeIdFromName(judgeName);
        const judgeScores = detailedScores.filter(s => s.judgeName === judgeName);

        // Get this judge's cup positions
        let judgePositions: MatchCupPosition[] = [];
        if (judgeId) {
          judgePositions = await storage.getJudgeCupPositions(matchId, judgeId);
        }

        // If judge hasn't entered their cup positions, try legacy positions as fallback
        if (judgePositions.length === 0) {
          judgePositions = await storage.getLegacyCupPositions(matchId);
        }

        // If still no positions, skip this judge's scores
        if (judgePositions.length === 0) {
          console.warn(`No cup positions found for judge ${judgeName} (ID: ${judgeId}) - skipping their scores`);
          continue;
        }

        // Calculate this judge's contribution to each competitor's score
        competitor1Score += calculateCompetitorScore(
          cupCode1,
          judgeScores,
          judgePositions.map(p => ({ cupCode: p.cupCode, position: p.position }))
        );

        competitor2Score += calculateCompetitorScore(
          cupCode2,
          judgeScores,
          judgePositions.map(p => ({ cupCode: p.cupCode, position: p.position }))
        );
      }
    } else {
      // Legacy mode: use global cup positions for all judges
      competitor1Score = calculateCompetitorScore(
        cupCode1,
        detailedScores,
        cupPositions.map(p => ({ cupCode: p.cupCode, position: p.position }))
      );

      competitor2Score = calculateCompetitorScore(
        cupCode2,
        detailedScores,
        cupPositions.map(p => ({ cupCode: p.cupCode, position: p.position }))
      );
    }

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
      // For tie-breaking, we need to pass per-judge position info if available
      return await breakTie(match, matchId, detailedScores, allCupPositions, cupCode1, cupCode2, competitor1Score, hasPerJudgePositions);
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
  matchId: number,
  detailedScores: JudgeDetailedScore[],
  allCupPositions: MatchCupPosition[],
  cupCode1: string,
  cupCode2: string,
  tiedScore: number,
  hasPerJudgePositions: boolean
): Promise<WinnerCalculationResult> {
  // Count category wins for each competitor
  let competitor1OverallWins = 0;
  let competitor2OverallWins = 0;
  let competitor1LatteArtWins = 0;
  let competitor2LatteArtWins = 0;
  let competitor1SensoryWins = 0;
  let competitor2SensoryWins = 0;

  // Helper to count wins for a single score with given positions
  const countWinsForScore = (
    score: JudgeDetailedScore,
    positionToCupCode: Record<'left' | 'right', string>
  ) => {
    const isLeft1 = positionToCupCode.left === cupCode1;
    const isRight1 = positionToCupCode.right === cupCode1;
    const isLeft2 = positionToCupCode.left === cupCode2;
    const isRight2 = positionToCupCode.right === cupCode2;

    // Overall wins (5pt)
    if (score.overall === 'left' && isLeft1) competitor1OverallWins++;
    if (score.overall === 'right' && isRight1) competitor1OverallWins++;
    if (score.overall === 'left' && isLeft2) competitor2OverallWins++;
    if (score.overall === 'right' && isRight2) competitor2OverallWins++;

    // Latte Art wins (3pt)
    if (score.visualLatteArt) {
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
  };

  if (hasPerJudgePositions) {
    // Use per-judge positions for tie-breaking
    const uniqueJudgeNames = [...new Set(detailedScores.map(s => s.judgeName))];

    for (const judgeName of uniqueJudgeNames) {
      const judgeId = await getJudgeIdFromName(judgeName);
      const judgeScores = detailedScores.filter(s => s.judgeName === judgeName);

      // Get this judge's cup positions
      let judgePositions: MatchCupPosition[] = [];
      if (judgeId) {
        judgePositions = await storage.getJudgeCupPositions(matchId, judgeId);
      }

      // If judge hasn't entered their cup positions, try legacy positions as fallback
      if (judgePositions.length === 0) {
        judgePositions = await storage.getLegacyCupPositions(matchId);
      }

      // Skip if no positions found
      if (judgePositions.length === 0) continue;

      // Build position mapping for this judge
      const positionToCupCode: Record<'left' | 'right', string> = { left: '', right: '' };
      judgePositions.forEach(pos => {
        positionToCupCode[pos.position] = pos.cupCode;
      });

      // Count wins for this judge's scores
      for (const score of judgeScores) {
        countWinsForScore(score, positionToCupCode);
      }
    }
  } else {
    // Legacy mode: use global cup positions
    const positionToCupCode: Record<'left' | 'right', string> = { left: '', right: '' };
    allCupPositions.forEach(pos => {
      positionToCupCode[pos.position] = pos.cupCode;
    });

    for (const score of detailedScores) {
      countWinsForScore(score, positionToCupCode);
    }
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

