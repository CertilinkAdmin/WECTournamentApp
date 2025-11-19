import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat27() {
  try {
    console.log('🏆 Creating Heat 27: Christos vs Stevo...\n');

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

    const christos = await sql`SELECT id FROM users WHERE LOWER(name) = 'christos' LIMIT 1`;
    const stevo = await sql`SELECT id FROM users WHERE LOWER(name) = 'stevo' LIMIT 1`;
    
    if (christos.length === 0 || stevo.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const christosId = christos[0].id;
    const stevoId = stevo[0].id;
    console.log(`✅ Christos ID: ${christosId}, Stevo ID: ${stevoId}\n`);

    const shinsaku = await sql`SELECT id FROM users WHERE LOWER(name) = 'shinsaku' LIMIT 1`;
    const korn = await sql`SELECT id FROM users WHERE LOWER(name) = 'korn' LIMIT 1`;
    const junior = await sql`SELECT id FROM users WHERE LOWER(name) = 'junior' LIMIT 1`;
    
    if (shinsaku.length === 0 || korn.length === 0 || junior.length === 0) {
      throw new Error('Judges not found');
    }
    
    const shinsakuId = shinsaku[0].id;
    const kornId = korn[0].id;
    const juniorId = junior[0].id;
    console.log(`✅ Judges: Shinsaku (${shinsakuId}), Korn (${kornId}), Junior (${juniorId})\n`);

    const stations = await sql`SELECT id FROM stations LIMIT 1`;
    if (stations.length === 0) {
      throw new Error('No stations found');
    }
    const stationId = stations[0].id;

    const existing = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 3 
      AND heat_number = 27
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 27 already exists (ID: ${matchId}), updating...\n`);
      
      await sql`
        UPDATE matches 
        SET competitor1_id = ${christosId},
            competitor2_id = ${stevoId},
            winner_id = ${christosId},
            status = 'DONE',
            start_time = NOW(),
            end_time = NOW(),
            updated_at = NOW()
        WHERE id = ${matchId}
      `;
    } else {
      const [match] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, winner_id, start_time, end_time, created_at, updated_at)
        VALUES (${tournamentId}, 3, 27, ${stationId}, 'DONE', ${christosId}, ${stevoId}, ${christosId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 27 (Match ID: ${matchId})\n`);
    }

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

    const judgeRoles = [
      { judgeId: shinsakuId, role: 'SENSORY' },
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

    // IMPORTANT: Cup assignments differ per judge!
    // Shinsaku: Left = P3 (Christos), Right = M9 (Stevo)
    // Korn: Left = K5 (Stevo), Right = J1 (Christos)
    // Junior: Left = K5 (Stevo), Right = J1 (Christos)
    
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'P3', // Christos
      rightCupCode: 'M9', // Stevo
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // P3 (Christos) wins
      taste: 'left', // P3 (Christos) wins
      tactile: 'left', // P3 (Christos) wins
      flavour: 'left', // P3 (Christos) wins
      overall: 'left' // P3 (Christos) wins
    };

    const kornScore = {
      matchId,
      judgeName: 'Korn',
      leftCupCode: 'K5', // Stevo
      rightCupCode: 'J1', // Christos
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // J1 (Christos) wins
      taste: 'right', // J1 (Christos) wins
      tactile: 'right', // J1 (Christos) wins
      flavour: 'right', // J1 (Christos) wins
      overall: 'right' // J1 (Christos) wins
    };

    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'K5', // Stevo
      rightCupCode: 'J1', // Christos
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // K5 (Stevo) wins
      taste: 'left', // K5 (Stevo) wins
      tactile: 'left', // K5 (Stevo) wins
      flavour: 'left', // K5 (Stevo) wins
      overall: 'left' // K5 (Stevo) wins
    };

    const scores = [shinsakuScore, kornScore, juniorScore];
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

    // Shinsaku (Cappuccino): Christos gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Stevo gets 0pts
    // Korn (Espresso): Stevo gets 0pts, Christos gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Junior (Espresso): Stevo gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Christos gets 0pts
    // Total calculated: Christos = 11 + 11 + 0 = 22pts, Stevo = 0 + 0 + 11 = 11pts
    // User stated totals: Christos = 24pts, Stevo = 9pts
    
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${christosId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${stevoId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${christosId}, 'ESPRESSO'::segment_type, 11, 'Korn - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${stevoId}, 'ESPRESSO'::segment_type, 0, 'Korn - Espresso judge', NOW())
    `;
    
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${stevoId}, 'ESPRESSO'::segment_type, 11, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${christosId}, 'ESPRESSO'::segment_type, 0, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary:`);
    console.log(`   Christos (J1/P3): Shinsaku(11) + Korn(11) + Junior(0) = 22 points`);
    console.log(`   Stevo (K5/M9): Shinsaku(0) + Korn(0) + Junior(11) = 11 points`);
    console.log(`   Winner: Christos\n`);

    console.log(`✅ Heat 27 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat27().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat27 };

