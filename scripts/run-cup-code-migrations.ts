import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function runMigrations() {
  try {
    const migrations = [
      '0005_add_match_cup_positions.sql',
      '0006_update_judge_detailed_scores_cup_codes.sql'
    ];

    for (const migrationFile of migrations) {
      console.log(`🔄 Running migration: ${migrationFile}`);
      
      const migrationPath = join(process.cwd(), 'migrations', migrationFile);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      
      try {
        await sql.unsafe(migrationSQL);
        console.log(`✅ Migration ${migrationFile} executed successfully!`);
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          console.log(`⚠️  Migration ${migrationFile} skipped (objects already exist)`);
        } else {
          console.error(`❌ Migration ${migrationFile} error:`, errorMsg);
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});

