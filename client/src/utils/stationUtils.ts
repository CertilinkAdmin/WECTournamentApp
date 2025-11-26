/**
 * Station Utilities
 * 
 * Converts station IDs to station letters (A, B, C, etc.)
 * 
 * IMPORTANT: This assumes stationId values are 1-indexed:
 * - stationId 1 → 'A'
 * - stationId 2 → 'B'
 * - stationId 3 → 'C'
 * - etc.
 * 
 * This is a temporary solution. Ideally, station names should be fetched
 * from the stations table via the API. If stationId doesn't follow this
 * pattern, this function will produce incorrect results.
 * 
 * @param stationId - The station ID from the database (should be 1-indexed)
 * @param fallback - The value to return if stationId is invalid (default: 'A')
 * @returns Station letter (A-Z) or fallback value
 */
export function stationIdToLetter(stationId: number | null | undefined, fallback: string = 'A'): string {
  // Handle null/undefined
  if (stationId == null) {
    return fallback;
  }

  // Validate: stationId must be a positive integer between 1 and 26
  // (26 is the maximum for single letters A-Z)
  if (!Number.isInteger(stationId) || stationId < 1 || stationId > 26) {
    console.warn(
      `Invalid stationId: ${stationId}. Expected integer between 1-26. ` +
      `Using fallback: ${fallback}. ` +
      `Consider fetching station name from API instead.`
    );
    return fallback;
  }

  // Convert: 1 → 'A' (65), 2 → 'B' (66), etc.
  // ASCII 'A' is 65, so 64 + stationId gives us the correct letter
  const charCode = 64 + stationId;
  const letter = String.fromCharCode(charCode);

  return letter;
}

/**
 * Validates that a station ID is within the valid range for single-letter stations
 * 
 * @param stationId - The station ID to validate
 * @returns true if valid (1-26), false otherwise
 */
export function isValidStationId(stationId: number | null | undefined): boolean {
  if (stationId == null) return false;
  return Number.isInteger(stationId) && stationId >= 1 && stationId <= 26;
}

/**
 * Station utilities for consistent station identification and matching
 */

export const normalizeStationName = (name: string): string => {
  return name.replace(/^Station\s*/i, '').trim().toUpperCase();
};

export const getStationLetter = (stationName: string): 'A' | 'B' | 'C' | null => {
  const normalized = normalizeStationName(stationName);
  return ['A', 'B', 'C'].includes(normalized) ? normalized as 'A' | 'B' | 'C' : null;
};

export const isMainStation = (stationName: string): boolean => {
  return ['A', 'B', 'C'].includes(normalizeStationName(stationName));
};

export const findStationByLetter = (stations: Array<{ id: number; name: string }>, letter: 'A' | 'B' | 'C') => {
  return stations.find(s => normalizeStationName(s.name) === letter);
};
