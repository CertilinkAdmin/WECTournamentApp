import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

interface HeatData {
  heatNumber: number;
  competitor1Name: string;
  competitor2Name: string | null; // null for BYE
}

const heats: HeatData[] = [
  { heatNumber: 1, competitor1Name: 'Penny', competitor2Name: null }, // BYE
  { heatNumber: 2, competitor1Name: 'Erland', competitor2Name: null }, // BYE
  { heatNumber: 3, competitor1Name: 'Felix', competitor2Name: null }, // BYE
  { heatNumber: 4, competitor1Name: 'Aga', competitor2Name: null }, // BYE
  { heatNumber: 5, competitor1Name: 'Julian', competitor2Name: null }, // BYE
  { heatNumber: 6, competitor1Name: 'Artur', competitor2Name: null }, // BYE
  { heatNumber: 7, competitor1Name: 'Hojat', competitor2Name: null }, // BYE
  { heatNumber: 8, competitor1Name: 'SCRATCHED', competitor2Name: null }, // BYE
  { heatNumber: 9, competitor1Name: 'Faiz', competitor2Name: null }, // BYE
  { heatNumber: 10, competitor1Name: 'Christos', competitor2Name: null }, // BYE
  { heatNumber: 11, competitor1Name: 'Danielle', competitor2Name: null }, // BYE (note: CSV has "Danielle" but user wrote "Daniele")
];

