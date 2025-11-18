import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import { db } from '../server/db';
import { persons, users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

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

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        // Skip rows without name or email
        if (!row.name || !row.email) {
          console.log(`⏭️  Skipping row (missing name/email): ${JSON.stringify(row)}`);
          skipped++;
          continue;
        }

        // Check which table exists - try persons first, fallback to users
        let existing: any[] = [];
        let tableToUse: 'persons' | 'users' = 'persons';
        
        try {
          existing = await db.select()
            .from(persons)
            .where(eq(persons.email, row.email))
            .limit(1);
        } catch (e) {
          // persons table doesn't exist, use users table
          tableToUse = 'users';
          existing = await db.select()
            .from(users)
            .where(eq(users.email, row.email))
            .limit(1);
        }

        if (existing.length > 0) {
          console.log(`✅ Person already exists: ${row.name} (${row.email})`);
          skipped++;
          continue;
        }

        // Insert into appropriate table
        let person: any;
        if (tableToUse === 'persons') {
          // Insert into persons table (no role/approved - those go in registrations)
          [person] = await db.insert(persons).values({
            name: row.name,
            email: row.email,
          }).returning();
        } else {
          // Insert into users table (legacy schema)
          [person] = await db.insert(users).values({
            name: row.name,
            email: row.email,
            role: row.role === 'JUDGE' ? 'JUDGE' : 'BARISTA',
            approved: row.approved === 'true',
          }).returning();
        }

        console.log(`✅ Created person: ${person.name} (ID: ${person.id}, Email: ${person.email})`);
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

