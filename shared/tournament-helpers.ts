/**
 * Tournament Partitioning Helpers
 * 
 * These helpers ensure proper tournament isolation and data partitioning.
 * Always use these when querying tournament-related data.
 */

import { eq, and } from 'drizzle-orm';
import { tournaments, matches, stations, tournamentParticipants, tournamentRoundTimes } from './schema';

/**
 * Validates that a tournament ID exists
 */
export async function validateTournamentId(
  db: any,
  tournamentId: number
): Promise<boolean> {
  const result = await db.select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);
  return result.length > 0;
}

/**
 * Gets tournament by ID with validation
 */
export async function getTournamentById(
  db: any,
  tournamentId: number
): Promise<typeof tournaments.$inferSelect | null> {
  const result = await db.select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);
  return result[0] || null;
}

/**
 * Gets tournament by name (case-insensitive partial match)
 */
export async function getTournamentByName(
  db: any,
  name: string
): Promise<typeof tournaments.$inferSelect | null> {
  // Use SQL for case-insensitive search
  const result = await db.execute(
    `SELECT * FROM tournaments WHERE LOWER(name) LIKE LOWER($1) LIMIT 1`,
    [`%${name}%`]
  );
  return result[0] || null;
}

/**
 * Ensures all queries filter by tournamentId
 * This is a type-safe way to ensure tournament isolation
 */
export function withTournamentFilter<T extends { tournamentId: number }>(
  tournamentId: number
) {
  return {
    filter: eq(matches.tournamentId, tournamentId) as any,
    // Add other common filters here
  };
}

/**
 * Validates that a user is a participant in the given tournament
 */
export async function validateTournamentParticipant(
  db: any,
  tournamentId: number,
  userId: number
): Promise<boolean> {
  const result = await db.select()
    .from(tournamentParticipants)
    .where(
      and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.userId, userId)
      )
    )
    .limit(1);
  return result.length > 0;
}

/**
 * Validates that a station belongs to the given tournament
 */
export async function validateTournamentStation(
  db: any,
  tournamentId: number,
  stationId: number
): Promise<boolean> {
  const result = await db.select()
    .from(stations)
    .where(
      and(
        eq(stations.tournamentId, tournamentId),
        eq(stations.id, stationId)
      )
    )
    .limit(1);
  return result.length > 0;
}

/**
 * Validates that a match belongs to the given tournament
 */
export async function validateTournamentMatch(
  db: any,
  tournamentId: number,
  matchId: number
): Promise<boolean> {
  const result = await db.select()
    .from(matches)
    .where(
      and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.id, matchId)
      )
    )
    .limit(1);
  return result.length > 0;
}

/**
 * Gets all data for a tournament (for verification/cleanup)
 */
export interface TournamentData {
  tournament: typeof tournaments.$inferSelect;
  participants: typeof tournamentParticipants.$inferSelect[];
  matches: typeof matches.$inferSelect[];
  stations: typeof stations.$inferSelect[];
  roundTimes: typeof tournamentRoundTimes.$inferSelect[];
}

export async function getTournamentData(
  db: any,
  tournamentId: number
): Promise<TournamentData | null> {
  const tournament = await getTournamentById(db, tournamentId);
  if (!tournament) return null;

  const [participants, matchesData, stationsData, roundTimes] = await Promise.all([
    db.select().from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId)),
    db.select().from(matches)
      .where(eq(matches.tournamentId, tournamentId)),
    db.select().from(stations)
      .where(eq(stations.tournamentId, tournamentId)),
    db.select().from(tournamentRoundTimes)
      .where(eq(tournamentRoundTimes.tournamentId, tournamentId)),
  ]);

  return {
    tournament,
    participants,
    matches: matchesData,
    stations: stationsData,
    roundTimes,
  };
}

