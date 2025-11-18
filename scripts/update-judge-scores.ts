import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Update judge detailed scores for Michalis, Jasper, and Korn
 * Based on corrected scorecard data
 */

interface JudgeScoreUpdate {
  heatNumber: number;
  judgeName: string;
  visualLatteArt: 'left' | 'right';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}

const scoreUpdates: JudgeScoreUpdate[] = [
  // Michalis updates
  { heatNumber: 12, judgeName: 'Michalis', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'right', overall: 'left' },
  { heatNumber: 14, judgeName: 'Michalis', visualLatteArt: 'left', taste: 'right', tactile: 'left', flavour: 'right', overall: 'right' },
  { heatNumber: 17, judgeName: 'Michalis', visualLatteArt: 'right', taste: 'right', tactile: 'left', flavour: 'right', overall: 'right' },
  { heatNumber: 21, judgeName: 'Michalis', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
  { heatNumber: 24, judgeName: 'Michalis', visualLatteArt: 'right', taste: 'right', tactile: 'left', flavour: 'right', overall: 'right' },
  { heatNumber: 26, judgeName: 'Michalis', visualLatteArt: 'right', taste: 'right', tactile: 'left', flavour: 'right', overall: 'right' },
  { heatNumber: 28, judgeName: 'Michalis', visualLatteArt: 'left', taste: 'right', tactile: 'right', flavour: 'left', overall: 'right' },
  
  // Jasper updates
  { heatNumber: 12, judgeName: 'Jasper', visualLatteArt: 'left', taste: 'right', tactile: 'left', flavour: 'right', overall: 'right' },
  { heatNumber: 14, judgeName: 'Jasper', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
  { heatNumber: 17, judgeName: 'Jasper', visualLatteArt: 'right', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
  { heatNumber: 21, judgeName: 'Jasper', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'left', overall: 'right' },
  { heatNumber: 24, judgeName: 'Jasper', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
  
  // Korn updates
  { heatNumber: 12, judgeName: 'Korn', visualLatteArt: 'right', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
  { heatNumber: 14, judgeName: 'Korn', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'left', overall: 'right' },
  { heatNumber: 26, judgeName: 'Korn', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
  { heatNumber: 27, judgeName: 'Korn', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
  { heatNumber: 29, judgeName: 'Korn', visualLatteArt: 'left', taste: 'right', tactile: 'left', flavour: 'left', overall: 'left' },
  { heatNumber: 30, judgeName: 'Korn', visualLatteArt: 'left', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
  { heatNumber: 31, judgeName: 'Korn', visualLatteArt: 'right', taste: 'right', tactile: 'left', flavour: 'left', overall: 'left' },
];

async function updateJudgeScores() {
  console.log('🔄 Updating judge detailed scores...\n');

  for (const update of scoreUpdates) {
    // Get match ID for this heat
    const matchResult = await sql`
      SELECT id FROM matches WHERE heat_number = ${update.heatNumber} LIMIT 1
    `;

    if (matchResult.length === 0) {
      console.log(`⚠️  Heat ${update.heatNumber} not found, skipping...`);
      continue;
    }

    const matchId = matchResult[0].id;

    // Update the judge's score
    const updateResult = await sql`
      UPDATE judge_detailed_scores
      SET 
        visual_latte_art = ${update.visualLatteArt},
        taste = ${update.taste},
        tactile = ${update.tactile},
        flavour = ${update.flavour},
        overall = ${update.overall}
      WHERE match_id = ${matchId} AND judge_name = ${update.judgeName}
      RETURNING id
    `;

    if (updateResult.length > 0) {
      console.log(`✅ Updated ${update.judgeName} - Heat ${update.heatNumber}: ${update.visualLatteArt}, ${update.taste}, ${update.tactile}, ${update.flavour}, ${update.overall}`);
    } else {
      console.log(`⚠️  No score found for ${update.judgeName} - Heat ${update.heatNumber}, skipping...`);
    }
  }

  console.log('\n✅ All judge scores updated!');
  process.exit(0);
}

updateJudgeScores().catch((error) => {
  console.error('❌ Error updating judge scores:', error);
  process.exit(1);
});

