import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat12() {
  try {
    console.log('🏆 Creating Heat 12: Stevo vs Edwin...\n');

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
    const stevo = await sql`SELECT id FROM users WHERE LOWER(name) = 'stevo' LIMIT 1`;
    const edwin = await sql`SELECT id FROM users WHERE LOWER(name) = 'edwin' LIMIT 1`;
    
    if (stevo.length === 0 || edwin.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const stevoId = stevo[0].id;
    const edwinId = edwin[0].id;
    console.log(`✅ Stevo ID: ${stevoId}, Edwin ID: ${edwinId}\n`);

    // Get judge IDs
    const jasper = await sql`SELECT id FROM users WHERE LOWER(name) = 'jasper' LIMIT 1`;
    const korn = await sql`SELECT id FROM users WHERE LOWER(name) = 'korn' LIMIT 1`;
    const michalis = await sql`SELECT id FROM users WHERE LOWER(name) = 'michalis' LIMIT 1`;
    
    if (jasper.length === 0 || korn.length === 0 || michalis.length === 0) {
      throw new Error('Judges not found');
    }
    
    const jasperId = jasper[0].id;
    const kornId = korn[0].id;
    const michalisId = michalis[0].id;
    console.log(`✅ Judges: Jasper (${jasperId}), Korn (${kornId}), Michalis (${michalisId})\n`);

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
      AND heat_number = 12
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 12 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${stevoId},
            competitor2_id = ${edwinId},
            winner_id = ${stevoId},
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
        VALUES (${tournamentId}, 1, 12, ${stationId}, 'DONE', ${stevoId}, ${edwinId}, ${stevoId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 12 (Match ID: ${matchId})\n`);
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
      { judgeId: jasperId, role: 'HEAD' },
      { judgeId: kornId, role: 'TECHNICAL' },
      { judgeId: michalisId, role: 'SENSORY' }
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
    // Jasper: Left = K9 (Edwin), Right = M7 (Stevo)
    // Korn: Left = M7 (Stevo), Right = K9 (Edwin)  
    // Michalis: Left = M7 (Stevo), Right = K9 (Edwin)
    
    // Jasper's scores (Left=K9=Edwin, Right=M7=Stevo)
    // Verified: Visual/Latte Art (3pts): left cup (K9/Edwin)
    //           Taste (1pt): right cup (M7/Stevo)
    //           Tactile (1pt): left cup (K9/Edwin)
    //           Flavour (1pt): right cup (M7/Stevo)
    //           Overall (5pts): right cup (M7/Stevo)
    const jasperScore = {
      matchId,
      judgeName: 'Jasper',
      leftCupCode: 'K9', // Edwin (left)
      rightCupCode: 'M7', // Stevo (right)
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // K9 (Edwin) wins Visual/Latte Art (3pts)
      taste: 'right', // M7 (Stevo) wins Taste (1pt)
      tactile: 'left', // K9 (Edwin) wins Tactile (1pt)
      flavour: 'right', // M7 (Stevo) wins Flavour (1pt)
      overall: 'right' // M7 (Stevo) wins Overall (5pts)
    };

    // Korn's scores (Left=M7=Stevo, Right=K9=Edwin)
    // Verified: Visual/Latte Art (3pts): right cup (K9/Edwin)
    //           Taste (1pt): left cup (M7/Stevo)
    //           Tactile (1pt): left cup (M7/Stevo)
    //           Flavour (1pt): left cup (M7/Stevo)
    //           Overall (5pts): left cup (M7/Stevo)
    const kornScore = {
      matchId,
      judgeName: 'Korn',
      leftCupCode: 'M7', // Stevo (left)
      rightCupCode: 'K9', // Edwin (right)
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // K9 (Edwin) wins Visual/Latte Art (3pts)
      taste: 'left', // M7 (Stevo) wins Taste (1pt)
      tactile: 'left', // M7 (Stevo) wins Tactile (1pt)
      flavour: 'left', // M7 (Stevo) wins Flavour (1pt)
      overall: 'left' // M7 (Stevo) wins Overall (5pts)
    };

    // Michalis's scores (Left=M7=Stevo, Right=K9=Edwin)
    // Verified: Visual/Latte Art (3pts): left cup (M7/Stevo)
    //           Taste (1pt): left cup (M7/Stevo)
    //           Tactile (1pt): left cup (M7/Stevo)
    //           Flavour (1pt): right cup (K9/Edwin)
    //           Overall (5pts): left cup (M7/Stevo)
    const michalisScore = {
      matchId,
      judgeName: 'Michalis',
      leftCupCode: 'M7', // Stevo (left)
      rightCupCode: 'K9', // Edwin (right)
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // M7 (Stevo) wins Visual/Latte Art (3pts)
      taste: 'left', // M7 (Stevo) wins Taste (1pt)
      tactile: 'left', // M7 (Stevo) wins Tactile (1pt)
      flavour: 'right', // K9 (Edwin) wins Flavour (1pt)
      overall: 'left' // M7 (Stevo) wins Overall (5pts)
    };

    // Insert detailed scores
    const scores = [jasperScore, kornScore, michalisScore];
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
    // Scoring breakdown per judge:
    // Jasper (Espresso): Left=K9(Edwin), Right=M7(Stevo)
    //   - Visual/Latte Art (3pts): left (K9/Edwin) → Edwin gets 3
    //   - Taste (1pt): right (M7/Stevo) → Stevo gets 1
    //   - Tactile (1pt): left (K9/Edwin) → Edwin gets 1
    //   - Flavour (1pt): right (M7/Stevo) → Stevo gets 1
    //   - Overall (5pts): right (M7/Stevo) → Stevo gets 5
    //   Total: Edwin = 4pts, Stevo = 7pts
    // Korn (Espresso): Left=M7(Stevo), Right=K9(Edwin)
    //   - Visual/Latte Art (3pts): right (K9/Edwin) → Edwin gets 3pts
    //   - Taste (1pt): left (M7/Stevo) → Stevo gets 1pt
    //   - Tactile (1pt): left (M7/Stevo) → Stevo gets 1pt
    //   - Flavour (1pt): left (M7/Stevo) → Stevo gets 1pt
    //   - Overall (5pts): left (M7/Stevo) → Stevo gets 5pts
    //   Total: Stevo = 8pts, Edwin = 3pts
    // Michalis (Cappuccino): Left=M7(Stevo), Right=K9(Edwin)
    //   - Visual/Latte Art (3pts): left (M7/Stevo) → Stevo gets 3pts
    //   - Taste (1pt): left (M7/Stevo) → Stevo gets 1pt
    //   - Tactile (1pt): left (M7/Stevo) → Stevo gets 1pt
    //   - Flavour (1pt): right (K9/Edwin) → Edwin gets 1pt
    //   - Overall (5pts): left (M7/Stevo) → Stevo gets 5pts
    //   Total: Stevo = 10pts, Edwin = 1pt
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Note: heat_scores table stores scores per segment, so we distribute points accordingly
    
    // Jasper's scores (Espresso judge) - Edwin: 4pts, Stevo: 7pts
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${edwinId}, 'ESPRESSO'::segment_type, 4, 'Jasper - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${stevoId}, 'ESPRESSO'::segment_type, 7, 'Jasper - Espresso judge', NOW())
    `;
    
    // Korn's scores (Espresso judge) - Stevo: 8, Edwin: 3
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${stevoId}, 'ESPRESSO'::segment_type, 8, 'Korn - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${edwinId}, 'ESPRESSO'::segment_type, 3, 'Korn - Espresso judge', NOW())
    `;
    
    // Michalis's scores (Cappuccino judge) - Stevo: 10, Edwin: 1
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${stevoId}, 'CAPPUCCINO'::segment_type, 10, 'Michalis - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${edwinId}, 'CAPPUCCINO'::segment_type, 1, 'Michalis - Cappuccino judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Stevo (M7): Jasper(7) + Korn(8) + Michalis(10) = 25 points`);
    console.log(`   Edwin (K9): Jasper(4) + Korn(3) + Michalis(1) = 8 points`);
    console.log(`   Winner: Stevo\n`);

    console.log(`✅ Heat 12 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat12().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat12 };

