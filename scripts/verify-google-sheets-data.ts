import { db } from '../server/db';
import { matches, judgeDetailedScores, heatScores, users, tournaments } from '../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Google Sheets data structure (from the provided spreadsheet)
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

// Sample data from Google Sheets (Heat 12, 13, 19, 21, 22)
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

// Competitor mappings from Google Sheets
const COMPETITOR_MAPPINGS: Record<string, { cupCode: string; total: number; name: string }> = {
  'Heat 12': [
    { cupCode: 'M7', total: 28, name: 'Stevo' },
    { cupCode: 'K9', total: 5, name: 'Edwin' },
  ],
  'Heat 13': [
    { cupCode: 'F5', total: 25, name: 'Chrisos' }, // Inferred from Heat 21
    { cupCode: 'X1', total: 7, name: 'Unknown' },
  ],
  'Heat 19': [
    { cupCode: 'G2', total: 24, name: 'Artur' },
    { cupCode: 'W8', total: 9, name: 'Julian' },
  ],
  'Heat 21': [
    { cupCode: 'Q5', total: 8, name: 'Faiz' },
    { cupCode: 'B1', total: 25, name: 'Chrisos' },
  ],
};

async function verifyGoogleSheetsData() {
  console.log('🔍 Verifying database data against Google Sheets...\n');

  try {
    // Get tournament ID 1 (WEC2025 Milano)
    const tournament = await db.select().from(tournaments).where(eq(tournaments.id, 1)).limit(1);
    if (!tournament || tournament.length === 0) {
      console.log('❌ No tournament found. Please ensure tournament ID 1 exists.');
      return;
    }

    console.log(`✅ Found tournament: ${tournament[0].name}\n`);
    const tournamentId = 1;

    // Fetch all matches for this tournament
    const allMatches = await db.select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId));

    console.log(`📊 Found ${allMatches.length} matches in database\n`);

    // Check each heat from Google Sheets
    for (const [heatName, sheetsRows] of Object.entries(GOOGLE_SHEETS_DATA)) {
      const heatNumber = parseInt(heatName.replace('Heat ', ''));
      const match = allMatches.find(m => m.heatNumber === heatNumber);

      if (!match) {
        console.log(`❌ ${heatName}: NOT FOUND in database`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 ${heatName} (Match ID: ${match.id})`);
      console.log('='.repeat(60));

      // Get detailed scores for this match
      const detailedScores = await db.select()
        .from(judgeDetailedScores)
        .where(eq(judgeDetailedScores.matchId, match.id));

      console.log(`\n📝 Detailed Scores in Database: ${detailedScores.length}`);
      
      // Group by judge
      const scoresByJudge: Record<string, typeof detailedScores> = {};
      detailedScores.forEach(score => {
        if (!scoresByJudge[score.judgeName]) {
          scoresByJudge[score.judgeName] = [];
        }
        scoresByJudge[score.judgeName].push(score);
      });

      // Compare with Google Sheets
      const sheetsJudges = new Set(sheetsRows.map(r => r.judge));
      const dbJudges = new Set(Object.keys(scoresByJudge));

      console.log(`\n👨‍⚖️  Judges:`);
      console.log(`   Google Sheets: ${Array.from(sheetsJudges).join(', ')}`);
      console.log(`   Database:      ${Array.from(dbJudges).join(', ')}`);

      // Check each judge
      for (const judgeName of sheetsJudges) {
        const judgeSheetsRows = sheetsRows.filter(r => r.judge === judgeName);
        const judgeDbScores = scoresByJudge[judgeName] || [];

        console.log(`\n   👤 Judge: ${judgeName}`);
        console.log(`      Google Sheets entries: ${judgeSheetsRows.length}`);
        console.log(`      Database entries: ${judgeDbScores.length}`);

        if (judgeDbScores.length === 0) {
          console.log(`      ⚠️  WARNING: Judge ${judgeName} has no scores in database`);
          continue;
        }

        // Check cup codes
        const dbScore = judgeDbScores[0];
        const cappuccinoRow = judgeSheetsRows.find(r => r.beverage === 'CAPPUCCINO' && r.latteArt);
        const espressoRow = judgeSheetsRows.find(r => r.beverage === 'ESPRESSO');

        if (cappuccinoRow) {
          const expectedLeft = cappuccinoRow.cupCode === '3' ? cappuccinoRow.beverage?.split(' ')[0] : cappuccinoRow.cupCode;
          const expectedRight = cappuccinoRow.latteArt === 'RIGHT CUP' ? cappuccinoRow.cupCode : undefined;
          
          console.log(`      Cup Codes (Cappuccino):`);
          console.log(`         Google Sheets: Left=${cappuccinoRow.cupCode || 'N/A'}, Right=${judgeSheetsRows.find(r => r.latteArt === 'RIGHT CUP')?.cupCode || 'N/A'}`);
          console.log(`         Database:      Left=${dbScore.leftCupCode}, Right=${dbScore.rightCupCode}`);
        }

        if (espressoRow) {
          console.log(`      Beverage Type (Espresso):`);
          console.log(`         Google Sheets: ${espressoRow.beverage || 'N/A'}`);
          console.log(`         Database:      ${dbScore.sensoryBeverage}`);
        }
      }

      // Check competitor totals
      const competitorMappings = COMPETITOR_MAPPINGS[heatName];
      if (competitorMappings) {
        console.log(`\n🏆 Competitor Totals:`);
        for (const comp of competitorMappings) {
          // Get scores for this competitor
          const competitor = await db.select()
            .from(users)
            .where(eq(users.name, comp.name))
            .limit(1);

          if (competitor.length > 0) {
            const compScores = await db.select()
              .from(heatScores)
              .where(
                and(
                  eq(heatScores.matchId, match.id),
                  eq(heatScores.competitorId, competitor[0].id)
                )
              );

            const totalScore = compScores.reduce((sum, s) => sum + s.score, 0);
            console.log(`   ${comp.name} (${comp.cupCode}):`);
            console.log(`      Google Sheets: ${comp.total} points`);
            console.log(`      Database:      ${totalScore} points`);
            
            if (totalScore !== comp.total) {
              console.log(`      ⚠️  MISMATCH!`);
            }
          }
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Verification complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  }
}

// Run verification
verifyGoogleSheetsData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

