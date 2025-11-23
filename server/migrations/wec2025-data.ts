
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';
import { 
  users, 
  tournaments, 
  tournamentParticipants, 
  matches, 
  heatJudges, 
  heatScores,
  judgeDetailedScores,
  stations 
} from '../../shared/schema';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sql = postgres(connectionString);
const db = drizzle(sql, { schema });

// Test Tournament Data
const WEC_2025_DATA = {
  tournament: {
    name: "Test Tournament 2025",
    status: "COMPLETED" as const,
    startDate: new Date("2025-01-15T08:00:00Z"),
    endDate: new Date("2025-01-17T18:00:00Z"),
    totalRounds: 5,
    currentRound: 5
  },
  
  competitors: [
    // WEC25 Tournament Competitors
    { name: "TEST BARISTA 1", code: "P1", seed: 1 },
    { name: "TEST BARISTA 2", code: "E2", seed: 2 },
    { name: "TEST BARISTA 3", code: "F3", seed: 3 },
    { name: "TEST BARISTA 4", code: "A4", seed: 4 },
    { name: "TEST BARISTA 5", code: "J5", seed: 5 },
    { name: "TEST BARISTA 6", code: "A6", seed: 6 },
    { name: "TEST BARISTA 7", code: "H7", seed: 7 },
    { name: "TEST BARISTA 8", code: "F9", seed: 8 },
    { name: "TEST BARISTA 9", code: "C10", seed: 9 },
    { name: "TEST BARISTA 10", code: "D11", seed: 10 },
    { name: "TEST BARISTA 11", code: "S12", seed: 11 },
    { name: "TEST BARISTA 12", code: "E12", seed: 12 },
    { name: "TEST BARISTA 13", code: "K13", seed: 13 },
    { name: "TEST BARISTA 14", code: "A13", seed: 14 },
    { name: "TEST BARISTA 15", code: "J14", seed: 15 },
    { name: "TEST BARISTA 16", code: "C14", seed: 16 },
    { name: "TEST BARISTA 17", code: "B15", seed: 17 },
    { name: "TEST BARISTA 18", code: "E16", seed: 18 }
  ],

  judges: [
    { name: "TEST JUDGE 1", role: "HEAD" as const },
    { name: "TEST JUDGE 2", role: "TECHNICAL" as const },
    { name: "TEST JUDGE 3", role: "SENSORY" as const },
    { name: "TEST JUDGE 4", role: "TECHNICAL" as const },
    { name: "TEST JUDGE 5", role: "SENSORY" as const },
    { name: "TEST JUDGE 6", role: "TECHNICAL" as const },
    { name: "TEST JUDGE 7", role: "SENSORY" as const },
    { name: "TEST JUDGE 8", role: "HEAD" as const }
  ],

  heats: [
    // Round 1 - Round of 32 (Heats 1-16)
    { heatNumber: 1, round: 1, competitor1: "TEST BARISTA 1", competitor2: "BYE", winner: "TEST BARISTA 1", points1: 33, points2: 0 },
    { heatNumber: 2, round: 1, competitor1: "TEST BARISTA 2", competitor2: "BYE", winner: "TEST BARISTA 2", points1: 33, points2: 0 },
    { heatNumber: 3, round: 1, competitor1: "TEST BARISTA 3", competitor2: "BYE", winner: "TEST BARISTA 3", points1: 33, points2: 0 },
    { heatNumber: 4, round: 1, competitor1: "TEST BARISTA 4", competitor2: "BYE", winner: "TEST BARISTA 4", points1: 33, points2: 0 },
    { heatNumber: 5, round: 1, competitor1: "TEST BARISTA 5", competitor2: "BYE", winner: "TEST BARISTA 5", points1: 33, points2: 0 },
    { heatNumber: 6, round: 1, competitor1: "TEST BARISTA 6", competitor2: "BYE", winner: "TEST BARISTA 6", points1: 33, points2: 0 },
    { heatNumber: 7, round: 1, competitor1: "TEST BARISTA 7", competitor2: "BYE", winner: "TEST BARISTA 7", points1: 33, points2: 0 },
    { heatNumber: 8, round: 1, competitor1: "SCRATCHED", competitor2: "BYE", winner: "BYE", points1: 0, points2: 33 },
    { heatNumber: 9, round: 1, competitor1: "TEST BARISTA 8", competitor2: "BYE", winner: "TEST BARISTA 8", points1: 33, points2: 0 },
    { heatNumber: 10, round: 1, competitor1: "TEST BARISTA 9", competitor2: "BYE", winner: "TEST BARISTA 9", points1: 33, points2: 0 },
    { heatNumber: 11, round: 1, competitor1: "TEST BARISTA 10", competitor2: "BYE", winner: "TEST BARISTA 10", points1: 33, points2: 0 },
    
    { 
      heatNumber: 12, 
      round: 1, 
      competitor1: "TEST BARISTA 11", 
      competitor2: "TEST BARISTA 12", 
      winner: "TEST BARISTA 11", 
      points1: 28, 
      points2: 5,
      judgeScores: [
        { judge: "TEST JUDGE 1", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 2", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 3", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 13, 
      round: 1, 
      competitor1: "TEST BARISTA 13", 
      competitor2: "TEST BARISTA 14", 
      winner: "TEST BARISTA 13", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 5", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 14, 
      round: 1, 
      competitor1: "TEST BARISTA 15", 
      competitor2: "TEST BARISTA 16", 
      winner: "TEST BARISTA 15", 
      points1: 28, 
      points2: 5,
      judgeScores: [
        { judge: "TEST JUDGE 3", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 1", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 2", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { heatNumber: 15, round: 1, competitor1: "TEST BARISTA 17", competitor2: "BYE", winner: "TEST BARISTA 17", points1: 33, points2: 0 },
    { heatNumber: 16, round: 1, competitor1: "TEST BARISTA 18", competitor2: "BYE", winner: "TEST BARISTA 18", points1: 33, points2: 0 },
    
    // Round 2 - Round of 16 (Heats 17-24)
    { 
      heatNumber: 17, 
      round: 2, 
      competitor1: "TEST BARISTA 1", 
      competitor2: "TEST BARISTA 2", 
      winner: "TEST BARISTA 1", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "TEST JUDGE 3", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 1", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 7", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 18, 
      round: 2, 
      competitor1: "TEST BARISTA 4", 
      competitor2: "TEST BARISTA 3", 
      winner: "TEST BARISTA 4", 
      points1: 31, 
      points2: 2,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 5", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 19, 
      round: 2, 
      competitor1: "TEST BARISTA 6", 
      competitor2: "TEST BARISTA 5", 
      winner: "TEST BARISTA 6", 
      points1: 2, 
      points2: 9,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 3 } },
        { judge: "TEST JUDGE 7", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 2 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 2, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 1, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { heatNumber: 20, round: 2, competitor1: "TEST BARISTA 10", competitor2: "BYE", winner: "TEST BARISTA 10", points1: null, points2: null },
    { 
      heatNumber: 21, 
      round: 2, 
      competitor1: "TEST BARISTA 9", 
      competitor2: "TEST BARISTA 8", 
      winner: "TEST BARISTA 9", 
      points1: 25, 
      points2: 8,
      judgeScores: [
        { judge: "TEST JUDGE 3", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 5", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 1", competitor1: { visual: 2, taste: 0, tactile: 0, flavour: 0, overall: 3 }, competitor2: { visual: 1, taste: 1, tactile: 1, flavour: 1, overall: 4 } }
      ]
    },
    { 
      heatNumber: 22, 
      round: 2, 
      competitor1: "TEST BARISTA 11", 
      competitor2: "TEST BARISTA 10", 
      winner: "TEST BARISTA 11", 
      points1: 19, 
      points2: 14,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 7", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 2, taste: 0, tactile: 0, flavour: 0, overall: 2 }, competitor2: { visual: 1, taste: 1, tactile: 1, flavour: 1, overall: 4 } }
      ]
    },
    { 
      heatNumber: 23, 
      round: 2, 
      competitor1: "TEST BARISTA 15", 
      competitor2: "TEST BARISTA 13", 
      winner: "TEST BARISTA 15", 
      points1: 27, 
      points2: 6,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 7", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 4 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 2 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 3 }, competitor2: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 1 } }
      ]
    },
    { 
      heatNumber: 24, 
      round: 2, 
      competitor1: "TEST BARISTA 18", 
      competitor2: "TEST BARISTA 17", 
      winner: "TEST BARISTA 18", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "TEST JUDGE 3", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 5", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 1", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 3 } }
      ]
    },

    // Round 3 - Quarterfinals (Heats 25-28)
    { 
      heatNumber: 25, 
      round: 3, 
      competitor1: "TEST BARISTA 4", 
      competitor2: "TEST BARISTA 1", 
      winner: "TEST BARISTA 4", 
      points1: 25, 
      points2: 8,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 7", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 3 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 2 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 2, taste: 0, tactile: 0, flavour: 0, overall: 2 }, competitor2: { visual: 1, taste: 1, tactile: 1, flavour: 1, overall: 2 } }
      ]
    },
    { 
      heatNumber: 26, 
      round: 3, 
      competitor1: "TEST BARISTA 6", 
      competitor2: "TEST BARISTA 7", 
      winner: "TEST BARISTA 6", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "TEST JUDGE 3", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 2", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 3 } }
      ]
    },
    { 
      heatNumber: 27, 
      round: 3, 
      competitor1: "TEST BARISTA 9", 
      competitor2: "TEST BARISTA 11", 
      winner: "TEST BARISTA 9", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 2", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 3 } }
      ]
    },
    { 
      heatNumber: 28, 
      round: 3, 
      competitor1: "TEST BARISTA 15", 
      competitor2: "TEST BARISTA 18", 
      winner: "TEST BARISTA 15", 
      points1: 23, 
      points2: 10,
      judgeScores: [
        { judge: "TEST JUDGE 3", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 7", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 3 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 2 } },
        { judge: "TEST JUDGE 6", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 2 } }
      ]
    },

    // Round 4 - Semifinals (Heats 29-30)
    { 
      heatNumber: 29, 
      round: 4, 
      competitor1: "TEST BARISTA 4", 
      competitor2: "TEST BARISTA 6", 
      winner: "TEST BARISTA 4", 
      points1: 25, 
      points2: 8,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 2", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 8", competitor1: { visual: 2, taste: 0, tactile: 0, flavour: 0, overall: 3 }, competitor2: { visual: 1, taste: 1, tactile: 1, flavour: 1, overall: 4 } }
      ]
    },
    { 
      heatNumber: 30, 
      round: 4, 
      competitor1: "TEST BARISTA 15", 
      competitor2: "TEST BARISTA 9", 
      winner: "TEST BARISTA 15", 
      points1: 19, 
      points2: 14,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 2", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "TEST JUDGE 8", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 4 } }
      ]
    },

    // Final (Heat 31)
    { 
      heatNumber: 31, 
      round: 5, 
      competitor1: "TEST BARISTA 4", 
      competitor2: "TEST BARISTA 15", 
      winner: "TEST BARISTA 4", 
      points1: 19, 
      points2: 14,
      judgeScores: [
        { judge: "TEST JUDGE 4", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "TEST JUDGE 2", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "TEST JUDGE 8", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    }
  ]
};

