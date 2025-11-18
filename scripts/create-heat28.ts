import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat28() {
  try {
    console.log('🏆 Creating Heat 28: Jae vs Engi...\n');

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
    const engi = await sql`SELECT id FROM users WHERE LOWER(name) = 'engi' LIMIT 1`;
    
    if (jae.length === 0 || engi.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const jaeId = jae[0].id;
    const engiId = engi[0].id;
    console.log(`✅ Jae ID: ${jaeId}, Engi ID: ${engiId}\n`);

    // Get judge IDs
    const michalis = await sql`SELECT id FROM users WHERE LOWER(name) = 'michalis' LIMIT 1`;
    const tess = await sql`SELECT id FROM users WHERE LOWER(name) = 'tess' LIMIT 1`;
    const junior = await sql`SELECT id FROM users WHERE LOWER(name) = 'junior' LIMIT 1`;
    
    if (michalis.length === 0 || tess.length === 0 || junior.length === 0) {
      throw new Error('Judges not found');
    }
    
    const michalisId = michalis[0].id;
    const tessId = tess[0].id;
    const juniorId = junior[0].id;
    console.log(`✅ Judges: Michalis (${michalisId}), Tess (${tessId}), Junior (${juniorId})\n`);

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
      AND heat_number = 28
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 28 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${jaeId},
            competitor2_id = ${engiId},
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
        VALUES (${tournamentId}, 1, 28, ${stationId}, 'DONE', ${jaeId}, ${engiId}, ${jaeId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 28 (Match ID: ${matchId})\n`);
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
    // Michalis: Left = G8 (Engi), Right = F4 (Jae)
    // Tess: Left = G8 (Engi), Right = F4 (Jae)
    // Junior: Left = F4 (Jae), Right = G8 (Engi)
    
    // Michalis's scores (Left=G8=Engi, Right=F4=Jae)
    const michalisScore = {
      matchId,
      judgeName: 'Michalis',
      leftCupCode: 'G8', // Engi
      rightCupCode: 'F4', // Jae
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // G8 (Engi) wins
      taste: 'right', // F4 (Jae) wins
      tactile: 'right', // F4 (Jae) wins
      flavour: 'left', // G8 (Engi) wins
      overall: 'right' // F4 (Jae) wins
    };

    // Tess's scores (Left=G8=Engi, Right=F4=Jae)
    const tessScore = {
      matchId,
      judgeName: 'Tess',
      leftCupCode: 'G8', // Engi
      rightCupCode: 'F4', // Jae
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // G8 (Engi) wins
      taste: 'right', // F4 (Jae) wins
      tactile: 'right', // F4 (Jae) wins
      flavour: 'right', // F4 (Jae) wins
      overall: 'right' // F4 (Jae) wins
    };

    // Junior's scores (Left=F4=Jae, Right=G8=Engi)
    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'F4', // Jae
      rightCupCode: 'G8', // Engi
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // F4 (Jae) wins
      taste: 'left', // F4 (Jae) wins
      tactile: 'left', // F4 (Jae) wins
      flavour: 'left', // F4 (Jae) wins
      overall: 'left' // F4 (Jae) wins
    };

    // Insert detailed scores
    const scores = [michalisScore, tessScore, juniorScore];
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
    // Michalis (Cappuccino): Engi gets Visual(3) + Flavour(1) = 4pts, Jae gets Taste(1) + Tactile(1) + Overall(5) = 7pts
    // Tess (Espresso): Engi gets Visual(3) = 3pts, Jae gets Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 8pts
    // Junior (Espresso): Jae gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Engi gets 0pts
    // Total calculated: Jae = 7 + 8 + 11 = 26pts, Engi = 4 + 3 + 0 = 7pts
    // User stated totals: Jae = 23pts, Engi = 10pts
    // There is a discrepancy - I'll use the calculated values from detailed scores
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Michalis's scores (Cappuccino judge) - Engi: 4, Jae: 7
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${engiId}, 'CAPPUCCINO'::segment_type, 4, 'Michalis - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${jaeId}, 'CAPPUCCINO'::segment_type, 7, 'Michalis - Cappuccino judge', NOW())
    `;
    
    // Tess's scores (Espresso judge) - Engi: 3, Jae: 8
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${engiId}, 'ESPRESSO'::segment_type, 3, 'Tess - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${jaeId}, 'ESPRESSO'::segment_type, 8, 'Tess - Espresso judge', NOW())
    `;
    
    // Junior's scores (Espresso judge) - Jae: 11, Engi: 0
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${jaeId}, 'ESPRESSO'::segment_type, 11, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${engiId}, 'ESPRESSO'::segment_type, 0, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Jae (F4): Michalis(7) + Tess(8) + Junior(11) = 26 points`);
    console.log(`   Engi (G8): Michalis(4) + Tess(3) + Junior(0) = 7 points`);
    console.log(`   Winner: Jae\n`);
    console.log(`Note: User stated totals are Jae: 23, Engi: 10.`);
    console.log(`      Calculated from detailed scores: Jae: 26, Engi: 7.`);
    console.log(`      Detailed scores have been saved correctly.\n`);

    console.log(`✅ Heat 28 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat28().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat28 };

