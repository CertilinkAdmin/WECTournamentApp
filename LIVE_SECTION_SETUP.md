# Live Section Setup - Tournament Preparation

## Overview

When a tournament is prepared and initiated, all live section pages are now properly populated with tournament-specific data.

## Pages Created/Updated

### 1. **Overview Page** (`/live/:tournamentId/overview`)
- **Component**: `LiveOverview.tsx`
- **Features**:
  - Tournament header with status badge
  - Statistics grid (matches, active heats, participants, stations)
  - Progress tracking with visual progress bar
  - Recent matches list
  - Real-time updates (5s polling)

### 2. **Bracket Page** (`/live/:tournamentId/bracket`)
- **Component**: `LiveBracket.tsx` (existing)
- **Features**:
  - Full tournament bracket display
  - Uses `TrueTournamentBracket` component
  - Only shows for ACTIVE or COMPLETED tournaments

### 3. **Heats Page** (`/live/:tournamentId/heats`)
- **Component**: `LiveHeats.tsx` (new)
- **Features**:
  - Station filter (All, A, B, C)
  - Active heats display (LIVE badge)
  - Ready heats display
  - All heats list sorted by heat number
  - Station statistics overview
  - Real-time updates (5s polling)

### 4. **Leaderboard Page** (`/live/:tournamentId/leaderboard`)
- **Component**: `LiveLeaderboard.tsx` (new)
- **Features**:
  - Live standings with scores
  - Top 3 highlighted with icons
  - Rank badges
  - Statistics cards (top score, average, total competitors)
  - Real-time updates (5s polling)

### 5. **Stations Page** (`/live/:tournamentId/stations`)
- **Component**: `StationsManagement.tsx` (updated)
- **Features**:
  - Station overview cards
  - Station tabs (A, B, C)
  - Individual station pages with matches
  - Station status indicators
  - Real-time updates (5s polling)

## Navigation

The `LiveLayout` component provides:
- Sticky header with tournament name and status
- Tab navigation with 5 tabs:
  1. Overview
  2. Bracket
  3. Heats
  4. Leaderboard
  5. Stations

## Data Requirements

All pages require:
- Tournament ID from route params
- Tournament data (status, name, dates)
- Matches data (filtered by tournament)
- Participants data (filtered by tournament)
- Stations data (filtered by tournament)
- Scores data (for leaderboard)

## Tournament Status Handling

All pages check tournament status:
- **SETUP**: Shows "Tournament Not Started" message
- **ACTIVE**: Full functionality with live updates
- **COMPLETED**: Full functionality (read-only)
- **CANCELLED**: Shows appropriate message

## Real-Time Updates

All pages use React Query with:
- `refetchInterval: 5000` (5 second polling)
- Automatic cache invalidation
- Optimistic updates where applicable

## API Endpoints Used

1. `/api/tournaments/:id` - Tournament details
2. `/api/tournaments/:id/matches` - Tournament matches
3. `/api/tournaments/:id/participants` - Tournament participants
4. `/api/stations` - Station data (filtered by tournament in backend)
5. `/api/tournaments/:id/leaderboard` - Leaderboard data (optional)

## Route Structure

```
/live
  └── /:tournamentId
      ├── /overview (default)
      ├── /bracket
      ├── /heats
      ├── /leaderboard
      └── /stations
```

## Next Steps

1. ✅ All pages created and routed
2. ✅ Tournament filtering implemented
3. ✅ Real-time updates configured
4. ⚠️ Verify API endpoints return tournament-filtered data
5. ⚠️ Test with actual tournament data
6. ⚠️ Apply OPUX optimizations (performance, responsive design)

## Testing Checklist

- [ ] Navigate to `/live/:tournamentId` - should show overview
- [ ] Check all 5 tabs navigate correctly
- [ ] Verify data loads for ACTIVE tournament
- [ ] Verify "Not Started" message for SETUP tournament
- [ ] Check real-time updates (wait 5+ seconds)
- [ ] Test on mobile/tablet/desktop
- [ ] Verify tournament filtering works correctly

