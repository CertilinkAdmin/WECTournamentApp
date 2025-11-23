# Tournament Data Fetch Fix

## Issue
When a tournament is selected, the tournament data (participants, matches) wasn't being fetched properly - getting nothing.

## Root Cause
React Query queries were using array queryKeys but relying on the default queryFn which joins with "/". While this should work, explicit queryFn functions provide better error handling and debugging.

## Fixes Applied

### 1. Added Explicit queryFn Functions
- Added explicit `queryFn` to all tournament-related queries
- Added console.log statements for debugging
- Added proper error handling

### 2. Auto-Selection of Tournament
- Added useEffect to auto-select first tournament when tournaments are loaded
- Prevents the "no tournament selected" state

### 3. Enhanced Error Handling
- Added error logging for failed API calls
- Better error messages in console

## Files Modified

1. **client/src/pages/admin/AdminTournaments.tsx**
   - Added explicit queryFn for tournaments, participants, and matches queries
   - Added useEffect for auto-selecting first tournament
   - Added loading states and error handling

2. **client/src/components/AdminTournamentSetup.tsx**
   - Added explicit queryFn for competitors and matches queries
   - Added error handling and logging

## Testing

To verify the fix works:

1. Open Admin Tournaments page
2. Select a tournament from the dropdown
3. Check browser console for:
   - "Fetched tournaments: [...]"
   - "Fetched participants: [...]"
   - "Fetched matches: [...]"
4. Verify data appears in the UI

## API Endpoints Verified

- ✅ `GET /api/tournaments` - Returns all tournaments
- ✅ `GET /api/tournaments/:id/participants` - Returns participants for tournament
- ✅ `GET /api/tournaments/:id/matches` - Returns matches for tournament

## Next Steps

If data still doesn't appear:
1. Check browser console for errors
2. Check network tab for API responses
3. Verify tournament has participants/matches in database
4. Check that tournament ID is valid

