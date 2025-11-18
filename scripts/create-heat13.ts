import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat13() {
  try {
    console.log('🏆 Creating Heat 13: Kirill vs Anja...\n');

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
    const kirill = await sql`SELECT id FROM users WHERE LOWER(name) = 'kirill' LIMIT 1`;
    const anja = await sql`SELECT id FROM users WHERE LOWER(name) = 'anja' LIMIT 1`;
    
    if (kirill.length === 0 || anja.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const kirillId = kirill[0].id;
    const anjaId = anja[0].id;
    console.log(`✅ Kirill ID: ${kirillId}, Anja ID: ${anjaId}\n`);

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
      AND heat_number = 13
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 13 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${kirillId},
            competitor2_id = ${anjaId},
            winner_id = ${kirillId},
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
        VALUES (${tournamentId}, 1, 13, ${stationId}, 'DONE', ${kirillId}, ${anjaId}, ${kirillId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 13 (Match ID: ${matchId})\n`);
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
      { judgeId: shinsakuId, role: 'TECHNICAL' },
      { judgeId: aliId, role: 'SENSORY' },
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
    // Cup assignments:
    // Shinsaku: Left = F5 (Kirill), Right = X1 (Anja)
    // Ali: Left = X1 (Anja), Right = F5 (Kirill)
    // Junior: Left = X1 (Anja), Right = F5 (Kirill)
    
    // Shinsaku's scores (Left=F5=Kirill, Right=X1=Anja)
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'F5', // Kirill
      rightCupCode: 'X1', // Anja
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // F5 (Kirill) wins
      taste: 'left', // F5 (Kirill) wins
      tactile: 'left', // F5 (Kirill) wins
      flavour: 'left', // F5 (Kirill) wins
      overall: 'left' // F5 (Kirill) wins
    };

    // Ali's scores (Left=X1=Anja, Right=F5=Kirill)
    const aliScore = {
      matchId,
      judgeName: 'Ali',
      leftCupCode: 'X1', // Anja
      rightCupCode: 'F5', // Kirill
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // X1 (Anja) wins
      taste: 'right', // F5 (Kirill) wins
      tactile: 'left', // X1 (Anja) wins
      flavour: 'right', // F5 (Kirill) wins
      overall: 'right' // F5 (Kirill) wins
    };

    // Junior's scores (Left=X1=Anja, Right=F5=Kirill)
    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'X1', // Anja
      rightCupCode: 'F5', // Kirill
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // X1 (Anja) wins
      taste: 'left', // X1 (Anja) wins
      tactile: 'left', // X1 (Anja) wins
      flavour: 'left', // X1 (Anja) wins
      overall: 'left' // X1 (Anja) wins
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
    // Shinsaku (Cappuccino): Kirill gets all 5 categories = 3+1+1+1+5 = 11pts, Anja gets 0pts
    // Ali (Espresso): Kirill gets Taste(1) + Flavour(1) + Overall(5) = 7pts, Anja gets Visual(3) + Tactile(1) = 4pts
    // Junior (Espresso): Kirill gets 0pts, Anja gets all 5 categories = 3+1+1+1+5 = 11pts
    // Total: Kirill = 11 + 7 + 0 = 18pts, Anja = 0 + 4 + 11 = 15pts
    // But user states: Kirill = 24pts, Anja = 9pts
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Shinsaku's scores (Cappuccino judge) - Kirill: 11, Anja: 0
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${kirillId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${anjaId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    // Ali's scores (Espresso judge) - Kirill: 7, Anja: 4
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${kirillId}, 'ESPRESSO'::segment_type, 7, 'Ali - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${anjaId}, 'ESPRESSO'::segment_type, 4, 'Ali - Espresso judge', NOW())
    `;
    
    // Junior's scores (Espresso judge) - Kirill: 0, Anja: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${kirillId}, 'ESPRESSO'::segment_type, 0, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${anjaId}, 'ESPRESSO'::segment_type, 11, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Kirill (F5): Shinsaku(11) + Ali(7) + Junior(0) = 18 points`);
    console.log(`   Anja (X1): Shinsaku(0) + Ali(4) + Junior(11) = 15 points`);
    console.log(`   Winner: Kirill\n`);
    console.log(`Note: User stated totals are Kirill: 24, Anja: 9.`);
    console.log(`      Calculated from detailed scores: Kirill: 18, Anja: 15.`);
    console.log(`      Detailed scores have been saved correctly.\n`);

    console.log(`✅ Heat 13 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat13().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat13 };

