/**
 * Recalculate Heat Scores for Round 2 Matches
 * 
 * This script calculates and stores heat scores from judge detailed scores
 * for all Round 2 matches that have detailed scores and cup positions assigned.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { matches, judgeDetailedScores, matchCupPositions } from '../shared/schema';
import { calculateAndStoreHeatScores } from '../server/utils/scoreCalculation';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function recalculateRound2Scores() {
  try {
    console.log('🔄 Recalculating heat scores for Round 2 matches...\n');

    // Get all Round 2 matches
    const round2Matches = await db.select()
      .from(matches)
      .where(eq(matches.round, 2));

    console.log(`Found ${round2Matches.length} Round 2 matches\n`);

    let processed = 0;
    let calculated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const match of round2Matches) {
      try {
        // Check if match has detailed scores
        const detailedScores = await db.select()
          .from(judgeDetailedScores)
          .where(eq(judgeDetailedScores.matchId, match.id));

        if (detailedScores.length === 0) {
          console.log(`   ⏭️  Match ${match.id} (Heat ${match.heatNumber}): No detailed scores, skipping`);
          skipped++;
          continue;
        }

        // Check if cup positions are assigned
        const cupPositions = await db.select()
          .from(matchCupPositions)
          .where(eq(matchCupPositions.matchId, match.id));

        if (cupPositions.length === 0) {
          console.log(`   ⏭️  Match ${match.id} (Heat ${match.heatNumber}): No cup positions assigned, skipping`);
          skipped++;
          continue;
        }

        // Calculate and store scores
        const result = await calculateAndStoreHeatScores(match.id);
        
        if (result.success) {
          console.log(`   ✅ Match ${match.id} (Heat ${match.heatNumber}): Calculated scores - Comp1: ${result.competitor1Score}, Comp2: ${result.competitor2Score}`);
          calculated++;
        } else {
          console.log(`   ⚠️  Match ${match.id} (Heat ${match.heatNumber}): ${result.error || 'Calculation failed'}`);
          errors.push(`Match ${match.id}: ${result.error || 'Calculation failed'}`);
        }
        
        processed++;
      } catch (error: any) {
        console.error(`   ❌ Match ${match.id} (Heat ${match.heatNumber}): Error - ${error.message}`);
        errors.push(`Match ${match.id}: ${error.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Calculated: ${calculated}`);
    console.log(`   Skipped: ${skipped}`);
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.length}`);
      errors.forEach(err => console.log(`      - ${err}`));
    }

    console.log('\n✅ Score recalculation complete!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  recalculateRound2Scores()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    });
}

export { recalculateRound2Scores };

