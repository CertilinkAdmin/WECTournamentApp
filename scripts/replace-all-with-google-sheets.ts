import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

// Judge name mapping (Google Sheets → Database)
const JUDGE_NAME_MAP: Record<string, string> = {
  'MC': 'Michalis',
  'JASPER': 'Jasper',
  'Shin': 'Shinsaku',
  'Korn': 'Korn',
  'Ali': 'Ali',
  'Junior': 'Junior',
  'Tess': 'Tess',
};

// Competitor to cup code mappings from Google Sheets (CUP CODES ARE ASSIGNED TO COMPETITORS)
const COMPETITOR_CUP_CODES: Record<string, Record<string, string>> = {
  'Heat 12': { 'Stevo': 'M7', 'Edwin': 'K9' },
  'Heat 13': { 'Kirill': 'F5', 'Anja': 'X1' },
  'Heat 19': { 'Artur': 'G2', 'Julian': 'W8' },
  'Heat 21': { 'Faiz': 'Q5', 'Christos': 'B1' },
  'Heat 22': { 'Stevo': 'J7', 'Danielle': 'T8' },
};

// Google Sheets data - COMPLETE replacement
const GOOGLE_SHEETS_DATA: Record<string, Array<{
  judge: string;
  beverage: 'CAPPUCCINO' | 'ESPRESSO';
  leftCupCode: string;
  rightCupCode: string;
  visualLatteArt: 'left' | 'right';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}>> = {
  'Heat 12': [
    {
      judge: 'MC',
      beverage: 'CAPPUCCINO',
      leftCupCode: 'M7', // Stevo
      rightCupCode: 'K9', // Edwin
      visualLatteArt: 'left', // M7 wins
      taste: 'left', // M7 wins
      tactile: 'left', // M7 wins
      flavour: 'right', // K9 wins
      overall: 'left' // M7 wins
    },
    {
      judge: 'Korn',
      beverage: 'ESPRESSO',
      leftCupCode: 'M7', // Stevo
      rightCupCode: 'K9', // Edwin
      visualLatteArt: 'right', // K9 wins
      taste: 'left', // M7 wins
      tactile: 'left', // M7 wins
      flavour: 'left', // M7 wins
      overall: 'left' // M7 wins
    },
    {
      judge: 'JASPER',
      beverage: 'ESPRESSO',
      leftCupCode: 'K9', // Edwin (NOTE: Different left/right assignment!)
      rightCupCode: 'M7', // Stevo
      visualLatteArt: 'left', // K9 wins
      taste: 'right', // M7 wins
      tactile: 'left', // K9 wins
      flavour: 'right', // M7 wins
      overall: 'right' // M7 wins
    }
  ],
  'Heat 13': [
    {
      judge: 'Shin',
      beverage: 'CAPPUCCINO',
      leftCupCode: 'F5', // Kirill
      rightCupCode: 'X1', // Anja
      visualLatteArt: 'left', // F5 wins (3pts)
      taste: 'left', // F5 wins (1pt)
      tactile: 'left', // F5 wins (1pt)
      flavour: 'left', // F5 wins (1pt)
      overall: 'left' // F5 wins (5pts) = 11 total for F5
    },
    {
      judge: 'Ali',
      beverage: 'CAPPUCCINO',
      leftCupCode: 'F5', // Kirill
      rightCupCode: 'X1', // Anja
      visualLatteArt: 'right', // X1 wins (3pts)
      taste: 'right', // X1 wins (1pt)
      tactile: 'right', // X1 wins (1pt)
      flavour: 'right', // X1 wins (1pt)
      overall: 'left' // F5 wins (5pts) = F5 gets 5, X1 gets 6
    },
    {
      judge: 'Ali',
      beverage: 'ESPRESSO',
      leftCupCode: 'X1', // Anja
      rightCupCode: 'F5', // Kirill
      visualLatteArt: 'right', // No latte art for espresso
      taste: 'left', // X1 wins (1pt)
      tactile: 'left', // X1 wins (1pt)
      flavour: 'right', // F5 wins (1pt)
      overall: 'right' // F5 wins (5pts) = F5 gets 6, X1 gets 2
    },
    {
      judge: 'Junior',
      beverage: 'ESPRESSO',
      leftCupCode: 'X1', // Anja
      rightCupCode: 'F5', // Kirill
      visualLatteArt: 'right', // No latte art for espresso
      taste: 'right', // F5 wins (1pt)
      tactile: 'right', // F5 wins (1pt)
      flavour: 'right', // F5 wins (1pt)
      overall: 'right' // F5 wins (5pts) = F5 gets 8, X1 gets 0
    }
  ],
  'Heat 19': [
    {
      judge: 'Tess',
      beverage: 'ESPRESSO',
      leftCupCode: 'G2', // Artur
      rightCupCode: 'W8', // Julian
      visualLatteArt: 'left', // G2 wins
      taste: 'left', // G2 wins
      tactile: 'left', // G2 wins
      flavour: 'left', // G2 wins
      overall: 'left' // G2 wins
    },
    {
      judge: 'Junior',
      beverage: 'ESPRESSO',
      leftCupCode: 'G2', // Artur
      rightCupCode: 'W8', // Julian
      visualLatteArt: 'right', // W8 wins
      taste: 'right', // W8 wins
      tactile: 'right', // W8 wins
      flavour: 'right', // W8 wins
      overall: 'right' // W8 wins
    }
  ],
  'Heat 21': [
    {
      judge: 'MC',
      beverage: 'CAPPUCCINO',
      leftCupCode: 'Q5', // Faiz
      rightCupCode: 'B1', // Christos
      visualLatteArt: 'right', // B1 wins
      taste: 'right', // B1 wins
      tactile: 'right', // B1 wins
      flavour: 'right', // B1 wins
      overall: 'right' // B1 wins
    },
    {
      judge: 'Ali',
      beverage: 'ESPRESSO',
      leftCupCode: 'Q5', // Faiz
      rightCupCode: 'B1', // Christos
      visualLatteArt: 'right', // B1 wins
      taste: 'right', // B1 wins
      tactile: 'left', // Q5 wins
      flavour: 'right', // B1 wins
      overall: 'right' // B1 wins
    },
    {
      judge: 'Jasper',
      beverage: 'ESPRESSO',
      leftCupCode: 'B1', // Christos (NOTE: Different assignment!)
      rightCupCode: 'Q5', // Faiz
      visualLatteArt: 'right', // Q5 wins
      taste: 'right', // Q5 wins
      tactile: 'right', // Q5 wins
      flavour: 'left', // B1 wins
      overall: 'right' // Q5 wins
    }
  ],
  'Heat 22': [
    {
      judge: 'Shin',
      beverage: 'CAPPUCCINO',
      leftCupCode: 'T8', // Danielle
      rightCupCode: 'J7', // Stevo
      visualLatteArt: 'left', // T8 wins
      taste: 'left', // T8 wins
      tactile: 'right', // J7 wins
      flavour: 'left', // T8 wins
      overall: 'left' // T8 wins
    }
  ]
};

