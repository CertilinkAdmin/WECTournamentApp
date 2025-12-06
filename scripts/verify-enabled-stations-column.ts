import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function verifyColumn() {
  try {
    const result = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tournaments' AND column_name = 'enabled_stations'
    `;
    
    if (result.length > 0) {
      console.log('✅ Column exists!');
      console.log('Column info:', result[0]);
      
      // Check existing tournaments
      const tournaments = await sql`
        SELECT id, name, enabled_stations 
        FROM tournaments 
        LIMIT 5
      `;
      
      console.log('\n📊 Sample tournaments with enabled_stations:');
      tournaments.forEach(t => {
        console.log(`  - ${t.name} (ID: ${t.id}): ${JSON.stringify(t.enabled_stations)}`);
      });
    } else {
      console.log('❌ Column does not exist!');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

verifyColumn().catch((error) => {
  console.error(error);
  process.exit(1);
});

