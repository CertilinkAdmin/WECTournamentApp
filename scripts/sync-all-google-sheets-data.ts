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

// Competitor to cup code mappings (CUP CODES ARE ASSIGNED TO COMPETITORS)
// From Google Sheets competitor totals section
const COMPETITOR_CUP_CODES: Record<string, Record<string, string>> = {
  'Heat 12': { 'Stevo': 'M7', 'Edwin': 'K9' },
  'Heat 13': { 'Kirill': 'F5', 'Anja': 'X1' },
  'Heat 19': { 'Artur': 'G2', 'Julian': 'W8' },
  'Heat 21': { 'Faiz': 'Q5', 'Christos': 'B1' },
  'Heat 22': { 'Stevo': 'J7', 'Danielle': 'T8' },
};

// Google Sheets data structure
interface GoogleSheetsRow {
  heat: string;
  judge: string;
  latteArt?: string;
  cupCode?: string;
  beverage?: string;
  taste?: string;
  tactile?: string;
  flavour?: string;
  overall?: string;
  subtotal?: string;
  cupCodes?: string;
  code?: string;
  total?: string;
  competitor?: string;
}

// Parsed judge score
interface ParsedJudgeScore {
  judgeName: string;
  leftCupCode: string;
  rightCupCode: string;
  sensoryBeverage: 'Cappuccino' | 'Espresso';
  visualLatteArt: 'left' | 'right';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}