// Calculate total score for a competitor
function calculateTotalScore(
  cupCode: string,
  judgeScores: typeof GOOGLE_SHEETS_DATA[string]
): number {
  let total = 0;

  for (const score of judgeScores) {
    const isLeft = score.leftCupCode === cupCode;
    const isRight = score.rightCupCode === cupCode;

    if (!isLeft && !isRight) continue;

    // Visual Latte Art (3 points) - ONLY for CAPPUCCINO
    if (score.beverage === 'CAPPUCCINO') {
      if ((score.visualLatteArt === 'left' && isLeft) || 
          (score.visualLatteArt === 'right' && isRight)) {
        total += 3;
      }
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

async function replaceAllWithGoogleSheets() {
  console.log('🔄 REPLACING ALL DATABASE SCORES WITH GOOGLE SHEETS DATA...\n');

  try {
    const tournamentId = 1;

    // Get all matches
    const matches = await sql`
      SELECT id, heat_number, competitor1_id, competitor2_id 
      FROM matches 
      WHERE tournament_id = ${tournamentId}
    `;

    console.log(`📊 Found ${matches.length} matches\n`);

    for (const [heatName, scores] of Object.entries(GOOGLE_SHEETS_DATA)) {
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

      // Map competitors to cup codes
      const competitorMapping = COMPETITOR_CUP_CODES[heatName];
      const comp1Name = comp1[0].name;
      const comp2Name = comp2[0].name;
      
      let comp1CupCode = '';
      let comp2CupCode = '';

      if (competitorMapping) {
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

      if (!comp1CupCode || !comp2CupCode) {
        console.log(`   ⚠️  Could not map competitors to cup codes`);
        continue;
      }

      console.log(`   📌 Cup Codes: ${comp1Name} = ${comp1CupCode}, ${comp2Name} = ${comp2CupCode}`);

      // DELETE all existing scores for this match
      await sql`DELETE FROM judge_detailed_scores WHERE match_id = ${match.id}`;
      await sql`DELETE FROM heat_scores WHERE match_id = ${match.id}`;
      console.log(`   🗑️  Deleted all existing scores`);

      // INSERT new scores from Google Sheets
      for (const score of scores) {
        const judgeName = JUDGE_NAME_MAP[score.judge] || score.judge;
        
        await sql`
          INSERT INTO judge_detailed_scores (
            match_id, judge_name, left_cup_code, right_cup_code, 
            sensory_beverage, visual_latte_art, taste, tactile, flavour, overall, submitted_at
          )
          VALUES (
            ${match.id}, ${judgeName}, ${score.leftCupCode}, ${score.rightCupCode},
            ${score.beverage === 'CAPPUCCINO' ? 'Cappuccino' : 'Espresso'}, 
            ${score.visualLatteArt}, ${score.taste}, 
            ${score.tactile}, ${score.flavour}, ${score.overall}, NOW()
          )
        `;
        console.log(`   ✅ Inserted score for ${judgeName} (${score.beverage})`);
      }

      // Calculate and insert totals
      const comp1Total = calculateTotalScore(comp1CupCode, scores);
      const comp2Total = calculateTotalScore(comp2CupCode, scores);

      await sql`
        INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, submitted_at)
        VALUES (${match.id}, 1, ${match.competitor1_id}, 'DIAL_IN'::segment_type, ${comp1Total}, NOW())
      `;

      await sql`
        INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, submitted_at)
        VALUES (${match.id}, 1, ${match.competitor2_id}, 'DIAL_IN'::segment_type, ${comp2Total}, NOW())
      `;

      console.log(`\n   ✅ Final Totals:`);
      console.log(`      ${comp1Name} (${comp1CupCode}): ${comp1Total} points`);
      console.log(`      ${comp2Name} (${comp2CupCode}): ${comp2Total} points`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ ALL SCORES REPLACED WITH GOOGLE SHEETS DATA!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

replaceAllWithGoogleSheets()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

