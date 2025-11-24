import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import {
  tournaments,
  users,
  tournamentParticipants,
  matches,
  heatJudges,
  judgeDetailedScores,
  heatScores,
  stations,
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// Judge name mapping (Google Sheets → Database)
const JUDGE_NAME_MAP: Record<string, string> = {
  'MC': 'Michalis',
  'JASPER': 'Jasper',
  'Jasper': 'Jasper',
  'Shin': 'Shinsaku',
  'Korn': 'Korn',
  'Ali': 'Ali',
  'Junior': 'Junior',
  'Tess': 'Tess',
};

// Spreadsheet data (same as before)
const SPREADSHEET_DATA: Record<string, any[]> = {
  'Heat 12': [
    { judge: 'MC', beverage: 'CAPPUCCINO', leftCup: 'M7', rightCup: 'K9', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'right', overall: 'left' },
    { judge: 'Korn', beverage: 'CAPPUCCINO', leftCup: 'M7', rightCup: 'K9', visualLatteArt: 'right', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'JASPER', beverage: 'CAPPUCCINO', leftCup: 'M7', rightCup: 'K9', visualLatteArt: 'left', taste: 'right', tactile: 'left', flavour: 'right', overall: 'right' },
    { judge: 'Korn', beverage: 'ESPRESSO', leftCup: 'M7', rightCup: 'K9', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'JASPER', beverage: 'ESPRESSO', leftCup: 'M7', rightCup: 'K9', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
  ],
  'Heat 13': [
    { judge: 'Shin', beverage: 'CAPPUCCINO', leftCup: 'F5', rightCup: 'X1', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'Ali', beverage: 'CAPPUCCINO', leftCup: 'F5', rightCup: 'X1', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'right', overall: 'left' },
    { judge: 'Junior', beverage: 'CAPPUCCINO', leftCup: 'F5', rightCup: 'X1', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'Ali', beverage: 'ESPRESSO', leftCup: 'F5', rightCup: 'X1', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
  ],
  'Heat 19': [
    { judge: 'Tess', beverage: 'CAPPUCCINO', leftCup: 'G2', rightCup: 'W8', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'Junior', beverage: 'ESPRESSO', leftCup: 'G2', rightCup: 'W8', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
    { judge: 'Tess', beverage: 'ESPRESSO', leftCup: 'G2', rightCup: 'W8', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
  ],
  'Heat 21': [
    { judge: 'MC', beverage: 'CAPPUCCINO', leftCup: 'Q5', rightCup: 'B1', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'right' },
    { judge: 'Ali', beverage: 'ESPRESSO', leftCup: 'Q5', rightCup: 'B1', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
    { judge: 'Jasper', beverage: 'ESPRESSO', leftCup: 'Q5', rightCup: 'B1', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
  ],
  'Heat 22': [
    { judge: 'Shin', beverage: 'CAPPUCCINO', leftCup: 'T8', rightCup: 'J7', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
  ],
};

const COMPETITOR_CUP_CODES: Record<string, Record<string, string>> = {
  'Heat 12': { 'Stevo': 'M7', 'Edwin': 'K9' },
  'Heat 13': { 'Kirill': 'F5', 'Anja': 'X1' },
  'Heat 19': { 'Artur': 'G2', 'Julian': 'W8' },
  'Heat 21': { 'Faiz': 'Q5', 'Christos': 'B1' },
  'Heat 22': { 'Danielle': 'T8', 'Stevo': 'J7' },
};

const COMPETITOR_NAMES: Record<string, string> = {
  'M7': 'Stevo',
  'K9': 'Edwin',
  'F5': 'Kirill',
  'X1': 'Anja',
  'G2': 'Artur',
  'W8': 'Julian',
  'Q5': 'Faiz',
  'B1': 'Christos',
  'T8': 'Danielle',
  'J7': 'Stevo',
};

async function createTournament2() {
  console.log('🏆 Creating WEC 2025 Milano Tournament #2...\n');

  try {
    // 1. Create tournament
    const [tournament] = await db.insert(tournaments).values({
      name: 'WEC 2025 Milano #2',
      location: 'Milano',
      status: 'COMPLETED',
      totalRounds: 5,
      currentRound: 5,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-05'),
    }).returning();

    console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id})\n`);

    // 2. Create stations
    const stationNames = ['A', 'B', 'C'];
    for (const name of stationNames) {
      await db.insert(stations).values({
        tournamentId: tournament.id,
        name,
        status: 'AVAILABLE',
        nextAvailableAt: new Date(),
      });
    }
    console.log(`✅ Created ${stationNames.length} stations\n`);

    // 3. Get or create users
    const allUsers = await db.select().from(users);
    const userMap = new Map<string, number>();
    allUsers.forEach(u => userMap.set(u.name.toLowerCase(), u.id));

    // Create missing competitors
    const competitorNames = new Set(Object.values(COMPETITOR_NAMES));
    for (const name of competitorNames) {
      const key = name.toLowerCase();
      if (!userMap.has(key)) {
        const [user] = await db.insert(users).values({
          name,
          email: `${name.toLowerCase().replace(' ', '.')}@wec2025.com`,
          role: 'BARISTA',
          approved: true,
        }).returning();
        userMap.set(key, user.id);
        console.log(`✅ Created competitor: ${name}`);
      }
    }

    // Create missing judges
    const judgeNames = new Set(Object.values(JUDGE_NAME_MAP));
    for (const name of judgeNames) {
      const key = name.toLowerCase();
      if (!userMap.has(key)) {
        const [user] = await db.insert(users).values({
          name,
          email: `${name.toLowerCase().replace(' ', '.')}@wec2025.com`,
          role: 'JUDGE',
          approved: true,
        }).returning();
        userMap.set(key, user.id);
        console.log(`✅ Created judge: ${name}`);
      }
    }
    console.log('');

    // 4. Add competitors as tournament participants
    const competitorUserIds = Array.from(competitorNames).map(name => userMap.get(name.toLowerCase())!);
    let seed = 1;
    for (const userId of competitorUserIds) {
      await db.insert(tournamentParticipants).values({
        tournamentId: tournament.id,
        userId,
        seed: seed++,
      });
    }
    console.log(`✅ Added ${competitorUserIds.length} competitors as participants\n`);

    // 5. Add judges as tournament participants
    const judgeUserIds = Array.from(judgeNames).map(name => userMap.get(name.toLowerCase())!);
    let judgeSeed = 1;
    for (const userId of judgeUserIds) {
      await db.insert(tournamentParticipants).values({
        tournamentId: tournament.id,
        userId,
        seed: judgeSeed++,
      });
    }
    console.log(`✅ Added ${judgeUserIds.length} judges as participants\n`);

    // 6. Get tournament 1 bye structure
    const tournament1Matches = await db.select().from(matches).where(eq(matches.tournamentId, 1));
    const tournament1Byes = tournament1Matches.filter(m => m.competitor2Id === null && m.round === 1);
    
    console.log(`📋 Found ${tournament1Byes.length} bye matches in tournament 1`);
    console.log(`📋 Total matches in tournament 1: ${tournament1Matches.length}\n`);

    // 7. Get tournament 2 barista participants sorted by seed
    const allParticipants2 = await db.select().from(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournament.id));
    
    // Refresh allUsers to include newly created users
    const updatedAllUsers = await db.select().from(users);
    
    const tournament2Baristas = allParticipants2
      .map(p => {
        const user = updatedAllUsers.find(u => u.id === p.userId);
        return user?.role === 'BARISTA' ? { ...p, user } : null;
      })
      .filter((p): p is typeof p & { user: any } => p !== null)
      .sort((a, b) => a.seed - b.seed);

    console.log(`📋 Tournament 2 baristas: ${tournament2Baristas.length}\n`);

    // 8. Create bye matches - use tournament 1's bye structure
    // Tournament 1 has 13 byes - create the same number for tournament 2
    // Map by position: first N baristas in tournament 2 get byes (where N = number of byes in tournament 1)
    const heatMatches: Record<string, number> = {};
    let heatNumber = 1;
    
    console.log(`\n📋 Creating bye matches from tournament 1 structure...`);
    let byeCount = 0;
    
    // Sort tournament 1 byes by heat_number to maintain order
    const sortedByes = [...tournament1Byes].sort((a, b) => (a.heatNumber || 0) - (b.heatNumber || 0));
    
    // Create byes for tournament 2 - use the same number of byes as tournament 1
    // Map by position: first bye in T1 → first barista in T2, second bye → second barista, etc.
    for (let i = 0; i < sortedByes.length && i < tournament2Baristas.length; i++) {
      const t2Participant = tournament2Baristas[i];
      if (t2Participant) {
        const [match] = await db.insert(matches).values({
          tournamentId: tournament.id,
          heatNumber: heatNumber++,
          round: 1,
          stationId: null,
          competitor1Id: t2Participant.userId,
          competitor2Id: null,
          status: 'DONE',
          winnerId: t2Participant.userId,
          startTime: new Date(),
          endTime: new Date(),
        }).returning();
        byeCount++;
        console.log(`✅ Created BYE match: Heat ${match.heatNumber} - ${t2Participant.user.name} (Seed ${t2Participant.seed})`);
      }
    }
    console.log(`✅ Created ${byeCount} bye matches\n`);

    // 9. Create regular matches from spreadsheet
    for (const [heatName, heatData] of Object.entries(SPREADSHEET_DATA)) {
      const cupCodeMap = COMPETITOR_CUP_CODES[heatName];
      if (!cupCodeMap) continue;

      const competitorEntries = Object.entries(cupCodeMap);
      if (competitorEntries.length < 2) continue;

      const [comp1Name, comp1Cup] = competitorEntries[0];
      const [comp2Name, comp2Cup] = competitorEntries[1];
      const comp1Id = userMap.get(comp1Name.toLowerCase());
      const comp2Id = userMap.get(comp2Name.toLowerCase());

      if (!comp1Id || !comp2Id) continue;

      const [station] = await db.select().from(stations).where(eq(stations.tournamentId, tournament.id)).limit(1);
      
      const [match] = await db.insert(matches).values({
        tournamentId: tournament.id,
        heatNumber: heatNumber++,
        round: 1,
        stationId: station?.id,
        competitor1Id: comp1Id,
        competitor2Id: comp2Id,
        status: 'DONE',
      }).returning();

      heatMatches[heatName] = match.id;
      console.log(`✅ Created ${heatName}: ${comp1Name} (${comp1Cup}) vs ${comp2Name} (${comp2Cup}) - Match ID: ${match.id}`);
    }
    console.log('');

    // 10. Assign judges and import scores (same logic as before)
    for (const [heatName, heatData] of Object.entries(SPREADSHEET_DATA)) {
      const matchId = heatMatches[heatName];
      if (!matchId) continue;

      const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
      if (!match[0]) continue;

      const comp1Id = match[0].competitor1Id;
      const comp2Id = match[0].competitor2Id;
      const comp1 = allUsers.find(u => u.id === comp1Id);
      const comp2 = allUsers.find(u => u.id === comp2Id);

      const cupCodeMap = COMPETITOR_CUP_CODES[heatName];
      let comp1Cup = '';
      let comp2Cup = '';
      if (comp1 && comp2 && cupCodeMap) {
        for (const [name, cupCode] of Object.entries(cupCodeMap)) {
          if (comp1.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(comp1.name.toLowerCase())) {
            comp1Cup = cupCode;
          }
          if (comp2.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(comp2.name.toLowerCase())) {
            comp2Cup = cupCode;
          }
        }
      }

      console.log(`\n📋 Processing ${heatName} (Match ID: ${matchId})`);
      console.log(`   Competitors: ${comp1?.name} (${comp1Cup}) vs ${comp2?.name} (${comp2Cup})`);

      const judgeScores: Record<string, any[]> = {};
      for (const score of heatData) {
        if (!judgeScores[score.judge]) {
          judgeScores[score.judge] = [];
        }
        judgeScores[score.judge].push(score);
      }

      const assignedJudgeIds: number[] = [];
      for (const [judgeSheetName, scores] of Object.entries(judgeScores)) {
        const judgeName = JUDGE_NAME_MAP[judgeSheetName] || judgeSheetName;
        const judgeId = userMap.get(judgeName.toLowerCase());

        if (!judgeId) continue;

        const hasEspresso = scores.some(s => s.beverage === 'ESPRESSO');
        const hasCappuccino = scores.some(s => s.beverage === 'CAPPUCCINO');
        
        if (!assignedJudgeIds.includes(judgeId)) {
          await db.insert(heatJudges).values({
            matchId,
            judgeId,
            role: hasCappuccino ? 'SENSORY' : 'TECHNICAL',
          }).onConflictDoNothing();
          assignedJudgeIds.push(judgeId);
        }

        for (const score of scores) {
          const leftCup = score.leftCup === comp1Cup ? comp1Cup : comp2Cup;
          const rightCup = score.rightCup === comp1Cup ? comp1Cup : score.rightCup === comp2Cup ? comp2Cup : (score.leftCup === comp1Cup ? comp2Cup : comp1Cup);

          const visualLatteArt = score.beverage === 'CAPPUCCINO' && score.visualLatteArt
            ? (score.visualLatteArt === 'left' ? leftCup : score.visualLatteArt === 'right' ? rightCup : '')
            : '';
          const taste = score.taste === 'left' ? leftCup : score.taste === 'right' ? rightCup : '';
          const tactile = score.tactile === 'left' ? leftCup : score.tactile === 'right' ? rightCup : '';
          const flavour = score.flavour === 'left' ? leftCup : score.flavour === 'right' ? rightCup : '';
          const overall = score.overall === 'left' ? leftCup : score.overall === 'right' ? rightCup : '';

          await db.insert(judgeDetailedScores).values({
            matchId,
            judgeName: judgeName,
            leftCupCode: leftCup,
            rightCupCode: rightCup,
            sensoryBeverage: score.beverage,
            visualLatteArt: visualLatteArt,
            taste: taste,
            tactile: tactile,
            flavour: flavour,
            overall: overall,
          }).onConflictDoNothing();
        }
      }

      const allDetailedScores = await db.select().from(judgeDetailedScores).where(eq(judgeDetailedScores.matchId, matchId));
      
      const calculateTotal = (cupCode: string) => {
        let total = 0;
        for (const score of allDetailedScores) {
          if (score.sensoryBeverage === 'CAPPUCCINO' && score.visualLatteArt === cupCode) total += 3;
          if (score.taste === cupCode) total += 1;
          if (score.tactile === cupCode) total += 1;
          if (score.flavour === cupCode) total += 1;
          if (score.overall === cupCode) total += 5;
        }
        return total;
      };

      const comp1Total = calculateTotal(comp1Cup);
      const comp2Total = calculateTotal(comp2Cup);

      await db.insert(heatScores).values({
        matchId,
        judgeId: assignedJudgeIds[0] || 1,
        competitorId: comp1Id!,
        segment: 'CAPPUCCINO',
        score: comp1Total,
        notes: 'Imported from Google Sheets - Total Score',
      }).onConflictDoNothing();

      await db.insert(heatScores).values({
        matchId,
        judgeId: assignedJudgeIds[0] || 1,
        competitorId: comp2Id!,
        segment: 'CAPPUCCINO',
        score: comp2Total,
        notes: 'Imported from Google Sheets - Total Score',
      }).onConflictDoNothing();

      console.log(`   ✅ Scores: ${comp1?.name} (${comp1Cup}) = ${comp1Total}, ${comp2?.name} (${comp2Cup}) = ${comp2Total}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ TOURNAMENT #2 CREATED AND DATA IMPORTED!');
    console.log(`   Tournament ID: ${tournament.id}`);
    console.log(`   Bye Matches: ${byeCount}`);
    console.log(`   Regular Matches: ${Object.keys(heatMatches).length}`);
    console.log(`   Total Matches: ${byeCount + Object.keys(heatMatches).length}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

createTournament2();

