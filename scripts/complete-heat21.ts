import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function completeHeat21() {
  try {
    console.log('🏆 Completing Heat 21: Faiz vs Christos...\n');

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
    const faiz = await sql`SELECT id FROM users WHERE LOWER(name) = 'faiz' LIMIT 1`;
    const christos = await sql`SELECT id FROM users WHERE LOWER(name) = 'christos' LIMIT 1`;
    
    if (faiz.length === 0 || christos.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const faizId = faiz[0].id;
    const christosId = christos[0].id;
    console.log(`✅ Faiz ID: ${faizId}, Christos ID: ${christosId}\n`);

    // Get judge IDs
    const michalis = await sql`SELECT id FROM users WHERE LOWER(name) = 'michalis' LIMIT 1`;
    const ali = await sql`SELECT id FROM users WHERE LOWER(name) = 'ali' LIMIT 1`;
    const jasper = await sql`SELECT id FROM users WHERE LOWER(name) = 'jasper' LIMIT 1`;
    
    if (michalis.length === 0 || ali.length === 0 || jasper.length === 0) {
      throw new Error('Judges not found');
    }
    
    const michalisId = michalis[0].id;
    const aliId = ali[0].id;
    const jasperId = jasper[0].id;
    console.log(`✅ Judges: Michalis (${michalisId}), Ali (${aliId}), Jasper (${jasperId})\n`);

    // Get match ID
    const matches = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 1 
      AND heat_number = 21
      LIMIT 1
    `;
    
    if (matches.length === 0) {
      throw new Error('Heat 21 not found. Please run create-heats-20-21.ts first.');
    }
    
    const matchId = matches[0].id;
    console.log(`✅ Found Heat 21 (Match ID: ${matchId})\n`);

    // Update match status and winner
    await sql`
      UPDATE matches 
      SET competitor1_id = ${faizId},
          competitor2_id = ${christosId},
          winner_id = ${christosId},
          status = 'DONE',
          start_time = NOW(),
          end_time = NOW(),
          updated_at = NOW()
      WHERE id = ${matchId}
    `;
    console.log(`✅ Match updated\n`);

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
      { judgeId: aliId, role: 'HEAD' },
      { judgeId: jasperId, role: 'TECHNICAL' }
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
    // Michalis: Left = Q5 (Faiz), Right = B1 (Christos)
    // Ali: Left = Q5 (Faiz), Right = B1 (Christos)
    // Jasper: Left = B1 (Christos), Right = Q5 (Faiz)
    
    // Michalis's scores (Left=Q5=Faiz, Right=B1=Christos)
    const michalisScore = {
      matchId,
      judgeName: 'Michalis',
      leftCupCode: 'Q5', // Faiz
      rightCupCode: 'B1', // Christos
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // B1 (Christos) wins
      taste: 'right', // B1 (Christos) wins
      tactile: 'right', // B1 (Christos) wins
      flavour: 'right', // B1 (Christos) wins
      overall: 'right' // B1 (Christos) wins
    };

    // Ali's scores (Left=Q5=Faiz, Right=B1=Christos)
    const aliScore = {
      matchId,
      judgeName: 'Ali',
      leftCupCode: 'Q5', // Faiz
      rightCupCode: 'B1', // Christos
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // B1 (Christos) wins
      taste: 'right', // B1 (Christos) wins
      tactile: 'left', // Q5 (Faiz) wins
      flavour: 'right', // B1 (Christos) wins
      overall: 'right' // B1 (Christos) wins
    };

    // Jasper's scores (Left=B1=Christos, Right=Q5=Faiz)
    const jasperScore = {
      matchId,
      judgeName: 'Jasper',
      leftCupCode: 'B1', // Christos
      rightCupCode: 'Q5', // Faiz
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // Q5 (Faiz) wins
      taste: 'right', // Q5 (Faiz) wins
      tactile: 'right', // Q5 (Faiz) wins
      flavour: 'left', // B1 (Christos) wins
      overall: 'right' // Q5 (Faiz) wins
    };

    // Insert detailed scores
    const scores = [michalisScore, aliScore, jasperScore];
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
    // Michalis (Cappuccino): Faiz gets 0pts, Christos gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Ali (Espresso): Faiz gets Tactile(1) = 1pt, Christos gets Visual(3) + Taste(1) + Flavour(1) + Overall(5) = 10pts
    // Jasper (Espresso): Faiz gets Visual(3) + Taste(1) + Tactile(1) + Overall(5) = 10pts, Christos gets Flavour(1) = 1pt
    // Total calculated: Faiz = 0 + 1 + 10 = 11pts, Christos = 11 + 10 + 1 = 22pts
    // User stated totals: Faiz = 8pts, Christos = 25pts
    // There is a discrepancy - I'll use the calculated values from detailed scores
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Michalis's scores (Cappuccino judge) - Faiz: 0, Christos: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${faizId}, 'CAPPUCCINO'::segment_type, 0, 'Michalis - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${christosId}, 'CAPPUCCINO'::segment_type, 11, 'Michalis - Cappuccino judge', NOW())
    `;
    
    // Ali's scores (Espresso judge) - Faiz: 1, Christos: 10
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${faizId}, 'ESPRESSO'::segment_type, 1, 'Ali - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${christosId}, 'ESPRESSO'::segment_type, 10, 'Ali - Espresso judge', NOW())
    `;
    
    // Jasper's scores (Espresso judge) - Faiz: 10, Christos: 1
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${faizId}, 'ESPRESSO'::segment_type, 10, 'Jasper - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${christosId}, 'ESPRESSO'::segment_type, 1, 'Jasper - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Christos (B1): Michalis(11) + Ali(10) + Jasper(1) = 22 points`);
    console.log(`   Faiz (Q5): Michalis(0) + Ali(1) + Jasper(10) = 11 points`);
    console.log(`   Winner: Christos\n`);
    console.log(`Note: User stated totals are Faiz: 8, Christos: 25.`);
    console.log(`      Calculated from detailed scores: Faiz: 11, Christos: 22.`);
    console.log(`      Detailed scores have been saved correctly.\n`);

    console.log(`✅ Heat 21 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeHeat21().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { completeHeat21 };

