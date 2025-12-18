/**
 * Round Completion Utility
 * Checks if a round is complete and all matches have winners
 */

import { storage } from '../storage';
import type { Match, Tournament } from '@shared/schema';

export interface RoundCompletionStatus {
  isComplete: boolean;
  round: number;
  totalMatches: number;
  completedMatches: number;
  matchesWithWinners: number;
  incompleteMatches: Match[];
  matchesWithoutWinners: Match[];
  stationStatus: StationCompletionStatus[];
  errors: string[];
}

export interface StationCompletionStatus {
  stationId: number;
  stationName: string;
  totalMatches: number;
  completedMatches: number;
  matchesWithWinners: number;
  incompleteMatches: Match[];
  matchesWithoutWinners: Match[];
  isComplete: boolean;
}

/**
 * Check if a round is complete for a tournament
 * A round is complete when:
 * 1. All matches in the round have status 'DONE'
 * 2. All matches have a winnerId assigned
 * 3. All stations have completed their heats
 */
export async function checkRoundCompletion(
  tournamentId: number,
  round: number
): Promise<RoundCompletionStatus> {
  // Get all matches for this round
  const allMatches = await storage.getTournamentMatches(tournamentId);
  const roundMatches = allMatches.filter(m => m.round === round);

  if (roundMatches.length === 0) {
    return {
      isComplete: false,
      round,
      totalMatches: 0,
      completedMatches: 0,
      matchesWithWinners: 0,
      incompleteMatches: [],
      matchesWithoutWinners: [],
      stationStatus: [],
      errors: [`No matches found for Round ${round}`]
    };
  }

  // Check match completion
  const completedMatches = roundMatches.filter(m => m.status === 'DONE');
  const incompleteMatches = roundMatches.filter(m => m.status !== 'DONE');
  const matchesWithWinners = roundMatches.filter(m => m.winnerId !== null);
  const matchesWithoutWinners = roundMatches.filter(m => m.winnerId === null);

  // Get station status
  const stationStatus = await getStationCompletionStatus(tournamentId, round, roundMatches);

  // Check if round is complete
  // Round is complete ONLY when:
  // 1. ALL matches in the round are DONE
  // 2. ALL matches have winners
  // 3. ALL stations that have matches in this round have completed ALL their heats
  const allMatchesComplete = incompleteMatches.length === 0;
  const allMatchesHaveWinners = matchesWithoutWinners.length === 0;
  
  // A station is complete if it has no matches (nothing to do) OR all its matches are done with winners
  // Round is complete only when ALL stations with matches are complete
  const stationsWithMatches = stationStatus.filter(s => s.totalMatches > 0);
  const allStationsComplete = stationsWithMatches.length === 0 || 
                               stationsWithMatches.every(s => s.isComplete);

  const errors: string[] = [];
  if (!allMatchesComplete) {
    errors.push(`${incompleteMatches.length} match(es) not yet completed`);
  }
  if (!allMatchesHaveWinners) {
    errors.push(`${matchesWithoutWinners.length} match(es) missing winners`);
  }
  if (!allStationsComplete) {
    const incompleteStations = stationStatus.filter(s => s.totalMatches > 0 && !s.isComplete);
    const stationDetails = incompleteStations.map(s => 
      `Station ${s.stationName}: ${s.incompleteMatches.length} incomplete heat(s), ${s.matchesWithoutWinners.length} without winner(s)`
    ).join('; ');
    errors.push(`${incompleteStations.length} station(s) have incomplete heats: ${stationDetails}`);
  }

  return {
    isComplete: allMatchesComplete && allMatchesHaveWinners && allStationsComplete,
    round,
    totalMatches: roundMatches.length,
    completedMatches: completedMatches.length,
    matchesWithWinners: matchesWithWinners.length,
    incompleteMatches,
    matchesWithoutWinners,
    stationStatus,
    errors
  };
}

/**
 * Get completion status for each station in the round
 */
async function getStationCompletionStatus(
  tournamentId: number,
  round: number,
  roundMatches: Match[]
): Promise<StationCompletionStatus[]> {
  // Get all stations for this tournament
  const allStations = await storage.getAllStations();
  // Tournament type is defined in @shared/schema - same type for regular and test tournaments
  const tournament: Tournament | undefined = await storage.getTournament(tournamentId);
  
  // Validate tournament exists (works for both regular and test tournaments)
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found. Tournament may not exist or may have been deleted.`);
  }
  
  // Tournament is now guaranteed to be defined (TypeScript type narrowing)
  const enabledStations = tournament.enabledStations || ['A', 'B', 'C'];
  const tournamentStations = allStations.filter(s => 
    s.tournamentId === tournamentId && enabledStations.includes(s.name)
  );

  // Group matches by station
  const matchesByStation = new Map<number, Match[]>();
  roundMatches.forEach(match => {
    if (match.stationId) {
      if (!matchesByStation.has(match.stationId)) {
        matchesByStation.set(match.stationId, []);
      }
      matchesByStation.get(match.stationId)!.push(match);
    }
  });

  // Build station status
  // A station is complete for a round ONLY when:
  // 1. It has matches assigned in this round
  // 2. ALL its matches in this round are DONE
  // 3. ALL its matches in this round have winners
  return tournamentStations.map(station => {
    const stationMatches = matchesByStation.get(station.id) || [];
    const completedMatches = stationMatches.filter(m => m.status === 'DONE');
    const incompleteMatches = stationMatches.filter(m => m.status !== 'DONE');
    const matchesWithWinners = stationMatches.filter(m => m.winnerId !== null);
    const matchesWithoutWinners = stationMatches.filter(m => m.winnerId === null);

    // Station is complete ONLY if:
    // - It has matches in this round (stationMatches.length > 0)
    // - ALL matches are DONE (incompleteMatches.length === 0)
    // - ALL matches have winners (matchesWithoutWinners.length === 0)
    // If station has no matches in this round, it's considered complete (no work to do)
    const isComplete = stationMatches.length === 0 || 
                      (stationMatches.length > 0 && 
                       incompleteMatches.length === 0 && 
                       matchesWithoutWinners.length === 0);

    return {
      stationId: station.id,
      stationName: station.name,
      totalMatches: stationMatches.length,
      completedMatches: completedMatches.length,
      matchesWithWinners: matchesWithWinners.length,
      incompleteMatches,
      matchesWithoutWinners,
      isComplete
    };
  });
}

