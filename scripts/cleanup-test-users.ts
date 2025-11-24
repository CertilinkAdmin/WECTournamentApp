/**
 * Cleanup Test Users - Keep Only 16 Baristas and 9 Judges
 * 
 * This script:
 * 1. Finds all test users (baristas and judges)
 * 2. Keeps the first 16 baristas and first 9 judges
 * 3. Deletes all other test users and their related data
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray, or, like } from 'drizzle-orm';
import { 
  users,
  tournamentParticipants,
  matches,
  heatJudges,
  heatScores,
  judgeDetailedScores,
  heatSegments,
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up test users...\n');

    // Find all test users (by email pattern or name pattern)
    const allTestUsers = await db.select().from(users).where(
      or(
        like(users.email, '%test%'),
        like(users.name, 'Test %'),
        like(users.name, 'TEST %')
      )
    );

    // Separate by role
    const testBaristas = allTestUsers.filter(u => u.role === 'BARISTA');
    const testJudges = allTestUsers.filter(u => u.role === 'JUDGE');

    console.log(`📊 Found test users:`);
    console.log(`   Baristas: ${testBaristas.length}`);
    console.log(`   Judges: ${testJudges.length}`);

    // Sort by ID to keep the oldest/first ones
    testBaristas.sort((a, b) => a.id - b.id);
    testJudges.sort((a, b) => a.id - b.id);

    // Determine which users to keep
    const baristasToKeep = testBaristas.slice(0, 16);
    const judgesToKeep = testJudges.slice(0, 9);

    const baristasToDelete = testBaristas.slice(16);
    const judgesToDelete = testJudges.slice(9);

    console.log(`\n✅ Will keep:`);
    console.log(`   ${baristasToKeep.length} baristas (IDs: ${baristasToKeep.map(b => b.id).join(', ')})`);
    console.log(`   ${judgesToKeep.length} judges (IDs: ${judgesToKeep.map(j => j.id).join(', ')})`);

    console.log(`\n🗑️  Will delete:`);
    console.log(`   ${baristasToDelete.length} baristas`);
    console.log(`   ${judgesToDelete.length} judges`);

    if (baristasToDelete.length === 0 && judgesToDelete.length === 0) {
      console.log('\n✅ No test users to delete. Already at target count.');
      return;
    }

    const usersToDelete = [...baristasToDelete, ...judgesToDelete];
    const userIdsToDelete = usersToDelete.map(u => u.id);

    if (userIdsToDelete.length === 0) {
      console.log('\n✅ No users to delete.');
      return;
    }

    console.log(`\n🗑️  Deleting ${userIdsToDelete.length} test users...\n`);

    // Get all matches where these users are participants
    const participantRecords = await db.select().from(tournamentParticipants).where(
      inArray(tournamentParticipants.userId, userIdsToDelete)
    );

    const tournamentIds = [...new Set(participantRecords.map(p => p.tournamentId))];
    const matchIds: number[] = [];

    // Get matches for tournaments that have these users as participants
    if (tournamentIds.length > 0) {
      const allMatches = await db.select().from(matches).where(
        inArray(matches.tournamentId, tournamentIds)
      );
      
      // Filter matches where deleted users are competitors
      const matchesWithDeletedUsers = allMatches.filter(m => 
        (m.competitor1Id && userIdsToDelete.includes(m.competitor1Id)) ||
        (m.competitor2Id && userIdsToDelete.includes(m.competitor2Id))
      );
      matchIds.push(...matchesWithDeletedUsers.map(m => m.id));
    }

    // Also get matches where these users are judges
    const judgeMatches = await db.select().from(heatJudges).where(
      inArray(heatJudges.judgeId, userIdsToDelete)
    );
    const judgeMatchIds = judgeMatches.map(j => j.matchId);
    matchIds.push(...judgeMatchIds);

    const uniqueMatchIds = [...new Set(matchIds)];

    // Delete related data
    if (uniqueMatchIds.length > 0) {
      console.log(`   Deleting scores and data for ${uniqueMatchIds.length} matches...`);
      
      await db.delete(judgeDetailedScores).where(
        inArray(judgeDetailedScores.matchId, uniqueMatchIds)
      );
      
      await db.delete(heatScores).where(
        inArray(heatScores.matchId, uniqueMatchIds)
      );
      
      await db.delete(heatSegments).where(
        inArray(heatSegments.matchId, uniqueMatchIds)
      );
      
      await db.delete(heatJudges).where(
        inArray(heatJudges.matchId, uniqueMatchIds)
      );
      
      console.log(`   ✅ Deleted match-related data`);
    }

    // Delete tournament participants
    if (participantRecords.length > 0) {
      console.log(`   Deleting ${participantRecords.length} tournament participant records...`);
      await db.delete(tournamentParticipants).where(
        inArray(tournamentParticipants.userId, userIdsToDelete)
      );
      console.log(`   ✅ Deleted tournament participants`);
    }

    // Delete the users
    console.log(`   Deleting ${userIdsToDelete.length} users...`);
    await db.delete(users).where(
      inArray(users.id, userIdsToDelete)
    );
    console.log(`   ✅ Deleted users`);

    // Verify final state
    const remainingTestUsers = await db.select().from(users).where(
      or(
        like(users.email, '%test%'),
        like(users.name, 'Test %'),
        like(users.name, 'TEST %')
      )
    );

    const remainingBaristas = remainingTestUsers.filter(u => u.role === 'BARISTA');
    const remainingJudges = remainingTestUsers.filter(u => u.role === 'JUDGE');

    console.log(`\n✅ Cleanup complete!`);
    console.log(`📊 Final state:`);
    console.log(`   Baristas: ${remainingBaristas.length} (target: 16)`);
    console.log(`   Judges: ${remainingJudges.length} (target: 9)`);

    if (remainingBaristas.length > 16) {
      console.log(`\n⚠️  Warning: Still have ${remainingBaristas.length} baristas (expected 16)`);
    }
    if (remainingJudges.length > 9) {
      console.log(`\n⚠️  Warning: Still have ${remainingJudges.length} judges (expected 9)`);
    }

    if (remainingBaristas.length === 16 && remainingJudges.length === 9) {
      console.log(`\n✅ Perfect! Exactly 16 baristas and 9 judges remaining.`);
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
  cleanupTestUsers().catch(console.error);
}

export { cleanupTestUsers };

