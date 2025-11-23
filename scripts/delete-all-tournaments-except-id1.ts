import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray, ne } from 'drizzle-orm';
import { 
  tournaments, 
  tournamentParticipants, 
  matches, 
  heatJudges, 
  heatScores,
  judgeDetailedScores,
  heatSegments,
  tournamentRoundTimes,
  stations
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function deleteAllTournamentsExceptId1() {
  try {
    console.log('🗑️  Deleting all tournaments except ID 1...\n');

    // Get all tournaments except ID 1
    const allTournaments = await db.select().from(tournaments);
    const tournamentsToDelete = allTournaments.filter(t => t.id !== 1);

    console.log(`📋 Found ${allTournaments.length} tournament(s) total:`);
    allTournaments.forEach(t => {
      console.log(`  ID: ${t.id}, Name: "${t.name}", Status: ${t.status}`);
    });

    if (tournamentsToDelete.length === 0) {
      console.log('\n✅ No tournaments to delete. Only tournament ID 1 exists.');
      return;
    }

    console.log(`\n🗑️  Will delete ${tournamentsToDelete.length} tournament(s) (keeping ID 1):`);
    tournamentsToDelete.forEach(t => {
      console.log(`  - ID ${t.id}: "${t.name}"`);
    });

    let deletedCount = 0;
    const errors: string[] = [];

    for (const tournament of tournamentsToDelete) {
      console.log(`\n  Deleting tournament ID ${tournament.id}: "${tournament.name}"`);
      
      try {
        // Get all matches for this tournament
        const tournamentMatches = await db.select({ id: matches.id }).from(matches).where(eq(matches.tournamentId, tournament.id));
        const matchIds = tournamentMatches.map(m => m.id);

        // Delete all related data in correct order (respecting foreign keys)
        if (matchIds.length > 0) {
          // Delete scores and detailed scores first
          await db.delete(judgeDetailedScores).where(inArray(judgeDetailedScores.matchId, matchIds));
          await db.delete(heatScores).where(inArray(heatScores.matchId, matchIds));
          console.log(`    ✅ Deleted scores for ${matchIds.length} matches`);
          
          // Delete heat judges
          await db.delete(heatJudges).where(inArray(heatJudges.matchId, matchIds));
          console.log(`    ✅ Deleted heat judges`);
          
          // Delete heat segments
          await db.delete(heatSegments).where(inArray(heatSegments.matchId, matchIds));
          console.log(`    ✅ Deleted heat segments`);
        }

        // Delete matches
        await db.delete(matches).where(eq(matches.tournamentId, tournament.id));
        console.log(`    ✅ Deleted ${tournamentMatches.length} matches`);

        // Delete tournament round times
        await db.delete(tournamentRoundTimes).where(eq(tournamentRoundTimes.tournamentId, tournament.id));
        console.log(`    ✅ Deleted tournament round times`);

        // Delete tournament participants (this must be before deleting tournament)
        await db.delete(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournament.id));
        console.log(`    ✅ Deleted tournament participants`);

        // Delete tournament-specific stations
        await db.delete(stations).where(eq(stations.tournamentId, tournament.id));
        console.log(`    ✅ Deleted tournament stations`);

        // Finally, delete the tournament
        await db.delete(tournaments).where(eq(tournaments.id, tournament.id));
        console.log(`    ✅ Deleted tournament ID ${tournament.id}`);
        
        deletedCount++;
      } catch (error: any) {
        const errorMsg = `Failed to delete tournament ${tournament.id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`    ❌ ${errorMsg}`);
      }
    }

    // Verify final state
    const remainingTournaments = await db.select().from(tournaments);
    console.log(`\n✅ Deletion complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Deleted: ${deletedCount} tournament(s)`);
    console.log(`   - Errors: ${errors.length}`);
    console.log(`   - Remaining: ${remainingTournaments.length} tournament(s)`);
    
    if (remainingTournaments.length > 0) {
      console.log(`\n📋 Remaining tournaments:`);
      remainingTournaments.forEach(t => {
        console.log(`   ID: ${t.id}, Name: "${t.name}"`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }

    // Verify tournament ID 1 still exists
    const tournament1 = await db.select().from(tournaments).where(eq(tournaments.id, 1)).limit(1);
    if (tournament1.length === 0) {
      console.log(`\n⚠️  WARNING: Tournament ID 1 was not found!`);
    } else {
      console.log(`\n✅ Tournament ID 1 is safe: "${tournament1[0].name}"`);
    }
    
  } catch (error) {
    console.error('❌ Deletion failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteAllTournamentsExceptId1().catch(console.error);
}

export { deleteAllTournamentsExceptId1 };

