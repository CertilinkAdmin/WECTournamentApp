# API Fixes Applied

## Summary

Fixed several issues found during API checking for frontend statistics displays.

## Fixes Applied

### 1. `/api/admin/system-stats` - SQL Import Error
**File:** `server/routes.ts`  
**Issue:** `sql is not defined`  
**Fix:** Added `import postgres from "postgres"` and created SQL connection in the endpoint  
**Status:** ✅ Fixed (requires server restart)

### 2. `/api/tournaments/:id` - Missing Table Error
**File:** `server/routes.ts`, `server/storage.ts`  
**Issue:** `relation "tournament_registrations" does not exist`  
**Fix:** Added error handling to gracefully handle missing `tournament_registrations` table  
**Status:** ✅ Fixed (requires server restart)

**Changes:**
- `server/routes.ts:119-135`: Added try-catch around `getTournamentRegistrations()` call
- `server/storage.ts:185-189`: Added error handling in `getTournamentRegistrations()` method

### 3. API Check Script - Port Configuration
**File:** `scripts/check-statistics-apis.ts`  
**Issue:** Script was using port 3000, but server runs on port 5000  
**Fix:** Updated BASE_URL to use port 5000  
**Status:** ✅ Fixed

### 4. API Check Script - Tournament ID Detection
**File:** `scripts/check-statistics-apis.ts`  
**Issue:** Tournament ID detection logic was incorrect  
**Fix:** Simplified tournament ID fetching logic  
**Status:** ✅ Fixed

## Remaining Issues

### 1. `/api/users` - Missing Route
**Status:** ⚠️ Not Fixed  
**Impact:** PublicDisplay.tsx, StationLeadView.tsx  
**Options:**
- Add `/api/users` route that returns users from database
- Update components to use `/api/persons` instead

### 2. `/api/tournaments/:id/participants` - Function Not Found
**Status:** ⚠️ Not Fixed  
**Impact:** Baristas.tsx  
**Issue:** `storage.getTournamentParticipants is not a function`  
**Options:**
- Implement `getTournamentParticipants` method
- Use `getTournamentRegistrations` instead

### 3. `/api/matches/:id/segments` - Missing 'code' Field
**Status:** ⚠️ Not Fixed  
**Impact:** PublicDisplay.tsx, StationLeadView.tsx  
**Issue:** Segments response missing expected 'code' field  
**Action:** Verify segment schema and update if needed

### 4. `/api/tournaments/:id/matches` - Slow Response
**Status:** ⚠️ Not Fixed  
**Impact:** TournamentList.tsx, PublicDisplay.tsx  
**Issue:** Response time 2128ms (should be < 500ms)  
**Action:** Optimize query, add database indexes

## Next Steps

1. **Restart Server** to apply fixes:
   ```bash
   # Kill existing server
   pkill -f "tsx server/index.ts"
   
   # Start server
   bun run dev
   ```

2. **Re-run API Check:**
   ```bash
   bun run scripts/check-statistics-apis.ts
   ```

3. **Verify Fixes:**
   - Test `/api/tournaments/1` endpoint
   - Test `/api/admin/system-stats` endpoint
   - Check all statistics pages load correctly

4. **Address Remaining Issues:**
   - Add `/api/users` route or update components
   - Fix `/api/tournaments/:id/participants` endpoint
   - Optimize slow queries
   - Verify segment structure

## Testing Checklist

After server restart, verify:
- [ ] `/api/tournaments/1` returns tournament data (not 500 error)
- [ ] `/api/admin/system-stats` returns stats (not 500 error)
- [ ] HeatResults.tsx loads correctly
- [ ] Standings.tsx loads correctly
- [ ] WEC2025Results.tsx loads correctly
- [ ] BaristaDetail.tsx loads correctly
- [ ] JudgeScorecardsResults.tsx loads correctly
- [ ] AdminDashboard.tsx shows system stats
- [ ] TournamentList.tsx loads matches
- [ ] PublicDisplay.tsx loads (may need `/api/users` fix)

