import type { Station } from '@shared/schema';

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

export const getStationLetter = (stationName: string, enabledStations: string[] = ['A', 'B', 'C']): string | null => {
  const normalized = normalizeStationName(stationName);
  return enabledStations.includes(normalized) ? normalized : null;
};

export const isMainStation = (stationName: string, enabledStations: string[] = ['A', 'B', 'C']): boolean => {
  return enabledStations.includes(normalizeStationName(stationName));
};

export const findStationByLetter = (stations: Array<{ id: number; name: string }>, letter: string) => {
  return stations.find(s => normalizeStationName(s.name) === letter);
};

export type StationWithNormalizedName = Station & { normalizedName: string };

const dedupeByLetter = (
  stations: StationWithNormalizedName[],
  enabledStations: string[]
): StationWithNormalizedName[] => {
  const buckets: Record<string, StationWithNormalizedName[]> = {};

  for (const station of stations) {
    if (!buckets[station.normalizedName]) {
      buckets[station.normalizedName] = [];
    }
    buckets[station.normalizedName].push(station);
  }

  const result: StationWithNormalizedName[] = [];

  // Use enabledStations order instead of hardcoded LETTER_PRIORITY
  for (const letter of enabledStations) {
    const bucket = buckets[letter];
    if (bucket && bucket.length > 0) {
      result.push(bucket[0]);
    }
  }

  return result;
};

export function getMainStationsForTournament(
  stations: Station[],
  tournamentId?: number | null,
  enabledStations: string[] = ['A', 'B', 'C']
): StationWithNormalizedName[] {
  const eligibleStations: StationWithNormalizedName[] = stations
    .map((station) => ({
      ...station,
      normalizedName: normalizeStationName(station.name),
    }))
    .filter((station) => isMainStation(station.name, enabledStations));

  if (eligibleStations.length === 0) {
    return [];
  }

  const groupedByTournament = new Map<number, StationWithNormalizedName[]>();
  for (const station of eligibleStations) {
    const group = groupedByTournament.get(station.tournamentId) ?? [];
    group.push(station);
    groupedByTournament.set(station.tournamentId, group);
  }

  const appendFromCandidates = (
    current: StationWithNormalizedName[],
    candidates: StationWithNormalizedName[],
    enabledStations: string[]
  ) => {
    const existingLetters = new Set(current.map((station) => station.normalizedName));

    for (const station of candidates) {
      if (existingLetters.has(station.normalizedName)) continue;
      current.push(station);
      existingLetters.add(station.normalizedName);
      if (current.length === enabledStations.length) {
        break;
      }
    }
  };

  const preferredGroup = tournamentId ? groupedByTournament.get(tournamentId) ?? [] : [];
  const mainStations: StationWithNormalizedName[] = dedupeByLetter(preferredGroup, enabledStations);

  if (mainStations.length < enabledStations.length) {
    const sortedGroups = Array.from(groupedByTournament.entries())
      .sort((a, b) => {
        const coverageDifference =
          dedupeByLetter(b[1], enabledStations).length - dedupeByLetter(a[1], enabledStations).length;
        if (coverageDifference !== 0) return coverageDifference;
        return a[0] - b[0];
      });

    for (const [groupId, stationsList] of sortedGroups) {
      if (tournamentId && groupId === tournamentId) continue;
      appendFromCandidates(mainStations, dedupeByLetter(stationsList, enabledStations), enabledStations);
      if (mainStations.length === enabledStations.length) {
        break;
      }
    }
  }

  return mainStations;
}
