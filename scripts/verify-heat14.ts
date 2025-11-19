import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function verifyHeat14() {
  try {
    const matchId = await sql`
      SELECT id FROM matches WHERE heat_number = 14 AND round = 1 LIMIT 1
    `;
    
    if (matchId.length === 0) {
      console.log('❌ Heat 14 not found');
      return;
    }
    
    const result = await sql`
      SELECT 
        judge_name,
        left_cup_code,
        right_cup_code,
        sensory_beverage,
        visual_latte_art,
        taste,
        tactile,
        flavour,
        overall
      FROM judge_detailed_scores
      WHERE match_id = ${matchId[0].id}
      ORDER BY judge_name
    `;
    
    console.log('\n📊 Heat 14 Judge Scorecards Verification:\n');
    console.log('='.repeat(80));
    
    for (const judge of result) {
      console.log(`\n👨‍⚖️  Judge: ${judge.judge_name}`);
      console.log(`   Cup Codes: Left=${judge.left_cup_code}, Right=${judge.right_cup_code}`);
      console.log(`   Sensory Beverage: ${judge.sensory_beverage}`);
      console.log(`   Visual/Latte Art: ${judge.visual_latte_art} cup`);
      console.log(`   Taste: ${judge.taste} cup`);
      console.log(`   Tactile: ${judge.tactile} cup`);
      console.log(`   Flavour: ${judge.flavour} cup`);
      console.log(`   Overall: ${judge.overall} cup`);
      
      // Verify Michalis specifically
      if (judge.judge_name === 'Michalis') {
        console.log(`\n   ✅ Michalis Verification:`);
        console.log(`      Expected: Visual=left, Taste=right, Tactile=left, Flavour=right, Overall=right`);
        console.log(`      Actual:   Visual=${judge.visual_latte_art}, Taste=${judge.taste}, Tactile=${judge.tactile}, Flavour=${judge.flavour}, Overall=${judge.overall}`);
        const isCorrect = 
          judge.visual_latte_art === 'left' &&
          judge.taste === 'right' &&
          judge.tactile === 'left' &&
          judge.flavour === 'right' &&
          judge.overall === 'right' &&
          judge.left_cup_code === 'C6' &&
          judge.right_cup_code === 'L4' &&
          judge.sensory_beverage === 'Cappuccino';
        console.log(`      ${isCorrect ? '✅ MATCHES' : '❌ MISMATCH'}`);
      }
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

verifyHeat14().catch((error) => {
  console.error(error);
  process.exit(1);
});

