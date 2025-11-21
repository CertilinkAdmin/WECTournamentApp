# Frontend Statistics Displays - API Documentation

This document maps all frontend statistics displays to their API endpoints and expected data structures.

## Overview

All statistics displays fetch data from REST API endpoints. This document provides:
1. Component-to-API mapping
2. Expected request/response formats
3. Data structure validation
4. Common issues and solutions

---

## API Endpoints Used by Statistics Displays

### 1. `/api/tournaments` (GET)
**Used by:** All results pages, AdminDashboard, PublicDisplay, TournamentList

**Response:**
```typescript
Array<{
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  totalRounds?: number;
  currentRound?: number;
}>
```

**Validation:**
- ✅ Must return an array
- ✅ Each tournament must have `id` and `name`
- ✅ Should not be empty (at least one tournament expected)

---

### 2. `/api/tournaments/:id` (GET)
**Used by:** HeatResults, Standings, WEC2025Results, BaristaDetail, JudgeScorecardsResults

**Response:**
```typescript
{
  tournament: {
    id: number;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    totalRounds?: number;
    currentRound?: number;
  };
  participants?: Array<{
    id: number;
    userId: number;
    name: string;
    email: string;
    seed?: number;
    finalRank?: number | null;
  }>;
  matches: Array<{
    id: number;
    round: number;
    heatNumber: number;
    status: string;
    competitor1Id: number | null;
    competitor2Id: number | null;
    winnerId: number | null;
    competitor1Name: string;
    competitor2Name: string;
    stationId?: number | null;
  }>;
  scores: Array<{
    matchId: number;
    judgeId: number;
    competitorId: number;
    segment: string;
    score: number;
    judgeName: string;
  }>;
  detailedScores: Array<{
    matchId: number;
    judgeName: string;
    leftCupCode: string;
    rightCupCode: string;
    sensoryBeverage: string;
    visualLatteArt: 'left' | 'right';
    taste: 'left' | 'right';
    tactile: 'left' | 'right';
    flavour: 'left' | 'right';
    overall: 'left' | 'right';
  }>;
}
```

**Validation:**
- ✅ Must return an object with `tournament`, `matches`, `scores`, `detailedScores`
- ✅ `matches` must be an array
- ✅ `scores` must be an array
- ✅ `detailedScores` must be an array
- ✅ Each match must have `competitor1Name` and `competitor2Name`
- ✅ Each score must have `judgeName`

**Common Issues:**
- Missing `competitor1Name`/`competitor2Name` in matches → Check user lookup logic
- Missing `judgeName` in scores → Check judge lookup logic
- Empty arrays → Tournament may not have matches/scores yet

---

### 3. `/api/tournaments/:id/matches` (GET)
**Used by:** TournamentList, PublicDisplay

**Response:**
```typescript
Array<{
  id: number;
  round: number;
  heatNumber: number;
  status: 'READY' | 'RUNNING' | 'DONE';
  competitor1Id: number | null;
  competitor2Id: number | null;
  winnerId: number | null;
  competitor1Name: string;
  competitor2Name: string;
  stationId?: number | null;
}>
```

**Validation:**
- ✅ Must return an array
- ✅ Each match must have `id`, `heatNumber`, `status`
- ✅ Status should be one of: 'READY', 'RUNNING', 'DONE'

---

### 4. `/api/tournaments/:id/participants` (GET)
**Used by:** Baristas page

**Response:**
```typescript
Array<{
  id: number;
  userId: number;
  name: string;
  email: string;
  seed?: number;
  finalRank?: number | null;
}>
```

**Validation:**
- ✅ Must return an array
- ✅ Each participant must have `id`, `userId`, `name`

---

### 5. `/api/stations` (GET)
**Used by:** TournamentList, PublicDisplay, StationLeadView, TournamentBracket

**Response:**
```typescript
Array<{
  id: number;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE';
  location?: string | null;
}>
```

**Validation:**
- ✅ Must return an array
- ✅ Each station must have `id`, `name`, `status`
- ✅ Status should be one of: 'AVAILABLE', 'BUSY', 'MAINTENANCE'

---

### 6. `/api/users` (GET)
**Used by:** PublicDisplay, StationLeadView

**Response:**
```typescript
Array<{
  id: number;
  name: string;
  email: string;
  role?: string;
}>
```

**Validation:**
- ✅ Must return an array
- ✅ Each user must have `id`, `name`

---

### 7. `/api/persons` (GET)
**Used by:** AdminDashboard

