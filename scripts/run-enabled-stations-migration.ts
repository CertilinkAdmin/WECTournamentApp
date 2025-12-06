import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function runMigration() {
  try {
    console.log('🔄 Running migration: 0010_add_enabled_stations_to_tournaments.sql');
    
    const migrationPath = join(process.cwd(), 'migrations', '0010_add_enabled_stations_to_tournaments.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Executing migration SQL...');
    
    try {
      await sql.unsafe(migrationSQL);
      console.log('✅ Migration SQL executed successfully!');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        console.log('⚠️  Migration skipped (column already exists)');
      } else {
        console.error('❌ Migration error:', errorMsg);
        throw error;
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration().catch((error) => {
  console.error(error);
  process.exit(1);
});

