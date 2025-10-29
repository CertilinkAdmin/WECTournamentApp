import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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

// WEC 2025 Tournament Data
const WEC_2025_DATA = {
  tournament: {
    name: "World Espresso Championships 2025 Milano",
    status: "COMPLETED" as const,
    startDate: new Date("2025-01-15T08:00:00Z"),
    endDate: new Date("2025-01-17T18:00:00Z"),
    totalRounds: 5,
    currentRound: 5
  },
  
  competitors: [
    // Competition competitors (Heats 12-31)
    { name: "Stevo", code: "M7", seed: 1 },
    { name: "Edwin", code: "K9", seed: 2 },
    { name: "Kirill", code: "F5", seed: 3 },
    { name: "Anja", code: "X1", seed: 4 },
    { name: "Jae", code: "L4", seed: 5 },
    { name: "Carlos", code: "C6", seed: 6 },
    { name: "Penny", code: "S5", seed: 7 },
    { name: "Erland", code: "W6", seed: 8 },
    { name: "Felix", code: "V4", seed: 9 },
    { name: "Aga", code: "J1", seed: 10 },
    { name: "Artur", code: "G2", seed: 11 },
    { name: "Julian", code: "W8", seed: 12 },
    { name: "Faiz", code: "Q5", seed: 13 },
    { name: "Christos", code: "B1", seed: 14 },
    { name: "Danielle", code: "J7", seed: 15 },
    { name: "Hojat", code: "K5", seed: 16 },
    { name: "Bill", code: "M1", seed: 17 },
    { name: "Engi", code: "E3", seed: 18 },
    // BYE competitors from Round 1 (Heats 1-11)
    { name: "Ronny Chalhoub", code: "BYE1", seed: 19 },
    { name: "David Yescas-Berg", code: "BYE2", seed: 20 },
    { name: "Keita Osawa", code: "BYE3", seed: 21 },
    { name: "Alge Mohamed", code: "BYE4", seed: 22 },
    { name: "Julian Yip", code: "BYE5", seed: 23 },
    { name: "Artur Kusnierz", code: "BYE6", seed: 24 },
    { name: "Hojat Mousavi", code: "BYE7", seed: 25 },
    { name: "Sebastian Hernandez", code: "BYE8", seed: 26 },
    { name: "Fraz Nurdin", code: "BYE9", seed: 27 },
    { name: "Christie Sidikat", code: "BYE10", seed: 28 },
    { name: "Danielle Misa", code: "BYE11", seed: 29 }
  ],

  judges: [
    { name: "Jasper", role: "HEAD" as const },
    { name: "Korn", role: "TECHNICAL" as const },
    { name: "Michalis", role: "SENSORY" as const },
    { name: "Shinsaku", role: "TECHNICAL" as const },
    { name: "Ali", role: "SENSORY" as const },
    { name: "Junior", role: "TECHNICAL" as const },
    { name: "Tess", role: "SENSORY" as const },
    { name: "Boss", role: "HEAD" as const }
  ],

  heats: [
    // BYE heats (heats 1-11) - competitors received 33 points (Round 1)
    { heatNumber: 1, round: 1, competitor1: "Ronny Chalhoub", competitor2: "BYE", winner: "Ronny Chalhoub", points1: 33, points2: 0 },
    { heatNumber: 2, round: 1, competitor1: "David Yescas-Berg", competitor2: "BYE", winner: "David Yescas-Berg", points1: 33, points2: 0 },
    { heatNumber: 3, round: 1, competitor1: "Keita Osawa", competitor2: "BYE", winner: "Keita Osawa", points1: 33, points2: 0 },
    { heatNumber: 4, round: 1, competitor1: "Alge Mohamed", competitor2: "BYE", winner: "Alge Mohamed", points1: 33, points2: 0 },
    { heatNumber: 5, round: 1, competitor1: "Julian Yip", competitor2: "BYE", winner: "Julian Yip", points1: 33, points2: 0 },
    { heatNumber: 6, round: 1, competitor1: "Artur Kusnierz", competitor2: "BYE", winner: "Artur Kusnierz", points1: 33, points2: 0 },
    { heatNumber: 7, round: 1, competitor1: "Hojat Mousavi", competitor2: "BYE", winner: "Hojat Mousavi", points1: 33, points2: 0 },
    { heatNumber: 8, round: 1, competitor1: "Sebastian Hernandez", competitor2: "BYE", winner: "Sebastian Hernandez", points1: 33, points2: 0 },
    { heatNumber: 9, round: 1, competitor1: "Fraz Nurdin", competitor2: "BYE", winner: "Fraz Nurdin", points1: 33, points2: 0 },
    { heatNumber: 10, round: 1, competitor1: "Christie Sidikat", competitor2: "BYE", winner: "Christie Sidikat", points1: 33, points2: 0 },
    { heatNumber: 11, round: 1, competitor1: "Danielle Misa", competitor2: "BYE", winner: "Danielle Misa", points1: 33, points2: 0 },
    
    // Actual heats with judge scores
    { 
      heatNumber: 12, 
      round: 2, 
      competitor1: "Stevo", 
      competitor2: "Edwin", 
      winner: "Stevo", 
      points1: 28, 
      points2: 5,
      judgeScores: [
        { judge: "Jasper", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Korn", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Michalis", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 0, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 1, overall: 0 } }
      ]
    },
    { 
      heatNumber: 13, 
      round: 2, 
      competitor1: "Kirill", 
      competitor2: "Anja", 
      winner: "Kirill", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Ali", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 14, 
      round: 2, 
      competitor1: "Jae", 
      competitor2: "Carlos", 
      winner: "Jae", 
      points1: 28, 
      points2: 5,
      judgeScores: [
        { judge: "Michalis", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Jasper", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Korn", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 1, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 0, overall: 5 } }
      ]
    },
    { 
      heatNumber: 17, 
      round: 3, 
      competitor1: "Penny", 
      competitor2: "Erland", 
      winner: "Penny", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "Michalis", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Jasper", competitor1: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Tess", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } }
      ]
    },
    { 
      heatNumber: 18, 
      round: 3, 
      competitor1: "Aga", 
      competitor2: "Felix", 
      winner: "Aga", 
      points1: 31, 
      points2: 2,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Ali", competitor1: { visual: 0, taste: 0, tactile: 1, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 0, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 3, taste: 1, tactile: 0, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 1, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 19, 
      round: 3, 
      competitor1: "Artur", 
      competitor2: "Julian", 
      winner: "Artur", 
      points1: 2, 
      points2: 9,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Tess", competitor1: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 3, taste: 0, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 1, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 21, 
      round: 4, 
      competitor1: "Christos", 
      competitor2: "Faiz", 
      winner: "Christos", 
      points1: 25, 
      points2: 8,
      judgeScores: [
        { judge: "Michalis", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Ali", competitor1: { visual: 0, taste: 0, tactile: 1, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 0, flavour: 1, overall: 5 } },
        { judge: "Jasper", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 1, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 0, overall: 5 } }
      ]
    },
    { 
      heatNumber: 22, 
      round: 4, 
      competitor1: "Stevo", 
      competitor2: "Danielle", 
      winner: "Stevo", 
      points1: 19, 
      points2: 14,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Tess", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 23, 
      round: 4, 
      competitor1: "Jae", 
      competitor2: "Kirill", 
      winner: "Jae", 
      points1: 27, 
      points2: 6,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Tess", competitor1: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 24, 
      round: 4, 
      competitor1: "Engi", 
      competitor2: "Bill", 
      winner: "Engi", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "Michalis", competitor1: { visual: 0, taste: 0, tactile: 1, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 0, flavour: 1, overall: 5 } },
        { judge: "Ali", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Jasper", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } }
      ]
    },
    { 
      heatNumber: 25, 
      round: 5, 
      competitor1: "Aga", 
      competitor2: "Penny", 
      winner: "Aga", 
      points1: 25, 
      points2: 8,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Tess", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } }
      ]
    },
    { 
      heatNumber: 26, 
      round: 5, 
      competitor1: "Artur", 
      competitor2: "Hojat", 
      winner: "Artur", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "Michalis", competitor1: { visual: 0, taste: 0, tactile: 1, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 0, flavour: 1, overall: 5 } },
        { judge: "Korn", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 27, 
      round: 5, 
      competitor1: "Artur", 
      competitor2: "Hojat", 
      winner: "Artur", 
      points1: 24, 
      points2: 9,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Korn", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 28, 
      round: 5, 
      competitor1: "Jae", 
      competitor2: "Engi", 
      winner: "Jae", 
      points1: 23, 
      points2: 10,
      judgeScores: [
        { judge: "Michalis", competitor1: { visual: 3, taste: 0, tactile: 0, flavour: 1, overall: 0 }, competitor2: { visual: 0, taste: 1, tactile: 1, flavour: 0, overall: 5 } },
        { judge: "Tess", competitor1: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Junior", competitor1: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 29, 
      round: 5, 
      competitor1: "Aga", 
      competitor2: "Artur", 
      winner: "Aga", 
      points1: 25, 
      points2: 8,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Korn", competitor1: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Boss", competitor1: { visual: 3, taste: 0, tactile: 1, flavour: 1, overall: 0 }, competitor2: { visual: 0, taste: 1, tactile: 0, flavour: 0, overall: 5 } }
      ]
    },
    { 
      heatNumber: 30, 
      round: 5, 
      competitor1: "Jae", 
      competitor2: "Christos", 
      winner: "Jae", 
      points1: 19, 
      points2: 14,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 } },
        { judge: "Korn", competitor1: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Boss", competitor1: { visual: 0, taste: 1, tactile: 1, flavour: 1, overall: 5 }, competitor2: { visual: 3, taste: 0, tactile: 0, flavour: 0, overall: 0 } }
      ]
    },
    { 
      heatNumber: 31, 
      round: 5, 
      competitor1: "Aga", 
      competitor2: "Jae", 
      winner: "Aga", 
      points1: 19, 
      points2: 14,
      judgeScores: [
        { judge: "Shinsaku", competitor1: { visual: 0, taste: 0, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 1, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Korn", competitor1: { visual: 0, taste: 1, tactile: 0, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 0, tactile: 1, flavour: 1, overall: 5 } },
        { judge: "Boss", competitor1: { visual: 0, taste: 1, tactile: 1, flavour: 0, overall: 0 }, competitor2: { visual: 3, taste: 0, tactile: 0, flavour: 1, overall: 5 } }
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

    // 2. Create users (competitors and judges)
    console.log('👥 Creating users...');
    const allUsers = [...WEC_2025_DATA.competitors, ...WEC_2025_DATA.judges];
    const userMap = new Map<string, number>();
    
    for (const user of allUsers) {
      const [createdUser] = await db.insert(users).values({
        name: user.name,
        email: `${user.name.toLowerCase().replace(/\s+/g, '')}@wec2025.com`,
        role: 'judges' in user ? 'JUDGE' : 'BARISTA'
      }).returning();
      userMap.set(user.name, createdUser.id);
      console.log(`✅ Created user: ${user.name} (ID: ${createdUser.id})`);
    }

    // 3. Create tournament participants
    console.log('🎯 Creating tournament participants...');
    for (const competitor of WEC_2025_DATA.competitors) {
      await db.insert(tournamentParticipants).values({
        tournamentId: tournament.id,
        userId: userMap.get(competitor.name)!,
        seed: competitor.seed,
        finalRank: competitor.name === 'Aga' ? 1 : null // Aga is the champion
      });
    }
    console.log('✅ Tournament participants created');

    // 4. Create stations
    console.log('🏢 Creating stations...');
    const stations_data = [
      { name: "Station 1", location: "Main Stage" },
      { name: "Station 2", location: "Side Stage" },
      { name: "Station 3", location: "Practice Area" }
    ];
    
    const stationMap = new Map<number, number>();
    for (const station of stations_data) {
      const [createdStation] = await db.insert(stations).values(station).returning();
      stationMap.set(1, createdStation.id); // Use station 1 for all matches
    }
    console.log('✅ Stations created');

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

      // Add judges to heat
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

        // Add scores
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
      }

      console.log(`✅ Heat ${heat.heatNumber} created`);
    }

    console.log('🎉 WEC 2025 Milano tournament data migration completed successfully!');
    console.log(`📊 Tournament ID: ${tournament.id}`);
    console.log(`👥 Total users: ${allUsers.length}`);
    console.log(`⚔️ Total heats: ${WEC_2025_DATA.heats.length}`);

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
