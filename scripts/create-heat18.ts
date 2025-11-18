import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat18() {
  try {
    console.log('🏆 Creating Heat 18: Felix vs Aga...\n');

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
    const felix = await sql`SELECT id FROM users WHERE LOWER(name) = 'felix' LIMIT 1`;
    const aga = await sql`SELECT id FROM users WHERE LOWER(name) = 'aga' LIMIT 1`;
    
    if (felix.length === 0 || aga.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const felixId = felix[0].id;
    const agaId = aga[0].id;
    console.log(`✅ Felix ID: ${felixId}, Aga ID: ${agaId}\n`);

    // Get judge IDs
    const shinsaku = await sql`SELECT id FROM users WHERE LOWER(name) = 'shinsaku' LIMIT 1`;
    const ali = await sql`SELECT id FROM users WHERE LOWER(name) = 'ali' LIMIT 1`;
    const junior = await sql`SELECT id FROM users WHERE LOWER(name) = 'junior' LIMIT 1`;
    
    if (shinsaku.length === 0 || ali.length === 0 || junior.length === 0) {
      throw new Error('Judges not found');
    }
    
    const shinsakuId = shinsaku[0].id;
    const aliId = ali[0].id;
    const juniorId = junior[0].id;
    console.log(`✅ Judges: Shinsaku (${shinsakuId}), Ali (${aliId}), Junior (${juniorId})\n`);

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
      AND heat_number = 18
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 18 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${felixId},
            competitor2_id = ${agaId},
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
        VALUES (${tournamentId}, 1, 18, ${stationId}, 'DONE', ${felixId}, ${agaId}, ${agaId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 18 (Match ID: ${matchId})\n`);
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
      { judgeId: aliId, role: 'HEAD' },
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
    // Left = V4 (Felix), Right = J1 (Aga)
    
    // Shinsaku's scores (Left=V4=Felix, Right=J1=Aga)
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'V4', // Felix
      rightCupCode: 'J1', // Aga
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // J1 (Aga) wins
      taste: 'right', // J1 (Aga) wins
      tactile: 'right', // J1 (Aga) wins
      flavour: 'right', // J1 (Aga) wins
      overall: 'right' // J1 (Aga) wins
    };

    // Ali's scores (Left=V4=Felix, Right=J1=Aga)
    const aliScore = {
      matchId,
      judgeName: 'Ali',
      leftCupCode: 'V4', // Felix
      rightCupCode: 'J1', // Aga
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // J1 (Aga) wins
      taste: 'right', // J1 (Aga) wins
      tactile: 'left', // V4 (Felix) wins
      flavour: 'right', // J1 (Aga) wins
      overall: 'right' // J1 (Aga) wins
    };

    // Junior's scores (Left=V4=Felix, Right=J1=Aga)
    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'V4', // Felix
      rightCupCode: 'J1', // Aga
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // J1 (Aga) wins
      taste: 'right', // J1 (Aga) wins
      tactile: 'right', // J1 (Aga) wins
      flavour: 'left', // V4 (Felix) wins
      overall: 'right' // J1 (Aga) wins
    };

    // Insert detailed scores
    const scores = [shinsakuScore, aliScore, juniorScore];
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
    // Shinsaku (Cappuccino): Felix gets 0pts, Aga gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Ali (Espresso): Felix gets Tactile(1) = 1pt, Aga gets Visual(3) + Taste(1) + Flavour(1) + Overall(5) = 10pts
    // Junior (Espresso): Felix gets Flavour(1) = 1pt, Aga gets Visual(3) + Taste(1) + Tactile(1) + Overall(5) = 10pts
    // Total calculated: Felix = 0 + 1 + 1 = 2pts, Aga = 11 + 10 + 10 = 31pts ✅ Matches user's stated totals!
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Shinsaku's scores (Cappuccino judge) - Felix: 0, Aga: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${felixId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${agaId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    // Ali's scores (Espresso judge) - Felix: 1, Aga: 10
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${felixId}, 'ESPRESSO'::segment_type, 1, 'Ali - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${agaId}, 'ESPRESSO'::segment_type, 10, 'Ali - Espresso judge', NOW())
    `;
    
    // Junior's scores (Espresso judge) - Felix: 1, Aga: 10
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${felixId}, 'ESPRESSO'::segment_type, 1, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${agaId}, 'ESPRESSO'::segment_type, 10, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary:`);
    console.log(`   Aga (J1): Shinsaku(11) + Ali(10) + Junior(10) = 31 points ✅`);
    console.log(`   Felix (V4): Shinsaku(0) + Ali(1) + Junior(1) = 2 points ✅`);
    console.log(`   Winner: Aga\n`);

    console.log(`✅ Heat 18 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat18().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat18 };

