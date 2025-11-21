/**
 * Score Validation Utility
 * Verifies that detailed scores sum to aggregated scores
 */

interface JudgeDetailedScore {
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

interface AggregatedScore {
  matchId: number;
  judgeId: number;
  competitorId: number;
  segment: string;
  score: number;
  judgeName: string;
}

const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};

/**
 * Calculate total score for a competitor from detailed scores
 */
function calculateScoreFromDetailed(
  detailedScores: JudgeDetailedScore[],
  matchId: number,
  competitorId: number,
  competitorPosition: 'left' | 'right'
): number {
  return detailedScores
    .filter(score => score.matchId === matchId)
    .reduce((total, score) => {
      let points = 0;
      if (score.visualLatteArt === competitorPosition) points += CATEGORY_POINTS.visualLatteArt;
      if (score.taste === competitorPosition) points += CATEGORY_POINTS.taste;
      if (score.tactile === competitorPosition) points += CATEGORY_POINTS.tactile;
      if (score.flavour === competitorPosition) points += CATEGORY_POINTS.flavour;
      if (score.overall === competitorPosition) points += CATEGORY_POINTS.overall;
      return total + points;
    }, 0);
}

/**
 * Get aggregated score for a competitor from a specific judge
 */
function getAggregatedScore(
  aggregatedScores: AggregatedScore[],
  matchId: number,
  judgeName: string,
  competitorId: number
): number {
  const score = aggregatedScores.find(
    s => s.matchId === matchId && s.judgeName === judgeName && s.competitorId === competitorId
  );
  return score?.score || 0;
}

/**
 * Validate that detailed scores match aggregated scores
 * Returns array of discrepancies found
 */
export interface ScoreDiscrepancy {
  matchId: number;
  competitorId: number;
  judgeName: string;
  detailedTotal: number;
  aggregatedTotal: number;
  difference: number;
}

export function validateScores(
  detailedScores: JudgeDetailedScore[],
  aggregatedScores: AggregatedScore[],
  matches: Array<{ id: number; competitor1Id: number | null; competitor2Id: number | null }>
): ScoreDiscrepancy[] {
  const discrepancies: ScoreDiscrepancy[] = [];

  // For each match, validate scores
  matches.forEach(match => {
    if (!match.competitor1Id || !match.competitor2Id) return;

    // Get all judges who scored this match
    const matchJudges = new Set(
      detailedScores
        .filter(s => s.matchId === match.id)
        .map(s => s.judgeName)
    );

    matchJudges.forEach(judgeName => {
      const judgeDetailedScores = detailedScores.filter(
        s => s.matchId === match.id && s.judgeName === judgeName
      );

      if (judgeDetailedScores.length === 0) return;

      // Calculate scores for both competitors
      const competitor1Detailed = calculateScoreFromDetailed(
        judgeDetailedScores,
        match.id,
        match.competitor1Id,
        'left'
      );
      const competitor2Detailed = calculateScoreFromDetailed(
        judgeDetailedScores,
        match.id,
        match.competitor2Id,
        'right'
      );

      // Get aggregated scores
      const competitor1Aggregated = getAggregatedScore(
        aggregatedScores,
        match.id,
        judgeName,
        match.competitor1Id
      );
      const competitor2Aggregated = getAggregatedScore(
        aggregatedScores,
        match.id,
        judgeName,
        match.competitor2Id
      );

      // Check for discrepancies
      if (competitor1Detailed !== competitor1Aggregated) {
        discrepancies.push({
          matchId: match.id,
          competitorId: match.competitor1Id,
          judgeName: judgeName,
          detailedTotal: competitor1Detailed,
          aggregatedTotal: competitor1Aggregated,
          difference: competitor1Detailed - competitor1Aggregated,
        });
      }

      if (competitor2Detailed !== competitor2Aggregated) {
        discrepancies.push({
          matchId: match.id,
          competitorId: match.competitor2Id,
          judgeName: judgeName,
          detailedTotal: competitor2Detailed,
          aggregatedTotal: competitor2Aggregated,
          difference: competitor2Detailed - competitor2Aggregated,
        });
      }
    });
  });

  return discrepancies;
}

/**
 * Log score discrepancies to console
 */
export function logScoreDiscrepancies(discrepancies: ScoreDiscrepancy[]): void {
  if (discrepancies.length === 0) {
    console.log('✅ Score validation passed: All detailed scores match aggregated scores');
    return;
  }

  console.warn(`⚠️ Score validation found ${discrepancies.length} discrepancy(ies):`);
  discrepancies.forEach(d => {
    console.warn(
      `  Match ${d.matchId}, Competitor ${d.competitorId}, Judge ${d.judgeName}: ` +
      `Detailed=${d.detailedTotal}, Aggregated=${d.aggregatedTotal}, Difference=${d.difference}`
    );
  });
}

/**
 * Simple validation that logs discrepancies - use this when you don't have full match/competitor data
 */
export function validateScoresSimple(
  detailedScores: JudgeDetailedScore[],
  aggregatedScores: AggregatedScore[]
): void {
  // This is a simplified validation that just checks if we have matching data
  // Full validation requires match and competitor position data
  if (detailedScores.length === 0 || aggregatedScores.length === 0) {
    console.log('⚠️ Score validation skipped: Missing detailed or aggregated scores');
    return;
  }
  
  console.log(`✅ Score validation: Found ${detailedScores.length} detailed scores and ${aggregatedScores.length} aggregated scores`);
  console.log('   Note: Full validation requires match and competitor position data');
}

