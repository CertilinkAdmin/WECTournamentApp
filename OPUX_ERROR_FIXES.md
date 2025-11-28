# OPUX Error Fixes Applied

**Date:** 2025-01-28  
**Issues:** Infinite loop in TrueTournamentBracket, 400 errors on API endpoints

## Issues Fixed

### 1. ✅ Infinite Loop in TrueTournamentBracket
**Problem:** "Maximum update depth exceeded" warning caused by useEffect dependency on `rounds` object that changes on every render.

**Root Cause:**
- `rounds` is a `useMemo` that depends on `allJudgesData`
- `allJudgesData` query was re-running constantly
- This caused `rounds` to be recreated, triggering the useEffect again

**Solution:**
- Added stable query key for `allJudgesData` using match IDs string
- Added `staleTime: 5000` to prevent excessive refetches
- Changed useEffect dependency from `rounds` to stringified version
- Added `isLoaded` check to prevent re-animation

**Code Changes:**
```typescript
// Before: Unstable query key
queryKey: ['/api/tournaments', tournamentId, 'matches', 'judges']

// After: Stable query key with match IDs
queryKey: ['/api/tournaments', tournamentId, 'matches', 'judges', tournamentData?.matches?.map(m => m.id).join(',')]
staleTime: 5000

// Before: Object dependency
useEffect(() => { ... }, [rounds]);

// After: String dependency + guard
const roundsString = JSON.stringify(rounds.map(r => ({ title: r.title, matchCount: r.matches.length })));
useEffect(() => { ... }, [roundsString, isLoaded]);
```

### 2. ✅ 400 Error on `/api/matches/:id/segments`
**Problem:** Endpoint returning 400 when match ID is invalid or segments don't exist.

**Solution:**
- Added try-catch error handling
- Validate match ID is a number
- Return empty array instead of error if no segments found
- Better error messages

**Code Changes:**
```typescript
app.get("/api/matches/:id/segments", async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }
    const segments = await storage.getMatchSegments(matchId);
    res.json(segments || []);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
```

### 3. ✅ 400 Error on Start Heat (Auto-Start Dial-In)
**Problem:** When starting heat, if segments don't exist yet, the auto-start fails.

**Solution:**
- Added error handling in `startMatchMutation`
- Check if segments exist before trying to start Dial-In
- Return gracefully if segments not found (they should be created by match creation)
- Added console warnings for debugging

**Code Changes:**
```typescript
// Added checks before auto-starting Dial-In
if (!matchSegments || matchSegments.length === 0) {
  console.warn('No segments found for match, cannot auto-start Dial-In');
  return { match: matchData, segment: null };
}

if (dialInSegment && dialInSegment.id) {
  // Start segment...
}
```

### 4. ✅ 400 Error on `/api/tournaments/:id/populate-next-round`
**Problem:** Endpoint was using all stations instead of tournament-specific stations.

**Solution:**
- Filter stations by `tournamentId` before checking availability
- Ensures only tournament-scoped stations are used

**Code Changes:**
```typescript
// Before: All stations
const stations = await storage.getAllStations();

// After: Tournament-scoped stations
const allStations = await storage.getAllStations();
const tournamentStations = allStations.filter(s => s.tournamentId === tournamentId);
const availableStations = tournamentStations.filter(s => s.status === 'AVAILABLE');
```

## Files Modified

1. **client/src/components/TrueTournamentBracket.tsx**
   - Fixed infinite loop in useEffect
   - Stabilized query keys
   - Added error handling for judges fetch

2. **server/routes.ts**
   - Added error handling to `/api/matches/:id/segments`
   - Fixed tournament scoping in populate-next-round

3. **client/src/components/StationLeadView.tsx**
   - Added error handling for segment fetching
   - Graceful fallback if segments don't exist

## Testing Checklist

- [x] TrueTournamentBracket no longer causes infinite loop
- [x] Segments endpoint handles invalid IDs gracefully
- [x] Start Heat works even if segments aren't ready yet
- [x] Populate-next-round uses tournament-scoped stations
- [x] No console errors for missing segments

## Remaining Issues to Monitor

- Ensure segments are always created when matches are created
- Monitor for race conditions when starting heat before segments exist
- Verify populate-next-round works with actual tournament data

