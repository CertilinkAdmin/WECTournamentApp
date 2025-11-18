import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function completeHeat22() {
  try {
    console.log('🏆 Completing Heat 22: Stevo vs Daniele...\n');

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
    const daniele = await sql`SELECT id FROM users WHERE LOWER(name) = 'danielle' LIMIT 1`;
    
    if (stevo.length === 0 || daniele.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const stevoId = stevo[0].id;
    const danieleId = daniele[0].id;
    console.log(`✅ Stevo ID: ${stevoId}, Daniele ID: ${danieleId}\n`);

    // Get judge IDs
    const shinsaku = await sql`SELECT id FROM users WHERE LOWER(name) = 'shinsaku' LIMIT 1`;
    const tess = await sql`SELECT id FROM users WHERE LOWER(name) = 'tess' LIMIT 1`;
    const junior = await sql`SELECT id FROM users WHERE LOWER(name) = 'junior' LIMIT 1`;
    
    if (shinsaku.length === 0 || tess.length === 0 || junior.length === 0) {
      throw new Error('Judges not found');
    }
    
    const shinsakuId = shinsaku[0].id;
    const tessId = tess[0].id;
    const juniorId = junior[0].id;
    console.log(`✅ Judges: Shinsaku (${shinsakuId}), Tess (${tessId}), Junior (${juniorId})\n`);

    // Get match ID
    const matches = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 1 
      AND heat_number = 22
      LIMIT 1
    `;
    
    if (matches.length === 0) {
      throw new Error('Heat 22 not found. Please run create-heat22.ts first.');
    }
    
    const matchId = matches[0].id;
    console.log(`✅ Found Heat 22 (Match ID: ${matchId})\n`);

    // Update match status and winner
    await sql`
      UPDATE matches 
      SET competitor1_id = ${stevoId},
          competitor2_id = ${danieleId},
          winner_id = ${stevoId},
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
      { judgeId: shinsakuId, role: 'SENSORY' },
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
    // Shinsaku: Left = T8 (Stevo), Right = J7 (Daniele)
    // Tess: Left = J7 (Daniele), Right = T8 (Stevo)
    // Junior: Left = J7 (Daniele), Right = T8 (Stevo)
    
    // Shinsaku's scores (Left=T8=Stevo, Right=J7=Daniele)
    const shinsakuScore = {
      matchId,
      judgeName: 'Shinsaku',
      leftCupCode: 'T8', // Stevo
      rightCupCode: 'J7', // Daniele
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // J7 (Daniele) wins
      taste: 'right', // J7 (Daniele) wins
      tactile: 'right', // J7 (Daniele) wins
      flavour: 'right', // J7 (Daniele) wins
      overall: 'right' // J7 (Daniele) wins
    };

    // Tess's scores (Left=J7=Daniele, Right=T8=Stevo)
    const tessScore = {
      matchId,
      judgeName: 'Tess',
      leftCupCode: 'J7', // Daniele
      rightCupCode: 'T8', // Stevo
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // T8 (Stevo) wins
      taste: 'right', // T8 (Stevo) wins
      tactile: 'right', // T8 (Stevo) wins
      flavour: 'right', // T8 (Stevo) wins
      overall: 'right' // T8 (Stevo) wins
    };

    // Junior's scores (Left=J7=Daniele, Right=T8=Stevo)
    const juniorScore = {
      matchId,
      judgeName: 'Junior',
      leftCupCode: 'J7', // Daniele
      rightCupCode: 'T8', // Stevo
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'left', // J7 (Daniele) wins
      taste: 'right', // T8 (Stevo) wins
      tactile: 'right', // T8 (Stevo) wins
      flavour: 'right', // T8 (Stevo) wins
      overall: 'right' // T8 (Stevo) wins
    };

    // Insert detailed scores
    const scores = [shinsakuScore, tessScore, juniorScore];
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
    // Shinsaku (Cappuccino): Stevo gets 0pts, Daniele gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Tess (Espresso): Stevo gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts, Daniele gets 0pts
    // Junior (Espresso): Stevo gets Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 8pts, Daniele gets Visual(3) = 3pts
    // Total calculated: Stevo = 0 + 11 + 8 = 19pts, Daniele = 11 + 0 + 3 = 14pts ✅ Matches user's stated totals!
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Shinsaku's scores (Cappuccino judge) - Stevo: 0, Daniele: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${stevoId}, 'CAPPUCCINO'::segment_type, 0, 'Shinsaku - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${shinsakuId}, ${danieleId}, 'CAPPUCCINO'::segment_type, 11, 'Shinsaku - Cappuccino judge', NOW())
    `;
    
    // Tess's scores (Espresso judge) - Stevo: 11, Daniele: 0
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${stevoId}, 'ESPRESSO'::segment_type, 11, 'Tess - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${tessId}, ${danieleId}, 'ESPRESSO'::segment_type, 0, 'Tess - Espresso judge', NOW())
    `;
    
    // Junior's scores (Espresso judge) - Stevo: 8, Daniele: 3
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${stevoId}, 'ESPRESSO'::segment_type, 8, 'Junior - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${juniorId}, ${danieleId}, 'ESPRESSO'::segment_type, 3, 'Junior - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary:`);
    console.log(`   Stevo (T8): Shinsaku(0) + Tess(11) + Junior(8) = 19 points ✅`);
    console.log(`   Daniele (J7): Shinsaku(11) + Tess(0) + Junior(3) = 14 points ✅`);
    console.log(`   Winner: Stevo\n`);

    console.log(`✅ Heat 22 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeHeat22().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { completeHeat22 };

