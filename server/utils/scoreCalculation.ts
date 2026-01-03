/**
 * Score Calculation and Storage Utility
 * Calculates aggregated heat scores from judge detailed scores and stores them in heat_scores table
 */

import { storage } from '../storage';
import { db } from '../db';
import { heatScores, matches, tournamentParticipants, heatJudges, users } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { calculateCompetitorScore } from '../../client/src/utils/scoreCalculation';

/**
 * Calculate and store heat scores for a match from judge detailed scores
 * This aggregates scores from judge_detailed_scores into heat_scores for leaderboard display
 */
export async function calculateAndStoreHeatScores(matchId: number): Promise<{
  success: boolean;
  competitor1Score: number;
  competitor2Score: number;
  error?: string;
}> {
  try {
    // Get match details
    const match = await storage.getMatch(matchId);
    if (!match) {
      return {
        success: false,
        competitor1Score: 0,
        competitor2Score: 0,
        error: 'Match not found'
      };
    }

    // Skip if match doesn't have both competitors (BYE match)
    if (!match.competitor1Id || !match.competitor2Id) {
      return {
        success: true,
        competitor1Score: 0,
        competitor2Score: 0
      };
    }

    // Get detailed scores
    const detailedScores = await storage.getMatchDetailedScores(matchId);
    if (detailedScores.length === 0) {
      // No scores yet, clear any existing heat scores
      await db.delete(heatScores).where(eq(heatScores.matchId, matchId));
      return {
        success: true,
        competitor1Score: 0,
        competitor2Score: 0
      };
    }

    // Get cup positions (required for score calculation)
    const cupPositions = await storage.getMatchCupPositions(matchId);
    if (cupPositions.length === 0) {
      // Cup positions not assigned yet, can't calculate scores
      // Clear existing heat scores
      await db.delete(heatScores).where(eq(heatScores.matchId, matchId));
      return {
        success: true,
        competitor1Score: 0,
        competitor2Score: 0
      };
    }

    // Get competitor cup codes
    const participants = await storage.getTournamentParticipants(match.tournamentId);
    const competitor1 = participants.find(p => p.userId === match.competitor1Id);
    const competitor2 = participants.find(p => p.userId === match.competitor2Id);

    if (!competitor1 || !competitor2) {
      return {
        success: false,
        competitor1Score: 0,
        competitor2Score: 0,
        error: 'Could not find competitor participants'
      };
    }

    const cupCode1 = competitor1.cupCode || '';
    const cupCode2 = competitor2.cupCode || '';

    if (!cupCode1 || !cupCode2) {
      // Cup codes not assigned yet
      await db.delete(heatScores).where(eq(heatScores.matchId, matchId));
      return {
        success: true,
        competitor1Score: 0,
        competitor2Score: 0
      };
    }

    // Calculate total scores for both competitors
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

    // Get judges for this match to store scores per judge
    const matchJudges = await storage.getMatchJudges(matchId);
    
    // Delete existing heat scores for this match (only once)
    await db.delete(heatScores).where(eq(heatScores.matchId, matchId));

    // Store aggregated scores - one entry per competitor with total score

    // Store total score per competitor
    // Use a special judgeId (0 or first judge) to indicate this is an aggregate score
    // The leaderboard will sum these scores per competitor
    if (matchJudges.length > 0) {
      // Store total score for competitor 1
      await db.insert(heatScores).values({
        matchId: match.id,
        judgeId: matchJudges[0].judgeId,
        competitorId: match.competitor1Id,
        segment: 'DIAL_IN', // Using DIAL_IN as aggregate segment for total score
        score: competitor1Score,
        notes: 'Total score aggregated from all judge detailed scores'
      });

      // Store total score for competitor 2
      await db.insert(heatScores).values({
        matchId: match.id,
        judgeId: matchJudges[0].judgeId,
        competitorId: match.competitor2Id,
        segment: 'DIAL_IN', // Using DIAL_IN as aggregate segment for total score
        score: competitor2Score,
        notes: 'Total score aggregated from all judge detailed scores'
      });
    }

    return {
      success: true,
      competitor1Score,
      competitor2Score
    };
  } catch (error: any) {
    console.error('Error calculating and storing heat scores:', error);
    return {
      success: false,
      competitor1Score: 0,
      competitor2Score: 0,
      error: error.message || 'Error calculating scores'
    };
  }
}

/**
 * Calculate and store heat scores for all matches in a tournament
 */
export async function calculateAndStoreAllHeatScores(tournamentId: number): Promise<{
  success: boolean;
  matchesProcessed: number;
  errors: string[];
}> {
  try {
    const matches = await storage.getTournamentMatches(tournamentId);
    const errors: string[] = [];
    let matchesProcessed = 0;

    for (const match of matches) {
      try {
        const result = await calculateAndStoreHeatScores(match.id);
        if (result.success) {
          matchesProcessed++;
        } else if (result.error) {
          errors.push(`Match ${match.id}: ${result.error}`);
        }
      } catch (error: any) {
        errors.push(`Match ${match.id}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      matchesProcessed,
      errors
    };
  } catch (error: any) {
    return {
      success: false,
      matchesProcessed: 0,
      errors: [error.message || 'Error processing matches']
    };
  }
}

