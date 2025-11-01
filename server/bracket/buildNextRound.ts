// Next Round Builder - Constructs Round N+1 from winners of previous round

import type { Competitor, Round, Heat } from './types';

/**
 * Builds the next round from winners of the previous round
 * Handles double no-shows by creating placeholder competitors
 */
export function buildNextRound(prevRound: Round): Round {
  const nextRoundNumber = prevRound.roundNumber + 1;
  
  // Collect winners in order
  const winners: (Competitor | null)[] = [];
  
  for (const heat of prevRound.heats) {
    if (!heat.winnerId) {
      // Double no-show or unresolved - create placeholder
      winners.push({
        id: `BYE-${heat.id}`,
        name: 'NO OPPONENT',
        signupOrder: -1,
        status: 'bye'
      });
    } else {
      // Find winner competitor
      const winner = heat.competitorA?.id === heat.winnerId 
        ? heat.competitorA 
        : heat.competitorB?.id === heat.winnerId 
          ? heat.competitorB 
          : null;
      
      if (winner) {
        winners.push(winner);
      } else {
        // Winner ID exists but competitor not found - create placeholder
        winners.push({
          id: heat.winnerId,
          name: 'UNKNOWN WINNER',
          signupOrder: -1,
          status: 'bye'
        });
      }
    }
  }
  
  // Pair winners into heats: [0,1], [2,3], etc.
  const heats: Heat[] = [];
  const numHeats = winners.length / 2;
  
  for (let i = 0; i < numHeats; i++) {
    const indexA = i * 2;
    const indexB = i * 2 + 1;
    
    const competitorA = winners[indexA] || undefined;
    const competitorB = winners[indexB] || undefined;
    
    heats.push({
      id: `R${nextRoundNumber}-H${i}`,
      round: nextRoundNumber,
      slot: i,
      competitorA: competitorA || undefined,
      competitorB: competitorB || undefined,
      winnerId: undefined,
      note: undefined
    });
  }
  
  return {
    roundNumber: nextRoundNumber,
    heats
  };
}

