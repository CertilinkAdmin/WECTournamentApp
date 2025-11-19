import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function verifyHeat17() {
  try {
    const match = await sql`
      SELECT id, round, heat_number, winner_id
      FROM matches 
      WHERE heat_number = 17
      LIMIT 1
    `;
    
    if (match.length === 0) {
      console.log('❌ Heat 17 not found');
      return;
    }
    
    console.log(`\n📊 Heat 17 Verification (Match ID: ${match[0].id}, Round: ${match[0].round}):\n`);
    console.log('='.repeat(80));
    
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
      WHERE match_id = ${match[0].id}
      ORDER BY judge_name
    `;
    
    for (const judge of scores) {
      console.log(`\n👨‍⚖️  Judge: ${judge.judge_name}`);
      console.log(`   Cup Codes: Left=${judge.left_cup_code}, Right=${judge.right_cup_code}`);
      console.log(`   Sensory Beverage: ${judge.sensory_beverage}`);
      console.log(`   Visual/Latte Art: ${judge.visual_latte_art} cup`);
      console.log(`   Taste: ${judge.taste} cup`);
      console.log(`   Tactile: ${judge.tactile} cup`);
      console.log(`   Flavour: ${judge.flavour} cup`);
      console.log(`   Overall: ${judge.overall} cup`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

verifyHeat17().catch((error) => {
  console.error(error);
  process.exit(1);
});