**Response:**
```typescript
Array<{
  id: number;
  name: string;
  email: string;
}>
```

**Validation:**
- ✅ Must return an array
- ✅ Each person must have `id`, `name`

---

### 8. `/api/matches/:id/segments` (GET)
**Used by:** PublicDisplay, StationLeadView

**Response:**
```typescript
Array<{
  id: number;
  matchId: number;
  code: string;
  status: string;
  startTime?: string;
  endTime?: string;
}>
```

**Validation:**
- ✅ Must return an array
- ✅ Each segment must have `id`, `matchId`, `code`

---

### 9. `/api/admin/system-stats` (GET)
**Used by:** AdminDashboard

**Response:**
```typescript
{
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  databaseSize: number;
  userCount?: number;
  tournamentCount?: number;
  matchCount?: number;
}
```

**Validation:**
- ✅ Must return an object
- ✅ Must have `uptime`, `memoryUsage`, `activeConnections`
- ✅ All numeric values should be >= 0

---

## Frontend Component API Usage

### Results Pages

#### `HeatResults.tsx`
**APIs:**
- `GET /api/tournaments` - Get tournaments list
- `GET /api/tournaments/:id` - Get full tournament data

**Data Used:**
- `tournament` - Tournament info
- `matches` - All matches (filtered by heatNumber)
- `detailedScores` - Judge scorecards for the heat

**Statistics Displayed:**
- Heat overview (heat number, station, round, winner)
- Competitor information
- Judge scorecards with all categories

---

#### `Standings.tsx`
**APIs:**
- `GET /api/tournaments` - Get tournaments list
- `GET /api/tournaments/:id` - Get full tournament data

**Data Used:**
- `participants` - All tournament participants
- `scores` - All scores across all matches

**Statistics Displayed:**
- Final standings table
- Total points per competitor
- Ranked list of competitors

**Calculation:**
```typescript
// Sum scores by competitorId
const totals = new Map<number, number>();
scores.forEach((s) => {
  totals.set(s.competitorId, (totals.get(s.competitorId) || 0) + s.score);
});
```

---

#### `WEC2025Results.tsx`
**APIs:**
- `GET /api/tournaments` - Get tournaments list
- `GET /api/tournaments/:id` - Get full tournament data

**Data Used:**
- `tournament` - Tournament info
- `matches` - All matches (grouped by round)
- `scores` - All scores
- `detailedScores` - Judge scorecards

**Statistics Displayed:**
- Round selection cards
- Heat list per round
- Competitor scores per heat
- Heat details dialog with full breakdown

---

#### `BaristaDetail.tsx`
**APIs:**
- `GET /api/tournaments` - Get tournaments list
- `GET /api/tournaments/:id` - Get full tournament data

**Data Used:**
- `matches` - Filtered by barista name
- `detailedScores` - Judge scores for barista's heats

**Statistics Displayed:**
- Overall tournament totals (by category)
- Per-heat scores
- Category breakdowns (Latte Art, Taste, Tactile, Flavor, Overall)
- Win/Loss record

**Calculations:**
```typescript
// Category points from judge votes
const CATEGORY_POINTS = {
  visualLatteArt: 3,
  taste: 1,
  tactile: 1,
  flavour: 1,
  overall: 5,
};
```

---

#### `JudgeScorecardsResults.tsx`
**APIs:**
- `GET /api/tournaments` - Get tournaments list
- `GET /api/tournaments/:id` - Get full tournament data

**Data Used:**
- `matches` - All matches
- `detailedScores` - All judge scorecards

**Statistics Displayed:**
- Heat-by-heat judge scorecards
- Judge consensus overview
- Individual judge breakdowns
- Cup codes and sensory evaluations

---

### Live/Admin Pages

#### `AdminDashboard.tsx`
**APIs:**
- `GET /api/admin/system-stats` - System monitoring
- `GET /api/persons` - User list
- `GET /api/tournaments` - Tournament list

**Statistics Displayed:**
- System uptime
- Memory usage
- Active connections
- Database size
- User count
- Tournament count
- Match count

**Refresh Rate:** Every 5 seconds

---

#### `TournamentList.tsx`
**APIs:**
- `GET /api/tournaments/:id/matches` - Tournament matches
- `GET /api/stations` - Station status

**Statistics Displayed:**
- Active heats count
- Total heats count
- Completed heats count
- Active stations count
- Total stations count

**Refresh Rate:** Every 5 seconds (live tab only)

---

