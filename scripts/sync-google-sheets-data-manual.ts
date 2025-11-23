import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

// Competitor to cup code mappings (CUP CODES ARE ASSIGNED TO COMPETITORS, NOT JUDGES)
const COMPETITOR_CUP_CODES: Record<string, Record<string, string>> = {
  'Heat 12': { 'Stevo': 'M7', 'Edwin': 'K9' },
  'Heat 13': { 'Kirill': 'F5', 'Anja': 'X1' },
  'Heat 19': { 'Artur': 'G2', 'Julian': 'W8' },
  'Heat 21': { 'Faiz': 'Q5', 'Christos': 'B1' },
  'Heat 22': { 'Stevo': 'J7', 'Danielle': 'T8' },
};

// Manually verified judge scores from Google Sheets
// These match the verified data in create-heat scripts
const VERIFIED_SCORES: Record<string, Array<{
  judgeName: string;
  leftCupCode: string;
  rightCupCode: string;
  sensoryBeverage: 'Cappuccino' | 'Espresso';
  visualLatteArt: 'left' | 'right';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}>> = {
  'Heat 12': [
    {
      judgeName: 'Michalis',
      leftCupCode: 'M7', // Stevo
      rightCupCode: 'K9', // Edwin
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // M7 wins
      taste: 'left', // M7 wins
      tactile: 'left', // M7 wins
      flavour: 'right', // K9 wins
      overall: 'left' // M7 wins
    },
    {
      judgeName: 'Korn',
      leftCupCode: 'M7', // Stevo
      rightCupCode: 'K9', // Edwin
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // K9 wins
      taste: 'left', // M7 wins
      tactile: 'left', // M7 wins
      flavour: 'left', // M7 wins
      overall: 'left' // M7 wins
    },
    {
      judgeName: 'Jasper',
      leftCupCode: 'K9', // Edwin (NOTE: Different assignment!)
      rightCupCode: 'M7', // Stevo
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // K9 wins
      taste: 'right', // M7 wins
      tactile: 'left', // K9 wins
      flavour: 'right', // M7 wins
      overall: 'right' // M7 wins
    }
  ],
  'Heat 21': [
    {
      judgeName: 'Michalis',
      leftCupCode: 'Q5', // Faiz
      rightCupCode: 'B1', // Christos
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // B1 wins
      taste: 'right', // B1 wins
      tactile: 'right', // B1 wins
      flavour: 'right', // B1 wins
      overall: 'right' // B1 wins
    },
    {
      judgeName: 'Ali',
      leftCupCode: 'Q5', // Faiz
      rightCupCode: 'B1', // Christos
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // B1 wins
      taste: 'right', // B1 wins
      tactile: 'left', // Q5 wins
      flavour: 'right', // B1 wins
      overall: 'right' // B1 wins
    },
    {
      judgeName: 'Jasper',
      leftCupCode: 'B1', // Christos (NOTE: Different assignment!)
      rightCupCode: 'Q5', // Faiz
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // Q5 wins
      taste: 'right', // Q5 wins
      tactile: 'right', // Q5 wins
      flavour: 'left', // B1 wins
      overall: 'right' // Q5 wins
    }
  ]
};

// Calculate competitor total score
function calculateTotalScore(
  cupCode: string,
  judgeScores: typeof VERIFIED_SCORES[string]
): number {
  let total = 0;

  for (const score of judgeScores) {
    const isLeft = score.leftCupCode === cupCode;
    const isRight = score.rightCupCode === cupCode;

    if (!isLeft && !isRight) continue;

    // Visual Latte Art (3 points)
    if ((score.visualLatteArt === 'left' && isLeft) || 
        (score.visualLatteArt === 'right' && isRight)) {
      total += 3;
    }

    // Taste (1 point)
    if ((score.taste === 'left' && isLeft) || 
        (score.taste === 'right' && isRight)) {
      total += 1;
    }

    // Tactile (1 point)
    if ((score.tactile === 'left' && isLeft) || 
        (score.tactile === 'right' && isRight)) {
      total += 1;
    }

    // Flavour (1 point)
    if ((score.flavour === 'left' && isLeft) || 
        (score.flavour === 'right' && isRight)) {
      total += 1;
    }

    // Overall (5 points)
    if ((score.overall === 'left' && isLeft) || 
        (score.overall === 'right' && isRight)) {
      total += 5;
    }
  }

  return total;
}

