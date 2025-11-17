import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function verifySchema() {
  try {
    console.log('🔍 Verifying schema...\n');
    
    // Check if persons table exists
    const personsCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'persons'
      );
    `;
    console.log(`✅ Persons table: ${personsCheck[0].exists ? 'EXISTS' : 'MISSING'}`);
    
    // Check if tournaments table exists
    const tournamentsCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tournaments'
      );
    `;
    console.log(`✅ Tournaments table: ${tournamentsCheck[0].exists ? 'EXISTS' : 'MISSING'}`);
    
    // Check if tournament_registrations table exists
    const registrationsCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tournament_registrations'
      );
    `;
    console.log(`✅ Tournament registrations table: ${registrationsCheck[0].exists ? 'EXISTS' : 'MISSING'}`);
    
    // Check enums
    const personRoleEnum = await sql`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'person_role'
      );
    `;
    console.log(`✅ person_role enum: ${personRoleEnum[0].exists ? 'EXISTS' : 'MISSING'}`);
    
    const verificationStatusEnum = await sql`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'verification_status'
      );
    `;
    console.log(`✅ verification_status enum: ${verificationStatusEnum[0].exists ? 'EXISTS' : 'MISSING'}`);
    
    // List all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('\n📊 All tables in database:');
    tables.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n✅ Schema verification complete!');
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  verifySchema().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { verifySchema };

