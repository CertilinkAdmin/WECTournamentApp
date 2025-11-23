import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray, or, like } from 'drizzle-orm';
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

async function keepOnlyWEC2025Milano() {
  try {
    console.log('🏆 Keeping only WEC2025 Milano tournament...\n');

    // Get all tournaments
    const allTournaments = await db.select().from(tournaments);
    console.log(`📋 Found ${allTournaments.length} tournament(s):`);
    allTournaments.forEach(t => {
      console.log(`  ID: ${t.id}, Name: "${t.name}", Status: ${t.status}`);
    });

    // Find WEC2025 Milano tournament (exact match or contains Milano)
    let targetTournament = allTournaments.find(t => 
      t.name.toLowerCase().includes('milano') && 
      (t.name.includes('2025') || t.name.includes('WEC'))
    );

    // If not found, look for any WEC2025 tournament
    if (!targetTournament) {
      targetTournament = allTournaments.find(t => 
        (t.name.includes('2025') || t.name.includes('WEC')) &&
        t.name.toLowerCase().includes('world espresso championships')
      );
    }

    // If still not found, check if there's a tournament with matches (most complete)
    if (!targetTournament && allTournaments.length > 0) {
      let maxMatches = 0;
      for (const t of allTournaments) {
        const tournamentMatches = await db.select().from(matches).where(eq(matches.tournamentId, t.id));
        if (tournamentMatches.length > maxMatches) {
          maxMatches = tournamentMatches.length;
          targetTournament = t;
        }
      }
    }

    // If no tournament found, create WEC2025 Milano
    if (!targetTournament) {
      console.log('\n📝 Creating WEC2025 Milano tournament...');
      const [newTournament] = await db.insert(tournaments).values({
        name: "World Espresso Championships 2025 Milano",
        status: "COMPLETED",
        startDate: new Date("2025-01-15T08:00:00Z"),
        endDate: new Date("2025-01-17T18:00:00Z"),
        totalRounds: 5,
        currentRound: 5
      }).returning();
      targetTournament = newTournament;
      console.log(`✅ Created tournament ID ${targetTournament.id}: "${targetTournament.name}"`);
    } else {
      // Ensure the name is correct
      if (!targetTournament.name.includes('Milano')) {
        console.log(`\n📝 Updating tournament name to include "Milano"...`);
        await db.update(tournaments)
          .set({ name: 'World Espresso Championships 2025 Milano' })
          .where(eq(tournaments.id, targetTournament.id));
        targetTournament.name = 'World Espresso Championships 2025 Milano';
        console.log(`✅ Updated tournament name`);
      }
      console.log(`\n✅ Keeping tournament ID ${targetTournament.id}: "${targetTournament.name}"`);
    }

    // Delete all other tournaments
    const tournamentsToDelete = allTournaments.filter(t => t.id !== targetTournament!.id);
    
    if (tournamentsToDelete.length === 0) {
      console.log('\n✅ No other tournaments to delete. Only WEC2025 Milano exists.');
      return;
    }

    console.log(`\n🗑️  Deleting ${tournamentsToDelete.length} other tournament(s)...`);
    
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

        // Finally, delete the tournament
        await db.delete(tournaments).where(eq(tournaments.id, tournament.id));
        console.log(`    ✅ Deleted tournament ID ${tournament.id}`);
        
      } catch (error: any) {
        console.error(`    ❌ Error deleting tournament ${tournament.id}:`, error.message);
        // Try to continue with other tournaments
      }
    }

    // Verify final state
    const remainingTournaments = await db.select().from(tournaments);
    console.log(`\n✅ Cleanup complete!`);
    console.log(`📋 Remaining tournaments: ${remainingTournaments.length}`);
    remainingTournaments.forEach(t => {
      console.log(`  ID: ${t.id}, Name: "${t.name}"`);
    });

    if (remainingTournaments.length === 1 && remainingTournaments[0].id === targetTournament.id) {
      console.log(`\n🎉 Success! Only WEC2025 Milano tournament remains.`);
    } else {
      console.log(`\n⚠️  Warning: Expected 1 tournament, but found ${remainingTournaments.length}`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  keepOnlyWEC2025Milano().catch(console.error);
}

export { keepOnlyWEC2025Milano };

