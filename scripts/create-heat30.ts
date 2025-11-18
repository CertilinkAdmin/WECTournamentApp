import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat30() {
  try {
    console.log('🏆 Creating Heat 30: Christos vs Jae...\n');

    // Get tournament ID
    const tournaments = await sql`
      SELECT id FROM tournaments 
      WHERE name LIKE '%WEC%2025%' OR name LIKE '%World Espresso%2025%'
      LIMIT 1
    `;
    
    if (tournaments.length === 0) {
      throw new Error('Tournament not found');
    }
    const tournamentId = tournaments[0].id;
    console.log(`✅ Tournament ID: ${tournamentId}\n`);

    // Get competitor IDs
    const christos = await sql`SELECT id FROM users WHERE LOWER(name) = 'christos' LIMIT 1`;
    const jae = await sql`SELECT id FROM users WHERE LOWER(name) = 'jae' LIMIT 1`;
    
    if (christos.length === 0 || jae.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const christosId = christos[0].id;
    const jaeId = jae[0].id;
    console.log(`✅ Christos ID: ${christosId}, Jae ID: ${jaeId}\n`);

    // Get judge IDs
    const shinsaku = await sql`SELECT id FROM users WHERE LOWER(name) = 'shinsaku' LIMIT 1`;
    const korn = await sql`SELECT id FROM users WHERE LOWER(name) = 'korn' LIMIT 1`;
    const boss = await sql`SELECT id FROM users WHERE LOWER(name) = 'boss' LIMIT 1`;
    
    if (shinsaku.length === 0 || korn.length === 0 || boss.length === 0) {
      throw new Error('Judges not found');
    }
    
    const shinsakuId = shinsaku[0].id;
    const kornId = korn[0].id;
    const bossId = boss[0].id;
    console.log(`✅ Judges: Shinsaku (${shinsakuId}), Korn (${kornId}), Boss (${bossId})\n`);

    // Get station ID
    const stations = await sql`SELECT id FROM stations LIMIT 1`;
    if (stations.length === 0) {
      throw new Error('No stations found');
    }
    const stationId = stations[0].id;

    // Check if heat already exists
    const existing = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 1 
      AND heat_number = 30
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 30 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${christosId},
            competitor2_id = ${jaeId},
            winner_id = ${jaeId},
            status = 'DONE',
            start_time = NOW(),
            end_time = NOW(),
            updated_at = NOW()
        WHERE id = ${matchId}
      `;
    } else {
      // Create match
      const [match] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, winner_id, start_time, end_time, created_at, updated_at)
        VALUES (${tournamentId}, 1, 30, ${stationId}, 'DONE', ${christosId}, ${jaeId}, ${jaeId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 30 (Match ID: ${matchId})\n`);
    }

    // Create heat segments
    const segments = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
    for (const segment of segments) {
      const existingSegment = await sql`
        SELECT id FROM heat_segments 
        WHERE match_id = ${matchId} AND segment = ${segment}::segment_type
        LIMIT 1
      `;
      
      if (existingSegment.length === 0) {
        await sql`
          INSERT INTO heat_segments (match_id, segment, status, start_time, end_time, planned_minutes)
          VALUES (${matchId}, ${segment}::segment_type, 'ENDED', NOW(), NOW(), 
            CASE 
              WHEN ${segment} = 'DIAL_IN' THEN 2
              WHEN ${segment} = 'CAPPUCCINO' THEN 2
              WHEN ${segment} = 'ESPRESSO' THEN 1
            END)
        `;
      }
    }
    console.log(`✅ Heat segments created\n`);

    // Assign judges to heat
    const judgeRoles = [
      { judgeId: shinsakuId, role: 'SENSORY' },
      { judgeId: kornId, role: 'HEAD' },
      { judgeId: bossId, role: 'TECHNICAL' }
    ];

    for (const { judgeId, role } of judgeRoles) {
      const existing = await sql`
        SELECT id FROM heat_judges 
        WHERE match_id = ${matchId} AND judge_id = ${judgeId}
        LIMIT 1
      `;
      
      if (existing.length === 0) {
        await sql`
          INSERT INTO heat_judges (match_id, judge_id, role)
          VALUES (${matchId}, ${judgeId}, ${role}::judge_role)
        `;
      }
    }
    console.log(`✅ Judges assigned\n`);

    // Create detailed judge scores
    // All judges have same cup assignment:
    // Left = N4 (Christos), Right = K6 (Jae)
    
    // Shinsaku's scores (Left=N4=Christos, Right=K6=Jae)
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'N4', // Christos
      rightCupCode: 'K6', // Jae
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // N4 (Christos) wins
      taste: 'left', // N4 (Christos) wins
      tactile: 'left', // N4 (Christos) wins
      flavour: 'left', // N4 (Christos) wins
      overall: 'left' // N4 (Christos) wins
    };

    // Korn's scores (Left=N4=Christos, Right=K6=Jae)
    const kornScore = {
      matchId,
      judgeName: 'Korn',
      leftCupCode: 'N4', // Christos
      rightCupCode: 'K6', // Jae
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // N4 (Christos) wins
      taste: 'right', // K6 (Jae) wins
      tactile: 'right', // K6 (Jae) wins
      flavour: 'right', // K6 (Jae) wins
      overall: 'right' // K6 (Jae) wins
    };

    // Boss's scores (Left=N4=Christos, Right=K6=Jae)
    const bossScore = {
      matchId,
      judgeName: 'Boss',
      leftCupCode: 'N4', // Christos
      rightCupCode: 'K6', // Jae
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // K6 (Jae) wins
      taste: 'right', // K6 (Jae) wins
      tactile: 'right', // K6 (Jae) wins
      flavour: 'right', // K6 (Jae) wins
      overall: 'right' // K6 (Jae) wins
    };

    // Insert detailed scores
    const scores = [shinsakuScore, kornScore, bossScore];
    for (const score of scores) {
      const existing = await sql`
        SELECT id FROM judge_detailed_scores 
        WHERE match_id = ${matchId} AND judge_name = ${score.judgeName}
        LIMIT 1
      `;
      
      if (existing.length === 0) {
        await sql`
          INSERT INTO judge_detailed_scores (
            match_id, judge_name, left_cup_code, right_cup_code, 
            sensory_beverage, visual_latte_art, taste, tactile, flavour, overall, submitted_at
          )
          VALUES (
            ${score.matchId}, ${score.judgeName}, ${score.leftCupCode}, ${score.rightCupCode},
            ${score.sensoryBeverage}, ${score.visualLatteArt}, ${score.taste}, 
            ${score.tactile}, ${score.flavour}, ${score.overall}, NOW()
          )
        `;
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
      }
    }
    console.log(`✅ Detailed judge scores created\n`);

    // Calculate scores based on detailed judge scores
    // Shinsaku (Cappuccino): Christos gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Jae gets 0pts
    // Korn (Espresso): Christos gets Visual(3) = 3pts, Jae gets Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 8pts
    // Boss (Espresso): Christos gets 0pts, Jae gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Total calculated: Christos = 11 + 3 + 0 = 14pts, Jae = 0 + 8 + 11 = 19pts ✅ Matches user's stated totals!
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Shinsaku's scores (Cappuccino judge) - Christos: 11, Jae: 0
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${christosId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${jaeId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    // Korn's scores (Espresso judge) - Christos: 3, Jae: 8
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${christosId}, 'ESPRESSO'::segment_type, 3, 'Korn - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${jaeId}, 'ESPRESSO'::segment_type, 8, 'Korn - Espresso judge', NOW())
    `;
    
    // Boss's scores (Espresso judge) - Christos: 0, Jae: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${bossId}, ${christosId}, 'ESPRESSO'::segment_type, 0, 'Boss - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${bossId}, ${jaeId}, 'ESPRESSO'::segment_type, 11, 'Boss - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary:`);
    console.log(`   Jae (K6): Shinsaku(0) + Korn(8) + Boss(11) = 19 points ✅`);
    console.log(`   Christos (N4): Shinsaku(11) + Korn(3) + Boss(0) = 14 points ✅`);
    console.log(`   Winner: Jae\n`);

    console.log(`✅ Heat 30 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat30().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat30 };

