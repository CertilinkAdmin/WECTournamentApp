import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat19() {
  try {
    console.log('🏆 Creating Heat 19: Artur vs Julian...\n');

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
    const artur = await sql`SELECT id FROM users WHERE LOWER(name) = 'artur' LIMIT 1`;
    const julian = await sql`SELECT id FROM users WHERE LOWER(name) = 'julian' LIMIT 1`;
    
    if (artur.length === 0 || julian.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const arturId = artur[0].id;
    const julianId = julian[0].id;
    console.log(`✅ Artur ID: ${arturId}, Julian ID: ${julianId}\n`);

    // Get judge IDs
    const shinsaku = await sql`SELECT id FROM users WHERE LOWER(name) = 'shinsaku' LIMIT 1`;
    const tess = await sql`SELECT id FROM users WHERE LOWER(name) = 'tess' LIMIT 1`;
    const junior = await sql`SELECT id FROM users WHERE LOWER(name) = 'junior' LIMIT 1`;
    
    if (shinsaku.length === 0 || tess.length === 0 || junior.length === 0) {
      throw new Error('Judges not found');
    }
    
    const shinsakuId = shinsaku[0].id;
    const tessId = tess[0].id;
    const juniorId = junior[0].id;
    console.log(`✅ Judges: Shinsaku (${shinsakuId}), Tess (${tessId}), Junior (${juniorId})\n`);

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
      AND heat_number = 19
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 19 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${arturId},
            competitor2_id = ${julianId},
            winner_id = ${arturId},
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
        VALUES (${tournamentId}, 1, 19, ${stationId}, 'DONE', ${arturId}, ${julianId}, ${arturId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 19 (Match ID: ${matchId})\n`);
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
      { judgeId: tessId, role: 'HEAD' },
      { judgeId: juniorId, role: 'TECHNICAL' }
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
    // Left = G2 (Artur), Right = W8 (Julian)
    
    // Shinsaku's scores (Left=G2=Artur, Right=W8=Julian)
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'G2', // Artur
      rightCupCode: 'W8', // Julian
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // G2 (Artur) wins
      taste: 'left', // G2 (Artur) wins
      tactile: 'left', // G2 (Artur) wins
      flavour: 'left', // G2 (Artur) wins
      overall: 'left' // G2 (Artur) wins
    };

    // Tess's scores (Left=G2=Artur, Right=W8=Julian)
    const tessScore = {
      matchId,
      judgeName: 'Tess',
      leftCupCode: 'G2', // Artur
      rightCupCode: 'W8', // Julian
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // G2 (Artur) wins
      taste: 'right', // W8 (Julian) wins
      tactile: 'left', // G2 (Artur) wins
      flavour: 'left', // G2 (Artur) wins
      overall: 'left' // G2 (Artur) wins
    };

    // Junior's scores (Left=G2=Artur, Right=W8=Julian)
    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'G2', // Artur
      rightCupCode: 'W8', // Julian
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // G2 (Artur) wins
      taste: 'right', // W8 (Julian) wins
      tactile: 'right', // W8 (Julian) wins
      flavour: 'right', // W8 (Julian) wins
      overall: 'right' // W8 (Julian) wins
    };

    // Insert detailed scores
    const scores = [shinsakuScore, tessScore, juniorScore];
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
    // Shinsaku (Cappuccino): Artur gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Julian gets 0pts
    // Tess (Espresso): Artur gets Visual(3) + Tactile(1) + Flavour(1) + Overall(5) = 10pts, Julian gets Taste(1) = 1pt
    // Junior (Espresso): Artur gets Visual(3) = 3pts, Julian gets Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 8pts
    // Total calculated: Artur = 11 + 10 + 3 = 24pts, Julian = 0 + 1 + 8 = 9pts
    // User stated totals: Artur = 2pts, Julian = 9pts
    // There is a discrepancy - I'll use the calculated values from detailed scores
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Shinsaku's scores (Cappuccino judge) - Artur: 11, Julian: 0
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${arturId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${julianId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    // Tess's scores (Espresso judge) - Artur: 10, Julian: 1
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${arturId}, 'ESPRESSO'::segment_type, 10, 'Tess - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${julianId}, 'ESPRESSO'::segment_type, 1, 'Tess - Espresso judge', NOW())
    `;
    
    // Junior's scores (Espresso judge) - Artur: 3, Julian: 8
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${arturId}, 'ESPRESSO'::segment_type, 3, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${julianId}, 'ESPRESSO'::segment_type, 8, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Artur (G2): Shinsaku(11) + Tess(10) + Junior(3) = 24 points`);
    console.log(`   Julian (W8): Shinsaku(0) + Tess(1) + Junior(8) = 9 points`);
    console.log(`   Winner: Artur\n`);
    console.log(`Note: User stated totals are Artur: 2, Julian: 9.`);
    console.log(`      Calculated from detailed scores: Artur: 24, Julian: 9.`);
    console.log(`      Detailed scores have been saved correctly.\n`);

    console.log(`✅ Heat 19 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat19().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat19 };

