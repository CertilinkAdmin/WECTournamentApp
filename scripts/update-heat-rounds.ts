import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

async function updateHeatRounds() {
  try {
    console.log('🔄 Updating heat rounds for WEC2025...\n');

    // Get tournament ID
    const tournaments = await sql`
      SELECT id FROM tournaments 
      WHERE name LIKE '%WEC%2025%' OR name LIKE '%World Espresso%2025%'
      LIMIT 1
    `;
    
    if (tournaments.length === 0) {
      throw new Error('WEC2025 tournament not found');
    }
    
    const tournamentId = tournaments[0].id;
    console.log(`✅ Tournament ID: ${tournamentId}\n`);

    // Round mapping based on user specification:
    // Round 1: Heats 1-16 (first 16 heats)
    // Round 2: Heats 17-23 (next 7 heats)
    // Round 3: Heats 24-27 (next 4 heats)
    // Round 4: Heats 28-29 (2 heats - semifinals)
    // Round 5: Heat 30+ (Final)

    const roundUpdates = [
      { round: 1, minHeat: 1, maxHeat: 16, description: 'Round 1 - First 16 heats' },
      { round: 2, minHeat: 17, maxHeat: 23, description: 'Round 2 - Next 7 heats' },
      { round: 3, minHeat: 24, maxHeat: 27, description: 'Round 3 - Next 4 heats' },
      { round: 4, minHeat: 28, maxHeat: 29, description: 'Round 4 - 2 heats (Semifinals)' },
      { round: 5, minHeat: 30, maxHeat: 999, description: 'Round 5 - Final' },
    ];

    let totalUpdated = 0;

    for (const { round, minHeat, maxHeat, description } of roundUpdates) {
      const result = await sql`
        UPDATE matches
        SET round = ${round}
        WHERE tournament_id = ${tournamentId}
        AND heat_number >= ${minHeat}
        AND heat_number <= ${maxHeat}
      `;
      
      const count = await sql`
        SELECT COUNT(*) as count FROM matches
        WHERE tournament_id = ${tournamentId}
        AND heat_number >= ${minHeat}
        AND heat_number <= ${maxHeat}
      `;
      
      const updatedCount = count[0]?.count || 0;
      console.log(`✅ ${description}: Updated ${updatedCount} heats (${minHeat}-${maxHeat === 999 ? '∞' : maxHeat})`);
      totalUpdated += parseInt(updatedCount);
    }

    // Verify the updates
    const verification = await sql`
      SELECT round, COUNT(*) as count, MIN(heat_number) as min_heat, MAX(heat_number) as max_heat
      FROM matches
      WHERE tournament_id = ${tournamentId}
      GROUP BY round
      ORDER BY round
    `;

    console.log(`\n📊 Verification:\n`);
    for (const row of verification) {
      console.log(`   Round ${row.round}: ${row.count} heats (${row.min_heat}-${row.max_heat})`);
    }

    console.log(`\n✅ Total heats updated: ${totalUpdated}`);
    console.log(`✅ Heat rounds update completed!`);

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateHeatRounds().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { updateHeatRounds };

