# Tournament Cleanup Scripts

## Problem

Multiple migration scripts create tournaments without checking if they already exist, leading to:
- Duplicate tournaments
- Foreign key constraint violations when trying to delete/update tournaments
- Data inconsistency

## Solution

### Script: `keep-only-wec2025-milano.ts`

This script ensures only the WEC2025 Milano tournament exists by:
1. Finding or creating the WEC2025 Milano tournament
2. Deleting all other tournaments and their related data in the correct order
3. Respecting foreign key constraints

### How to Run

```bash
# Using tsx
npx tsx scripts/keep-only-wec2025-milano.ts

# Or add to package.json scripts
npm run cleanup-tournaments
```

### What It Does

1. **Finds existing tournaments** - Lists all tournaments in the database
2. **Identifies WEC2025 Milano** - Looks for tournament with "Milano" and "2025" in name
3. **Creates if missing** - Creates WEC2025 Milano if it doesn't exist
4. **Deletes others** - Removes all other tournaments in this order:
   - Judge detailed scores
   - Heat scores
   - Heat judges
   - Heat segments
   - Matches
   - Tournament round times
   - Tournament participants (this is critical - must be before deleting tournament)
   - Tournament itself

### Foreign Key Constraint Fix

The error you're seeing:
```
update or delete on table "tournaments" violates foreign key constraint 
"tournament_participants_tournament_id_tournaments_id_fk" on table "tournament_participants"
```

This happens because `tournament_participants` references `tournaments.id`. The cleanup script deletes participants **before** deleting the tournament, which resolves the constraint violation.

## Prevention

To prevent this issue in the future, migration scripts should:

1. **Check for existing tournament first:**
```typescript
const existingTournament = await db.query.tournaments.findFirst({
  where: (tournaments, { eq, and }) => and(
    eq(tournaments.name, "World Espresso Championships 2025 Milano"),
    eq(tournaments.status, "COMPLETED")
  )
});

if (existingTournament) {
  console.log(`✅ Tournament already exists: ID ${existingTournament.id}`);
  tournament = existingTournament;
} else {
  const [newTournament] = await db.insert(tournaments).values({...}).returning();
  tournament = newTournament;
}
```

2. **Use upsert pattern** (if supported by your schema)

3. **Run cleanup script before running migrations**

## Related Scripts

- `cleanup-wec2025-duplicates.ts` - Older cleanup script (less comprehensive)
- `keep-only-wec2025-milano.ts` - **Use this one** (handles all edge cases)

