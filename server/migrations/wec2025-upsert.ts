import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { 
  users, 
  tournaments, 
  tournamentParticipants, 
  matches, 
  heatJudges, 
  heatScores,
  stations 
} from '../../shared/schema';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function migrateWEC2025Data() {
  try {
    console.log('🏆 Starting WEC 2025 Milano tournament data migration...');

    // 1. Create tournament
    console.log('📝 Creating tournament...');
    const [tournament] = await db.insert(tournaments).values({
      name: "World Espresso Championships 2025 Milano",
      status: "COMPLETED",
      startDate: new Date("2025-01-15T08:00:00Z"),
      endDate: new Date("2025-01-17T18:00:00Z"),
      totalRounds: 5,
      currentRound: 5
    }).returning();
    console.log(`✅ Tournament created with ID: ${tournament.id}`);

    // 2. Get or create users
    console.log('👥 Getting/creating users...');
    const competitors = [
      { name: "Stevo", code: "M7" },
      { name: "Edwin", code: "K9" },
      { name: "Kirill", code: "F5" },
      { name: "Anja", code: "X1" },
      { name: "Jae", code: "L4" },
      { name: "Carlos", code: "C6" },
      { name: "Penny", code: "S5" },
      { name: "Erland", code: "W6" },
      { name: "Felix", code: "V4" },
      { name: "Aga", code: "J1" },
      { name: "Artur", code: "G2" },
      { name: "Julian", code: "W8" },
      { name: "Faiz", code: "Q5" },
      { name: "Christos", code: "B1" },
      { name: "Danielle", code: "J7" },
      { name: "Hojat", code: "K5" },
      { name: "Bill", code: "M1" },
      { name: "Engi", code: "E3" }
    ];

    const judges = [
      { name: "Jasper", role: "HEAD" as const },
      { name: "Korn", role: "TECHNICAL" as const },
      { name: "Michalis", role: "SENSORY" as const },
      { name: "Shinsaku", role: "TECHNICAL" as const },
      { name: "Ali", role: "SENSORY" as const },
      { name: "Junior", role: "TECHNICAL" as const },
      { name: "Tess", role: "SENSORY" as const },
      { name: "Boss", role: "HEAD" as const }
    ];

    const userMap = new Map<string, number>();

    // Get or create competitors
    for (const competitor of competitors) {
      const email = `${competitor.name.toLowerCase().replace(/\s+/g, '')}@wec2025.com`;
      let existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (existingUser.length === 0) {
        const [createdUser] = await db.insert(users).values({
          name: competitor.name,
          email: email,
          role: 'BARISTA'
        }).returning();
        userMap.set(competitor.name, createdUser.id);
        console.log(`✅ Created competitor: ${competitor.name} (ID: ${createdUser.id})`);
      } else {
        userMap.set(competitor.name, existingUser[0].id);
        console.log(`✅ Found existing competitor: ${competitor.name} (ID: ${existingUser[0].id})`);
      }
    }

    // Get or create judges
    for (const judge of judges) {
      const email = `${judge.name.toLowerCase().replace(/\s+/g, '')}@wec2025.com`;
      let existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (existingUser.length === 0) {
        const [createdUser] = await db.insert(users).values({
          name: judge.name,
          email: email,
          role: 'JUDGE'
        }).returning();
        userMap.set(judge.name, createdUser.id);
        console.log(`✅ Created judge: ${judge.name} (ID: ${createdUser.id})`);
      } else {
        userMap.set(judge.name, existingUser[0].id);
        console.log(`✅ Found existing judge: ${judge.name} (ID: ${existingUser[0].id})`);
      }
    }

    // 3. Create tournament participants
    console.log('🎯 Creating tournament participants...');
    for (let i = 0; i < competitors.length; i++) {
      await db.insert(tournamentParticipants).values({
        tournamentId: tournament.id,
        userId: userMap.get(competitors[i].name)!,
        seed: i + 1,
        finalRank: competitors[i].name === 'Aga' ? 1 : null // Aga is the champion
      });
    }
    console.log('✅ Tournament participants created');

    // 4. Create stations
    console.log('🏢 Creating stations...');
    const [station] = await db.insert(stations).values({
      name: "Main Stage",
      location: "WEC 2025 Milano",
      status: "AVAILABLE"
    }).returning();
    console.log('✅ Station created');

    // 5. Create key matches with actual scores
    console.log('⚔️ Creating key matches...');
    
    // Heat 12: Stevo vs Edwin
    const [heat12] = await db.insert(matches).values({
      tournamentId: tournament.id,
      round: 2,
      heatNumber: 12,
      stationId: station.id,
      status: 'DONE',
      competitor1Id: userMap.get('Stevo'),
      competitor2Id: userMap.get('Edwin'),
      winnerId: userMap.get('Stevo'),
      startTime: new Date(),
      endTime: new Date()
    }).returning();

    // Add judges and scores for Heat 12
    await db.insert(heatJudges).values([
      { matchId: heat12.id, judgeId: userMap.get('Jasper')!, role: 'HEAD' },
      { matchId: heat12.id, judgeId: userMap.get('Korn')!, role: 'TECHNICAL' },
      { matchId: heat12.id, judgeId: userMap.get('Michalis')!, role: 'SENSORY' }
    ]);

    // Stevo's scores (28 points total)
    await db.insert(heatScores).values([
      { matchId: heat12.id, judgeId: userMap.get('Jasper')!, competitorId: userMap.get('Stevo')!, segment: 'DIAL_IN', score: 11 }, // 3+1+1+1+5
      { matchId: heat12.id, judgeId: userMap.get('Korn')!, competitorId: userMap.get('Stevo')!, segment: 'DIAL_IN', score: 0 },
      { matchId: heat12.id, judgeId: userMap.get('Michalis')!, competitorId: userMap.get('Stevo')!, segment: 'DIAL_IN', score: 10 } // 3+1+1+0+5
    ]);

    // Edwin's scores (5 points total)
    await db.insert(heatScores).values([
      { matchId: heat12.id, judgeId: userMap.get('Jasper')!, competitorId: userMap.get('Edwin')!, segment: 'DIAL_IN', score: 0 },
      { matchId: heat12.id, judgeId: userMap.get('Korn')!, competitorId: userMap.get('Edwin')!, segment: 'DIAL_IN', score: 11 }, // 3+1+1+1+5
      { matchId: heat12.id, judgeId: userMap.get('Michalis')!, competitorId: userMap.get('Edwin')!, segment: 'DIAL_IN', score: 1 } // 0+0+0+1+0
    ]);

    // Heat 13: Kirill vs Anja
    const [heat13] = await db.insert(matches).values({
      tournamentId: tournament.id,
      round: 2,
      heatNumber: 13,
      stationId: station.id,
      status: 'DONE',
      competitor1Id: userMap.get('Kirill'),
      competitor2Id: userMap.get('Anja'),
      winnerId: userMap.get('Kirill'),
      startTime: new Date(),
      endTime: new Date()
    }).returning();

    // Add judges and scores for Heat 13
    await db.insert(heatJudges).values([
      { matchId: heat13.id, judgeId: userMap.get('Shinsaku')!, role: 'TECHNICAL' },
      { matchId: heat13.id, judgeId: userMap.get('Ali')!, role: 'SENSORY' },
      { matchId: heat13.id, judgeId: userMap.get('Junior')!, role: 'TECHNICAL' }
    ]);

    // Kirill's scores (24 points total)
    await db.insert(heatScores).values([
      { matchId: heat13.id, judgeId: userMap.get('Shinsaku')!, competitorId: userMap.get('Kirill')!, segment: 'DIAL_IN', score: 11 }, // 3+1+1+1+5
      { matchId: heat13.id, judgeId: userMap.get('Ali')!, competitorId: userMap.get('Kirill')!, segment: 'DIAL_IN', score: 0 },
      { matchId: heat13.id, judgeId: userMap.get('Junior')!, competitorId: userMap.get('Kirill')!, segment: 'DIAL_IN', score: 11 } // 3+1+1+1+5
    ]);

    // Anja's scores (9 points total)
    await db.insert(heatScores).values([
      { matchId: heat13.id, judgeId: userMap.get('Shinsaku')!, competitorId: userMap.get('Anja')!, segment: 'DIAL_IN', score: 0 },
      { matchId: heat13.id, judgeId: userMap.get('Ali')!, competitorId: userMap.get('Anja')!, segment: 'DIAL_IN', score: 11 }, // 3+1+1+1+5
      { matchId: heat13.id, judgeId: userMap.get('Junior')!, competitorId: userMap.get('Anja')!, segment: 'DIAL_IN', score: 0 }
    ]);

    // Final Heat 31: Aga vs Jae (Championship)
    const [heat31] = await db.insert(matches).values({
      tournamentId: tournament.id,
      round: 5,
      heatNumber: 31,
      stationId: station.id,
      status: 'DONE',
      competitor1Id: userMap.get('Aga'),
      competitor2Id: userMap.get('Jae'),
      winnerId: userMap.get('Aga'),
      startTime: new Date(),
      endTime: new Date()
    }).returning();

    // Add judges and scores for Heat 31
    await db.insert(heatJudges).values([
      { matchId: heat31.id, judgeId: userMap.get('Shinsaku')!, role: 'TECHNICAL' },
      { matchId: heat31.id, judgeId: userMap.get('Korn')!, role: 'TECHNICAL' },
      { matchId: heat31.id, judgeId: userMap.get('Boss')!, role: 'HEAD' }
    ]);

    // Aga's scores (19 points total) - Champion
    await db.insert(heatScores).values([
      { matchId: heat31.id, judgeId: userMap.get('Shinsaku')!, competitorId: userMap.get('Aga')!, segment: 'DIAL_IN', score: 0 },
      { matchId: heat31.id, judgeId: userMap.get('Korn')!, competitorId: userMap.get('Aga')!, segment: 'DIAL_IN', score: 1 }, // 0+1+0+0+0
      { matchId: heat31.id, judgeId: userMap.get('Boss')!, competitorId: userMap.get('Aga')!, segment: 'DIAL_IN', score: 2 } // 0+1+1+0+0
    ]);

    // Jae's scores (14 points total)
    await db.insert(heatScores).values([
      { matchId: heat31.id, judgeId: userMap.get('Shinsaku')!, competitorId: userMap.get('Jae')!, segment: 'DIAL_IN', score: 11 }, // 3+1+1+1+5
      { matchId: heat31.id, judgeId: userMap.get('Korn')!, competitorId: userMap.get('Jae')!, segment: 'DIAL_IN', score: 11 }, // 3+1+1+1+5
      { matchId: heat31.id, judgeId: userMap.get('Boss')!, competitorId: userMap.get('Jae')!, segment: 'DIAL_IN', score: 11 } // 3+1+1+1+5
    ]);

    console.log('🎉 WEC 2025 Milano tournament data migration completed successfully!');
    console.log(`📊 Tournament ID: ${tournament.id}`);
    console.log(`👥 Total users: ${competitors.length + judges.length}`);
    console.log(`⚔️ Key heats created: Heat 12, 13, and 31 (Championship)`);
    console.log(`🏆 Champion: Aga`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateWEC2025Data().catch(console.error);
}

export { migrateWEC2025Data };
