# Station Configuration Flow - Programmatic Approach

## Current Implementation

### Problem
When users configure stations (A, A&B, or A&B&C) before bracket generation, the bracket was still showing all A, B, C stations seeded.

### Root Cause
1. Tournament creation creates all stations (A, B, C) by default
2. When `enabledStations` is updated before bracket generation, we update the tournament config but don't create/delete station records
3. Bracket generation filters by `enabledStations`, but unused stations still exist in database

### Solution Implemented

#### 1. Station Management on `enabledStations` Update
**Endpoint**: `PATCH /api/tournaments/:id/enabled-stations`

**Before Bracket Generation (no matches exist)**:
- ✅ Create newly enabled stations (if they don't exist)
- ✅ Delete disabled stations (if they have no matches)
- ✅ Update tournament.enabledStations

**After Bracket Generation (matches exist)**:
- ✅ Migrate heats from disabled stations to remaining stations
- ✅ Update tournament.enabledStations
- ❌ Do NOT delete stations (they may have matches)

#### 2. Bracket Generation Flow
**Process**:
1. Fetch tournament (always fresh data)
2. Get `enabledStations` from tournament
3. Get tournament stations from database
4. **Filter stations by `enabledStations.includes(s.name)`**
5. Only use filtered stations for bracket generation
6. Split pairings across enabled stations only

#### 3. Frontend Flow
**Before Bracket Generation**:
1. User configures stations (A, A&B, or A&B&C)
2. User clicks "Generate Bracket"
3. Frontend checks if stations changed
4. If changed, calls `PATCH /api/tournaments/:id/enabled-stations` first
5. Waits for update to complete (300ms + query refresh)
6. Then calls `POST /api/tournaments/:id/generate-bracket`
7. Bracket generation uses updated `enabledStations`

**After Bracket Generation**:
1. User can disable/enable stations
2. If disabling with existing matches → confirmation dialog
3. Backend migrates matches to remaining stations
4. UI refreshes to show updated assignments

## Key Design Decisions

### Why Create/Delete Stations Before Bracket Generation?
- **Clean state**: Only enabled stations exist in database
- **Simpler filtering**: Bracket generation doesn't need to filter (all stations are valid)
- **Clear intent**: Database reflects actual configuration

### Why NOT Delete Stations After Bracket Generation?
- **Data integrity**: Stations may have matches, judges, station leads assigned
- **Migration complexity**: Need to handle all related data
- **User safety**: Prevents accidental data loss

### Why Filter in Bracket Generation?
- **Defense in depth**: Even if stations exist, only use enabled ones
- **Backward compatibility**: Works with existing tournaments
- **Safety**: Prevents using wrong stations if update fails

## Programmatic Flow

```
User Configures Stations (A only)
    ↓
Frontend: updateEnabledStationsMutation
    ↓
Backend: PATCH /api/tournaments/:id/enabled-stations
    ├─ Check: hasMatches? 
    │   ├─ NO → Create/Delete stations
    │   └─ YES → Migrate matches
    └─ Update tournament.enabledStations
    ↓
Frontend: Wait + Refresh tournament data
    ↓
Frontend: generateBracketMutation
    ↓
Backend: POST /api/tournaments/:id/generate-bracket
    ├─ Fetch tournament (fresh)
    ├─ Get enabledStations
    ├─ Get tournament stations
    ├─ Filter: stations.filter(s => enabledStations.includes(s.name))
    ├─ Split pairings into N groups (N = enabledStations.length)
    └─ Assign to filtered stations only
    ↓
Result: Bracket uses only enabled stations
```

## Verification

To verify it's working:
1. Create tournament (defaults to A, B, C)
2. Configure to A only before bracket generation
3. Generate bracket
4. Check console logs: Should see "Using 1 stations for bracket: ['A']"
5. Check bracket: Should only show Station A heats
6. Check database: Stations B and C should be deleted (if no matches)

## Edge Cases Handled

1. **Tournament created with A, B, C → Changed to A only before bracket**
   - ✅ Stations B, C deleted
   - ✅ Only Station A used for bracket

2. **Tournament created with A, B, C → Changed to A&B before bracket**
   - ✅ Station C deleted
   - ✅ Only Stations A, B used for bracket

3. **Bracket generated with A, B, C → Changed to A only after bracket**
   - ✅ Matches from B, C migrated to A
   - ✅ Stations B, C remain (may have station leads)

4. **Bracket generated with A only → Changed to A&B after bracket**
   - ✅ Station B created
   - ✅ New matches can use Station B

## Future Improvements

1. **Station Status Management**: Mark disabled stations as "OFFLINE" instead of deleting
2. **Station Re-enabling**: When re-enabling a station, check if it needs to be recreated
3. **Validation**: Prevent bracket generation if enabledStations doesn't match existing stations
4. **UI Feedback**: Show which stations will be used before generating bracket

