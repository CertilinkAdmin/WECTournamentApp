import postgres from 'postgres';
import { db } from '../server/db';
import { matches, judgeDetailedScores, heatScores, users } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

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

// Parsed judge score data
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

// Cup code mappings per heat (from Google Sheets competitor totals)
const CUP_CODE_MAPPINGS: Record<string, { left: string; right: string }> = {
  'Heat 12': { left: 'M7', right: 'K9' }, // Stevo (M7) vs Edwin (K9)
  'Heat 13': { left: 'F5', right: 'X1' }, // From Google Sheets
  'Heat 19': { left: 'G2', right: 'W8' }, // Artur (G2) vs Julian (W8)
  'Heat 21': { left: 'Q5', right: 'B1' }, // Faiz (Q5) vs Chrisos (B1)
  'Heat 22': { left: 'T8', right: '??' }, // T8 vs unknown
};

// Google Sheets data (from the spreadsheet)
const GOOGLE_SHEETS_DATA: Record<string, GoogleSheetsRow[]> = {
  'Heat 12': [
    // MC - Cappuccino
    { heat: 'Heat 12', judge: 'MC', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'M7', taste: 'CAPPUCCINO', tactile: 'LEFT CUP', flavour: '1', overall: '1', subtotal: '5', cupCodes: '7', code: 'M7' },
    { heat: 'Heat 12', judge: 'MC', latteArt: 'RIGHT CUP', cupCode: 'K9', beverage: 'CAPPUCCINO', taste: 'RIGHT CUP', tactile: '1', flavour: '1', cupCodes: 'K9' },
    // Korn - Cappuccino
    { heat: 'Heat 12', judge: 'Korn', latteArt: 'LEFT CUP', cupCode: 'M7' },
    { heat: 'Heat 12', judge: 'Korn', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'K9' },
    // JASPER - Cappuccino
    { heat: 'Heat 12', judge: 'JASPER', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'M7' },
    { heat: 'Heat 12', judge: 'JASPER', latteArt: 'RIGHT CUP', cupCode: 'K9' },
    // Korn - Espresso
    { heat: 'Heat 12', judge: 'Korn', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', flavour: '1', overall: '5', subtotal: '8', cupCodes: 'M7' },
    { heat: 'Heat 12', judge: 'Korn', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '0', cupCodes: 'K9' },
    // JASPER - Espresso
    { heat: 'Heat 12', judge: 'JASPER', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'K9' },
    { heat: 'Heat 12', judge: 'JASPER', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'M7' },
  ],
  'Heat 13': [
    // Shin - Cappuccino
    { heat: 'Heat 13', judge: 'Shin', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'F5', taste: 'CAPPUCCINO', tactile: 'LEFT CUP', flavour: '1', overall: '1', subtotal: '1', cupCodes: '5', code: '8', total: 'F5' },
    { heat: 'Heat 13', judge: 'Shin', latteArt: 'RIGHT CUP', cupCode: 'X1', beverage: 'CAPPUCCINO', taste: 'RIGHT CUP', tactile: '0', cupCodes: 'X1' },
    // Ali - Cappuccino
    { heat: 'Heat 13', judge: 'Ali', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'F5' },
    { heat: 'Heat 13', judge: 'Ali', latteArt: 'RIGHT CUP', cupCode: 'X1' },
    // Junior - Cappuccino
    { heat: 'Heat 13', judge: 'Junior', latteArt: 'LEFT CUP', cupCode: '3', beverage: 'F5' },
    { heat: 'Heat 13', judge: 'Junior', latteArt: 'RIGHT CUP', cupCode: 'X1' },
    // Ali - Espresso
    { heat: 'Heat 13', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'X1' },
    { heat: 'Heat 13', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'F5' },
  ],
  'Heat 19': [
    // Tess - Espresso
    { heat: 'Heat 19', judge: 'Tess', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'G2' },
    { heat: 'Heat 19', judge: 'Tess', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', cupCodes: 'W8' },
    // Junior - Espresso
    { heat: 'Heat 19', judge: 'Junior', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '0', cupCodes: 'G2' },
    { heat: 'Heat 19', judge: 'Junior', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '1', overall: '5', subtotal: '8', cupCodes: 'W8' },
  ],
  'Heat 21': [
    // MC - Cappuccino
    { heat: 'Heat 21', judge: 'MC', latteArt: 'LEFT CUP', cupCode: 'Q5', beverage: 'CAPPUCCINO', taste: 'LEFT CUP', tactile: '0', cupCodes: 'Q5' },
    { heat: 'Heat 21', judge: 'MC', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'B1', taste: 'CAPPUCCINO', tactile: 'RIGHT CUP', flavour: '1', overall: '1', subtotal: '1', cupCodes: '5', code: '8', total: 'B1' },
    // Ali - Cappuccino
    { heat: 'Heat 21', judge: 'Ali', latteArt: 'LEFT CUP', cupCode: 'Q5' },
    { heat: 'Heat 21', judge: 'Ali', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'B1' },
    // Jasper - Cappuccino
    { heat: 'Heat 21', judge: 'Jasper', latteArt: 'LEFT CUP', cupCode: 'Q5' },
    { heat: 'Heat 21', judge: 'Jasper', latteArt: 'RIGHT CUP', cupCode: '3', beverage: 'B1' },
    // Ali - Espresso
    { heat: 'Heat 21', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'Q5' },
    { heat: 'Heat 21', judge: 'Ali', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'B1' },
    // Jasper - Espresso
    { heat: 'Heat 21', judge: 'Jasper', beverage: 'ESPRESSO', latteArt: 'LEFT CUP', taste: '1', tactile: '1', cupCodes: 'B1' },
    { heat: 'Heat 21', judge: 'Jasper', beverage: 'ESPRESSO', latteArt: 'RIGHT CUP', taste: '1', tactile: '1', flavour: '5', overall: '7', cupCodes: 'Q5' },
  ],
  'Heat 22': [
    // Shin - Cappuccino
    { heat: 'Heat 22', judge: 'Shin', latteArt: 'LEFT CUP', cupCode: 'T8', beverage: 'CAPPUCCINO', taste: 'LEFT CUP', tactile: '0', cupCodes: 'T8' },
  ],
};

// Parse Google Sheets rows into judge detailed scores
function parseJudgeScores(heatRows: GoogleSheetsRow[], heatName: string): ParsedJudgeScore[] {
  const judgeScores: Map<string, ParsedJudgeScore> = new Map();
  
  // Get cup code mapping for this heat
  const cupCodes = CUP_CODE_MAPPINGS[heatName] || { left: '', right: '' };

  // First pass: collect cup codes from Cappuccino rows
  const cupCodeMap: Map<string, { left?: string; right?: string }> = new Map();
  
  for (const row of heatRows) {
    const judgeName = JUDGE_NAME_MAP[row.judge] || row.judge;
    
    if (row.beverage === 'CAPPUCCINO' && row.latteArt) {
      if (!cupCodeMap.has(judgeName)) {
        cupCodeMap.set(judgeName, {});
      }
      
      const codes = cupCodeMap.get(judgeName)!;
      
      if (row.latteArt === 'LEFT CUP') {
        // Try to extract cup code from various fields
        let leftCode = row.code || row.cupCodes || '';
        // If beverage field has format like "M7" or "F5", use that
        if (row.beverage && row.beverage.length <= 3 && row.beverage !== 'CAPPUCCINO') {
          leftCode = row.beverage;
        }
        // If cupCode is not '3', use it
        if (row.cupCode && row.cupCode !== '3') {
          leftCode = row.cupCode;
        }
        // Fallback to heat mapping
        if (!leftCode || leftCode === '3') {
          leftCode = cupCodes.left;
        }
        if (leftCode && leftCode !== '3') {
          codes.left = leftCode;
        }
      } else if (row.latteArt === 'RIGHT CUP') {
        let rightCode = row.cupCode || row.cupCodes || '';
        // Fallback to heat mapping
        if (!rightCode || rightCode === '3') {
          rightCode = cupCodes.right;
        }
        if (rightCode && rightCode !== '3') {
          codes.right = rightCode;
        }
      }
    }
  }

  // Second pass: build complete scores
  for (const row of heatRows) {
    const judgeName = JUDGE_NAME_MAP[row.judge] || row.judge;
    
    if (!judgeScores.has(judgeName)) {
      const codes = cupCodeMap.get(judgeName) || {};
      judgeScores.set(judgeName, {
        judgeName,
        leftCupCode: codes.left || cupCodes.left || '',
        rightCupCode: codes.right || cupCodes.right || '',
        sensoryBeverage: 'Cappuccino',
        visualLatteArt: 'left',
        taste: 'left',
        tactile: 'left',
        flavour: 'left',
        overall: 'left',
      });
    }

    const score = judgeScores.get(judgeName)!;

    // Parse Cappuccino data (latte art)
    if (row.beverage === 'CAPPUCCINO' && row.latteArt) {
      score.sensoryBeverage = 'Cappuccino';
      
      if (row.latteArt === 'LEFT CUP') {
        score.visualLatteArt = 'left';
        // Update cup code if we found it
        const codes = cupCodeMap.get(judgeName);
        if (codes?.left) {
          score.leftCupCode = codes.left;
        }
      } else if (row.latteArt === 'RIGHT CUP') {
        score.visualLatteArt = 'right';
        const codes = cupCodeMap.get(judgeName);
        if (codes?.right) {
          score.rightCupCode = codes.right;
        }
      }

      // Parse taste/tactile from Cappuccino rows
      if (row.taste === 'LEFT CUP') {
        score.taste = 'left';
      } else if (row.taste === 'RIGHT CUP') {
        score.taste = 'right';
      } else if (row.taste === 'CAPPUCCINO' && row.latteArt === 'LEFT CUP') {
        score.taste = 'left';
      }

      if (row.tactile === 'LEFT CUP') {
        score.tactile = 'left';
      } else if (row.tactile === 'RIGHT CUP') {
        score.tactile = 'right';
      } else if (row.tactile === '1' && row.latteArt === 'LEFT CUP') {
        score.tactile = 'left';
      } else if (row.tactile === '1' && row.latteArt === 'RIGHT CUP') {
        score.tactile = 'right';
      }

      if (row.flavour === '1' && row.latteArt === 'LEFT CUP') {
        score.flavour = 'left';
      } else if (row.flavour === '1' && row.latteArt === 'RIGHT CUP') {
        score.flavour = 'right';
      }

      if (row.overall === '1' && row.latteArt === 'LEFT CUP') {
        score.overall = 'left';
      } else if (row.overall === '1' && row.latteArt === 'RIGHT CUP') {
        score.overall = 'right';
      }
    }

    // Parse Espresso data
    if (row.beverage === 'ESPRESSO') {
      score.sensoryBeverage = 'Espresso';
      
      // Cup codes from cupCodes field
      if (row.cupCodes && row.cupCodes !== '3') {
        if (row.latteArt === 'LEFT CUP') {
          score.leftCupCode = row.cupCodes;
        } else if (row.latteArt === 'RIGHT CUP') {
          score.rightCupCode = row.cupCodes;
        }
      }

      // Parse scores - '1' means that cup won, '0' means it lost
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

  return Array.from(judgeScores.values());
}

// Calculate score for a competitor based on detailed scores
// IMPORTANT: Each judge can have different left/right cup assignments!
function calculateCompetitorScore(
  cupCode: string,
  detailedScores: ParsedJudgeScore[]
): number {
  let total = 0;

  for (const score of detailedScores) {
    // Check which cup (left or right) has this cup code for this judge
    const isLeftCup = score.leftCupCode === cupCode;
    const isRightCup = score.rightCupCode === cupCode;

    if (!isLeftCup && !isRightCup) {
      // This competitor's cup code doesn't match this judge's assignment
      continue;
    }

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

async function syncGoogleSheetsData() {
  console.log('🔄 Syncing database with Google Sheets data...\n');

  try {
    const tournamentId = 1;

    // Fetch all matches
    const allMatches = await db.select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId));

    console.log(`📊 Found ${allMatches.length} matches in database\n`);

    // Process each heat from Google Sheets
    for (const [heatName, sheetsRows] of Object.entries(GOOGLE_SHEETS_DATA)) {
      const heatNumber = parseInt(heatName.replace('Heat ', ''));
      const match = allMatches.find(m => m.heatNumber === heatNumber);

      if (!match) {
        console.log(`⚠️  ${heatName}: Match not found, skipping...`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Processing ${heatName} (Match ID: ${match.id})`);
      console.log('='.repeat(60));

      // Parse judge scores from Google Sheets
      const parsedScores = parseJudgeScores(sheetsRows, heatName);
      console.log(`\n📝 Parsed ${parsedScores.length} judge scores from Google Sheets`);

      // Insert/update detailed scores
      for (const score of parsedScores) {
        if (!score.leftCupCode || !score.rightCupCode) {
          console.log(`   ⚠️  Skipping ${score.judgeName}: Missing cup codes`);
          continue;
        }

        // Check if score already exists
        const existing = await sql`
          SELECT id FROM judge_detailed_scores 
          WHERE match_id = ${match.id} AND judge_name = ${score.judgeName}
          LIMIT 1
        `;

        if (existing.length === 0) {
          // Insert new score
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
          // Update existing score
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

      // Recalculate heat scores based on detailed scores
      const allDetailedScores = await sql`
        SELECT * FROM judge_detailed_scores WHERE match_id = ${match.id}
      `;

      if (allDetailedScores.length > 0 && match.competitor1Id && match.competitor2Id) {
        // Get competitor names
        const comp1 = await sql`SELECT id, name FROM users WHERE id = ${match.competitor1Id} LIMIT 1`;
        const comp2 = await sql`SELECT id, name FROM users WHERE id = ${match.competitor2Id} LIMIT 1`;

        if (comp1.length === 0 || comp2.length === 0) {
          console.log(`   ⚠️  Skipping score recalculation: Competitors not found`);
          continue;
        }

        // Get cup codes from cup code mappings
        const cupCodes = CUP_CODE_MAPPINGS[heatName];
        if (!cupCodes) {
          console.log(`   ⚠️  Skipping score recalculation: No cup code mapping for ${heatName}`);
          continue;
        }

        // Map cup codes to competitors (need to determine which competitor has which cup code)
        // For now, use the first judge's cup codes as reference
        const firstScore = allDetailedScores[0];
        let comp1CupCode = cupCodes.left;
        let comp2CupCode = cupCodes.right;

        // Try to determine which competitor has which cup code by checking all judges
        // Most judges should agree on the left/right assignment
        const leftCounts: Record<string, number> = {};
        const rightCounts: Record<string, number> = {};
        
        for (const score of allDetailedScores) {
          leftCounts[score.left_cup_code] = (leftCounts[score.left_cup_code] || 0) + 1;
          rightCounts[score.right_cup_code] = (rightCounts[score.right_cup_code] || 0) + 1;
        }

        // Find most common cup codes
        const mostCommonLeft = Object.keys(leftCounts).reduce((a, b) => leftCounts[a] > leftCounts[b] ? a : b);
        const mostCommonRight = Object.keys(rightCounts).reduce((a, b) => rightCounts[a] > rightCounts[b] ? a : b);

        comp1CupCode = mostCommonLeft;
        comp2CupCode = mostCommonRight;

        // Parse scores for calculation
        const parsedDetailedScores: ParsedJudgeScore[] = allDetailedScores.map((s: any) => ({
          judgeName: s.judge_name,
          leftCupCode: s.left_cup_code,
          rightCupCode: s.right_cup_code,
          sensoryBeverage: s.sensory_beverage,
          visualLatteArt: s.visual_latte_art,
          taste: s.taste,
          tactile: s.tactile,
          flavour: s.flavour,
          overall: s.overall,
        }));

        // Calculate total scores for each competitor
        const comp1Total = calculateCompetitorScore(comp1CupCode, parsedDetailedScores);
        const comp2Total = calculateCompetitorScore(comp2CupCode, parsedDetailedScores);

        // Delete all existing heat scores for this match
        await sql`DELETE FROM heat_scores WHERE match_id = ${match.id}`;

        // Insert new total scores (using DIAL_IN segment as aggregate)
        await sql`
          INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, submitted_at)
          VALUES (${match.id}, 1, ${match.competitor1Id}, 'DIAL_IN'::segment_type, ${comp1Total}, NOW())
        `;

        await sql`
          INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, submitted_at)
          VALUES (${match.id}, 1, ${match.competitor2Id}, 'DIAL_IN'::segment_type, ${comp2Total}, NOW())
        `;

        console.log(`   ✅ Recalculated scores:`);
        console.log(`      ${comp1[0].name} (${comp1CupCode}): ${comp1Total} points`);
        console.log(`      ${comp2[0].name} (${comp2CupCode}): ${comp2Total} points`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Sync complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error syncing data:', error);
    throw error;
  }
}

// Run sync
syncGoogleSheetsData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

