/**
 * Score Calculation Utility
 * Calculates scores using admin-assigned cup position mapping
 */

import type { JudgeDetailedScore } from '@shared/schema';

export interface CupPosition {
  cupCode: string;
  position: 'left' | 'right';
}

export const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

/**
 * Calculate total score for a competitor (by cup code) using cup position mapping
 * Judges score left/right (blind), admin assigns cup codes to positions
 */
export function calculateCompetitorScore(
  cupCode: string,
  detailedScores: JudgeDetailedScore[],
  cupPositions: CupPosition[]
): number {
  // Create mapping from position to cup code
  const positionToCupCode: Record<'left' | 'right', string> = {
    left: '',
    right: '',
  };

  cupPositions.forEach(pos => {
    positionToCupCode[pos.position] = pos.cupCode;
  });

  let total = 0;

  for (const score of detailedScores) {
    // Determine which position (left/right) this cup code was in
    const isLeftCup = positionToCupCode.left === cupCode;
    const isRightCup = positionToCupCode.right === cupCode;

    // If neither position matches this cup code, skip this judge entry
    if (!isLeftCup && !isRightCup) continue;

    // Award points based on judge's left/right selections
    // Visual Latte Art (3 points) - only for Cappuccino
    if (score.sensoryBeverage === 'Cappuccino' && score.visualLatteArt) {
      const winnerPosition = score.visualLatteArt as 'left' | 'right';
      if ((winnerPosition === 'left' && isLeftCup) || (winnerPosition === 'right' && isRightCup)) {
        total += CATEGORY_POINTS.visualLatteArt;
      }
    }

    // Taste (1 point)
    if (score.taste) {
      const winnerPosition = score.taste as 'left' | 'right';
      if ((winnerPosition === 'left' && isLeftCup) || (winnerPosition === 'right' && isRightCup)) {
        total += CATEGORY_POINTS.taste;
      }
    }

    // Tactile (1 point)
    if (score.tactile) {
      const winnerPosition = score.tactile as 'left' | 'right';
      if ((winnerPosition === 'left' && isLeftCup) || (winnerPosition === 'right' && isRightCup)) {
        total += CATEGORY_POINTS.tactile;
      }
    }

    // Flavour (1 point)
    if (score.flavour) {
      const winnerPosition = score.flavour as 'left' | 'right';
      if ((winnerPosition === 'left' && isLeftCup) || (winnerPosition === 'right' && isRightCup)) {
        total += CATEGORY_POINTS.flavour;
      }
    }

    // Overall (5 points) - derived from majority of sensory categories (Taste, Tactile, Flavour)
    let leftWins = 0;
    let rightWins = 0;

    if (score.taste === 'left') leftWins++;
    if (score.taste === 'right') rightWins++;
    if (score.tactile === 'left') leftWins++;
    if (score.tactile === 'right') rightWins++;
    if (score.flavour === 'left') leftWins++;
    if (score.flavour === 'right') rightWins++;

    let overallWinner: 'left' | 'right' | null = null;
    if (leftWins > rightWins) {
      overallWinner = 'left';
    } else if (rightWins > leftWins) {
      overallWinner = 'right';
    }

    if (
      overallWinner &&
      ((overallWinner === 'left' && isLeftCup) || (overallWinner === 'right' && isRightCup))
    ) {
      total += CATEGORY_POINTS.overall;
    }
  }

  return total;
}

/**
 * Calculate scores for both competitors in a match
 */
export function calculateMatchScores(
  detailedScores: JudgeDetailedScore[],
  cupPositions: CupPosition[],
  cupCode1: string,
  cupCode2: string
): { cupCode1Score: number; cupCode2Score: number } {
  const cupCode1Score = calculateCompetitorScore(cupCode1, detailedScores, cupPositions);
  const cupCode2Score = calculateCompetitorScore(cupCode2, detailedScores, cupPositions);

  return { cupCode1Score, cupCode2Score };
}

