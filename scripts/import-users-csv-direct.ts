import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

interface CSVRow {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  approved: string;
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.split(',').every(cell => !cell.trim())) {
      continue; // Skip empty rows
    }

    // Parse CSV line (handling quoted values)
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          j++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Add last value

    if (values.length >= headers.length && values[0]) {
      // Only process rows with data
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.replace(/^"|"$/g, '') || '';
      });
      rows.push(row as CSVRow);
    }
  }

  return rows;
}

async function importUsersCSV() {
  try {
    console.log('📥 Importing users from CSV...\n');

    // Read CSV file
    const csvPath = join(process.cwd(), 'users.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const rows = parseCSV(csvContent);
    console.log(`📊 Found ${rows.length} rows to process\n`);

    // Check which table exists
    let tableName = 'persons';
    try {
      await sql`SELECT 1 FROM persons LIMIT 1`;
      console.log('✅ Using persons table\n');
    } catch (e) {
      try {
        await sql`SELECT 1 FROM users LIMIT 1`;
        tableName = 'users';
        console.log('✅ Using users table (legacy schema)\n');
      } catch (e2) {
        throw new Error('Neither persons nor users table exists in database');
      }
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        // Skip rows without name or email
        if (!row.name || !row.email) {
          console.log(`⏭️  Skipping row (missing name/email): ${row.name || 'empty'}`);
          skipped++;
          continue;
        }

        // Check if person already exists by email
        let existing: any[];
        if (tableName === 'persons') {
          existing = await sql`SELECT id FROM persons WHERE email = ${row.email} LIMIT 1`;
        } else {
          existing = await sql`SELECT id FROM users WHERE email = ${row.email} LIMIT 1`;
        }

        if (existing.length > 0) {
          console.log(`✅ Person already exists: ${row.name} (${row.email})`);
          skipped++;
          continue;
        }

        // Insert into appropriate table
        if (tableName === 'persons') {
          await sql`
            INSERT INTO persons (name, email, created_at, updated_at)
            VALUES (${row.name}, ${row.email}, NOW(), NOW())
          `;
        } else {
          // Insert into users table (legacy schema with role/approved)
          const role = row.role === 'JUDGE' ? 'JUDGE' : 'BARISTA';
          const approved = row.approved === 'true';
          await sql`
            INSERT INTO users (name, email, role, approved, created_at)
            VALUES (${row.name}, ${row.email}, ${role}::user_role, ${approved}, NOW())
          `;
        }

        console.log(`✅ Created: ${row.name} (${row.email})`);
        created++;
      } catch (error: any) {
        console.error(`❌ Error importing ${row.name || 'unknown'}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✅ Import completed!`);

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importUsersCSV().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { importUsersCSV };

