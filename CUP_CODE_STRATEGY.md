# Cup Code Assignment Strategy

## Current Implementation: Option A - Persistent Per Barista

### How It Works
- **Cup codes are assigned to baristas at tournament setup/activation**
- **Each barista keeps the same cup code throughout the entire tournament**
- Cup codes are stored on the `TournamentParticipant` table
- Format: First 2 letters of name + seed number (e.g., "JOH1", "MAR2")

### Assignment Flow
1. **Tournament Setup**: Participants added with seeds
2. **Tournament Activation**: Cup codes generated and assigned to all barista participants
   - Location: `server/routes.ts:1366-1385` (`/api/tournament-mode/:tournamentId/activate`)
   - Uses: `BracketGenerator.generateCupCode(user.name, participant.seed, participant.seed - 1)`
3. **Bracket Generation**: Cup codes already exist, no new assignment needed
4. **Next Round Population**: Winners keep their existing cup codes (generated if missing as safety)

### Advantages
✅ **Consistency**: Same cup code throughout tournament makes tracking easier
✅ **Simplicity**: One assignment at the start, no per-heat logic needed
✅ **Audit Trail**: Cup code stays with barista, easier to track performance across rounds
✅ **Blind Judging**: Judges still see left/right positions, cup codes revealed after scoring
✅ **Current Implementation**: Already working and tested

### Disadvantages
❌ **No Per-Heat Randomization**: Same cup code in every heat (but positions are randomized)
❌ **Potential Pattern Recognition**: If judges see same cup code multiple times, might recognize patterns

---

## Alternative: Option B - Per Heat Assignment

### How It Would Work
- **Two cup codes assigned to each heat** (not to baristas)
- **Cup codes assigned when baristas are placed in bracket for that heat**
- Cup codes could be heat-specific (e.g., "H1L", "H1R" for Heat 1 Left/Right)
- Or randomly generated per heat

### Advantages
✅ **Maximum Blindness**: New cup codes every heat, no pattern recognition
✅ **Heat Isolation**: Each heat completely independent

### Disadvantages
❌ **Complexity**: Need to assign cup codes for every heat in every round
❌ **No Consistency**: Harder to track barista performance across rounds
❌ **More Data**: Need to store cup codes per match, not per participant
❌ **Implementation Overhead**: Significant code changes required

---

## Recommendation: **Keep Option A (Current Implementation)**

### Rationale
1. **Blind Judging is Already Achieved**: 
   - Judges score by position (left/right), not cup code
   - Cup codes are only revealed AFTER all scoring is complete
   - Positions are randomized at heat start

2. **Operational Simplicity**:
   - One assignment at tournament start
   - No per-heat assignment logic needed
   - Easier for station leads and admins to track

3. **Audit and Tracking**:
   - Easier to track a barista's performance across rounds
   - Cup code becomes a consistent identifier
   - Better for statistics and reporting

4. **Current System Works**:
   - Already implemented and tested
   - No known issues with pattern recognition
   - Judges don't see cup codes during scoring

### When to Consider Option B
- If judges report recognizing patterns despite blind judging
- If tournament rules require per-heat cup code assignment
- If there are specific security/anti-cheating requirements

---

## Current Code Locations

### Cup Code Generation
- **File**: `server/bracketGenerator.ts`
- **Function**: `BracketGenerator.generateCupCode(name, seed, index)`
- **Format**: First 2 letters (uppercase) + seed number

### Cup Code Assignment
- **File**: `server/routes.ts`
- **Endpoint**: `POST /api/tournament-mode/:tournamentId/activate`
- **Lines**: 1366-1385
- **Trigger**: Tournament activation

### Cup Code Storage
- **Table**: `tournament_participants`
- **Column**: `cup_code` (string)
- **Persistence**: Stays with participant throughout tournament

### Cup Position Assignment (Different from Cup Code Assignment)
- **File**: `client/src/components/AdminCupPositionAssignment.tsx`
- **Endpoint**: `POST /api/matches/:matchId/cup-positions`
- **Purpose**: Assigns cup codes to left/right positions AFTER scoring
- **This is NOT the same as initial cup code assignment**

---

## Summary

**Current Strategy**: Option A - Persistent per barista ✅
- Cup codes assigned at tournament activation
- Same cup code throughout tournament
- Positions randomized per heat for blind judging
- Recommended to keep this approach

**Alternative**: Option B - Per heat assignment
- Would require significant refactoring
- Only consider if specific requirements demand it
- Not recommended unless there's a clear need

