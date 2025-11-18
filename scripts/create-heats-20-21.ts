import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeats20And21() {
  try {
    console.log('🏆 Creating Heat 20 (Daniele vs BYE) and Heat 21 (Faiz vs Christos)...\n');

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
    const daniele = await sql`SELECT id FROM users WHERE LOWER(name) = 'danielle' LIMIT 1`;
    const faiz = await sql`SELECT id FROM users WHERE LOWER(name) = 'faiz' LIMIT 1`;
    const christos = await sql`SELECT id FROM users WHERE LOWER(name) = 'christos' LIMIT 1`;
    
    if (daniele.length === 0) {
      throw new Error('Daniele not found in users table');
    }
    if (faiz.length === 0) {
      throw new Error('Faiz not found in users table');
    }
    if (christos.length === 0) {
      throw new Error('Christos not found in users table');
    }
    
    const danieleId = daniele[0].id;
    const faizId = faiz[0].id;
    const christosId = christos[0].id;
    console.log(`✅ Daniele ID: ${danieleId}, Faiz ID: ${faizId}, Christos ID: ${christosId}\n`);

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
      AND round = 1 
      AND heat_number = 20
      LIMIT 1
    `;

    if (existing20.length > 0) {
      console.log(`✅ Heat 20 already exists (ID: ${existing20[0].id}), skipping...\n`);
    } else {
      const [match20] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, created_at, updated_at)
        VALUES (${tournamentId}, 1, 20, ${stationId}, 'PENDING', ${danieleId}, NULL, NOW(), NOW())
        RETURNING id
      `;
      console.log(`✅ Created Heat 20: Daniele vs BYE (Match ID: ${match20.id})\n`);
    }

    // Create Heat 21 (Faiz vs Christos) - pending scores
    const existing21 = await sql`
      SELECT id FROM matches 
      WHERE tournament_id = ${tournamentId} 
      AND round = 1 
      AND heat_number = 21
      LIMIT 1
    `;

    if (existing21.length > 0) {
      console.log(`✅ Heat 21 already exists (ID: ${existing21[0].id}), skipping...\n`);
    } else {
      const [match21] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, created_at, updated_at)
        VALUES (${tournamentId}, 1, 21, ${stationId}, 'PENDING', ${faizId}, ${christosId}, NOW(), NOW())
        RETURNING id
      `;
      console.log(`✅ Created Heat 21: Faiz vs Christos (Match ID: ${match21.id}) - Pending judge scores\n`);
    }

    console.log(`✅ Heats 20 and 21 completed successfully!`);
    console.log(`\nNote: Heat 21 is created but pending judge scores.`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeats20And21().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeats20And21 };

