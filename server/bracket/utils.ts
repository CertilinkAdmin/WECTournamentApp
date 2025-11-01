// Bracket utility functions for power-of-two calculations

/**
 * Returns the smallest power of two that is >= n
 */
export function nextPowerOfTwo(n: number): number {
  if (n <= 0) return 1;
  if (n === 1) return 1;
  
  // Find the next power of 2
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Calculates bracket size and number of byes needed
 * @param numCompetitors - Total number of competitors
 * @returns Object with bracketSize and number of byes
 */
export function calculateByes(numCompetitors: number): { bracketSize: number; byes: number } {
  const bracketSize = nextPowerOfTwo(numCompetitors);
  const byes = Math.max(0, bracketSize - numCompetitors);
  
  return { bracketSize, byes };
}

