// Manual Override - Allows admin to move competitors between heats

import type { Heat } from './types';

export interface MoveFrom {
  heatId: string;
  side: 'A' | 'B';
}

export interface MoveTo {
  heatId: string;
  side: 'A' | 'B';
}

/**
 * Moves a competitor from one heat/slot to another
 * Returns a new array (immutable style) for UI re-rendering
 */
export function moveCompetitor(
  heats: Heat[],
  from: MoveFrom,
  to: MoveTo
): Heat[] {
  // Create a copy to avoid mutating input
  const newHeats = [...heats];
  
  // Find source and target heats
  const sourceHeatIndex = newHeats.findIndex(h => h.id === from.heatId);
  const targetHeatIndex = newHeats.findIndex(h => h.id === to.heatId);
  
  if (sourceHeatIndex === -1 || targetHeatIndex === -1) {
    // Heat not found - return original array
    return heats;
  }
  
  const sourceHeat = newHeats[sourceHeatIndex];
  const targetHeat = newHeats[targetHeatIndex];
  
  // Extract competitor from source side
  const competitor = from.side === 'A' ? sourceHeat.competitorA : sourceHeat.competitorB;
  
  if (!competitor) {
    // Source side is empty - no-op
    return heats;
  }
  
  // Create new source heat with competitor removed from source side
  const newSourceHeat: Heat = {
    ...sourceHeat,
    competitorA: from.side === 'A' ? undefined : sourceHeat.competitorA,
    competitorB: from.side === 'B' ? undefined : sourceHeat.competitorB,
    winnerId: undefined, // Reset winner when moving
    note: undefined
  };
  
  // Create new target heat with competitor assigned to target side
  const newTargetHeat: Heat = {
    ...targetHeat,
    competitorA: to.side === 'A' ? competitor : targetHeat.competitorA,
    competitorB: to.side === 'B' ? competitor : targetHeat.competitorB,
    winnerId: undefined, // Reset winner when moving
    note: undefined
  };
  
  // Update both heats in the array
  newHeats[sourceHeatIndex] = newSourceHeat;
  newHeats[targetHeatIndex] = newTargetHeat;
  
  return newHeats;
}

