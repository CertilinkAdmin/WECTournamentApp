// Heat Resolver - Resolves winner based on BYE or NO SHOW logic
// Preserves no-show competitor name in the heat

import type { Heat } from './types';

/**
 * Resolves the outcome of a heat based on BYE or NO SHOW logic
 * Preserves the no-show competitor's name in the heat
 */
export function resolveHeat(heat: Heat): Heat {
  const { competitorA, competitorB } = heat;
  
  // If one side has status='bye' and other is empty, bye advances
  if (competitorA?.status === 'bye' && !competitorB) {
    return {
      ...heat,
      winnerId: competitorA.id,
      note: 'BYE advances'
    };
  }
  
  if (competitorB?.status === 'bye' && !competitorA) {
    return {
      ...heat,
      winnerId: competitorB.id,
      note: 'BYE advances'
    };
  }
  
  // If competitorA is no-show and competitorB is present & not no-show
  if (competitorA?.status === 'no-show' && competitorB && competitorB.status !== 'no-show') {
    return {
      ...heat,
      winnerId: competitorB.id,
      note: `${competitorA.name} NO SHOW`
    };
  }
  
  // If competitorB is no-show and competitorA is present & not no-show
  if (competitorB?.status === 'no-show' && competitorA && competitorA.status !== 'no-show') {
    return {
      ...heat,
      winnerId: competitorA.id,
      note: `${competitorB.name} NO SHOW`
    };
  }
  
  // If both sides are no-show
  if (competitorA?.status === 'no-show' && competitorB?.status === 'no-show') {
    return {
      ...heat,
      winnerId: undefined, // Leave unresolved
      note: 'DOUBLE NO SHOW'
    };
  }
  
  // Neither is bye/no-show - return unchanged (judges/manual scoring will fill winnerId)
  return heat;
}

