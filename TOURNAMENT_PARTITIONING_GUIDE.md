# Tournament Partitioning Guide

## Overview

Every tournament must be properly partitioned and isolated. All data must be referenced by tournament `id` or `name` to ensure:
- Data isolation between tournaments
- Proper foreign key relationships
- Query performance with indexes
- Data integrity and consistency

## Schema Requirements

### Tables That Must Have `tournament_id`

1. ✅ **tournament_participants** - Links users to tournaments
2. ✅ **matches** - All matches belong to a tournament
3. ✅ **tournament_round_times** - Round timing per tournament
4. ✅ **stations** - Stations are tournament-specific (ADDED in migration 0003)

### Foreign Key Constraints

All `tournament_id` columns should have:
- Foreign key constraint to `tournaments.id`
- `ON DELETE CASCADE` - When tournament is deleted, related data is deleted
- `ON UPDATE CASCADE` - If tournament ID changes, references update

### Indexes

All `tournament_id` columns should have indexes for query performance:
- Single column index: `tournament_id`
- Composite indexes for common queries:
  - `matches(tournament_id, round)` - Filter matches by tournament and round
  - `matches(tournament_id, status)` - Filter matches by tournament and status
  - `stations(tournament_id, status)` - Filter stations by tournament and status

## Migration Steps

### 1. Add tournament_id to stations (if missing)

```sql
-- Migration 0003_add_tournament_id_to_stations.sql
ALTER TABLE "stations" ADD COLUMN "tournament_id" integer;
UPDATE "stations" SET "tournament_id" = (SELECT id FROM tournaments ORDER BY id DESC LIMIT 1) WHERE "tournament_id" IS NULL;
ALTER TABLE "stations" ALTER COLUMN "tournament_id" SET NOT NULL;
ALTER TABLE "stations" ADD CONSTRAINT "stations_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "stations_tournament_id_idx" ON "stations"("tournament_id");
```

### 2. Add indexes on tournament_id columns

```sql
-- Migration 0004_add_tournament_indexes.sql
CREATE INDEX "tournament_participants_tournament_id_idx" ON "tournament_participants"("tournament_id");
CREATE INDEX "matches_tournament_id_idx" ON "matches"("tournament_id");
CREATE INDEX "matches_tournament_round_idx" ON "matches"("tournament_id", "round");
CREATE INDEX "matches_tournament_status_idx" ON "matches"("tournament_id", "status");
CREATE INDEX "tournament_round_times_tournament_id_idx" ON "tournament_round_times"("tournament_id");
```

## Code Patterns

### ✅ Always Filter by Tournament ID

**Bad:**
```typescript
// Returns stations from ALL tournaments
const stations = await db.select().from(stations);
```

**Good:**
```typescript
// Returns stations for specific tournament
const stations = await db.select()
  .from(stations)
  .where(eq(stations.tournamentId, tournamentId));
```

### ✅ Use Helper Functions

```typescript
import { validateTournamentId, getTournamentStations } from '@shared/tournament-helpers';

// Validate tournament exists
if (!await validateTournamentId(db, tournamentId)) {
  throw new Error('Tournament not found');
}

// Get tournament-specific data
const stations = await getTournamentStations(db, tournamentId);
```

### ✅ API Routes Should Require Tournament ID

**Bad:**
```typescript
app.get('/api/stations', async (req, res) => {
  const stations = await storage.getAllStations(); // Returns ALL stations
  res.json(stations);
});
```

**Good:**
```typescript
app.get('/api/tournaments/:tournamentId/stations', async (req, res) => {
  const tournamentId = parseInt(req.params.tournamentId);
  const stations = await storage.getTournamentStations(tournamentId);
  res.json(stations);
});
```

## Verification

Run the verification script to check partitioning:

```bash
npx tsx scripts/verify-tournament-partitioning.ts
```

This will check:
- ✅ All tables have `tournament_id` column where needed
- ✅ Foreign key constraints are properly set
- ✅ Indexes exist on `tournament_id` columns
- ✅ No data leakage between tournaments
- ✅ All references are valid

## Common Issues

### Issue 1: Stations Without Tournament ID

**Problem:** Stations table missing `tournament_id` column

**Solution:** Run migration 0003

### Issue 2: Queries Not Filtered by Tournament

**Problem:** API returns data from all tournaments

**Solution:** Always filter by `tournamentId` in queries

### Issue 3: Missing Indexes

**Problem:** Slow queries when filtering by tournament

**Solution:** Run migration 0004 to add indexes

### Issue 4: Data Leakage

**Problem:** Matches reference users from other tournaments

**Solution:** Validate participants belong to tournament before creating matches

## Best Practices

1. **Always specify tournament_id** when creating records
2. **Validate tournament exists** before operations
3. **Use helper functions** from `tournament-helpers.ts`
4. **Filter by tournament_id** in all queries
5. **Use composite indexes** for common query patterns
6. **Test partitioning** with verification script

## Example: Creating a Match

```typescript
async function createMatch(
  db: any,
  tournamentId: number,
  matchData: InsertMatch
) {
  // 1. Validate tournament exists
  const tournament = await getTournamentById(db, tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // 2. Validate participants belong to tournament
  if (matchData.competitor1Id) {
    const isValid = await validateTournamentParticipant(
      db, 
      tournamentId, 
      matchData.competitor1Id
    );
    if (!isValid) {
      throw new Error('Competitor 1 is not a participant in this tournament');
    }
  }

  // 3. Validate station belongs to tournament
  if (matchData.stationId) {
    const isValid = await validateTournamentStation(
      db,
      tournamentId,
      matchData.stationId
    );
    if (!isValid) {
      throw new Error('Station does not belong to this tournament');
    }
  }

  // 4. Create match with tournament_id
  const match = await db.insert(matches).values({
    ...matchData,
    tournamentId, // Always set explicitly
  }).returning();

  return match[0];
}
```

## Checklist

When adding new tournament-related features:

- [ ] Does the table have `tournament_id` column?
- [ ] Is there a foreign key constraint?
- [ ] Is there an index on `tournament_id`?
- [ ] Are queries filtered by `tournament_id`?
- [ ] Are API routes scoped to tournaments?
- [ ] Are validations in place?
- [ ] Is data leakage prevented?