async function migrateWEC2025Data() {
  try {
    console.log('🏆 Starting WEC 2025 Milano tournament data migration...');

    // 1. Create tournament
    console.log('📝 Creating tournament...');
    const [tournament] = await db.insert(tournaments).values(WEC_2025_DATA.tournament).returning();
    console.log(`✅ Tournament created with ID: ${tournament.id}`);

    // 2. Create or get existing users (competitors and judges)
    console.log('👥 Creating/getting users...');
    const allUsers = [...WEC_2025_DATA.competitors, ...WEC_2025_DATA.judges];
    const userMap = new Map<string, number>();
    
    for (const user of allUsers) {
      const email = `${user.name.toLowerCase().replace(/\s+/g, '')}@wec2025.com`;
      const role = 'role' in user ? 'JUDGE' : 'BARISTA';
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email)
      });
      
      if (existingUser) {
        userMap.set(user.name, existingUser.id);
        console.log(`✅ Found existing user: ${user.name} (ID: ${existingUser.id})`);
      } else {
        const [createdUser] = await db.insert(users).values({
          name: user.name,
          email,
          role
        }).returning();
        userMap.set(user.name, createdUser.id);
        console.log(`✅ Created user: ${user.name} (ID: ${createdUser.id})`);
      }
    }

    // 3. Create tournament participants
    console.log('🎯 Creating tournament participants...');
    for (const competitor of WEC_2025_DATA.competitors) {
      await db.insert(tournamentParticipants).values({
        tournamentId: tournament.id,
        userId: userMap.get(competitor.name)!,
        seed: competitor.seed,
        finalRank: competitor.name === 'TEST BARISTA 4' ? 1 : competitor.name === 'TEST BARISTA 15' ? 2 : null
      });
    }
    console.log('✅ Tournament participants created');

    // 4. Get or create stations
    console.log('🏢 Getting stations...');
    const existingStations = await db.select().from(stations).limit(1);
    const stationMap = new Map<number, number>();
    
    if (existingStations.length > 0) {
      // Use first existing station for all matches
      stationMap.set(1, existingStations[0].id);
      console.log(`✅ Using existing station: ${existingStations[0].name} (ID: ${existingStations[0].id})`);
    } else {
      // Create a single station if none exist
      const [createdStation] = await db.insert(stations).values({
        name: "Station A",
        location: "Main Stage"
      }).returning();
      stationMap.set(1, createdStation.id);
      console.log(`✅ Created station: Station A (ID: ${createdStation.id})`);
    }

    // 5. Create matches and scores
    console.log('⚔️ Creating matches and scores...');
    for (const heat of WEC_2025_DATA.heats) {
      const competitor1Id = userMap.get(heat.competitor1);
      const competitor2Id = heat.competitor2 === 'BYE' ? null : userMap.get(heat.competitor2);
      const winnerId = userMap.get(heat.winner);

      // Create match
      const [match] = await db.insert(matches).values({
        tournamentId: tournament.id,
        round: heat.round,
        heatNumber: heat.heatNumber,
        stationId: stationMap.get(1),
        status: 'DONE',
        competitor1Id,
        competitor2Id,
        winnerId,
        startTime: new Date(),
        endTime: new Date()
      }).returning();

      // Handle BYE matches - no scoring, just advance
      if (heat.competitor2 === 'BYE' && competitor1Id) {
        console.log(`✅ BYE Heat ${heat.heatNumber} - ${heat.competitor1} advances`);
        continue;
      }
      
      // Handle competition heats with judge scores
      if (heat.judgeScores) {
        for (const judgeScore of heat.judgeScores) {
          const judgeId = userMap.get(judgeScore.judge);
          if (judgeId) {
            await db.insert(heatJudges).values({
              matchId: match.id,
              judgeId,
              role: 'TECHNICAL' // Default role, would need to be mapped properly
            });
          }
        }

        // Add aggregate scores
        for (const judgeScore of heat.judgeScores) {
          const judgeId = userMap.get(judgeScore.judge);
          if (judgeId && competitor1Id) {
            // Competitor 1 scores
            await db.insert(heatScores).values({
              matchId: match.id,
              judgeId,
              competitorId: competitor1Id,
              segment: 'DIAL_IN',
              score: judgeScore.competitor1.visual + judgeScore.competitor1.taste + judgeScore.competitor1.tactile + judgeScore.competitor1.flavour + judgeScore.competitor1.overall
            });
          }
          if (judgeId && competitor2Id) {
            // Competitor 2 scores
            await db.insert(heatScores).values({
              matchId: match.id,
              judgeId,
              competitorId: competitor2Id,
              segment: 'DIAL_IN',
              score: judgeScore.competitor2.visual + judgeScore.competitor2.taste + judgeScore.competitor2.tactile + judgeScore.competitor2.flavour + judgeScore.competitor2.overall
            });
          }
        }
        
        // Add detailed scores with cup codes
        const comp1CupCode = heat.competitor1.substring(0, 2).toUpperCase();
        const comp2CupCode = heat.competitor2.substring(0, 2).toUpperCase();
        
        for (const judgeScore of heat.judgeScores) {
          // Determine which side won each category for detailed scoring
          const visualWinner = judgeScore.competitor1.visual > judgeScore.competitor2.visual ? 'left' : 'right';
          const tasteWinner = judgeScore.competitor1.taste > judgeScore.competitor2.taste ? 'left' : 'right';
          const tactileWinner = judgeScore.competitor1.tactile > judgeScore.competitor2.tactile ? 'left' : 'right';
          const flavourWinner = judgeScore.competitor1.flavour > judgeScore.competitor2.flavour ? 'left' : 'right';
          const overallWinner = judgeScore.competitor1.overall > judgeScore.competitor2.overall ? 'left' : 'right';
          
          await db.insert(judgeDetailedScores).values({
            matchId: match.id,
            judgeName: judgeScore.judge,
            leftCupCode: comp1CupCode,
            rightCupCode: comp2CupCode,
            sensoryBeverage: 'Cappuccino', // Default, could be mapped from data
            visualLatteArt: visualWinner,
            taste: tasteWinner,
            tactile: tactileWinner,
            flavour: flavourWinner,
            overall: overallWinner
          });
        }
      }

      console.log(`✅ Heat ${heat.heatNumber} created`);
    }

    console.log('🎉 WEC 2025 Milano tournament data migration completed successfully!');
    console.log(`📊 Tournament ID: ${tournament.id}`);
    console.log(`👥 Total users: ${allUsers.length}`);
    console.log(`⚔️ Total heats: ${WEC_2025_DATA.heats.length}`);
    console.log(`🏆 Champion: TEST BARISTA 4`);

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

export { migrateWEC2025Data, WEC_2025_DATA };