#### `PublicDisplay.tsx`
**APIs:**
- `GET /api/tournaments` - Get tournaments list
- `GET /api/tournaments/:id/matches` - Get matches
- `GET /api/users` - Get competitor names
- `GET /api/stations` - Get stations
- `GET /api/matches/:id/segments` - Get segments for matches

**Statistics Displayed:**
- Current match per station
- Segment timers
- Competitor names
- Station status

**Refresh Rate:** Real-time via WebSocket + polling

---

## Common Issues and Solutions

### Issue: Missing `competitor1Name`/`competitor2Name` in matches

**Cause:** User lookup failing in `/api/tournaments/:id` endpoint

**Solution:** Check that:
1. `competitor1Id`/`competitor2Id` are valid user IDs
2. Users exist in the `users` table
3. User lookup logic is correct in routes.ts

**Location:** `server/routes.ts` lines 140-159

---

### Issue: Missing `judgeName` in scores

**Cause:** Judge lookup failing in `/api/tournaments/:id` endpoint

**Solution:** Check that:
1. `judgeId` is valid user ID
2. Judge exists in the `users` table
3. Judge lookup logic is correct

**Location:** `server/routes.ts` lines 165-171

---

### Issue: Empty arrays returned

**Possible Causes:**
1. Tournament has no matches yet
2. Matches have no scores yet
3. Database query returning no results

**Solution:**
- Check database for actual data
- Verify tournament ID is correct
- Check if matches/scores exist in database

---

### Issue: API returns 404

**Possible Causes:**
1. Tournament ID doesn't exist
2. Route not registered
3. Server not running

**Solution:**
- Verify tournament exists: `GET /api/tournaments`
- Check server logs
- Verify route registration in `server/routes.ts`

---

### Issue: Slow API responses

**Possible Causes:**
1. N+1 query problem (fetching user names one by one)
2. Large dataset
3. Missing database indexes

**Solution:**
- Check for N+1 queries in routes.ts
- Add database indexes on foreign keys
- Consider pagination for large datasets

---

## Testing Checklist

When checking APIs for statistics displays:

- [ ] `/api/tournaments` returns array with at least one tournament
- [ ] `/api/tournaments/:id` returns complete tournament data
- [ ] All matches have `competitor1Name` and `competitor2Name`
- [ ] All scores have `judgeName`
- [ ] `detailedScores` array is populated
- [ ] `/api/stations` returns array of stations
- [ ] `/api/users` returns array of users
- [ ] `/api/admin/system-stats` returns valid stats object
- [ ] Response times are acceptable (< 500ms)
- [ ] No 404 or 500 errors
- [ ] Data structures match expected formats

---

## Running the API Check Script

To automatically check all APIs:

```bash
# Make sure server is running first
bun run dev

# In another terminal, run the check script
bun run scripts/check-statistics-apis.ts
```

The script will:
1. Test all endpoints used by statistics displays
2. Validate data structures
3. Report any missing fields
4. Show response times
5. Map results to frontend components

---

## API Response Examples

### Successful Tournament Response
```json
{
  "tournament": {
    "id": 1,
    "name": "World Espresso Championships 2025 Milano",
    "status": "ACTIVE",
    "startDate": "2025-01-01",
    "endDate": "2025-01-05",
    "totalRounds": 5,
    "currentRound": 1
  },
  "matches": [
    {
      "id": 1,
      "round": 1,
      "heatNumber": 1,
      "status": "DONE",
      "competitor1Id": 1,
      "competitor2Id": 2,
      "winnerId": 1,
      "competitor1Name": "John Doe",
      "competitor2Name": "Jane Smith",
      "stationId": 1
    }
  ],
  "scores": [
    {
      "matchId": 1,
      "judgeId": 10,
      "competitorId": 1,
      "segment": "visualLatteArt",
      "score": 3,
      "judgeName": "Judge A"
    }
  ],
  "detailedScores": [
    {
      "matchId": 1,
      "judgeName": "Judge A",
      "leftCupCode": "A1",
      "rightCupCode": "A2",
      "sensoryBeverage": "Cappuccino",
      "visualLatteArt": "left",
      "taste": "left",
      "tactile": "right",
      "flavour": "left",
      "overall": "left"
    }
  ]
}
```

---

## Notes

- All endpoints should return JSON
- Error responses should include `error` field with message
- Status codes: 200 (success), 400 (bad request), 404 (not found), 500 (server error)
- CORS is enabled for all origins
- No authentication required for read endpoints (may change in future)

