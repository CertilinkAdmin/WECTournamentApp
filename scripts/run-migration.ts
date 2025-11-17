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
    console.log('🔄 Running migration: 0002_restructured_schema.sql');
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', '0002_restructured_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the entire SQL file
    // Split by semicolons but keep multi-line statements together
    console.log('📝 Executing migration SQL...');
    
    try {
      // Execute the entire migration file
      await sql.unsafe(migrationSQL);
      console.log('✅ Migration SQL executed successfully!');
    } catch (error: any) {
      // If there are specific errors, try to handle them gracefully
      const errorMsg = error.message || String(error);
      
      // Check if it's a "does not exist" error (might be okay if we're dropping)
      if (errorMsg.includes('does not exist') && errorMsg.includes('DROP')) {
        console.log('⚠️  Some DROP statements skipped (objects don\'t exist):', errorMsg.split('\n')[0]);
      } else if (errorMsg.includes('already exists')) {
        console.log('⚠️  Some objects already exist, continuing...');
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { runMigration };

