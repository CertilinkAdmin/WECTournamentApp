import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import { 
  tournaments, 
  tournamentParticipants, 
  matches, 
  stations,
  tournamentRoundTimes,
  heatJudges,
  heatScores,
  judgeDetailedScores,
  heatSegments
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sqlClient = postgres(connectionString);
const db = drizzle(sqlClient);

interface PartitioningIssue {
  table: string;
  issue: string;
  count: number;
  details?: any;
}

async function verifyTournamentPartitioning() {
  try {
    console.log('🔍 Verifying Tournament Partitioning...\n');
    
    const issues: PartitioningIssue[] = [];
    
    // Get all tournaments
    const allTournaments = await db.select().from(tournaments);
    console.log(`📋 Found ${allTournaments.length} tournament(s):`);
    allTournaments.forEach(t => {
      console.log(`  ID: ${t.id}, Name: "${t.name}"`);
    });
    
    if (allTournaments.length === 0) {
      console.log('\n⚠️  No tournaments found. Cannot verify partitioning.');
      return;
    }
    
    console.log('\n🔍 Checking schema and data integrity...\n');
    
    // 1. Check if stations table has tournamentId column
    try {
      const stationsCheck = await sqlClient`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'stations' AND column_name = 'tournament_id'
      `;
      
      if (stationsCheck.length === 0) {
        issues.push({
          table: 'stations',
          issue: 'Missing tournament_id column',
          count: 0,
          details: 'Stations table should have tournament_id for proper partitioning'
        });
        console.log('❌ Stations table is missing tournament_id column');
      } else {
        console.log('✅ Stations table has tournament_id column');
        
        // Check for stations without tournamentId
        const orphanStations = await sqlClient`
          SELECT COUNT(*) as count FROM stations WHERE tournament_id IS NULL
        `;
        if (orphanStations[0].count > 0) {
          issues.push({
            table: 'stations',
            issue: 'Stations without tournament_id',
            count: parseInt(orphanStations[0].count as string),
            details: 'Some stations are not associated with any tournament'
          });
          console.log(`⚠️  Found ${orphanStations[0].count} stations without tournament_id`);
        }
      }
    } catch (error: any) {
      console.log(`⚠️  Could not check stations: ${error.message}`);
    }
    
    // 2. Check tournament_participants partitioning
    for (const tournament of allTournaments) {
      const participants = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournament.id));
      console.log(`  Tournament ${tournament.id} (${tournament.name}): ${participants.length} participants`);
    }
    
    // 3. Check matches partitioning
    for (const tournament of allTournaments) {
      const tournamentMatches = await db.select()
        .from(matches)
        .where(eq(matches.tournamentId, tournament.id));
      console.log(`  Tournament ${tournament.id}: ${tournamentMatches.length} matches`);
      
      // Check for matches with invalid tournamentId
      const invalidMatches = await sqlClient`
        SELECT COUNT(*) as count 
        FROM matches 
        WHERE tournament_id NOT IN (SELECT id FROM tournaments)
      `;
      if (invalidMatches[0].count > 0) {
        issues.push({
          table: 'matches',
          issue: 'Matches with invalid tournament_id',
          count: parseInt(invalidMatches[0].count as string),
          details: 'Some matches reference non-existent tournaments'
        });
      }
    }
    
    // 4. Check tournament_round_times partitioning
    for (const tournament of allTournaments) {
      const roundTimes = await db.select()
        .from(tournamentRoundTimes)
        .where(eq(tournamentRoundTimes.tournamentId, tournament.id));
      console.log(`  Tournament ${tournament.id}: ${roundTimes.length} round time configurations`);
    }
    
    // 5. Check foreign key constraints
    console.log('\n🔗 Checking foreign key constraints...');
    const foreignKeys = await sqlClient`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'tournaments'
      ORDER BY tc.table_name, kcu.column_name
    `;
    
    console.log('\nForeign keys referencing tournaments:');
    foreignKeys.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → tournaments.${fk.foreign_column_name}`);
    });
    
    // 6. Check indexes on tournamentId columns
    console.log('\n📊 Checking indexes on tournament_id columns...');
    const indexes = await sqlClient`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE indexdef LIKE '%tournament_id%'
      ORDER BY tablename, indexname
    `;
    
    if (indexes.length === 0) {
      issues.push({
        table: 'all',
        issue: 'Missing indexes on tournament_id columns',
        count: 0,
        details: 'Indexes improve query performance for tournament-filtered queries'
      });
      console.log('⚠️  No indexes found on tournament_id columns');
    } else {
      console.log('✅ Found indexes on tournament_id:');
      indexes.forEach(idx => {
        console.log(`  ${idx.tablename}.${idx.indexname}`);
      });
    }
    
    // 7. Check for data leakage (matches referencing wrong tournament's participants)
    console.log('\n🔒 Checking for data leakage between tournaments...');
    for (const tournament of allTournaments) {
      const tournamentMatches = await db.select()
        .from(matches)
        .where(eq(matches.tournamentId, tournament.id));
      
      const participantIds = await db.select({ userId: tournamentParticipants.userId })
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournament.id));
      const validUserIds = new Set(participantIds.map(p => p.userId));
      
      let leakageCount = 0;
      for (const match of tournamentMatches) {
        if (match.competitor1Id && !validUserIds.has(match.competitor1Id)) {
          leakageCount++;
        }
        if (match.competitor2Id && !validUserIds.has(match.competitor2Id)) {
          leakageCount++;
        }
      }
      
      if (leakageCount > 0) {
        issues.push({
          table: 'matches',
          issue: `Data leakage in tournament ${tournament.id}`,
          count: leakageCount,
          details: 'Matches reference users not in this tournament'
        });
        console.log(`⚠️  Tournament ${tournament.id}: ${leakageCount} matches reference users from other tournaments`);
      } else {
        console.log(`✅ Tournament ${tournament.id}: No data leakage detected`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    if (issues.length === 0) {
      console.log('✅ All tournament partitioning checks passed!');
    } else {
      console.log(`\n⚠️  Found ${issues.length} issue(s):\n`);
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.table}: ${issue.issue}`);
        console.log(`   Count: ${issue.count}`);
        if (issue.details) {
          console.log(`   Details: ${issue.details}`);
        }
        console.log('');
      });
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Ensure all tables with tournament data have tournament_id column');
    console.log('2. Add indexes on tournament_id columns for better query performance');
    console.log('3. Always filter queries by tournament_id to ensure data isolation');
    console.log('4. Use foreign key constraints with CASCADE DELETE for data integrity');
    console.log('5. Validate tournament_id in API routes before processing requests');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await sqlClient.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyTournamentPartitioning().catch(console.error);
}

export { verifyTournamentPartitioning };

