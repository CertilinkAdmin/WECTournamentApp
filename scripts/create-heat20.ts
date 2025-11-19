import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat20() {
  try {
    console.log('🏆 Creating Heat 20: Daniele vs BYE...\n');

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

    // Get competitor ID
    const daniele = await sql`SELECT id FROM users WHERE LOWER(name) LIKE 'daniele%' OR LOWER(name) LIKE 'danielle%' LIMIT 1`;
    
    if (daniele.length === 0) {
      throw new Error('Daniele not found in users table');
    }
    
    const danieleId = daniele[0].id;
    console.log(`✅ Daniele ID: ${danieleId}\n`);

    // Get station ID
    const stations = await sql`SELECT id FROM stations LIMIT 1`;
    if (stations.length === 0) {
      throw new Error('No stations found');
    }
    const stationId = stations[0].id;

    // Create Heat 20 (Daniele vs BYE)
    const existing20 = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 2 
      AND heat_number = 20
      LIMIT 1
    `;

    if (existing20.length > 0) {
      // Update existing heat to ensure winner is set and no scores exist
      await sql`
        UPDATE matches 
        SET competitor1_id = ${danieleId},
            competitor2_id = NULL,
            winner_id = ${danieleId},
            status = 'DONE',
            updated_at = NOW()
        WHERE id = ${existing20[0].id}
      `;
      // Ensure no scores exist for BYE matches
      await sql`DELETE FROM judge_detailed_scores WHERE match_id = ${existing20[0].id}`;
      await sql`DELETE FROM heat_scores WHERE match_id = ${existing20[0].id}`;
      console.log(`✅ Heat 20 updated: Daniele vs BYE (Match ID: ${existing20[0].id}) - Winner: Daniele, No scores\n`);
    } else {
      const [match20] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, winner_id, start_time, end_time, created_at, updated_at)
        VALUES (${tournamentId}, 2, 20, ${stationId}, 'DONE', ${danieleId}, NULL, ${danieleId}, NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `;
      console.log(`✅ Created Heat 20: Daniele vs BYE (Match ID: ${match20.id}) - Winner: Daniele, No scores\n`);
    }

    console.log(`✅ Heat 20 completed successfully!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat20().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat20 };
