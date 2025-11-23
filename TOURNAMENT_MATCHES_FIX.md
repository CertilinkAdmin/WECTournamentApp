# Tournament Matches Generation Fix

## Issue
Tournament ID 8 ("World Espresso Championships 2025 Milano") was showing 0 matches and 0 detailed scores when selected.

## Root Cause
The `generateBracketMutation` was calling the wrong endpoint:
- **Wrong**: `/api/tournaments/${selectedTournamentId}/seed` (randomizes seeds)
- **Correct**: `/api/tournaments/${selectedTournamentId}/generate-bracket` (generates matches)

## Fixes Applied

### 1. Fixed Generate Bracket Endpoint
- Changed from `/seed` to `/generate-bracket`
- Added better error handling
- Added console logging for debugging
- Added success message showing number of matches created

### 2. Enhanced UI Feedback
- Shows message when no participants found
- Shows participant count in generate button
- Shows message when bracket already exists
- Better loading states

### 3. Query Invalidation
- Invalidates both matches and participants queries after bracket generation
- Ensures UI updates immediately after generation

## How to Generate Matches

1. **Select Tournament** - Choose tournament from dropdown
2. **Verify Participants** - Ensure tournament has barista participants (not judges)
3. **Go to Bracket Tab** - Click "Bracket Builder" tab
4. **Generate Bracket** - Click "Generate Bracket" button
5. **Verify** - Matches should appear in the bracket view

## Requirements

Before generating a bracket:
- ✅ Tournament must have at least 2 barista participants
- ✅ Tournament must have stations (A, B, C) created
- ✅ Participants should have seeds assigned (can randomize first)

## API Endpoint

**POST** `/api/tournaments/:id/generate-bracket`

**Response:**
```json
{
  "success": true,
  "matchesCreated": 31
}
```

## Next Steps

If matches still don't appear:
1. Check browser console for errors
2. Verify tournament has participants: `GET /api/tournaments/:id/participants`
3. Verify stations exist: `GET /api/stations`
4. Check server logs for bracket generation errors

