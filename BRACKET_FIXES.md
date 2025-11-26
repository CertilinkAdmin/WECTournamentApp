# Bracket Builder Fixes

## Issues to Fix

1. **Drag and Drop Not Working** - DndContext missing sensors
2. **Tournament Data Leakage** - TournamentBracket using tournaments[0] instead of specific tournamentId
3. **Segment Time Assignment** - Need UI to set dial in, espresso, cappuccino times per round
4. **Judge Assignment Display** - Show which judges do what (ESPRESSO, CAPPUCCINO, LATTE ART)

## Fixes Applied

### 1. Fix Drag and Drop
- Add sensors to DndContext in AdminTournaments
- Ensure PointerSensor and KeyboardSensor are configured

### 2. Fix Tournament Filtering
- Update TournamentBracket to accept tournamentId prop
- Update TrueTournamentBracket to fetch data for specific tournamentId
- Filter all queries by tournamentId

### 3. Add Segment Time Assignment UI
- Create component for setting round times
- Add to AdminTournaments bracket builder tab
- Connect to existing API endpoint

### 4. Display Judge Assignments
- Show judge roles per heat (2 ESPRESSO, 1 CAPPUCCINO, all score LATTE ART)
- Display in bracket view and heat details













