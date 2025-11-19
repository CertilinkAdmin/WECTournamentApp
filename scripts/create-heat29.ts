import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat29() {
  try {
    console.log('🏆 Creating Heat 29: Aga vs Artur (Semifinals)...\n');

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

    const aga = await sql`SELECT id FROM users WHERE LOWER(name) = 'aga' LIMIT 1`;
    const artur = await sql`SELECT id FROM users WHERE LOWER(name) = 'artur' LIMIT 1`;
    
    if (aga.length === 0 || artur.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const agaId = aga[0].id;
    const arturId = artur[0].id;
    console.log(`✅ Aga ID: ${agaId}, Artur ID: ${arturId}\n`);

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

    const stations = await sql`SELECT id FROM stations LIMIT 1`;
    if (stations.length === 0) {
      throw new Error('No stations found');
    }
    const stationId = stations[0].id;

    const existing = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 4 
      AND heat_number = 29
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 29 already exists (ID: ${matchId}), updating...\n`);
      
      await sql`
        UPDATE matches 
        SET competitor1_id = ${agaId},
            competitor2_id = ${arturId},
            winner_id = ${agaId},
            status = 'DONE',
            start_time = NOW(),
            end_time = NOW(),
            updated_at = NOW()
        WHERE id = ${matchId}
      `;
    } else {
      const [match] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, winner_id, start_time, end_time, created_at, updated_at)
        VALUES (${tournamentId}, 4, 29, ${stationId}, 'DONE', ${agaId}, ${arturId}, ${agaId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 29 (Match ID: ${matchId})\n`);
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

    // IMPORTANT: Cup assignments differ per judge!
    // Shinsaku: Left = L2 (Aga), Right = Z7 (Artur)
    // Korn: Left = Z7 (Artur), Right = L2 (Aga)
    // Boss: Left = Z7 (Artur), Right = L2 (Aga)
    
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'L2', // Aga
      rightCupCode: 'Z7', // Artur
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'left', // L2 (Aga) wins
      taste: 'left', // L2 (Aga) wins
      tactile: 'left', // L2 (Aga) wins
      flavour: 'left', // L2 (Aga) wins
      overall: 'left' // L2 (Aga) wins
    };

    const kornScore = {
      matchId,
      judgeName: 'Korn',
      leftCupCode: 'Z7', // Artur
      rightCupCode: 'L2', // Aga
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // Z7 (Artur) wins
      taste: 'right', // L2 (Aga) wins
      tactile: 'left', // Z7 (Artur) wins
      flavour: 'left', // Z7 (Artur) wins
      overall: 'left' // Z7 (Artur) wins
    };

    const bossScore = {
      matchId,
      judgeName: 'Boss',
      leftCupCode: 'Z7', // Artur
      rightCupCode: 'L2', // Aga
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // Z7 (Artur) wins
      taste: 'right', // L2 (Aga) wins
      tactile: 'right', // L2 (Aga) wins
      flavour: 'left', // Z7 (Artur) wins
      overall: 'right' // L2 (Aga) wins
    };

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

    // Shinsaku (Cappuccino): Aga gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Artur gets 0pts
    // Korn (Espresso): Artur gets Visual(3) + Tactile(1) + Flavour(1) = 5pts, Aga gets Taste(1) + Overall(5) = 6pts
    // Boss (Espresso): Artur gets Visual(3) + Flavour(1) = 4pts, Aga gets Taste(1) + Tactile(1) + Overall(5) = 7pts
    // Total calculated: Aga = 11 + 6 + 7 = 24pts, Artur = 0 + 5 + 4 = 9pts
    // User stated totals: Aga = 25pts, Artur = 8pts
    
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${agaId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${arturId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${agaId}, 'ESPRESSO'::segment_type, 6, 'Korn - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${kornId}, ${arturId}, 'ESPRESSO'::segment_type, 5, 'Korn - Espresso judge', NOW())
    `;
    
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${bossId}, ${agaId}, 'ESPRESSO'::segment_type, 7, 'Boss - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${bossId}, ${arturId}, 'ESPRESSO'::segment_type, 4, 'Boss - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary:`);
    console.log(`   Aga (L2): Shinsaku(11) + Korn(6) + Boss(7) = 24 points`);
    console.log(`   Artur (Z7): Shinsaku(0) + Korn(5) + Boss(4) = 9 points`);
    console.log(`   Winner: Aga\n`);

    console.log(`✅ Heat 29 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat29().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat29 };

