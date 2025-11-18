import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat26() {
  try {
    console.log('🏆 Creating Heat 26: Hojat vs Artur...\n');

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
    const hojat = await sql`SELECT id FROM users WHERE LOWER(name) = 'hojat' LIMIT 1`;
    const artur = await sql`SELECT id FROM users WHERE LOWER(name) = 'artur' LIMIT 1`;
    
    if (hojat.length === 0 || artur.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const hojatId = hojat[0].id;
    const arturId = artur[0].id;
    console.log(`✅ Hojat ID: ${hojatId}, Artur ID: ${arturId}\n`);

    // Get judge IDs
    const michalis = await sql`SELECT id FROM users WHERE LOWER(name) = 'michalis' LIMIT 1`;
    const korn = await sql`SELECT id FROM users WHERE LOWER(name) = 'korn' LIMIT 1`;
    const junior = await sql`SELECT id FROM users WHERE LOWER(name) = 'junior' LIMIT 1`;
    
    if (michalis.length === 0 || korn.length === 0 || junior.length === 0) {
      throw new Error('Judges not found');
    }
    
    const michalisId = michalis[0].id;
    const kornId = korn[0].id;
    const juniorId = junior[0].id;
    console.log(`✅ Judges: Michalis (${michalisId}), Korn (${kornId}), Junior (${juniorId})\n`);

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
      AND heat_number = 26
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 26 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${hojatId},
            competitor2_id = ${arturId},
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
        VALUES (${tournamentId}, 1, 26, ${stationId}, 'DONE', ${hojatId}, ${arturId}, ${arturId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 26 (Match ID: ${matchId})\n`);
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
      { judgeId: michalisId, role: 'SENSORY' },
      { judgeId: kornId, role: 'HEAD' },
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
    // Left = K5 (Hojat), Right = J1 (Artur)
    
    // Michalis's scores (Left=K5=Hojat, Right=J1=Artur)
    const michalisScore = {
      matchId,
      judgeName: 'Michalis',
      leftCupCode: 'K5', // Hojat
      rightCupCode: 'J1', // Artur
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // J1 (Artur) wins
      taste: 'right', // J1 (Artur) wins
      tactile: 'left', // K5 (Hojat) wins
      flavour: 'right', // J1 (Artur) wins
      overall: 'right' // J1 (Artur) wins
    };

    // Korn's scores (Left=K5=Hojat, Right=J1=Artur)
    const kornScore = {
      matchId,
      judgeName: 'Korn',
      leftCupCode: 'K5', // Hojat
      rightCupCode: 'J1', // Artur
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // J1 (Artur) wins
      taste: 'right', // J1 (Artur) wins
      tactile: 'right', // J1 (Artur) wins
      flavour: 'right', // J1 (Artur) wins
      overall: 'right' // J1 (Artur) wins
    };

    // Junior's scores (Left=K5=Hojat, Right=J1=Artur)
    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'K5', // Hojat
      rightCupCode: 'J1', // Artur
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // K5 (Hojat) wins
      taste: 'left', // K5 (Hojat) wins
      tactile: 'left', // K5 (Hojat) wins
      flavour: 'left', // K5 (Hojat) wins
      overall: 'left' // K5 (Hojat) wins
    };

    // Insert detailed scores
    const scores = [michalisScore, kornScore, juniorScore];
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
    // Michalis (Cappuccino): Hojat gets Tactile(1) = 1pt, Artur gets Visual(3) + Taste(1) + Flavour(1) + Overall(5) = 10pts
    // Korn (Espresso): Hojat gets 0pts, Artur gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Junior (Espresso): Hojat gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Artur gets 0pts
    // Total calculated: Hojat = 1 + 0 + 11 = 12pts, Artur = 10 + 11 + 0 = 21pts
    // User stated totals: Hojat = 9pts, Artur = 24pts
    // There is a discrepancy - I'll use the calculated values from detailed scores
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Michalis's scores (Cappuccino judge) - Hojat: 1, Artur: 10
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${hojatId}, 'CAPPUCCINO'::segment_type, 1, 'Michalis - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${arturId}, 'CAPPUCCINO'::segment_type, 10, 'Michalis - Cappuccino judge', NOW())
    `;
    
    // Korn's scores (Espresso judge) - Hojat: 0, Artur: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${hojatId}, 'ESPRESSO'::segment_type, 0, 'Korn - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${arturId}, 'ESPRESSO'::segment_type, 11, 'Korn - Espresso judge', NOW())
    `;
    
    // Junior's scores (Espresso judge) - Hojat: 11, Artur: 0
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${hojatId}, 'ESPRESSO'::segment_type, 11, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${arturId}, 'ESPRESSO'::segment_type, 0, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Artur (J1): Michalis(10) + Korn(11) + Junior(0) = 21 points`);
    console.log(`   Hojat (K5): Michalis(1) + Korn(0) + Junior(11) = 12 points`);
    console.log(`   Winner: Artur\n`);
    console.log(`Note: User stated totals are Hojat: 9, Artur: 24.`);
    console.log(`      Calculated from detailed scores: Hojat: 12, Artur: 21.`);
    console.log(`      Detailed scores have been saved correctly.\n`);

    console.log(`✅ Heat 26 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat26().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat26 };

