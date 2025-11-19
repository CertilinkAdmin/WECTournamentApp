import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeats15And16() {
  try {
    console.log('🏆 Creating Heat 15 (Bill vs BYE) and Heat 16 (Engi vs BYE)...\n');

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
    const bill = await sql`SELECT id FROM users WHERE LOWER(name) = 'bill' LIMIT 1`;
    const engi = await sql`SELECT id FROM users WHERE LOWER(name) = 'engi' LIMIT 1`;
    
    if (bill.length === 0) {
      throw new Error('Bill not found in users table');
    }
    if (engi.length === 0) {
      throw new Error('Engi not found in users table');
    }
    
    const billId = bill[0].id;
    const engiId = engi[0].id;
    console.log(`✅ Bill ID: ${billId}, Engi ID: ${engiId}\n`);

    // Get station ID
    const stations = await sql`SELECT id FROM stations LIMIT 1`;
    if (stations.length === 0) {
      throw new Error('No stations found');
    }
    const stationId = stations[0].id;

    // Create Heat 15 (Bill vs BYE)
    const existing15 = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 1 
      AND heat_number = 15
      LIMIT 1
    `;

    if (existing15.length > 0) {
      // Update existing heat to ensure winner is set and no scores exist
      await sql`
        UPDATE matches 
        SET competitor1_id = ${billId},
            competitor2_id = NULL,
            winner_id = ${billId},
            status = 'DONE',
            updated_at = NOW()
        WHERE id = ${existing15[0].id}
      `;
      // Ensure no scores exist for BYE matches
      await sql`DELETE FROM judge_detailed_scores WHERE match_id = ${existing15[0].id}`;
      await sql`DELETE FROM heat_scores WHERE match_id = ${existing15[0].id}`;
      console.log(`✅ Heat 15 updated: Bill vs BYE (Match ID: ${existing15[0].id}) - Winner: Bill, No scores\n`);
    } else {
      const [match15] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, winner_id, start_time, end_time, created_at, updated_at)
        VALUES (${tournamentId}, 1, 15, ${stationId}, 'DONE', ${billId}, NULL, ${billId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      console.log(`✅ Created Heat 15: Bill vs BYE (Match ID: ${match15.id}) - Winner: Bill, No scores\n`);
    }

    // Create Heat 16 (Engi vs BYE)
    const existing16 = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 1 
      AND heat_number = 16
      LIMIT 1
    `;

    if (existing16.length > 0) {
      // Update existing heat to ensure winner is set and no scores exist
      await sql`
        UPDATE matches 
        SET competitor1_id = ${engiId},
            competitor2_id = NULL,
            winner_id = ${engiId},
            status = 'DONE',
            updated_at = NOW()
        WHERE id = ${existing16[0].id}
      `;
      // Ensure no scores exist for BYE matches
      await sql`DELETE FROM judge_detailed_scores WHERE match_id = ${existing16[0].id}`;
      await sql`DELETE FROM heat_scores WHERE match_id = ${existing16[0].id}`;
      console.log(`✅ Heat 16 updated: Engi vs BYE (Match ID: ${existing16[0].id}) - Winner: Engi, No scores\n`);
    } else {
      const [match16] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, winner_id, start_time, end_time, created_at, updated_at)
        VALUES (${tournamentId}, 1, 16, ${stationId}, 'DONE', ${engiId}, NULL, ${engiId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      console.log(`✅ Created Heat 16: Engi vs BYE (Match ID: ${match16.id}) - Winner: Engi, No scores\n`);
    }

    console.log(`✅ Heats 15 and 16 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeats15And16().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeats15And16 };

