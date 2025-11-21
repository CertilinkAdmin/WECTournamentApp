# API Check Summary for Frontend Statistics Displays

## Overview

This document summarizes the API endpoints used by all frontend statistics displays and provides a verification checklist.

## Files Created

1. **`STATISTICS_API_DOCUMENTATION.md`** - Comprehensive documentation of all APIs
2. **`STATISTICS_API_CHECKLIST.md`** - Quick reference checklist
3. **`scripts/check-statistics-apis.ts`** - Automated testing script

## API Endpoints Summary

### Core Statistics APIs

| Endpoint | Method | Used By | Critical Fields |
|----------|--------|---------|----------------|
| `/api/tournaments` | GET | All results pages | `id`, `name` |
| `/api/tournaments/:id` | GET | All results pages | `tournament`, `matches`, `scores`, `detailedScores` |
| `/api/tournaments/:id/matches` | GET | TournamentList, PublicDisplay | `id`, `heatNumber`, `status` |
| `/api/tournaments/:id/participants` | GET | Baristas | `id`, `userId`, `name` |
| `/api/stations` | GET | Multiple components | `id`, `name`, `status` |
| `/api/users` | GET | PublicDisplay, StationLeadView | `id`, `name` |
| `/api/persons` | GET | AdminDashboard | `id`, `name` |
| `/api/matches/:id/segments` | GET | PublicDisplay, StationLeadView | `id`, `matchId`, `code` |
| `/api/admin/system-stats` | GET | AdminDashboard | `uptime`, `memoryUsage`, `activeConnections` |

## Critical Issues to Verify

### 1. Competitor Names in `/api/tournaments/:id`

**Location:** `server/routes.ts:140-159`

**Issue:** Matches must include `competitor1Name` and `competitor2Name`

**Check:**
```bash
curl http://localhost:3000/api/tournaments/1 | jq '.matches[] | select(.competitor1Name == "" or .competitor2Name == "")'
```

**Expected:** No matches should be returned (all have names)

---

### 2. Judge Names in Scores

**Location:** `server/routes.ts:165-171`

**Issue:** Scores must include `judgeName` (not "Unknown Judge")

**Check:**
```bash
curl http://localhost:3000/api/tournaments/1 | jq '.scores[] | select(.judgeName == "Unknown Judge" or .judgeName == "")'
```

**Expected:** No scores should be returned (all have judge names)

---

### 3. Detailed Scores Structure

**Location:** `server/routes.ts:174-176`

**Issue:** `detailedScores` must be populated for judge scorecards

**Check:**
```bash
curl http://localhost:3000/api/tournaments/1 | jq '.detailedScores | length'
```

**Expected:** Should match number of matches × number of judges

---

### 4. Empty Arrays

**Check for:**
- Empty `matches` array
- Empty `scores` array  
- Empty `detailedScores` array

**Fix:** Verify tournament has data in database

---

## Component-Specific Checks

### HeatResults.tsx
- ✅ Tournament data loads
- ✅ Heat number matches URL param
- ✅ Judge scorecards display
- ✅ Competitor names show correctly

### Standings.tsx
- ✅ Participants list loads
- ✅ Scores aggregate correctly
- ✅ Rankings sort properly

### WEC2025Results.tsx
- ✅ Rounds group correctly
- ✅ Heat cards display
- ✅ Heat details dialog works

### BaristaDetail.tsx
- ✅ Barista heats filter correctly
- ✅ Category scores calculate properly
- ✅ Overall totals sum correctly

### JudgeScorecardsResults.tsx
- ✅ All heats display
- ✅ Judge tabs work
- ✅ Consensus overview shows

### AdminDashboard.tsx
- ✅ System stats refresh every 5s
- ✅ Stats display correctly
- ✅ User list loads

### TournamentList.tsx
- ✅ Live stats update every 5s
- ✅ Match counts accurate
- ✅ Station counts accurate

### PublicDisplay.tsx
- ✅ Current matches show per station
- ✅ Segment timers work
- ✅ Competitor names display

## Testing Steps

### 1. Start Server
```bash
bun run dev
```

### 2. Run Automated Check
```bash
bun run scripts/check-statistics-apis.ts
```

### 3. Manual Verification
```bash
# Get tournament ID
TOURNAMENT_ID=$(curl -s http://localhost:3000/api/tournaments | jq '.[0].id')

# Test full tournament endpoint
curl http://localhost:3000/api/tournaments/$TOURNAMENT_ID | jq '{
  tournament: .tournament.name,
  matches: .matches | length,
  matches_with_names: [.matches[] | select(.competitor1Name != "" and .competitor2Name != "")] | length,
  scores: .scores | length,
  scores_with_judges: [.scores[] | select(.judgeName != "Unknown Judge")] | length,
  detailed_scores: .detailedScores | length
}'
```

### 4. Check Frontend Pages
1. Navigate to each statistics page
2. Open browser DevTools → Network tab
3. Verify API calls succeed (200 status)
4. Check response times (< 1000ms)
5. Verify data displays correctly

## Common Problems & Solutions

### Problem: "Tournament not found"
**Solution:** 
- Check tournament exists: `GET /api/tournaments`
- Verify tournament ID in URL
- Check server logs for errors

### Problem: Missing competitor names
**Solution:**
- Verify users exist in database
- Check user lookup logic in `server/routes.ts:140-159`
- Ensure `competitor1Id`/`competitor2Id` are valid

### Problem: Missing judge names
**Solution:**
- Verify judges exist in users table
- Check judge lookup logic in `server/routes.ts:165-171`
- Ensure `judgeId` is valid

### Problem: Empty arrays
**Solution:**
- Check database has matches for tournament
- Verify tournament ID is correct
- Check if matches have scores yet

### Problem: Slow responses
**Solution:**
- Check for N+1 queries
- Add database indexes
- Consider pagination for large datasets

## Next Steps

1. ✅ Documentation created
2. ✅ Test script created
3. ⏳ **Run server and test all endpoints**
4. ⏳ **Verify data structures match expectations**
5. ⏳ **Fix any missing fields or errors**
6. ⏳ **Test frontend pages with real data**

## Quick Reference

- **Full Documentation:** `STATISTICS_API_DOCUMENTATION.md`
- **Quick Checklist:** `STATISTICS_API_CHECKLIST.md`
- **Test Script:** `scripts/check-statistics-apis.ts`
- **Server Routes:** `server/routes.ts`

