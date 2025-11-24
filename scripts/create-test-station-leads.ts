import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import { users } from '../shared/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function createTestStationLeads() {
  try {
    console.log('👔 Creating 9 test station leads...\n');

    const stationLeads = [];
    for (let i = 1; i <= 9; i++) {
      // Check if station lead already exists
      const existing = await db.select().from(users)
        .where(and(
          eq(users.name, `Test Station Lead ${i}`),
          eq(users.role, 'STATION_LEAD')
        ))
        .limit(1);

      if (existing.length > 0) {
        console.log(`✅ Test Station Lead ${i} already exists (ID: ${existing[0].id})`);
        stationLeads.push(existing[0]);
      } else {
        const [stationLead] = await db.insert(users).values({
          name: `Test Station Lead ${i}`,
          email: `test-stationlead-${i}@test.com`,
          role: 'STATION_LEAD',
          approved: true
        }).returning();
        console.log(`✅ Created Test Station Lead ${i} (ID: ${stationLead.id})`);
        stationLeads.push(stationLead);
      }
    }

    console.log(`\n✅ Successfully created/verified ${stationLeads.length} test station leads`);
    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating test station leads:', error);
    await sql.end();
    process.exit(1);
  }
}

createTestStationLeads();

