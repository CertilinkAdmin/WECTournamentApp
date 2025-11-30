import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);

async function updateJudgeRolesToCappuccino() {
  try {
    console.log('🔄 Starting judge_role enum migration (SENSORY → CAPPUCCINO)...');

    // Check current enum values
    const enumValuesResult = await sql`
      SELECT enum_range(NULL::judge_role);
    `;
    const currentEnumValues = enumValuesResult[0].enum_range.replace(/[{}]/g, '').split(',');
    console.log('Current judge_role enum values:', currentEnumValues);

    if (currentEnumValues.includes('SENSORY')) {
      console.log('SENSORY role found in enum. Proceeding with migration...');

      // Step 1: Rename current enum
      await sql`ALTER TYPE judge_role RENAME TO judge_role_old;`;
      console.log('Renamed judge_role enum to judge_role_old');
      
      // Step 2: Create new enum with CAPPUCCINO and ESPRESSO
      await sql`CREATE TYPE judge_role AS ENUM ('ESPRESSO', 'CAPPUCCINO');`;
      console.log('Created new judge_role enum with ESPRESSO and CAPPUCCINO');
      
      // Step 3: Update table to use new enum, converting SENSORY to CAPPUCCINO
      await sql`
        ALTER TABLE heat_judges 
        ALTER COLUMN role TYPE judge_role 
        USING CASE 
          WHEN role::text = 'SENSORY' THEN 'CAPPUCCINO'::judge_role
          WHEN role::text = 'ESPRESSO' THEN 'ESPRESSO'::judge_role
          ELSE 'ESPRESSO'::judge_role
        END;
      `;
      console.log('Updated heat_judges table to use new enum (SENSORY → CAPPUCCINO)');
      
      // Step 4: Drop old enum
      await sql`DROP TYPE judge_role_old;`;
      console.log('Dropped old judge_role_old enum');
      
      console.log('✅ Judge role migration completed successfully!');
    } else if (currentEnumValues.includes('CAPPUCCINO')) {
      console.log('✅ Enum already has CAPPUCCINO. Migration not needed.');
    } else {
      console.log('⚠️  Unexpected enum values:', currentEnumValues);
    }

    // Verify final state
    const finalEnumValuesResult = await sql`
      SELECT enum_range(NULL::judge_role);
    `;
    const finalEnumValues = finalEnumValuesResult[0].enum_range.replace(/[{}]/g, '').split(',');
    console.log('Final judge_role enum values:', finalEnumValues);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

updateJudgeRolesToCappuccino();

