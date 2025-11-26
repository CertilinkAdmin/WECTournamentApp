// Round 1 Generator - Creates Round 1 from signup-ordered competitors
// BYES are applied only in Round 1, to earliest signups

import type { Competitor, Round } from './types';
import { calculateByes } from './utils';

/**
 * Generates Round 1 from a list of competitors sorted by signupOrder
 * Assigns BYES to earliest signups to fill bracket to power-of-two
 */
export function generateRound1(competitors: Competitor[]): Round {
  const N = competitors.length;

  if (N === 0) {
    return {
      roundNumber: 1,
      heats: []
    };
  }

  // Calculate bracket size and byes needed
  const { bracketSize, byes } = calculateByes(N);

  // Mark first 'byes' competitors with status='bye'
  const competitorsWithByes = competitors.map((comp, index) => ({
    ...comp,
    status: index < byes ? ('bye' as const) : comp.status || ('active' as const)
  }));

  // Create heats by pairing indices [0,1], [2,3], etc.
  const heats: Round['heats'] = [];
  const numHeats = bracketSize / 2;

  for (let i = 0; i < numHeats; i++) {
    const indexA = i * 2;
    const indexB = i * 2 + 1;

    const competitorA = indexA < competitorsWithByes.length 
      ? competitorsWithByes[indexA] 
      : undefined;

    const competitorB = indexB < competitorsWithByes.length 
      ? competitorsWithByes[indexB] 
      : undefined;

    heats.push({
      id: `R1-H${i}`,
      round: 1,
      slot: i,
      competitorA,
      competitorB,
      winnerId: undefined,
      note: undefined
    });
  }

  return {
    roundNumber: 1,
    heats
  };
}