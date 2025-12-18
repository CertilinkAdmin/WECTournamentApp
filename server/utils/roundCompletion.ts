/**
 * Round Completion Utility
 * Checks if a round is complete and all matches have winners
 */

import { storage } from '../storage';
import type { Match } from '@shared/schema';

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
  const allMatchesComplete = incompleteMatches.length === 0;
  const allMatchesHaveWinners = matchesWithoutWinners.length === 0;
  const allStationsComplete = stationStatus.every(s => s.isComplete || s.totalMatches === 0);

  const errors: string[] = [];
  if (!allMatchesComplete) {
    errors.push(`${incompleteMatches.length} match(es) not yet completed`);
  }
  if (!allMatchesHaveWinners) {
    errors.push(`${matchesWithoutWinners.length} match(es) missing winners`);
  }
  if (!allStationsComplete) {
    const incompleteStations = stationStatus.filter(s => !s.isComplete && s.totalMatches > 0);
    errors.push(`${incompleteStations.length} station(s) have incomplete heats`);
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
  const tournament = await storage.getTournament(tournamentId);
  const enabledStations = tournament?.enabledStations || ['A', 'B', 'C'];
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
  return tournamentStations.map(station => {
    const stationMatches = matchesByStation.get(station.id) || [];
    const completedMatches = stationMatches.filter(m => m.status === 'DONE');
    const incompleteMatches = stationMatches.filter(m => m.status !== 'DONE');
    const matchesWithWinners = stationMatches.filter(m => m.winnerId !== null);
    const matchesWithoutWinners = stationMatches.filter(m => m.winnerId === null);

    return {
      stationId: station.id,
      stationName: station.name,
      totalMatches: stationMatches.length,
      completedMatches: completedMatches.length,
      matchesWithWinners: matchesWithWinners.length,
      incompleteMatches,
      matchesWithoutWinners,
      isComplete: stationMatches.length > 0 && 
                  incompleteMatches.length === 0 && 
                  matchesWithoutWinners.length === 0
    };
  });
}

