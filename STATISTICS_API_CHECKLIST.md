# Statistics API Quick Checklist

Quick reference for checking all APIs used by frontend statistics displays.

## Quick Test Commands

```bash
# Start server first
bun run dev

# Then test endpoints (in another terminal)
curl http://localhost:3000/api/tournaments
curl http://localhost:3000/api/tournaments/1
curl http://localhost:3000/api/tournaments/1/matches
curl http://localhost:3000/api/tournaments/1/participants
curl http://localhost:3000/api/stations
curl http://localhost:3000/api/users
curl http://localhost:3000/api/persons
curl http://localhost:3000/api/admin/system-stats
curl http://localhost:3000/api/matches/1/segments
```

## Component → API Mapping

| Component | APIs Used | Critical Fields |
|-----------|----------|----------------|
| **HeatResults.tsx** | `/api/tournaments`<br>`/api/tournaments/:id` | `matches[].heatNumber`<br>`matches[].competitor1Name`<br>`detailedScores[].judgeName` |
| **Standings.tsx** | `/api/tournaments`<br>`/api/tournaments/:id` | `participants[].name`<br>`scores[].competitorId`<br>`scores[].score` |
| **WEC2025Results.tsx** | `/api/tournaments`<br>`/api/tournaments/:id` | `matches[].round`<br>`matches[].heatNumber`<br>`matches[].competitor1Name` |
| **BaristaDetail.tsx** | `/api/tournaments`<br>`/api/tournaments/:id` | `matches[].competitor1Name`<br>`detailedScores[].visualLatteArt` |
| **JudgeScorecardsResults.tsx** | `/api/tournaments`<br>`/api/tournaments/:id` | `matches[]`<br>`detailedScores[].judgeName`<br>`detailedScores[].leftCupCode` |
| **AdminDashboard.tsx** | `/api/admin/system-stats`<br>`/api/persons`<br>`/api/tournaments` | `uptime`<br>`memoryUsage`<br>`activeConnections` |
| **TournamentList.tsx** | `/api/tournaments/:id/matches`<br>`/api/stations` | `matches[].status`<br>`stations[].status` |
| **PublicDisplay.tsx** | `/api/tournaments`<br>`/api/tournaments/:id/matches`<br>`/api/users`<br>`/api/stations`<br>`/api/matches/:id/segments` | `matches[].status`<br>`users[].name`<br>`segments[].code` |

## Critical Validations

### ✅ `/api/tournaments/:id` Response Must Have:

```typescript
{
  tournament: { id, name, status },  // Required
  matches: [{                         // Required array
    id, heatNumber, round,
    competitor1Name, competitor2Name,  // CRITICAL: Must not be empty strings
    winnerId, status
  }],
  scores: [{                          // Required array
    matchId, judgeId, competitorId,
    judgeName,                        // CRITICAL: Must not be "Unknown Judge"
    score, segment
  }],
  detailedScores: [{                  // Required array
    matchId, judgeName,               // CRITICAL: Must not be empty
    leftCupCode, rightCupCode,
    visualLatteArt, taste, tactile, flavour, overall
  }]
}
```

### ⚠️ Common Issues to Check:

1. **Missing Names in Matches**
   - `competitor1Name` or `competitor2Name` is empty string
   - **Fix:** Check user lookup in `server/routes.ts:140-159`

2. **Missing Judge Names**
   - `judgeName` is "Unknown Judge" or empty
   - **Fix:** Check judge lookup in `server/routes.ts:165-171`

3. **Empty Arrays**
   - `matches`, `scores`, or `detailedScores` are empty
   - **Check:** Database has data for tournament

4. **Wrong Tournament ID**
   - 404 error or wrong tournament returned
   - **Fix:** Verify tournament exists with `/api/tournaments`

5. **Slow Responses**
   - Response time > 1000ms
   - **Check:** N+1 queries, database indexes

## Test Script Usage

```bash
# Run automated check (requires server running)
bun run scripts/check-statistics-apis.ts

# Expected output:
# ✅ Success: X
# ❌ Errors: Y
# ⚠️  Warnings: Z
```

## Manual Verification Steps

1. **Start Server**
   ```bash
   bun run dev
   ```

2. **Get Tournament ID**
   ```bash
   curl http://localhost:3000/api/tournaments | jq '.[0].id'
   ```

3. **Test Full Tournament Endpoint**
   ```bash
   TOURNAMENT_ID=1
   curl http://localhost:3000/api/tournaments/$TOURNAMENT_ID | jq '{
     tournament: .tournament.name,
     matches_count: (.matches | length),
     scores_count: (.scores | length),
     detailed_scores_count: (.detailedScores | length),
     matches_with_names: [.matches[] | select(.competitor1Name != "" and .competitor2Name != "")] | length,
     scores_with_judges: [.scores[] | select(.judgeName != "Unknown Judge")] | length
   }'
   ```

4. **Check for Missing Data**
   ```bash
   # Matches without competitor names
   curl http://localhost:3000/api/tournaments/$TOURNAMENT_ID | jq '.matches[] | select(.competitor1Name == "" or .competitor2Name == "")'
   
   # Scores without judge names
   curl http://localhost:3000/api/tournaments/$TOURNAMENT_ID | jq '.scores[] | select(.judgeName == "Unknown Judge" or .judgeName == "")'
   ```

## Expected Response Times

| Endpoint | Expected Time | Warning Threshold |
|----------|---------------|-------------------|
| `/api/tournaments` | < 100ms | > 500ms |
| `/api/tournaments/:id` | < 500ms | > 2000ms |
| `/api/tournaments/:id/matches` | < 200ms | > 1000ms |
| `/api/stations` | < 50ms | > 200ms |
| `/api/users` | < 100ms | > 500ms |
| `/api/admin/system-stats` | < 100ms | > 500ms |

## Server Code Locations

- **Tournament endpoints:** `server/routes.ts:100-189`
- **Matches endpoints:** `server/routes.ts:528-533`
- **Stations endpoints:** `server/routes.ts:464-482`
- **System stats:** `server/routes.ts:1121-1149`
- **User/Person endpoints:** `server/routes.ts:48-77`

## Debugging Tips

1. **Check Server Logs**
   - Look for errors in console when endpoints are called
   - Check for database query errors

2. **Verify Database Data**
   ```sql
   -- Check tournaments
   SELECT id, name FROM tournaments;
   
   -- Check matches with competitor names
   SELECT m.id, m.heatNumber, 
          u1.name as competitor1, u2.name as competitor2
   FROM matches m
   LEFT JOIN users u1 ON m.competitor1Id = u1.id
   LEFT JOIN users u2 ON m.competitor2Id = u2.id
   WHERE m.tournamentId = 1;
   
   -- Check scores with judge names
   SELECT s.matchId, s.competitorId, s.score,
          u.name as judgeName
   FROM heatScores s
   LEFT JOIN users u ON s.judgeId = u.id
   WHERE s.matchId IN (SELECT id FROM matches WHERE tournamentId = 1);
   ```

3. **Test with Browser DevTools**
   - Open Network tab
   - Navigate to statistics pages
   - Check API responses
   - Verify status codes and response times

4. **Check React Query Cache**
   - Open React DevTools
   - Check Query DevTools
   - Verify query keys match endpoints
   - Check for stale/error states

