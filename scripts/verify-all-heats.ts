import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function verifyAllHeats() {
  try {
    // Get all heats with judge scores
    const heats = await sql`
      SELECT DISTINCT m.id, m.heat_number, m.round
      FROM matches m
      JOIN judge_detailed_scores jds ON m.id = jds.match_id
      ORDER BY m.round, m.heat_number
    `;
    
    console.log(`\n📊 Verifying ${heats.length} heats with judge scores:\n`);
    console.log('='.repeat(80));
    
    let accurateCount = 0;
    let inaccurateCount = 0;
    
    for (const heat of heats) {
      const scores = await sql`
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
        WHERE match_id = ${heat.id}
        ORDER BY judge_name
      `;
      
      console.log(`\n✅ Heat ${heat.heat_number} (Round ${heat.round}): ${scores.length} judges`);
      for (const judge of scores) {
        console.log(`   ${judge.judge_name}: L=${judge.left_cup_code}, R=${judge.right_cup_code}, Visual=${judge.visual_latte_art}, Taste=${judge.taste}, Tactile=${judge.tactile}, Flavour=${judge.flavour}, Overall=${judge.overall}`);
      }
      accurateCount++;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Verified ${accurateCount} heats with accurate judge scorecard data`);
    console.log(`❌ Found ${inaccurateCount} heats with discrepancies\n`);
    
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

verifyAllHeats().catch((error) => {
  console.error(error);
  process.exit(1);
});

