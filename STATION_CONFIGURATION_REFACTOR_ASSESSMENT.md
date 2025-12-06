# Station Configuration Refactor Assessment

## Overview
Refactor the tournament system to support configurable station counts: A only, A&B, or A&B&C (instead of always requiring all 3).

## Complexity Assessment: **MODERATE** (3-4 hours)

### Why Moderate?
- ✅ **Well-structured codebase** - Clear separation of concerns
- ✅ **Tournament partitioning already in place** - Stations are tournament-specific
- ⚠️ **Multiple touchpoints** - ~15-20 files need updates
- ⚠️ **Database migration required** - Schema change needed
- ⚠️ **Backward compatibility** - Need to handle existing tournaments

## Required Changes

### 1. Database Schema (HIGH PRIORITY)
**File**: `shared/schema.ts` + Migration

**Changes**:
- Add `enabledStations` field to `tournaments` table
- Type: `text[]` (PostgreSQL array) or JSON column
- Default: `['A', 'B', 'C']` for backward compatibility
- Values: `['A']`, `['A', 'B']`, or `['A', 'B', 'C']`

**Migration needed**: Create new migration file

### 2. Backend - Tournament Creation (HIGH PRIORITY)
**Files**:
- `server/routes.ts` (line ~288-311)
- `server/routes/admin.ts` (line ~272)
- `scripts/create-wec2025-tournament-*.ts` (2 files)

**Changes**:
- Accept `enabledStations` in tournament creation request
- Only create stations that are enabled
- Validate: at least 1 station, only A/B/C allowed

### 3. Backend - Bracket Generator (HIGH PRIORITY)
**File**: `server/bracketGenerator.ts`

**Key Changes**:
- **Line 145-147**: Change hardcoded "Need at least 3 stations" to dynamic check
- **Line 151-157**: Find stations dynamically based on enabled stations (not hardcoded A, B, C)
- **Line 160-176**: Set staggered timing dynamically (10 min intervals)
- **Line 182-195**: Split pairings into N groups (not hardcoded 3)
- **Line 585-597**: Update `generateNextRound` to use dynamic stations

**Complexity**: Medium - Need to make station assignment algorithm generic

### 4. Backend - Station Assignment Routes (MEDIUM PRIORITY)
**Files**:
- `server/routes.ts` (lines ~1227-1266, ~158, ~1611)
- `server/routes/tournament.ts` (line ~316-317)

**Changes**:
- Filter stations by tournament's `enabledStations` instead of hardcoded `['A', 'B', 'C']`
- Get enabled stations from tournament config

### 5. Frontend - Station Utilities (MEDIUM PRIORITY)
**File**: `client/src/utils/stationUtils.ts`

**Changes**:
- **Line 66-68**: `getStationLetter` - Make return type dynamic
- **Line 71-73**: `isMainStation` - Check against tournament's enabled stations
- **Line 75-77**: `findStationByLetter` - Already generic, but may need updates
- **Line 81**: `LETTER_PRIORITY` - Make dynamic based on tournament config
- **Line 105-165**: `getMainStationsForTournament` - Use tournament's enabled stations

**Complexity**: Medium - Need to pass tournament config to utility functions

### 6. Frontend - Tournament Creation Form (MEDIUM PRIORITY)
**File**: `client/src/pages/admin/CreateTournament.tsx`

**Changes**:
- Add station selection UI (checkboxes or radio buttons)
- Options: "A only", "A & B", "A, B & C"
- Send `enabledStations` in tournament creation request

### 7. Frontend - Components Using Hardcoded Stations (MEDIUM PRIORITY)
**Files**:
- `client/src/components/StationLeadView.tsx` (line 674)
- `client/src/components/HeatsView.tsx` (line 294)
- `client/src/components/AdminTournamentSetup.tsx` (line 1230)
- `client/src/components/JudgeAssignment.tsx` (line 113)

**Changes**:
- Replace hardcoded `['A', 'B', 'C']` with dynamic station list from tournament
- Fetch tournament config or pass as prop

### 8. Frontend - Station Management (LOW PRIORITY)
**File**: `client/src/components/StationsManagement.tsx`

**Changes**:
- Only show/enable stations that are configured for the tournament
- Hide or disable unused stations

## Implementation Strategy

### Phase 1: Database & Backend Core (1-1.5 hours)
1. Add `enabledStations` to schema
2. Create migration
3. Update tournament creation endpoints
4. Update bracket generator to use dynamic stations

### Phase 2: Backend Routes & Utilities (1 hour)
1. Update all station filtering logic
2. Update station assignment routes
3. Test bracket generation with different station counts

### Phase 3: Frontend Updates (1-1.5 hours)
1. Update tournament creation form
2. Update station utilities
3. Update all components using hardcoded stations
4. Test UI with different configurations

### Phase 4: Testing & Edge Cases (30 min)
1. Test with A only
2. Test with A & B
3. Test with A, B & C (existing behavior)
4. Verify backward compatibility (existing tournaments default to A, B, C)

## Key Design Decisions

### 1. Storage Format
**Option A**: PostgreSQL array `text[]`
```sql
enabled_stations text[] DEFAULT ARRAY['A', 'B', 'C']
```
**Option B**: JSON column
```sql
enabled_stations jsonb DEFAULT '["A", "B", "C"]'::jsonb
```
**Recommendation**: Use `text[]` - simpler, native PostgreSQL support

### 2. Staggered Timing
**Current**: A=0min, B=10min, C=20min
**New**: Dynamic based on station count
- 1 station: 0min
- 2 stations: 0min, 10min
- 3 stations: 0min, 10min, 20min

### 3. Station Assignment Algorithm
**Current**: Split into 3 equal groups
**New**: Split into N equal groups (where N = enabledStations.length)

### 4. Backward Compatibility
- Default `enabledStations` to `['A', 'B', 'C']` for existing tournaments
- Migration sets all existing tournaments to `['A', 'B', 'C']`

## Testing Checklist

- [ ] Create tournament with A only
- [ ] Create tournament with A & B
- [ ] Create tournament with A, B & C (existing behavior)
- [ ] Generate bracket with 1 station
- [ ] Generate bracket with 2 stations
- [ ] Generate bracket with 3 stations
- [ ] Verify staggered timing works correctly
- [ ] Verify station assignment routes work
- [ ] Verify UI shows correct stations
- [ ] Verify existing tournaments still work (backward compatibility)

## Risk Assessment

**Low Risk**:
- Database migration (straightforward)
- Tournament creation (isolated change)

**Medium Risk**:
- Bracket generator (core logic, needs careful testing)
- Station utilities (used in many places)

**Mitigation**:
- Add comprehensive tests for bracket generation
- Test with small tournament first (4-8 participants)
- Keep backward compatibility default

## Estimated Effort

- **Database & Schema**: 30 minutes
- **Backend Core Logic**: 1.5 hours
- **Backend Routes**: 45 minutes
- **Frontend Forms**: 45 minutes
- **Frontend Components**: 1 hour
- **Testing & Bug Fixes**: 1 hour

**Total**: ~5-6 hours for complete implementation and testing

## Recommendation

**Proceed with refactor** - The codebase is well-structured and the changes are localized. The main complexity is in the bracket generator, but the algorithm can be generalized without major restructuring.

