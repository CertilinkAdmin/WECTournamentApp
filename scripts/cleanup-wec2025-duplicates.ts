import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray } from 'drizzle-orm';
import { 
  tournaments, 
  tournamentParticipants, 
  matches, 
  heatJudges, 
  heatScores,
  judgeDetailedScores,
  heatSegments,
  tournamentRoundTimes
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function cleanupWEC2025Duplicates() {
  try {
    console.log('🧹 Starting WEC2025 duplicate cleanup...\n');

    // Get all WEC2025 tournaments
    const allTournaments = await db.select().from(tournaments);
    const wec2025Tournaments = allTournaments.filter(t => 
      t.name.includes('2025') && t.name.toLowerCase().includes('world espresso championships')
    );

    console.log('📋 Found WEC2025 tournaments:');
    for (const t of wec2025Tournaments) {
      const tournamentMatches = await db.select().from(matches).where(eq(matches.tournamentId, t.id));
      const rounds = [...new Set(tournamentMatches.map(m => m.round))].sort();
      console.log(`  ID: ${t.id}, Name: "${t.name}", Rounds: [${rounds.join(', ')}], Matches: ${tournamentMatches.length}`);
    }

    // Find the complete tournament (has all rounds 1-5 and most matches)
    const completeTournament = wec2025Tournaments.find(t => {
      // We'll check matches after
      return t.name.includes('2025');
    });

    let targetTournamentId: number | null = null;
    let targetTournamentName = '';

    // Check which tournament has the most complete data
    for (const t of wec2025Tournaments) {
      const tournamentMatches = await db.select().from(matches).where(eq(matches.tournamentId, t.id));
      const rounds = [...new Set(tournamentMatches.map(m => m.round))].sort();
      
      // Prefer tournament with all 5 rounds and most matches
      if (rounds.length === 5 && rounds[0] === 1 && rounds[4] === 5) {
        if (!targetTournamentId) {
          targetTournamentId = t.id;
          targetTournamentName = t.name;
        } else {
          const existingMatches = await db.select().from(matches).where(eq(matches.tournamentId, targetTournamentId));
          if (tournamentMatches.length > existingMatches.length) {
            targetTournamentId = t.id;
            targetTournamentName = t.name;
          }
        }
      }
    }

    // If no tournament has all 5 rounds, pick the one with most matches
    if (!targetTournamentId) {
      let maxMatches = 0;
      for (const t of wec2025Tournaments) {
        const tournamentMatches = await db.select().from(matches).where(eq(matches.tournamentId, t.id));
        if (tournamentMatches.length > maxMatches) {
          maxMatches = tournamentMatches.length;
          targetTournamentId = t.id;
          targetTournamentName = t.name;
        }
      }
    }

    if (!targetTournamentId) {
      console.log('❌ No tournament found with data. Cannot proceed.');
      return;
    }

    console.log(`\n✅ Keeping tournament ID ${targetTournamentId}: "${targetTournamentName}"`);

    // Update the name to include "Milano" if it doesn't already
    if (!targetTournamentName.includes('Milano')) {
      await db.update(tournaments)
        .set({ name: 'World Espresso Championships 2025 Milano' })
        .where(eq(tournaments.id, targetTournamentId));
      console.log(`📝 Updated name to include "Milano"`);
    }

    // Delete all other WEC2025 tournaments
    const tournamentsToDelete = wec2025Tournaments.filter(t => t.id !== targetTournamentId);
    
    for (const tournament of tournamentsToDelete) {
      console.log(`\n🗑️  Deleting tournament ID ${tournament.id}: "${tournament.name}"`);
      
      // Get all matches for this tournament
      const tournamentMatches = await db.select({ id: matches.id }).from(matches).where(eq(matches.tournamentId, tournament.id));
      const matchIds = tournamentMatches.map(m => m.id);

      // Delete all related data
      if (matchIds.length > 0) {
        await db.delete(heatScores).where(inArray(heatScores.matchId, matchIds));
        await db.delete(judgeDetailedScores).where(inArray(judgeDetailedScores.matchId, matchIds));
        await db.delete(heatJudges).where(inArray(heatJudges.matchId, matchIds));
        await db.delete(heatSegments).where(inArray(heatSegments.matchId, matchIds));
        console.log(`  ✅ Deleted scores, judges, and segments for ${matchIds.length} matches`);
      }

      await db.delete(matches).where(eq(matches.tournamentId, tournament.id));
      await db.delete(tournamentRoundTimes).where(eq(tournamentRoundTimes.tournamentId, tournament.id));
      await db.delete(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournament.id));
      await db.delete(tournaments).where(eq(tournaments.id, tournament.id));
      
      console.log(`  ✅ Deleted tournament ID ${tournament.id}`);
    }

    console.log(`\n✅ Cleanup complete! Only one WEC2025 tournament remains: ID ${targetTournamentId}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupWEC2025Duplicates().catch(console.error);
}

export { cleanupWEC2025Duplicates };

