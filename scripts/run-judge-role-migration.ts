import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function runJudgeRoleMigration() {
  try {
    console.log('🔄 Starting judge_role enum migration...');
    
    // Step 1: Check current enum values
    const currentEnumValues = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'judge_role')
      ORDER BY enumsortorder;
    `;
    console.log('Current judge_role enum values:', currentEnumValues.map((v: any) => v.enumlabel));
    
    // Check if migration is already done
    const hasTechnical = currentEnumValues.some((v: any) => v.enumlabel === 'TECHNICAL');
    const hasHead = currentEnumValues.some((v: any) => v.enumlabel === 'HEAD');
    const hasSensory = currentEnumValues.some((v: any) => v.enumlabel === 'SENSORY');
    
    if (!hasTechnical && hasHead && hasSensory) {
      console.log('✅ Enum already has correct values (HEAD, SENSORY). Migration not needed.');
      await sql.end();
      return;
    }
    
    // Step 2: Update all TECHNICAL records to SENSORY (using text cast to avoid enum validation)
    console.log('📝 Updating TECHNICAL roles to SENSORY...');
    try {
      const updateResult = await sql`
        UPDATE heat_judges 
        SET role = 'SENSORY'::text::judge_role
        WHERE role::text = 'TECHNICAL';
      `;
      console.log('✅ Updated TECHNICAL roles to SENSORY');
    } catch (error: any) {
      // If there are no TECHNICAL records, that's fine
      if (error.message.includes('TECHNICAL')) {
        console.log('⚠️  No TECHNICAL records found to update (may already be updated)');
      } else {
        throw error;
      }
    }
    
    // Step 3: Rename current enum
    console.log('📝 Renaming judge_role enum...');
    try {
      await sql`ALTER TYPE judge_role RENAME TO judge_role_old;`;
      console.log('✅ Enum renamed to judge_role_old');
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  judge_role_old already exists or enum was already renamed');
      } else {
        throw error;
      }
    }
    
    // Step 4: Create new enum with only HEAD and SENSORY
    console.log('📝 Creating new judge_role enum...');
    try {
      await sql`CREATE TYPE judge_role AS ENUM ('HEAD', 'SENSORY');`;
      console.log('✅ New enum created');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  New enum already exists');
      } else {
        throw error;
      }
    }
    
    // Step 5: Update table to use new enum
    console.log('📝 Updating heat_judges table to use new enum...');
    await sql`
      ALTER TABLE heat_judges 
      ALTER COLUMN role TYPE judge_role 
      USING role::text::judge_role;
    `;
    console.log('✅ Table updated to use new enum');
    
    // Step 6: Drop old enum
    console.log('📝 Dropping old enum...');
    try {
      await sql`DROP TYPE judge_role_old;`;
      console.log('✅ Old enum dropped');
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  judge_role_old does not exist (may have been dropped already)');
      } else {
        throw error;
      }
    }
    
    // Verify final state
    const finalEnumValues = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'judge_role')
      ORDER BY enumsortorder;
    `;
    console.log('✅ Final judge_role enum values:', finalEnumValues.map((v: any) => v.enumlabel));
    
    // Check for any remaining TECHNICAL roles (should be 0)
    const technicalCount = await sql`
      SELECT COUNT(*) as count 
      FROM heat_judges 
      WHERE role::text = 'TECHNICAL';
    `;
    console.log('Remaining TECHNICAL roles:', technicalCount[0]?.count || 0);
    
    console.log('✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runJudgeRoleMigration().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { runJudgeRoleMigration };
