import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function createHeat22() {
  try {
    console.log('🏆 Creating Heat 22: Stevo vs Daniele...\n');

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
      AND heat_number = 22
      LIMIT 1
    `;

    if (existing.length > 0) {
      console.log(`✅ Heat 22 already exists (ID: ${existing[0].id}), skipping...\n`);
    } else {
      // Create match (pending judge scores)
      const [match] = await sql`
        INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, created_at, updated_at)
        VALUES (${tournamentId}, 1, 22, ${stationId}, 'PENDING', ${stevoId}, ${danieleId}, NOW(), NOW())
        RETURNING id
      `;
      console.log(`✅ Created Heat 22: Stevo vs Daniele (Match ID: ${match.id}) - Pending judge scores\n`);
    }

    console.log(`✅ Heat 22 created successfully!`);
    console.log(`\nNote: Heat 22 is created but pending judge scores.`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createHeat22().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createHeat22 };

