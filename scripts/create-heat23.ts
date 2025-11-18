import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat23() {
  try {
    console.log('🏆 Creating Heat 23: Jae vs Kirill...\n');

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
    const jae = await sql`SELECT id FROM users WHERE LOWER(name) = 'jae' LIMIT 1`;
    const kirill = await sql`SELECT id FROM users WHERE LOWER(name) = 'kirill' LIMIT 1`;
    
    if (jae.length === 0 || kirill.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const jaeId = jae[0].id;
    const kirillId = kirill[0].id;
    console.log(`✅ Jae ID: ${jaeId}, Kirill ID: ${kirillId}\n`);

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
      AND heat_number = 23
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 23 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${jaeId},
            competitor2_id = ${kirillId},
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
        VALUES (${tournamentId}, 1, 23, ${stationId}, 'DONE', ${jaeId}, ${kirillId}, ${jaeId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 23 (Match ID: ${matchId})\n`);
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
    // IMPORTANT: Cup assignments differ per judge!
    // Shinsaku: Left = E9 (Kirill), Right = V2 (Jae)
    // Tess: Left = E9 (Kirill), Right = V2 (Jae)
    // Junior: Left = V2 (Jae), Right = E9 (Kirill)
    
    // Shinsaku's scores (Left=E9=Kirill, Right=V2=Jae)
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'E9', // Kirill
      rightCupCode: 'V2', // Jae
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // V2 (Jae) wins
      taste: 'right', // V2 (Jae) wins
      tactile: 'right', // V2 (Jae) wins
      flavour: 'right', // V2 (Jae) wins
      overall: 'right' // V2 (Jae) wins
    };

    // Tess's scores (Left=E9=Kirill, Right=V2=Jae)
    const tessScore = {
      matchId,
      judgeName: 'Tess',
      leftCupCode: 'E9', // Kirill
      rightCupCode: 'V2', // Jae
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // E9 (Kirill) wins
      taste: 'right', // V2 (Jae) wins
      tactile: 'right', // V2 (Jae) wins
      flavour: 'right', // V2 (Jae) wins
      overall: 'right' // V2 (Jae) wins
    };

    // Junior's scores (Left=V2=Jae, Right=E9=Kirill)
    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'V2', // Jae
      rightCupCode: 'E9', // Kirill
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // V2 (Jae) wins
      taste: 'left', // V2 (Jae) wins
      tactile: 'left', // V2 (Jae) wins
      flavour: 'left', // V2 (Jae) wins
      overall: 'left' // V2 (Jae) wins
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
    // Shinsaku (Cappuccino): Kirill gets 0pts, Jae gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Tess (Espresso): Kirill gets Visual(3) = 3pts, Jae gets Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 8pts
    // Junior (Espresso): Jae gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Kirill gets 0pts
    // Total calculated: Jae = 11 + 8 + 11 = 30pts, Kirill = 0 + 3 + 0 = 3pts
    // User stated totals: Jae = 27pts, Kirill = 6pts
    // There is a discrepancy - I'll use the calculated values from detailed scores
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Shinsaku's scores (Cappuccino judge) - Kirill: 0, Jae: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${kirillId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${jaeId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    // Tess's scores (Espresso judge) - Kirill: 3, Jae: 8
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${kirillId}, 'ESPRESSO'::segment_type, 3, 'Tess - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${jaeId}, 'ESPRESSO'::segment_type, 8, 'Tess - Espresso judge', NOW())
    `;
    
    // Junior's scores (Espresso judge) - Jae: 11, Kirill: 0
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${jaeId}, 'ESPRESSO'::segment_type, 11, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${kirillId}, 'ESPRESSO'::segment_type, 0, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Jae (V2): Shinsaku(11) + Tess(8) + Junior(11) = 30 points`);
    console.log(`   Kirill (E9): Shinsaku(0) + Tess(3) + Junior(0) = 3 points`);
    console.log(`   Winner: Jae\n`);
    console.log(`Note: User stated totals are Jae: 27, Kirill: 6.`);
    console.log(`      Calculated from detailed scores: Jae: 30, Kirill: 3.`);
    console.log(`      Detailed scores have been saved correctly.\n`);

    console.log(`✅ Heat 23 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat23().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat23 };