async function syncVerifiedScores() {
  console.log('🔄 Syncing database with verified Google Sheets data...\n');

  try {
    const tournamentId = 1;

    // Get all matches
    const matches = await sql`
      SELECT id, heat_number, competitor1_id, competitor2_id 
      FROM matches 
      WHERE tournament_id = ${tournamentId}
    `;

    console.log(`📊 Found ${matches.length} matches\n`);

    for (const [heatName, scores] of Object.entries(VERIFIED_SCORES)) {
      const heatNumber = parseInt(heatName.replace('Heat ', ''));
      const match = matches.find(m => m.heat_number === heatNumber);

      if (!match) {
        console.log(`⚠️  ${heatName}: Match not found`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ${heatName} (Match ID: ${match.id})`);
      console.log('='.repeat(60));

      // Get competitor info
      const comp1 = await sql`SELECT id, name FROM users WHERE id = ${match.competitor1_id} LIMIT 1`;
      const comp2 = await sql`SELECT id, name FROM users WHERE id = ${match.competitor2_id} LIMIT 1`;

      if (comp1.length === 0 || comp2.length === 0) {
        console.log(`   ⚠️  Competitors not found`);
        continue;
      }

      // Update/insert detailed scores
      for (const score of scores) {
        const existing = await sql`
          SELECT id FROM judge_detailed_scores 
          WHERE match_id = ${match.id} AND judge_name = ${score.judgeName}
          LIMIT 1
        `;

        if (existing.length === 0) {
          await sql`
            INSERT INTO judge_detailed_scores (
              match_id, judge_name, left_cup_code, right_cup_code, 
              sensory_beverage, visual_latte_art, taste, tactile, flavour, overall, submitted_at
            )
            VALUES (
              ${match.id}, ${score.judgeName}, ${score.leftCupCode}, ${score.rightCupCode},
              ${score.sensoryBeverage}, ${score.visualLatteArt}, ${score.taste}, 
              ${score.tactile}, ${score.flavour}, ${score.overall}, NOW()
            )
          `;
          console.log(`   ✅ Inserted score for ${score.judgeName}`);
        } else {
          await sql`
            UPDATE judge_detailed_scores
            SET left_cup_code = ${score.leftCupCode},
                right_cup_code = ${score.rightCupCode},
                sensory_beverage = ${score.sensoryBeverage},
                visual_latte_art = ${score.visualLatteArt},
                taste = ${score.taste},
                tactile = ${score.tactile},
                flavour = ${score.flavour},
                overall = ${score.overall}
            WHERE id = ${existing[0].id}
          `;
          console.log(`   🔄 Updated score for ${score.judgeName}`);
        }
      }

      // CUP CODES ARE ASSIGNED TO COMPETITORS, NOT JUDGES
      // Determine which competitor has which cup code
      // Get all unique cup codes from all judges
      const allCupCodes = new Set<string>();
      scores.forEach(s => {
        allCupCodes.add(s.leftCupCode);
        allCupCodes.add(s.rightCupCode);
      });
      
      const cupCodeArray = Array.from(allCupCodes);
      if (cupCodeArray.length !== 2) {
        console.log(`   ⚠️  Expected 2 cup codes, found ${cupCodeArray.length}`);
        continue;
      }

      // CUP CODES ARE ASSIGNED TO COMPETITORS, NOT JUDGES
      // Map competitors to their cup codes
      const competitorMapping = COMPETITOR_CUP_CODES[heatName];
      const comp1Name = comp1[0].name;
      const comp2Name = comp2[0].name;
      
      let comp1CupCode = '';
      let comp2CupCode = '';

      if (competitorMapping) {
        // Find cup code for each competitor by name match
        for (const [name, cupCode] of Object.entries(competitorMapping)) {
          if (comp1Name.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(comp1Name.toLowerCase())) {
            comp1CupCode = cupCode;
          }
          if (comp2Name.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(comp2Name.toLowerCase())) {
            comp2CupCode = cupCode;
          }
        }
      }

      // Fallback: use cup codes from judge scores if mapping not found
      if (!comp1CupCode || !comp2CupCode) {
        const allCupCodes = new Set<string>();
        scores.forEach(s => {
          allCupCodes.add(s.leftCupCode);
          allCupCodes.add(s.rightCupCode);
        });
        const cupCodeArray = Array.from(allCupCodes);
        if (cupCodeArray.length === 2) {
          comp1CupCode = comp1CupCode || cupCodeArray[0];
          comp2CupCode = comp2CupCode || cupCodeArray[1];
        }
      }

      if (!comp1CupCode || !comp2CupCode) {
        console.log(`   ⚠️  Could not determine cup codes for competitors`);
        continue;
      }

      // Calculate totals
      const comp1Total = calculateTotalScore(comp1CupCode, scores);
      const comp2Total = calculateTotalScore(comp2CupCode, scores);

      // Update heat scores
      await sql`DELETE FROM heat_scores WHERE match_id = ${match.id}`;

      await sql`
        INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, submitted_at)
        VALUES (${match.id}, 1, ${match.competitor1_id}, 'DIAL_IN'::segment_type, ${comp1Total}, NOW())
      `;

      await sql`
        INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, submitted_at)
        VALUES (${match.id}, 1, ${match.competitor2_id}, 'DIAL_IN'::segment_type, ${comp2Total}, NOW())
      `;

      console.log(`\n   ✅ Recalculated totals:`);
      console.log(`      ${comp1[0].name} (${comp1CupCode}): ${comp1Total} points`);
      console.log(`      ${comp2[0].name} (${comp2CupCode}): ${comp2Total} points`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Sync complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

syncVerifiedScores()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

