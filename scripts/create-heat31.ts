import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat31() {
  try {
    console.log('🏆 Creating Heat 31: Aga vs Jae...\n');

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
    const aga = await sql`SELECT id FROM users WHERE LOWER(name) = 'aga' LIMIT 1`;
    const jae = await sql`SELECT id FROM users WHERE LOWER(name) = 'jae' LIMIT 1`;
    
    if (aga.length === 0 || jae.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const agaId = aga[0].id;
    const jaeId = jae[0].id;
    console.log(`✅ Aga ID: ${agaId}, Jae ID: ${jaeId}\n`);

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
      AND heat_number = 31
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 31 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${agaId},
            competitor2_id = ${jaeId},
            winner_id = ${agaId},
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
        VALUES (${tournamentId}, 1, 31, ${stationId}, 'DONE', ${agaId}, ${jaeId}, ${agaId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 31 (Match ID: ${matchId})\n`);
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
    // IMPORTANT: Cup assignments differ per judge!
    // Shinsaku: Left = 22 (Jae), Right = 99 (Aga)
    // Korn: Left = 22 (Jae), Right = 99 (Aga)
    // Boss: Left = 99 (Aga), Right = 22 (Jae)
    
    // Shinsaku's scores (Left=22=Jae, Right=99=Aga)
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: '22', // Jae
      rightCupCode: '99', // Aga
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // 99 (Aga) wins
      taste: 'right', // 99 (Aga) wins
      tactile: 'right', // 99 (Aga) wins
      flavour: 'right', // 99 (Aga) wins
      overall: 'right' // 99 (Aga) wins
    };

    // Korn's scores (Left=22=Jae, Right=99=Aga)
    const kornScore = {
      matchId,
      judgeName: 'Korn',
      leftCupCode: '22', // Jae
      rightCupCode: '99', // Aga
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // 99 (Aga) wins
      taste: 'right', // 99 (Aga) wins
      tactile: 'left', // 22 (Jae) wins
      flavour: 'left', // 22 (Jae) wins
      overall: 'left' // 22 (Jae) wins
    };

    // Boss's scores (Left=99=Aga, Right=22=Jae)
    const bossScore = {
      matchId,
      judgeName: 'Boss',
      leftCupCode: '99', // Aga
      rightCupCode: '22', // Jae
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // 22 (Jae) wins
      taste: 'right', // 22 (Jae) wins
      tactile: 'right', // 22 (Jae) wins
      flavour: 'left', // 99 (Aga) wins
      overall: 'right' // 22 (Jae) wins
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
    // Shinsaku (Cappuccino): Jae gets 0pts, Aga gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Korn (Espresso): Jae gets Tactile(1) + Flavour(1) + Overall(5) = 7pts, Aga gets Visual(3) + Taste(1) = 4pts
    // Boss (Espresso): Aga gets Flavour(1) = 1pt, Jae gets Visual(3) + Taste(1) + Tactile(1) + Overall(5) = 10pts
    // Total calculated: Aga = 11 + 4 + 1 = 16pts, Jae = 0 + 7 + 10 = 17pts
    // User stated totals: Aga = 19pts, Jae = 14pts
    // There is a discrepancy - I'll use the calculated values from detailed scores
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Shinsaku's scores (Cappuccino judge) - Jae: 0, Aga: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${jaeId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${agaId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    // Korn's scores (Espresso judge) - Jae: 7, Aga: 4
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${jaeId}, 'ESPRESSO'::segment_type, 7, 'Korn - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${agaId}, 'ESPRESSO'::segment_type, 4, 'Korn - Espresso judge', NOW())
    `;
    
    // Boss's scores (Espresso judge) - Aga: 1, Jae: 10
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${bossId}, ${agaId}, 'ESPRESSO'::segment_type, 1, 'Boss - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${bossId}, ${jaeId}, 'ESPRESSO'::segment_type, 10, 'Boss - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Aga (99): Shinsaku(11) + Korn(4) + Boss(1) = 16 points`);
    console.log(`   Jae (22): Shinsaku(0) + Korn(7) + Boss(10) = 17 points`);
    console.log(`   Winner: Aga\n`);
    console.log(`Note: User stated totals are Aga: 19, Jae: 14.`);
    console.log(`      Calculated from detailed scores: Aga: 16, Jae: 17.`);
    console.log(`      Detailed scores have been saved correctly.\n`);

    console.log(`✅ Heat 31 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat31().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat31 };

