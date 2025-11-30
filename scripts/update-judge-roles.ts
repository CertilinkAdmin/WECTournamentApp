
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);

async function updateJudgeRoles() {
  try {
    console.log('🔄 Starting judge role migration...');

    // First, check current state
    const currentRoles = await sql`
      SELECT DISTINCT role FROM heat_judges;
    `;
    console.log('Current roles in database:', currentRoles);

    // Update all TECHNICAL roles to SENSORY
    const updateResult = await sql`
      UPDATE heat_judges 
      SET role = 'SENSORY' 
      WHERE role = 'TECHNICAL';
    `;
    console.log('Updated TECHNICAL roles to SENSORY:', updateResult);

    // Now try to recreate the enum
    console.log('🔄 Recreating judge_role enum...');
    
    // Step 1: Rename current enum
    await sql`ALTER TYPE judge_role RENAME TO judge_role_old;`;
    
    // Step 2: Create new enum with only HEAD and SENSORY
    await sql`CREATE TYPE judge_role AS ENUM ('HEAD', 'SENSORY');`;
    
    // Step 3: Update table to use new enum
    await sql`
      ALTER TABLE heat_judges 
      ALTER COLUMN role TYPE judge_role 
      USING role::text::judge_role;
    `;
    
    // Step 4: Drop old enum
    await sql`DROP TYPE judge_role_old;`;
    
    console.log('✅ Judge role migration completed successfully!');

    // Verify final state
    const finalRoles = await sql`
      SELECT DISTINCT role FROM heat_judges;
    `;
    console.log('Final roles in database:', finalRoles);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

updateJudgeRoles();