async function createRound1Heats() {
  try {
    console.log('🏆 Creating Round 1 Heats (1-11)...\n');

    // Check which schema we're using and find/create tournament
    let usingNewSchema = false;
    let tournamentId: string | number;
    
    // First check what columns tournaments table has
    const tableInfo = await sql`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'tournaments'
      ORDER BY ordinal_position
    `;
    
    const hasLocation = tableInfo.some((r: any) => r.column_name === 'location');
    const hasYear = tableInfo.some((r: any) => r.column_name === 'year');
    const idType = tableInfo.find((r: any) => r.column_name === 'id')?.data_type;
    
    console.log(`Tournament table structure: id type=${idType}, has location=${hasLocation}, has year=${hasYear}\n`);
    
    if (idType === 'text') {
      usingNewSchema = true;
    }
    
    // Try to find existing tournament
    let tournaments: any[];
    if (usingNewSchema) {
      tournaments = await sql`
        SELECT id FROM tournaments 
        WHERE id = 'WEC2025' OR name LIKE '%WEC%2025%' OR name LIKE '%World Espresso%2025%'
        LIMIT 1
      `;
    } else {
      tournaments = await sql`
        SELECT id FROM tournaments 
        WHERE name LIKE '%WEC%2025%' OR name LIKE '%World Espresso%2025%'
        LIMIT 1
      `;
    }
    
    if (tournaments.length > 0) {
      tournamentId = tournaments[0].id;
      console.log(`✅ Found tournament: ${tournamentId}\n`);
    } else {
      // Create tournament
      console.log('📝 Creating WEC2025 tournament...');
      if (usingNewSchema && hasLocation && hasYear) {
        const [newTournament] = await sql`
          INSERT INTO tournaments (id, name, location, year, status, total_rounds, current_round, created_at, updated_at)
          VALUES ('WEC2025', 'World Espresso Championships 2025', 'WEC', 2025, 'SETUP', 5, 1, NOW(), NOW())
          RETURNING id
        `;
        tournamentId = newTournament.id;
        console.log(`✅ Created tournament: ${tournamentId}\n`);
      } else {
        // Old schema (integer ID)
        const [newTournament] = await sql`
          INSERT INTO tournaments (name, status, total_rounds, current_round, created_at, updated_at)
          VALUES ('World Espresso Championships 2025', 'SETUP', 5, 1, NOW(), NOW())
          RETURNING id
        `;
        tournamentId = newTournament.id;
        console.log(`✅ Created tournament (legacy): ${tournamentId}\n`);
      }
    }

    // Get user/person IDs for competitors
    const userMap = new Map<string, number>();
    
    for (const heat of heats) {
      if (heat.competitor1Name && heat.competitor1Name !== 'SCRATCHED') {
        // Try to find user by name (case insensitive, handle variations)
        const searchName = heat.competitor1Name.toLowerCase();
        let users: any[];
        
        try {
          users = await sql`
            SELECT id, name, email FROM users 
            WHERE LOWER(name) = ${searchName} 
            OR LOWER(name) LIKE ${`%${searchName}%`}
            OR LOWER(email) LIKE ${`%${searchName}%`}
            LIMIT 1
          `;
        } catch (e) {
          // Try persons table
          users = await sql`
            SELECT id, name, email FROM persons 
            WHERE LOWER(name) = ${searchName} 
            OR LOWER(name) LIKE ${`%${searchName}%`}
            OR LOWER(email) LIKE ${`%${searchName}%`}
            LIMIT 1
          `;
        }
        
        if (users.length > 0) {
          userMap.set(heat.competitor1Name, users[0].id);
          console.log(`✅ Found: ${heat.competitor1Name} (ID: ${users[0].id})`);
        } else {
          console.log(`⚠️  Not found: ${heat.competitor1Name}`);
        }
      }
    }

    // Handle "Danielle" vs "Daniele" - check both
    if (!userMap.has('Danielle') && !userMap.has('Daniele')) {
      const danielleUsers = await sql`
        SELECT id, name FROM users WHERE LOWER(name) LIKE 'dani%' LIMIT 1
      `;
      if (danielleUsers.length > 0) {
        userMap.set('Danielle', danielleUsers[0].id);
        console.log(`✅ Found Danielle variant: ${danielleUsers[0].name} (ID: ${danielleUsers[0].id})`);
      }
    }

    // Get or create stations (need at least one for matches)
    let stationId: number;
    
    // Check stations table structure
    const stationInfo = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'stations'
    `;
    const hasTournamentId = stationInfo.some((r: any) => r.column_name === 'tournament_id');
    
    const stations = await sql`SELECT id FROM stations LIMIT 1`;
    if (stations.length > 0) {
      stationId = stations[0].id;
      console.log(`✅ Using existing station: ${stationId}`);
    } else {
      // Create a default station
      if (hasTournamentId) {
        const [newStation] = await sql`
          INSERT INTO stations (tournament_id, name, status, next_available_at, created_at, updated_at)
          VALUES (${tournamentId}, 'Station A', 'AVAILABLE', NOW(), NOW(), NOW())
          RETURNING id
        `;
        stationId = newStation.id;
      } else {
        const [newStation] = await sql`
          INSERT INTO stations (name, status, next_available_at)
          VALUES ('Station A', 'AVAILABLE', NOW())
          RETURNING id
        `;
        stationId = newStation.id;
      }
      console.log(`✅ Created station: ${stationId}`);
    }

    // Create matches
    let created = 0;
    let skipped = 0;

    for (const heat of heats) {
      try {
        // Check if match already exists
        const existingMatches = await sql`
          SELECT id FROM matches 
          WHERE tournament_id = ${tournamentId} 
          AND round = 1 
          AND heat_number = ${heat.heatNumber}
          LIMIT 1
        `;

        if (existingMatches.length > 0) {
          console.log(`⏭️  Heat ${heat.heatNumber} already exists, skipping`);
          skipped++;
          continue;
        }

        const competitor1Id = heat.competitor1Name === 'SCRATCHED' 
          ? null 
          : userMap.get(heat.competitor1Name) || null;
        
        const competitor2Id = heat.competitor2Name === null || heat.competitor2Name === 'BYE'
          ? null
          : userMap.get(heat.competitor2Name) || null;

        // Check matches table structure to determine field names
        const matchColumns = await sql`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'matches'
          ORDER BY ordinal_position
        `;
        const columnNames = matchColumns.map((r: any) => r.column_name);
        
        let insertQuery: any;
        
        if (columnNames.includes('competitor1_registration_id')) {
          // New schema - need registrations, skip for now
          console.log(`⚠️  New schema detected - matches require registrations. Skipping heat ${heat.heatNumber} for now.`);
          skipped++;
          continue;
        } else {
          // Old schema - use competitor1_id, competitor2_id
          insertQuery = sql`
            INSERT INTO matches (tournament_id, round, heat_number, station_id, status, competitor1_id, competitor2_id, created_at, updated_at)
            VALUES (${tournamentId}, 1, ${heat.heatNumber}, ${stationId}, 'PENDING', ${competitor1Id}, ${competitor2Id}, NOW(), NOW())
            RETURNING id
          `;
        }

        const [match] = await insertQuery;
        console.log(`✅ Created Heat ${heat.heatNumber}: ${heat.competitor1Name} vs ${heat.competitor2Name || 'BYE'} (Match ID: ${match.id})`);
        created++;
      } catch (error: any) {
        console.error(`❌ Error creating heat ${heat.heatNumber}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`\n✅ Round 1 heats creation completed!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createRound1Heats().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createRound1Heats };

