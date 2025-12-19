# Tournament Logic - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tournament Structure](#tournament-structure)
3. [Setup & Initialization](#setup--initialization)
4. [Bracket Generation](#bracket-generation)
5. [Heat Execution Flow](#heat-execution-flow)
6. [Scoring System](#scoring-system)
7. [Cup Code Assignment](#cup-code-assignment)
8. [Winner Calculation](#winner-calculation)
9. [Round Completion](#round-completion)
10. [Next Round Population](#next-round-population)
11. [Tournament Completion](#tournament-completion)
12. [Key Components & Files](#key-components--files)

---

## Overview

The tournament system manages a multi-round elimination bracket competition with:
- **Multiple Rounds**: Progressive elimination (typically 5 rounds: 32→16→8→4→2→1)
- **3 Stations**: A, B, C running in parallel with staggered timing
- **2 Competitors per Heat**: Head-to-head matches
- **3 Judges per Heat**: 1 CAPPUCCINO judge, 2 ESPRESSO judges
- **3 Sequential Segments**: DIAL_IN, CAPPUCCINO, ESPRESSO
- **Blind Judging**: Judges score by cup position (left/right), cup codes revealed after scoring

---

## Tournament Structure

### Round Progression
```
Round 1: N Baristas → N/2 Winners
Round 2: N/2 Baristas → N/4 Winners
Round 3: N/4 Baristas → N/8 Winners
Round 4: N/8 Baristas → N/16 Winners
Round 5: 2 Baristas → 1 Champion
```

### Match Status Flow
```
PENDING → READY → RUNNING → DONE
```

### Heat Structure
Each heat consists of:
- **2 Competitors** (Baristas with cup codes)
- **3 Judges** (assigned roles: 1 CAPPUCCINO, 2 ESPRESSO)
- **3 Segments** (sequential: DIAL_IN → CAPPUCCINO → ESPRESSO)
- **1 Station** (A, B, or C)
- **Cup Positions** (left/right assignment after scoring)

---

## Setup & Initialization

### 1. Tournament Creation
- Tournament created with `status: 'SETUP'`
- Participants added with seeds (1, 2, 3, ...)
- Stations configured (A, B, C) with `status: 'AVAILABLE'`
- Round times configured per round (dial-in, cappuccino, espresso durations)

### 2. Seed Randomization
- Seeds randomized for fairness
- Cup codes generated: `BracketGenerator.generateCupCode(name, seed, index)`
- Format: First 3 letters of name + seed number (e.g., "JOH1", "MAR2")

### 3. Judge Assignment
- Judges must be approved (`seed > 0` in participants)
- Minimum 3 judges required
- Judges shuffled for randomization
- Judges assigned to heats with staggering (no consecutive heats)

### 4. Tournament Activation
- Tournament status changed to `'ACTIVE'`
- Cup codes assigned to participants missing them
- Tournament ready for bracket generation

**Key Files:**
- `server/routes.ts`: Tournament creation endpoints
- `server/bracketGenerator.ts`: Seed randomization, cup code generation

---

## Bracket Generation

### Round 1 Generation

**Process:**
1. Get all participants with seeds
2. Generate pairings using `generateRound1Pairings()`
   - Even players: Standard pairing (1 vs N, 2 vs N-1, ...)
   - Odd players: Top seed gets bye (1 vs BYE, then 2 vs N, ...)
3. Distribute matches across stations A, B, C
   - Round-robin distribution: A, B, C, A, B, C, ...
4. Assign judges to each heat
   - 3 unique judges per heat
   - Role distribution: 2 ESPRESSO, 1 CAPPUCCINO
   - Staggered across heats
5. Create matches with status `'PENDING'`
6. Create heat segments (DIAL_IN, CAPPUCCINO, ESPRESSO) with status `'PENDING'`

**Station Timing:**
- Station A: Starts immediately
- Station B: Starts +10 minutes
- Station C: Starts +20 minutes
- 10-minute buffer between heats on same station

**Key Files:**
- `server/bracketGenerator.ts`: `generateBracket()` method
- `server/routes.ts`: `/api/tournaments/:id/generate-bracket` endpoint

---

## Heat Execution Flow

### 1. Start Heat
**Trigger:** Station Lead clicks "Start Heat"

**Process:**
1. Match status: `PENDING` → `READY` → `RUNNING`
2. DIAL_IN segment automatically starts (`status: 'RUNNING'`)
3. Cup codes assigned to left/right positions (randomized)
4. Station availability updated (nextAvailableAt = current + totalMinutes + 10)

**Validation:**
- Both competitors must have cup codes
- Station must be available
- Match must be in PENDING or READY status

**Key Files:**
- `server/routes.ts`: `/api/matches/:id/start` endpoint
- `client/src/components/StationLeadView.tsx`: Start heat button

### 2. Segment Progression

**DIAL_IN Segment:**
- Station Lead starts DIAL_IN
- Baristas dial in their equipment
- Station Lead ends DIAL_IN
- Status: `RUNNING` → `ENDED`

**CAPPUCCINO Segment:**
- Can only start after DIAL_IN is ENDED
- Station Lead starts CAPPUCCINO
- Baristas prepare cappuccinos
- Judges score:
  - **All 3 judges**: Visual Latte Art (left/right)
  - **1 CAPPUCCINO judge**: Cappuccino Sensory (taste, tactile, flavour, overall)
- Station Lead ends CAPPUCCINO
- Status: `RUNNING` → `ENDED`

**ESPRESSO Segment:**
- Can only start after CAPPUCCINO is ENDED
- Station Lead starts ESPRESSO
- Baristas prepare espressos
- Judges score:
  - **2 ESPRESSO judges**: Espresso Sensory (taste, tactile, flavour, overall)
- Station Lead ends ESPRESSO
- Status: `RUNNING` → `ENDED`

**Key Files:**
- `server/routes.ts`: `/api/segments/:id/start`, `/api/segments/:id/end` endpoints
- `client/src/components/StationLeadView.tsx`: Segment controls

### 3. Judge Scoring

**Scoring Requirements:**
- **All 3 judges**: Must submit Latte Art decision (left/right)
- **1 CAPPUCCINO judge**: Must submit Cappuccino Sensory (all 4 categories)
- **2 ESPRESSO judges**: Must submit Espresso Sensory (all 4 categories)

**Scoring Interface:**
- Judges see left/right cup positions only (blind judging)
- Cup codes hidden during scoring
- Judges submit scores via `JudgeScoringView`

**Validation:**
- All required categories must be filled
- Scores locked after submission
- Global lock activates when all segments ENDED and all judges submitted

**Key Files:**
- `client/src/components/JudgeScoringView.tsx`: Judge scoring interface
- `server/storage.ts`: `getGlobalLockStatus()` method

---

## Cup Code Assignment

### When Cup Codes Are Assigned

**Before Heat Starts:**
- Cup codes assigned to participants during tournament setup
- Cup codes stay with competitor throughout tournament

**During Heat:**
- Cup codes randomly assigned to left/right positions when heat starts
- Judges see positions only (left/right), not cup codes

**After All Judges Complete Scoring:**
- Admin assigns cup codes to left/right positions
- This reveals which competitor had which position
- Required before heat can advance

### Cup Position Assignment Logic

**Requirements:**
1. All segments must be ENDED (DIAL_IN, CAPPUCCINO, ESPRESSO)
2. All judges must have completed all required scoring:
   - All 3 judges: Latte Art
   - 1 CAPPUCCINO judge: Cappuccino Sensory (all categories)
   - 2 ESPRESSO judges: Espresso Sensory (all categories)
3. Both competitors must have cup codes

**Process:**
1. Admin selects which cup code goes to left position
2. Admin selects which cup code goes to right position
3. System validates assignment
4. Cup positions stored in `match_cup_positions` table

**Validation:**
- Backend checks `getGlobalLockStatus()` before allowing assignment
- Frontend shows assignment UI only when all judges complete
- Assignment required before heat can advance

**Key Files:**
- `client/src/components/AdminCupPositionAssignment.tsx`: Assignment UI
- `server/routes.ts`: `/api/matches/:matchId/cup-positions` endpoint
- `server/storage.ts`: `getJudgeCompletionStatus()` method

---

## Winner Calculation

### When Winner Is Calculated

**Trigger:** Station Lead clicks "Complete and Advance to Next Heat"

**Prerequisites:**
1. All segments ENDED
2. All judges submitted all required scores
3. Cup positions assigned (left/right)

**Process:**
1. Get detailed scores from all judges
2. Get cup positions (left/right → cup code mapping)
3. Calculate competitor scores:
   - Map cup codes to positions
   - Sum scores for each competitor's cup code
   - Scoring breakdown:
     - Latte Art: 3 points (all 3 judges)
     - Overall: 5 points (all judges)
     - Taste, Tactile, Flavour: 1 point each (sensory judges only)
4. Compare scores:
   - Higher score wins
   - If tied, use tie-breaker rules

### Tie-Breaker Rules

If scores are tied, winner determined by:
1. **Most Overall Wins** (5pt category)
   - Count how many judges chose each competitor for "overall"
2. **Most Latte Art Wins** (3pt category)
   - Count how many judges chose each competitor for "latte art"
3. **Most Sensory Category Wins** (1pt each)
   - Count wins in taste, tactile, flavour categories
4. **Manual Resolution**
   - If still tied after all tie-breakers, requires manual resolution

**Key Files:**
- `server/utils/winnerCalculation.ts`: `calculateMatchWinner()` function
- `client/src/utils/scoreCalculation.ts`: Score calculation utilities

---

## Round Completion

### Round Completion Check

**Requirements:**
A round is complete ONLY when:
1. **All matches in round have status `'DONE'`**
2. **All matches have `winnerId` assigned**
3. **All stations with matches have completed ALL their heats**

**Validation:**
- `checkRoundCompletion()` function checks all requirements
- Returns detailed status per station
- Shows which matches are incomplete or missing winners

**Process:**
1. Get all matches for current round
2. Check each match status
3. Check each match has winner
4. Group by station and verify station completion
5. Return completion status with errors if incomplete

**Key Files:**
- `server/utils/roundCompletion.ts`: `checkRoundCompletion()` function
- `client/src/components/StationLeadView.tsx`: `isCurrentRoundComplete` check

### Round Completion UI

**Station A Lead Controls:**
- "Set Up Next Round" button appears ONLY when:
  - Station A is selected
  - All stations (A, B, C) have completed all heats in current round
  - All matches have winners assigned

**Key Files:**
- `client/src/components/StationLeadView.tsx`: Round completion UI (line 1551)

---

## Next Round Population

### When Next Round Is Populated

**Trigger:** Station A Lead clicks "Set Up Next Round"

**Prerequisites:**
1. Round completion validated via `checkRoundCompletion()`
2. All matches have winners
3. At least 2 winners (or tournament is complete)

**Process:**
1. **Validate Round Completion**
   - Check all matches DONE
   - Check all matches have winners
   - Check all stations complete

2. **Collect Winners**
   - Get all winners from current round matches
   - Validate winners are tournament participants
   - Remove duplicates
   - Check for tournament completion (1 winner = tournament done)

3. **Ensure Cup Codes**
   - Check all winners have cup codes
   - Generate cup codes if missing

4. **Create Next Round Matches**
   - Sort winners by original seed
   - Split into 3 groups for stations A, B, C
   - Create pairings within each group
   - Generate bracket structure
   - Create matches with status `'PENDING'`
   - Assign to stations in round-robin
   - Create heat segments (DIAL_IN, CAPPUCCINO, ESPRESSO)
   - Assign judges (3 per heat, staggered)

5. **Update Tournament**
   - Update `currentRound` to next round
   - Emit WebSocket events for round completion and next round populated

**Station Distribution:**
- Winners distributed evenly across stations A, B, C
- Maintains bracket order (sorted by seed)
- Round-robin assignment to stations

**Key Files:**
- `server/routes.ts`: `/api/tournaments/:id/populate-next-round` endpoint (line 1756)
- `server/bracketGenerator.ts`: `generateNextRound()` method

---

## Tournament Completion

### Tournament Completion Detection

**When Tournament Completes:**
- After round completion check
- Only 1 winner remains
- Tournament status can be updated to `'COMPLETE'`

**Process:**
1. Check winners after round completion
2. If only 1 winner:
   - Update tournament status
   - Emit tournament completion event
   - Return tournament complete response
3. If 2+ winners:
   - Continue to next round

**Key Files:**
- `server/routes.ts`: Tournament completion check in `populate-next-round` (line 1871)

---

## Key Components & Files

### Backend

**Core Logic:**
- `server/bracketGenerator.ts`: Bracket generation, pairing logic, station assignment
- `server/utils/winnerCalculation.ts`: Winner calculation and tie-breaking
- `server/utils/roundCompletion.ts`: Round completion validation
- `server/storage.ts`: Database operations, judge completion status, global lock status

**API Endpoints:**
- `server/routes.ts`: All tournament, match, segment, judge endpoints

**Key Endpoints:**
- `POST /api/tournaments/:id/generate-bracket`: Generate Round 1 bracket
- `POST /api/tournaments/:id/populate-next-round`: Populate next round from winners
- `POST /api/matches/:id/start`: Start a heat
- `POST /api/segments/:id/start`: Start a segment
- `POST /api/segments/:id/end`: End a segment
- `POST /api/matches/:matchId/cup-positions`: Assign cup positions
- `POST /api/stations/:stationId/advance-heat`: Complete heat and advance
- `GET /api/matches/:id/global-lock-status`: Check if scoring is locked

### Frontend

**Core Components:**
- `client/src/components/StationLeadView.tsx`: Station lead interface, heat management
- `client/src/components/JudgeScoringView.tsx`: Judge scoring interface
- `client/src/components/AdminCupPositionAssignment.tsx`: Cup position assignment
- `client/src/components/TournamentBracket.tsx`: Bracket visualization

**Utilities:**
- `client/src/utils/scoreCalculation.ts`: Score calculation logic

### Database Schema

**Key Tables:**
- `tournaments`: Tournament metadata
- `tournament_participants`: Participants with seeds and cup codes
- `matches`: Individual heats/matches
- `heat_segments`: Segment timing and status
- `heat_judges`: Judge assignments per heat
- `judge_detailed_scores`: Detailed scoring data
- `match_cup_positions`: Cup code to position mapping
- `stations`: Station configuration and availability

---

## Workflow Summary

### Complete Heat Flow
```
1. Tournament Setup
   → Randomize seeds
   → Generate cup codes
   → Assign judges

2. Generate Round 1 Bracket
   → Create matches
   → Assign to stations
   → Assign judges

3. Start Heat
   → Match: PENDING → RUNNING
   → DIAL_IN segment starts
   → Cup codes assigned to positions

4. Execute Segments
   → DIAL_IN: Baristas dial in
   → CAPPUCCINO: Baristas prepare, judges score
   → ESPRESSO: Baristas prepare, judges score

5. Complete Scoring
   → All judges submit scores
   → All segments ENDED
   → Global lock activated

6. Assign Cup Positions
   → Admin assigns cup codes to left/right
   → Required before advancing

7. Calculate Winner
   → Scores calculated by cup code
   → Winner determined
   → Match status: DONE

8. Advance Heat
   → Next heat in queue starts
   → Or heat queue empty

9. Complete Round
   → All stations complete all heats
   → All matches have winners

10. Populate Next Round
    → Collect winners
    → Create next round matches
    → Distribute across stations
    → Assign judges

11. Repeat Steps 3-10 until tournament complete
```

---

## Important Notes

### Cup Code System
- Cup codes stay with competitors throughout tournament
- Cup codes assigned to participants during setup
- Cup codes randomly assigned to left/right positions at heat start
- Cup positions (left/right → cup code) assigned after all scoring complete
- This enables blind judging (judges see positions, not identities)

### Judge Assignment
- 3 judges per heat (always)
- 1 CAPPUCCINO judge, 2 ESPRESSO judges
- All 3 judges score latte art
- Judges staggered across heats (no consecutive heats)
- Works with any number of judges (minimum 3)

### Station Management
- 3 stations (A, B, C) run in parallel
- Staggered timing: A (+0), B (+10), C (+20) minutes
- 10-minute buffer between heats on same station
- Station availability tracked via `nextAvailableAt`

### Scoring Validation
- All segments must END before cup positions can be assigned
- All judges must complete all required scoring before advancing
- Cup positions must be assigned before winner calculation
- Winner must be calculated before heat can be marked DONE

### Round Progression
- Round completion checked per station
- All stations must complete before next round can populate
- Only Station A lead can trigger next round population
- Winners distributed evenly across stations in next round

---

## Error Handling

### Common Validation Errors
- "All segments must be completed before advancing"
- "All judges must complete scoring before advancing"
- "Cup codes must be assigned to left/right positions before advancing"
- "Round is not complete. X match(es) not yet completed"
- "Round is not complete. X match(es) missing winners"
- "Insufficient winners to create next round"

### Recovery Procedures
- Judges can be reassigned if needed
- Cup positions can be reassigned if incorrect
- Matches can be manually completed if calculation fails
- Tournament can be paused/resumed via status management

---

*Last Updated: Based on current codebase implementation*

