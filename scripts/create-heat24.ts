import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat24() {
  try {
    console.log('🏆 Creating Heat 24: Engi vs Bill...\n');

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
    const engi = await sql`SELECT id FROM users WHERE LOWER(name) = 'engi' LIMIT 1`;
    const bill = await sql`SELECT id FROM users WHERE LOWER(name) = 'bill' LIMIT 1`;
    
    if (engi.length === 0 || bill.length === 0) {
      throw new Error('Competitors not found');
    }
    
    const engiId = engi[0].id;
    const billId = bill[0].id;
    console.log(`✅ Engi ID: ${engiId}, Bill ID: ${billId}\n`);

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
      AND round = 2 
      AND heat_number = 24
      LIMIT 1
    `;

    let matchId: number;
    if (existing.length > 0) {
      matchId = existing[0].id;
      console.log(`✅ Heat 24 already exists (ID: ${matchId}), updating...\n`);
      
      // Update match
      await sql`
        UPDATE matches 
        SET competitor1_id = ${engiId},
            competitor2_id = ${billId},
            winner_id = ${engiId},
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
        VALUES (${tournamentId}, 2, 24, ${stationId}, 'DONE', ${engiId}, ${billId}, ${engiId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      matchId = match.id;
      console.log(`✅ Created Heat 24 (Match ID: ${matchId})\n`);
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
    // Michalis: Left = M1 (Bill), Right = E6 (Engi) - Note: User says E3=Engi, but Michalis has E6. Using E6 as provided.
    // Ali: Left = M1 (Bill), Right = E3 (Engi)
    // Jasper: Left = E3 (Engi), Right = M1 (Bill)
    
    // Michalis's scores (Left=M1=Bill, Right=E6=Engi)
    // Note: Using E6 as provided, though user states E3=Engi. This may be a cup code variation.
    const michalisScore = {
      matchId,
      judgeName: 'Michalis',
      leftCupCode: 'M1', // Bill
      rightCupCode: 'E6', // Engi (note: user states E3=Engi, but Michalis has E6)
      sensoryBeverage: 'Cappuccino',
      visualLatteArt: 'right', // E6 (Engi) wins
      taste: 'right', // E6 (Engi) wins
      tactile: 'left', // M1 (Bill) wins
      flavour: 'right', // E6 (Engi) wins
      overall: 'right' // E6 (Engi) wins
    };

    // Ali's scores (Left=M1=Bill, Right=E3=Engi)
    const aliScore = {
      matchId,
      judgeName: 'Ali',
      leftCupCode: 'M1', // Bill
      rightCupCode: 'E3', // Engi
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // E3 (Engi) wins
      taste: 'right', // E3 (Engi) wins
      tactile: 'right', // E3 (Engi) wins
      flavour: 'right', // E3 (Engi) wins
      overall: 'right' // E3 (Engi) wins
    };

    // Jasper's scores (Left=E3=Engi, Right=M1=Bill)
    const jasperScore = {
      matchId,
      judgeName: 'Jasper',
      leftCupCode: 'E3', // Engi
      rightCupCode: 'M1', // Bill
      sensoryBeverage: 'Espresso',
      visualLatteArt: 'right', // Right cup = M1 (Bill) wins
      taste: 'right', // Right cup = M1 (Bill) wins
      tactile: 'right', // Right cup = M1 (Bill) wins
      flavour: 'right', // Right cup = M1 (Bill) wins
      overall: 'right' // Right cup = M1 (Bill) wins
    };

    // Wait, let me re-check Jasper's scores. The user says:
    // "Left Cup Code/Competitor: E3" and "Right Cup Code: M1"
    // And then "Visual/Latte Art (3 points): right cup"
    // So right cup = M1 = Bill wins Visual
    // But the user says "E3 = Engi: 24 points" and "M1 = Bill: 9 points"
    // So Engi should win most categories. Let me re-read...
    
    // Actually, looking at the pattern, if E3 = Engi wins 24 points, and Jasper has E3 on left and M1 on right,
    // and Jasper says "right cup" wins all categories, then M1 (Bill) wins all from Jasper.
    // But that doesn't match the totals. Let me use what the user provided exactly.

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
    // Michalis (Cappuccino): Bill gets Tactile(1) = 1pt, Engi gets Visual(3) + Taste(1) + Flavour(1) + Overall(5) = 10pts
    // Ali (Espresso): Bill gets 0pts, Engi gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Jasper (Espresso): Engi gets 0pts (left cup), Bill gets Visual(3) + Taste(1) + Tactile(1) + Flavour(1) + Overall(5) = 11pts
    // Total calculated: Engi = 10 + 11 + 0 = 21pts, Bill = 1 + 0 + 11 = 12pts
    // User stated totals: Engi = 24pts, Bill = 9pts
    // There is a discrepancy - I'll use the calculated values from detailed scores
    
    // Clear existing heat scores
    await sql`DELETE FROM heat_scores WHERE match_id = ${matchId}`;
    
    // Create aggregated heat scores per segment
    // Michalis's scores (Cappuccino judge) - Bill: 1, Engi: 10
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${billId}, 'CAPPUCCINO'::segment_type, 1, 'Michalis - Cappuccino judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${michalisId}, ${engiId}, 'CAPPUCCINO'::segment_type, 10, 'Michalis - Cappuccino judge', NOW())
    `;
    
    // Ali's scores (Espresso judge) - Bill: 0, Engi: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${billId}, 'ESPRESSO'::segment_type, 0, 'Ali - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${aliId}, ${engiId}, 'ESPRESSO'::segment_type, 11, 'Ali - Espresso judge', NOW())
    `;
    
    // Jasper's scores (Espresso judge) - Engi: 0, Bill: 11
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${engiId}, 'ESPRESSO'::segment_type, 0, 'Jasper - Espresso judge', NOW())
    `;
    await sql`
      INSERT INTO heat_scores (match_id, judge_id, competitor_id, segment, score, notes, submitted_at)
      VALUES (${matchId}, ${jasperId}, ${billId}, 'ESPRESSO'::segment_type, 11, 'Jasper - Espresso judge', NOW())
    `;
    
    console.log(`✅ Aggregated heat scores created\n`);
    console.log(`📊 Score Summary (from detailed scores):`);
    console.log(`   Engi (E3/E6): Michalis(10) + Ali(11) + Jasper(0) = 21 points`);
    console.log(`   Bill (M1): Michalis(1) + Ali(0) + Jasper(11) = 12 points`);
    console.log(`   Winner: Engi\n`);
    console.log(`Note: User stated totals are Engi: 24, Bill: 9.`);
    console.log(`      Calculated from detailed scores: Engi: 21, Bill: 12.`);
    console.log(`      Note: There's also a cup code discrepancy (E6 vs E3 for Engi).`);
    console.log(`      Detailed scores have been saved as provided.\n`);

    console.log(`✅ Heat 24 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat24().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat24 };