// Google Sheets data (from spreadsheet)
const GOOGLE_SHEETS_DATA: Record<string, GoogleSheetsRow[]> = {
  'Heat 12': [
    { heat: 'Heat 12', judge: 'MC', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'M7', taste: 'CAPPUCCINO', tactile: 'LEFT CUP', flavour: '1', overall: '1', subtotal: '5', cupCodes: '7', code: 'M7' },
    { heat: 'Heat 12', judge: 'MC', latteArt: 'RIGHT CUP', cupCode: 'K9', beverage: 'CAPPUCCINO', taste: 'RIGHT CUP', tactile: '1', flavour: '1', cupCodes: 'K9' },
    { heat: 'Heat 12', judge: 'Korn', latteArt: 'LEFT CUP', cupCode: 'M7' },
    { heat: 'Heat 12', judge: 'Korn', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'K9' },
    { heat: 'Heat 12', judge: 'JASPER', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'M7' },
    { heat: 'Heat 12', judge: 'JASPER', latteArt: 'RIGHT CUP', cupCode: 'K9' },
    { heat: 'Heat 12', judge: 'Korn', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', flavour: '1', overall: '5', subtotal: '8', cupCodes: 'M7' },
    { heat: 'Heat 12', judge: 'Korn', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '0', cupCodes: 'K9' },
    { heat: 'Heat 12', judge: 'JASPER', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'K9' },
    { heat: 'Heat 12', judge: 'JASPER', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'M7' },
  ],
  'Heat 13': [
    { heat: 'Heat 13', judge: 'Shin', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'F5', taste: 'CAPPUCCINO', tactile: 'LEFT CUP', flavour: '1', overall: '1', subtotal: '1', cupCodes: '5', code: '8', total: 'F5' },
    { heat: 'Heat 13', judge: 'Shin', latteArt: 'RIGHT CUP', cupCode: 'X1', beverage: 'CAPPUCCINO', taste: 'RIGHT CUP', tactile: '0', cupCodes: 'X1' },
    { heat: 'Heat 13', judge: 'Ali', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'F5' },
    { heat: 'Heat 13', judge: 'Ali', latteArt: 'RIGHT CUP', cupCode: 'X1' },
    { heat: 'Heat 13', judge: 'Junior', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'F5' },
    { heat: 'Heat 13', judge: 'Junior', latteArt: 'RIGHT CUP', cupCode: 'X1' },
    { heat: 'Heat 13', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'X1' },
    { heat: 'Heat 13', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'F5' },
  ],
  'Heat 19': [
    { heat: 'Heat 19', judge: 'Tess', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'G2' },
    { heat: 'Heat 19', judge: 'Tess', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', cupCodes: 'W8' },
    { heat: 'Heat 19', judge: 'Junior', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '0', cupCodes: 'G2' },
    { heat: 'Heat 19', judge: 'Junior', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '1', overall: '5', subtotal: '8', cupCodes: 'W8' },
  ],
  'Heat 21': [
    { heat: 'Heat 21', judge: 'MC', latteArt: 'LEFT CUP', cupCode: 'Q5', beverage: 'CAPPUCCINO', taste: 'LEFT CUP', tactile: '0', cupCodes: 'Q5' },
    { heat: 'Heat 21', judge: 'MC', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'B1', taste: 'CAPPUCCINO', tactile: 'RIGHT CUP', flavour: '1', overall: '1', subtotal: '1', cupCodes: '5', code: '8', total: 'B1' },
    { heat: 'Heat 21', judge: 'Ali', latteArt: 'LEFT CUP', cupCode: 'Q5' },
    { heat: 'Heat 21', judge: 'Ali', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'B1' },
    { heat: 'Heat 21', judge: 'Jasper', latteArt: 'LEFT CUP', cupCode: 'Q5' },
    { heat: 'Heat 21', judge: 'Jasper', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'B1' },
    { heat: 'Heat 21', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'Q5' },
    { heat: 'Heat 21', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'B1' },
    { heat: 'Heat 21', judge: 'Jasper', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'B1' },
    { heat: 'Heat 21', judge: 'Jasper', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'Q5' },
  ],
  'Heat 22': [
    { heat: 'Heat 22', judge: 'Shin', latteArt: 'LEFT CUP', cupCode: 'T8', beverage: 'CAPPUCCINO', taste: 'LEFT CUP', tactile: '0', cupCodes: 'T8' },
  ],
};

// Parse Google Sheets data into judge scores
// IMPORTANT: Cup codes are assigned to competitors, not judges
function parseJudgeScores(
  heatRows: GoogleSheetsRow[],
  heatName: string,
  competitorCupCodes: Record<string, string>
): ParsedJudgeScore[] {
  const judgeScores: Map<string, ParsedJudgeScore> = new Map();
  const cupCodes = Object.values(competitorCupCodes);
  
  if (cupCodes.length !== 2) {
    console.log(`   ⚠️  Expected 2 cup codes, found ${cupCodes.length}`);
    return [];
  }

  const [cupCode1, cupCode2] = cupCodes;

  for (const row of heatRows) {
    const judgeName = JUDGE_NAME_MAP[row.judge] || row.judge;
    
    if (!judgeScores.has(judgeName)) {
      judgeScores.set(judgeName, {
        judgeName,
        leftCupCode: '',
        rightCupCode: '',
        sensoryBeverage: 'Cappuccino',
        visualLatteArt: 'left',
        taste: 'left',
        tactile: 'left',
        flavour: 'left',
        overall: 'left',
      });
    }

    const score = judgeScores.get(judgeName)!;

    // Parse Cappuccino data
    if (row.beverage === 'CAPPUCCINO' && row.latteArt) {
      score.sensoryBeverage = 'Cappuccino';
      
      if (row.latteArt === 'LEFT CUP') {
        // Extract cup code - could be in code, beverage, or cupCode field
        let leftCode = row.code || row.beverage || '';
        if (leftCode && leftCode.length <= 3 && leftCode !== 'CAPPUCCINO' && leftCode !== '3') {
          // Validate it's one of our cup codes
          if (cupCodes.includes(leftCode)) {
            score.leftCupCode = leftCode;
          }
        }
        score.visualLatteArt = 'left';
      } else if (row.latteArt === 'RIGHT CUP') {
        let rightCode = row.cupCode || row.cupCodes || '';
        if (rightCode && rightCode !== '3') {
          if (cupCodes.includes(rightCode)) {
            score.rightCupCode = rightCode;
          }
        }
        score.visualLatteArt = 'right';
      }

      // Parse category winners
      if (row.taste === 'LEFT CUP') score.taste = 'left';
      else if (row.taste === 'RIGHT CUP') score.taste = 'right';
      else if (row.taste === 'CAPPUCCINO' && row.latteArt === 'LEFT CUP') score.taste = 'left';

      if (row.tactile === 'LEFT CUP') score.tactile = 'left';
      else if (row.tactile === 'RIGHT CUP') score.tactile = 'right';
      else if (row.tactile === '1' && row.latteArt === 'LEFT CUP') score.tactile = 'left';
      else if (row.tactile === '1' && row.latteArt === 'RIGHT CUP') score.tactile = 'right';

      if (row.flavour === '1' && row.latteArt === 'LEFT CUP') score.flavour = 'left';
      else if (row.flavour === '1' && row.latteArt === 'RIGHT CUP') score.flavour = 'right';

      if (row.overall === '1' && row.latteArt === 'LEFT CUP') score.overall = 'left';
      else if (row.overall === '1' && row.latteArt === 'RIGHT CUP') score.overall = 'right';
    }

    // Parse Espresso data
    if (row.beverage === 'ESPRESSO') {
      score.sensoryBeverage = 'Espresso';
      
      if (row.cupCodes && cupCodes.includes(row.cupCodes)) {
        if (row.latteArt === 'LEFT CUP') {
          score.leftCupCode = row.cupCodes;
        } else if (row.latteArt === 'RIGHT CUP') {
          score.rightCupCode = row.cupCodes;
        }
      }

      // Parse scores
      if (row.taste === '1') {
        score.taste = row.latteArt === 'LEFT CUP' ? 'left' : 'right';
      } else if (row.taste === '0') {
        score.taste = row.latteArt === 'LEFT CUP' ? 'right' : 'left';
      }

      if (row.tactile === '1') {
        score.tactile = row.latteArt === 'LEFT CUP' ? 'left' : 'right';
      } else if (row.tactile === '0') {
        score.tactile = row.latteArt === 'LEFT CUP' ? 'right' : 'left';
      }

      if (row.flavour === '1') {
        score.flavour = row.latteArt === 'LEFT CUP' ? 'left' : 'right';
      } else if (row.flavour === '5') {
        score.flavour = row.latteArt === 'LEFT CUP' ? 'right' : 'left';
      }

      if (row.overall === '5' || row.overall === '7') {
        score.overall = row.latteArt === 'LEFT CUP' ? 'right' : 'left';
      } else if (row.overall === '1') {
        score.overall = row.latteArt === 'LEFT CUP' ? 'left' : 'right';
      }
    }
  }

  // Ensure all scores have cup codes assigned
  for (const score of judgeScores.values()) {
    if (!score.leftCupCode || !score.rightCupCode) {
      // Assign based on most common pattern
      const allLeftCodes = heatRows
        .filter(r => r.latteArt === 'LEFT CUP' && (r.cupCode || r.code || r.cupCodes))
        .map(r => r.cupCode || r.code || r.cupCodes)
        .filter(c => c && c !== '3' && cupCodes.includes(c));
      
      const allRightCodes = heatRows
        .filter(r => r.latteArt === 'RIGHT CUP' && (r.cupCode || r.cupCodes))
        .map(r => r.cupCode || r.cupCodes)
        .filter(c => c && c !== '3' && cupCodes.includes(c));

      if (allLeftCodes.length > 0 && !score.leftCupCode) {
        score.leftCupCode = allLeftCodes[0];
      }
      if (allRightCodes.length > 0 && !score.rightCupCode) {
        score.rightCupCode = allRightCodes[0];
      }

      // Final fallback: use the competitor cup codes
      if (!score.leftCupCode) score.leftCupCode = cupCode1;
      if (!score.rightCupCode) score.rightCupCode = cupCode2;
    }
  }

  return Array.from(judgeScores.values());
}

// Calculate total score for a competitor (by their cup code)
function calculateCompetitorScore(
  cupCode: string,
  judgeScores: ParsedJudgeScore[]
): number {
  let total = 0;

  for (const score of judgeScores) {
    // Check which cup (left or right) has this competitor's cup code
    const isLeftCup = score.leftCupCode === cupCode;
    const isRightCup = score.rightCupCode === cupCode;

    if (!isLeftCup && !isRightCup) continue;

    // Visual Latte Art (3 points)
    if ((score.visualLatteArt === 'left' && isLeftCup) || 
        (score.visualLatteArt === 'right' && isRightCup)) {
      total += 3;
    }

    // Taste (1 point)
    if ((score.taste === 'left' && isLeftCup) || 
        (score.taste === 'right' && isRightCup)) {
      total += 1;
    }

    // Tactile (1 point)
    if ((score.tactile === 'left' && isLeftCup) || 
        (score.tactile === 'right' && isRightCup)) {
      total += 1;
    }

    // Flavour (1 point)
    if ((score.flavour === 'left' && isLeftCup) || 
        (score.flavour === 'right' && isRightCup)) {
      total += 1;
    }

    // Overall (5 points)
    if ((score.overall === 'left' && isLeftCup) || 
        (score.overall === 'right' && isRightCup)) {
      total += 5;
    }
  }

  return total;
}

async function syncAllGoogleSheetsData() {
  console.log('🔄 Syncing all Google Sheets data to database...\n');

  try {
    const tournamentId = 1;

    // Get all matches
    const matches = await sql`
      SELECT id, heat_number, competitor1_id, competitor2_id 
      FROM matches 
      WHERE tournament_id = ${tournamentId}
    `;

    console.log(`📊 Found ${matches.length} matches\n`);

    for (const [heatName, sheetsRows] of Object.entries(GOOGLE_SHEETS_DATA)) {
      const heatNumber = parseInt(heatName.replace('Heat ', ''));
      const match = matches.find(m => m.heat_number === heatNumber);

      if (!match) {
        console.log(`⚠️  ${heatName}: Match not found`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ${heatName} (Match ID: ${match.id})`);
      console.log('='.repeat(60));

      // Get competitor cup code mapping
      const competitorMapping = COMPETITOR_CUP_CODES[heatName];
      if (!competitorMapping) {
        console.log(`   ⚠️  No competitor cup code mapping found`);
        continue;
      }

      // Get competitor info
      const comp1 = await sql`SELECT id, name FROM users WHERE id = ${match.competitor1_id} LIMIT 1`;
      const comp2 = await sql`SELECT id, name FROM users WHERE id = ${match.competitor2_id} LIMIT 1`;

      if (comp1.length === 0 || comp2.length === 0) {
        console.log(`   ⚠️  Competitors not found`);
        continue;
      }

      // Map competitors to cup codes
      const comp1Name = comp1[0].name;
      const comp2Name = comp2[0].name;
      
      let comp1CupCode = '';
      let comp2CupCode = '';

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

      if (!comp1CupCode || !comp2CupCode) {
        console.log(`   ⚠️  Could not map competitors to cup codes`);
        continue;
      }

      console.log(`   📌 Cup Codes: ${comp1Name} = ${comp1CupCode}, ${comp2Name} = ${comp2CupCode}`);

      // Parse judge scores
      const parsedScores = parseJudgeScores(sheetsRows, heatName, competitorMapping);
      console.log(`\n📝 Parsed ${parsedScores.length} judge scores`);

      // Insert/update detailed scores
      for (const score of parsedScores) {
        if (!score.leftCupCode || !score.rightCupCode) {
          console.log(`   ⚠️  Skipping ${score.judgeName}: Missing cup codes`);
          continue;
        }

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

      // Recalculate competitor totals
      const comp1Total = calculateCompetitorScore(comp1CupCode, parsedScores);
      const comp2Total = calculateCompetitorScore(comp2CupCode, parsedScores);

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
      console.log(`      ${comp1Name} (${comp1CupCode}): ${comp1Total} points`);
      console.log(`      ${comp2Name} (${comp2CupCode}): ${comp2Total} points`);
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

syncAllGoogleSheetsData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

