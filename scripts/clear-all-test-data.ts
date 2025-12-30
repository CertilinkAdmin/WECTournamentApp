/**
 * Clear All Test Data from Database
 * 
 * This script removes all test data including:
 * - Test tournaments (name contains "test" or "demo")
 * - Test users (email contains @test.com or starts with test-, or name starts with "Test"/"TEST")
 * - All related data (matches, scores, participants, stations, etc.)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray, like, or, and } from 'drizzle-orm';
import { 
  tournaments,
  users,
  tournamentParticipants,
  matches,
  heatJudges,
  heatScores,
  judgeDetailedScores,
  heatSegments,
  stations,
  tournamentRoundTimes,
  matchCupPositions,
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function clearAllTestData() {
  try {
    console.log('🧹 Starting comprehensive test data cleanup...\n');

    // Step 1: Find all test tournaments
    console.log('📋 Step 1: Identifying test tournaments...');
    const allTournaments = await db.select().from(tournaments);
    const testTournamentIds = new Set<number>();
    const testTournamentNames: string[] = [];

    // Find tournaments by name (case-insensitive)
    allTournaments.forEach(t => {
      const nameLower = t.name.toLowerCase();
      if (nameLower.includes('test') || nameLower.includes('demo')) {
        testTournamentIds.add(t.id);
        testTournamentNames.push(t.name);
        console.log(`   Found test tournament: ${t.name} (ID: ${t.id})`);
      }
    });

    // Step 2: Find all test users
    console.log('\n👥 Step 2: Identifying test users...');
    const testUsers = await db.select().from(users).where(
      or(
        like(users.email, '%@test.com'),
        like(users.email, 'test-%'),
        like(users.name, 'Test %'),
        like(users.name, 'TEST %')
      )
    );

    console.log(`   Found ${testUsers.length} test users`);
    const testUserIds = new Set(testUsers.map(u => u.id));

    // Step 3: Find tournaments that have test users as participants
    if (testUserIds.size > 0) {
      console.log('\n🔍 Step 3: Finding tournaments with test participants...');
      const testParticipants = await db.select()
        .from(tournamentParticipants)
        .where(inArray(tournamentParticipants.userId, Array.from(testUserIds)));

      testParticipants.forEach(p => {
        if (!testTournamentIds.has(p.tournamentId)) {
          const tournament = allTournaments.find(t => t.id === p.tournamentId);
          if (tournament) {
            testTournamentIds.add(p.tournamentId);
            testTournamentNames.push(tournament.name);
            console.log(`   Found test tournament via participants: ${tournament.name} (ID: ${tournament.id})`);
          }
        }
      });
    }

    const testTournaments = allTournaments.filter(t => testTournamentIds.has(t.id));
    console.log(`\n📊 Summary:`);
    console.log(`   Test tournaments to delete: ${testTournaments.length}`);
    console.log(`   Test users to delete: ${testUsers.length}`);

    if (testTournaments.length === 0 && testUsers.length === 0) {
      console.log('\n✅ No test data found. Database is clean!');
      return;
    }

    // Step 4: Delete all related data for test tournaments
    if (testTournaments.length > 0) {
      console.log('\n🗑️  Step 4: Deleting test tournament data...');
      
      const tournamentIdsArray = Array.from(testTournamentIds);

      // Get all matches for test tournaments
      const allMatches = await db.select()
        .from(matches)
        .where(inArray(matches.tournamentId, tournamentIdsArray));
      
      const matchIds = allMatches.map(m => m.id);
      console.log(`   Found ${matchIds.length} matches to delete`);

      if (matchIds.length > 0) {
        // Delete in correct order (respecting foreign keys)
        console.log('   Deleting judge detailed scores...');
        await db.delete(judgeDetailedScores)
          .where(inArray(judgeDetailedScores.matchId, matchIds));

        console.log('   Deleting heat scores...');
        await db.delete(heatScores)
          .where(inArray(heatScores.matchId, matchIds));

        console.log('   Deleting heat judges...');
        await db.delete(heatJudges)
          .where(inArray(heatJudges.matchId, matchIds));

        console.log('   Deleting heat segments...');
        await db.delete(heatSegments)
          .where(inArray(heatSegments.matchId, matchIds));

        // Check if matchCupPositions table exists and delete
        try {
          console.log('   Deleting match cup positions...');
          await db.delete(matchCupPositions)
            .where(inArray(matchCupPositions.matchId, matchIds));
        } catch (error: any) {
          // Table might not exist, ignore error
          console.log('   (matchCupPositions table not found or empty, skipping)');
        }
      }

      console.log('   Deleting matches...');
      await db.delete(matches)
        .where(inArray(matches.tournamentId, tournamentIdsArray));

      console.log('   Deleting tournament participants...');
      await db.delete(tournamentParticipants)
        .where(inArray(tournamentParticipants.tournamentId, tournamentIdsArray));

      console.log('   Deleting stations...');
      await db.delete(stations)
        .where(inArray(stations.tournamentId, tournamentIdsArray));

      console.log('   Deleting tournament round times...');
      await db.delete(tournamentRoundTimes)
        .where(inArray(tournamentRoundTimes.tournamentId, tournamentIdsArray));

      console.log('   Deleting tournaments...');
      await db.delete(tournaments)
        .where(inArray(tournaments.id, tournamentIdsArray));

      console.log(`   ✅ Deleted ${testTournaments.length} test tournament(s)`);
    }

    // Step 5: Delete test users (after tournaments to avoid foreign key issues)
    if (testUsers.length > 0) {
      console.log('\n🗑️  Step 5: Deleting test users...');
      
      const testUserIdsArray = Array.from(testUserIds);

      // Delete any remaining references to test users
      // Check for matches where test users are competitors
      const matchesWithTestUsers = await db.select()
        .from(matches)
        .where(
          or(
            inArray(matches.competitor1Id, testUserIdsArray),
            inArray(matches.competitor2Id, testUserIdsArray),
            inArray(matches.winnerId, testUserIdsArray)
          )
        );

      if (matchesWithTestUsers.length > 0) {
        const matchIds = matchesWithTestUsers.map(m => m.id);
        console.log(`   Cleaning up ${matchIds.length} matches with test users...`);
        
        await db.delete(judgeDetailedScores)
          .where(inArray(judgeDetailedScores.matchId, matchIds));
        await db.delete(heatScores)
          .where(inArray(heatScores.matchId, matchIds));
        await db.delete(heatJudges)
          .where(inArray(heatJudges.matchId, matchIds));
        await db.delete(heatSegments)
          .where(inArray(heatSegments.matchId, matchIds));
        await db.delete(matches)
          .where(inArray(matches.id, matchIds));
      }

      // Delete heat judges where test users are judges
      await db.delete(heatJudges)
        .where(inArray(heatJudges.judgeId, testUserIdsArray));

      // Delete heat scores where test users are judges or competitors
      await db.delete(heatScores)
        .where(
          or(
            inArray(heatScores.judgeId, testUserIdsArray),
            inArray(heatScores.competitorId, testUserIdsArray)
          )
        );

      // Delete tournament participants
      await db.delete(tournamentParticipants)
        .where(inArray(tournamentParticipants.userId, testUserIdsArray));

      // Delete users
      await db.delete(users)
        .where(inArray(users.id, testUserIdsArray));

      console.log(`   ✅ Deleted ${testUsers.length} test user(s)`);
    }

    // Step 6: Verify cleanup
    console.log('\n✅ Step 6: Verifying cleanup...');
    const remainingTestTournaments = await db.select().from(tournaments).where(
      or(
        like(tournaments.name, '%test%'),
        like(tournaments.name, '%demo%')
      )
    );

    const remainingTestUsers = await db.select().from(users).where(
      or(
        like(users.email, '%@test.com'),
        like(users.email, 'test-%'),
        like(users.name, 'Test %'),
        like(users.name, 'TEST %')
      )
    );

    console.log(`   Remaining test tournaments: ${remainingTestTournaments.length}`);
    console.log(`   Remaining test users: ${remainingTestUsers.length}`);

    if (remainingTestTournaments.length === 0 && remainingTestUsers.length === 0) {
      console.log('\n✅ All test data successfully cleared!');
    } else {
      console.log('\n⚠️  Warning: Some test data may still remain');
      if (remainingTestTournaments.length > 0) {
        console.log(`   Remaining tournaments: ${remainingTestTournaments.map(t => t.name).join(', ')}`);
      }
      if (remainingTestUsers.length > 0) {
        console.log(`   Remaining users: ${remainingTestUsers.map(u => u.name).join(', ')}`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearAllTestData()
    .then(() => {
      console.log('\n✅ Cleanup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}

export { clearAllTestData };

