# Tournament Builder Workflow - Complete Guide

## Overview
This document outlines the complete tournament builder workflow, step by step, with all fixes applied.

## Workflow Steps

### Step 1: Approve Participants (Competitors & Judges)
**Location**: `AdminTournaments` → "Approve Participants" Tab

#### For Competitors (Baristas):
1. **Add Competitors**: Competitors must first be added to the tournament as participants (seed = 0)
2. **Pending Approval**: Shows all competitors with seed = 0
3. **Approve**: Click "Approve" button to assign next available seed
4. **Approved**: Shows all competitors with seed > 0

#### For Judges:
1. **Add Judges**: Click "Add" button next to available judges to add them to tournament (seed = 0)
2. **Pending Approval**: Shows all judges with seed = 0
3. **Approve**: Click "Approve" button to assign next available seed
4. **Approved**: Shows all judges with seed > 0

**Fixes Applied**:
- ✅ Added proper error handling for judge add endpoint
- ✅ Added proper error handling for competitor/judge approval
- ✅ Participants fetch now includes judges with `?includeJudges=true`

### Step 2: Randomize Seeds (Competitors Only)
**Location**: `AdminTournaments` → "Randomize Seeds" Tab

1. **Select Tournament**: Ensure tournament is selected
2. **Preview Randomization**: Click "Preview Randomization" to see shuffled seeds
3. **Apply or Randomize**: Either apply preview or click "Randomize Now"

**Fixes Applied**:
- ✅ Randomize-seeds endpoint now filters to **only baristas** (not judges)
- ✅ Judges are excluded from seed randomization
- ✅ Only approved competitors (seed > 0) are randomized

### Step 3: Generate Bracket
**Location**: `AdminTournaments` → "Bracket Builder" Tab

1. **Prepare Tournament**: Click "Prepare Tournament" button (optional - does all steps)
   - OR manually:
2. **Generate Bracket**: Click "Generate Bracket" button
3. **Verify Matches**: Matches should appear in the bracket view

**Requirements**:
- ✅ At least 2 approved competitors (seed > 0)
- ✅ Stations A, B, C must exist
- ✅ Judges should be approved (for later assignment)

**Fixes Applied**:
- ✅ Generate bracket endpoint filters to only baristas
- ✅ Proper error handling and feedback

### Step 4: Assign Judges to Heats
**Location**: `AdminTournaments` → "Bracket Builder" Tab

1. **Verify Approved Judges**: Check "Approved Judges" card shows at least 3 judges
2. **Randomize Judges**: Click "Randomize Judges for All Heats" button
3. **Verify Assignment**: Each heat gets 3 judges (2 ESPRESSO, 1 CAPPUCCINO)

**Requirements**:
- ✅ At least 3 approved judges in tournament
- ✅ Bracket must be generated (matches exist)

**Note**: Judges are automatically assigned when bracket is generated, but can be re-randomized.

### Step 5: Initiate Tournament
**Location**: `AdminTournaments` → Header (top right)

1. **Verify Prerequisites**:
   - ✅ Tournament status is `SETUP`
   - ✅ At least 2 approved competitors
   - ✅ Bracket generated (matches exist)
2. **Initiate**: Click "Initiate Tournament" button
3. **Status Change**: Tournament status changes to `ACTIVE`

## API Endpoints

### Add Participant (Judge or Competitor)
**POST** `/api/tournaments/:id/participants`
```json
{
  "userId": 123,
  "seed": 0
}
```

### Approve Participant
**PATCH** `/api/tournaments/:id/participants/:participantId/seed`
```json
{
  "seed": 1
}
```

### Randomize Seeds (Baristas Only)
**POST** `/api/tournaments/:id/randomize-seeds`
```json
{}
```
**Note**: Only randomizes baristas, not judges.

### Generate Bracket
**POST** `/api/tournaments/:id/generate-bracket`
**Response**:
```json
{
  "success": true,
  "matchesCreated": 31
}
```

### Assign Judges to Heats
**POST** `/api/tournaments/:id/assign-judges`
**Response**:
```json
{
  "success": true,
  "message": "Judges assigned to 31 heats."
}
```

### Initiate Tournament
**POST** `/api/tournament-mode/:tournamentId/activate`
**Response**:
```json
{
  "success": true,
  "tournament": { ... }
}
```

## Data Flow

1. **Participants Table**: Stores all tournament participants (both competitors and judges)
   - `seed = 0`: Pending approval
   - `seed > 0`: Approved (for competitors, seed determines bracket position)

2. **Matches Table**: Stores tournament matches/heats
   - Created during bracket generation
   - Links to competitors via `competitor1Id` and `competitor2Id`

3. **Heat Judges Table**: Stores judge assignments to matches
   - Links judges to matches
   - Role: `TECHNICAL` (ESPRESSO) or `SENSORY` (CAPPUCCINO)

## Common Issues & Solutions

### Issue: Judges not showing in approval tab
**Solution**: Ensure participants fetch includes `?includeJudges=true`

### Issue: Randomizer getting stuck
**Solution**: Fixed - now only randomizes baristas, not judges

### Issue: Can't add judges
**Solution**: Fixed - added proper error handling and async/await

### Issue: Bracket generation fails
**Solution**: 
- Verify at least 2 approved competitors
- Verify stations A, B, C exist
- Check server logs for specific errors

## Testing Checklist

- [ ] Add judge to tournament
- [ ] Approve judge
- [ ] Add competitor to tournament
- [ ] Approve competitor
- [ ] Randomize competitor seeds
- [ ] Generate bracket
- [ ] Assign judges to heats
- [ ] Initiate tournament

## Next Steps

After tournament is initiated:
- Judges can start scoring heats
- Competitors can be assigned to stations
- Scores are tracked and displayed
- Tournament progresses through rounds

