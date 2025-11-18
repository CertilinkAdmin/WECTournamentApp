import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat14() {
  try {
    console.log('🏆 Creating Heat 14: Jae vs Carlos...\n');

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
    const carlos = await sql`SELECT id FROM users WHERE LOWER(name) = 'carlos' LIMIT 1`;
    
    if (jae.length === 0 || carlos.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const jaeId = jae[0].id;
    const carlosId = carlos[0].id;
    console.log(`✅ Jae ID: ${jaeId}, Carlos ID: ${carlosId}\n`);

    // Get judge IDs (reusing judges from previous heats)
    const michalis = await sql`SELECT id FROM users WHERE LOWER(name) = 'michalis' LIMIT 1`;
    const jasper = await sql`SELECT id FROM users WHERE LOWER(name) = 'jasper' LIMIT 1`;
    const korn = await sql`SELECT id FROM users WHERE LOWER(name) = 'korn' LIMIT 1`;
    
    if (michalis.length === 0 || jasper.length === 0 || korn.length === 0) {
      throw new Error('Judges not found');
    }
    
    const michalisId = michalis[0].id;
    const jasperId = jasper[0].id;
    const kornId = korn[0].id;
    console.log(`✅ Judges: Michalis (${michalisId}), Jasper (${jasperId}), Korn (${kornId})\n`);

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
      AND heat_number = 14
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 14 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${jaeId},
            competitor2_id = ${carlosId},
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
        VALUES (${tournamentId}, 1, 14, ${stationId}, 'DONE', ${jaeId}, ${carlosId}, ${jaeId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 14 (Match ID: ${matchId})\n`);
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
      { judgeId: jasperId, role: 'HEAD' },
      { judgeId: kornId, role: 'TECHNICAL' }
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
    // Cup assignments (all judges have same assignment):
    // Left = C6 (Carlos), Right = L4 (Jae)
    
    // Michalis's scores (Left=C6=Carlos, Right=L4=Jae)
    const michalisScore = {
      matchId,
      judgeName: 'Michalis',
      leftCupCode: 'C6', // Carlos
      rightCupCode: 'L4', // Jae
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // C6 (Carlos) wins
      taste: 'right', // L4 (Jae) wins
      tactile: 'left', // C6 (Carlos) wins
      flavour: 'right', // L4 (Jae) wins
      overall: 'right' // L4 (Jae) wins
    };

    // Jasper's scores (Left=C6=Carlos, Right=L4=Jae)
    const jasperScore = {
      matchId,
      judgeName: 'Jasper',
      leftCupCode: 'C6', // Carlos
      rightCupCode: 'L4', // Jae
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // L4 (Jae) wins
      taste: 'right', // L4 (Jae) wins
      tactile: 'right', // L4 (Jae) wins
      flavour: 'right', // L4 (Jae) wins
      overall: 'right' // L4 (Jae) wins
    };

    // Korn's scores (Left=C6=Carlos, Right=L4=Jae)
    const kornScore = {
      matchId,
      judgeName: 'Korn',
      leftCupCode: 'C6', // Carlos
      rightCupCode: 'L4', // Jae
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // L4 (Jae) wins
      taste: 'right', // L4 (Jae) wins
      tactile: 'right', // L4 (Jae) wins
      flavour: 'left', // C6 (Carlos) wins
      overall: 'right' // L4 (Jae) wins
    };

    // Insert detailed scores
    const scores = [michalisScore, jasperScore, kornScore];
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
    // Michalis (Cappuccino): Carlos gets Visual(3) + Tactile(1) = 4pts, Jae gets Taste(1) + Flavour(1) + Overall(5) = 7pts
    // Jasper (Espresso): Carlos gets 0pts, Jae gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Korn (Espresso): Carlos gets Flavour(1) = 1pt, Jae gets Visual(3) + Taste(1) + Tactile(1) + Overall(5) = 10pts
    // Total: Carlos = 4 + 0 + 1 = 5pts, Jae = 7 + 11 + 10 = 28pts ✅ Matches user's stated totals!
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Michalis's scores (Cappuccino judge) - Carlos: 4, Jae: 7
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${carlosId}, 'CAPPUCCINO'::segment_type, 4, 'Michalis - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${jaeId}, 'CAPPUCCINO'::segment_type, 7, 'Michalis - Cappuccino judge', NOW())
    `;
    
    // Jasper's scores (Espresso judge) - Carlos: 0, Jae: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${carlosId}, 'ESPRESSO'::segment_type, 0, 'Jasper - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${jaeId}, 'ESPRESSO'::segment_type, 11, 'Jasper - Espresso judge', NOW())
    `;
    
    // Korn's scores (Espresso judge) - Carlos: 1, Jae: 10
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${carlosId}, 'ESPRESSO'::segment_type, 1, 'Korn - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${jaeId}, 'ESPRESSO'::segment_type, 10, 'Korn - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary:`);
    console.log(`   Jae (L4): Michalis(7) + Jasper(11) + Korn(10) = 28 points ✅`);
    console.log(`   Carlos (C6): Michalis(4) + Jasper(0) + Korn(1) = 5 points ✅`);
    console.log(`   Winner: Jae\n`);

    console.log(`✅ Heat 14 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat14().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat14 };

