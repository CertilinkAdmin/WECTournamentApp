import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(DATABASE_URL);

async function addTournaments() {
  console.log('🏆 Adding 2025-2026 tournaments...');

  try {
    const tournaments = [
      {
        name: 'World Espresso Championships 2025 Milano',
        status: 'ACTIVE',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-03-17'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Australia Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-12'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Indonesia Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-03-05'),
        endDate: new Date('2026-03-07'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Italy Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-04-15'),
        endDate: new Date('2026-04-17'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Japan Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-05-20'),
        endDate: new Date('2026-05-22'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Kazakhstan Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-12'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Malaysia Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-07-08'),
        endDate: new Date('2026-07-10'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Russia Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-08-12'),
        endDate: new Date('2026-08-14'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 South Africa Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-09-16'),
        endDate: new Date('2026-09-18'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 Thailand Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-10-14'),
        endDate: new Date('2026-10-16'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 United States Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-11-11'),
        endDate: new Date('2026-11-13'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: '2026 United Kingdom Espresso Championship',
        status: 'SETUP',
        startDate: new Date('2026-11-25'),
        endDate: new Date('2026-11-27'),
        totalRounds: 5,
        currentRound: 1
      },
      {
        name: 'World Espresso Championships 2026 Panama',
        status: 'SETUP',
        startDate: new Date('2026-12-09'),
        endDate: new Date('2026-12-11'),
        totalRounds: 5,
        currentRound: 1
      }
    ];

    for (const tournament of tournaments) {
      const existing = await sql`
        SELECT id FROM tournaments WHERE name = ${tournament.name}
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO tournaments (name, status, start_date, end_date, total_rounds, current_round, created_at, updated_at)
          VALUES (
            ${tournament.name},
            ${tournament.status},
            ${tournament.startDate},
            ${tournament.endDate},
            ${tournament.totalRounds},
            ${tournament.currentRound},
            NOW(),
            NOW()
          )
        `;
        console.log(`✅ Added: ${tournament.name}`);
      } else {
        console.log(`⏭️  Skipped (exists): ${tournament.name}`);
      }
    }

    console.log('✅ Tournament migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

addTournaments();
