# Judge Assignment Logic

## Requirements
- **3 judges per heat**: Always assign exactly 3 judges
- **Role distribution**: 1 CAPPUCCINO judge, 2 ESPRESSO judges
- **All score latte art**: All 3 judges score visual latte art
- **Sensory scoring**: 
  - 1 CAPPUCCINO judge scores Cappuccino sensory
  - 2 ESPRESSO judges score Espresso sensory
- **Staggering**: When there are fewer judges than heats, judges are reused/staggered across heats

## Current Implementation

### Assignment Endpoint: `/api/tournaments/:id/assign-judges`

**Logic**:
1. Get all approved judges (seed > 0) for tournament
2. Shuffle judges for randomization
3. For each heat:
   - Select 3 **unique** judges starting from rotation index
   - Rotate starting position for next heat to stagger judges
   - Assign roles: 2 ESPRESSO, 1 CAPPUCCINO

**Example with 5 judges and 5 heats**:
```
Heat 1: Judges [0, 1, 2] → ESPRESSO, ESPRESSO, CAPPUCCINO
Heat 2: Judges [1, 2, 3] → ESPRESSO, ESPRESSO, CAPPUCCINO
Heat 3: Judges [2, 3, 4] → ESPRESSO, ESPRESSO, CAPPUCCINO
Heat 4: Judges [3, 4, 0] → ESPRESSO, ESPRESSO, CAPPUCCINO
Heat 5: Judges [4, 0, 1] → ESPRESSO, ESPRESSO, CAPPUCCINO
```

**Key Features**:
- ✅ Ensures 3 unique judges per heat
- ✅ Staggers judges across heats (no judge judges consecutive heats)
- ✅ Works with any number of judges (as long as >= 3)
- ✅ Proper rotation prevents overloading any single judge

### Bracket Generation: Auto-Assignment

When bracket is generated, judges are automatically assigned using similar logic:
- Uses heat number to determine starting rotation index
- Ensures 3 unique judges per heat
- Staggers judges across heats

## Edge Cases Handled

1. **Fewer judges than heats**: Judges are reused with proper staggering
2. **Exactly 3 judges**: Each judge assigned to every heat (rotated)
3. **Many judges**: Judges are distributed evenly across heats
4. **Judge count not divisible by 3**: Rotation ensures even distribution

## Validation

- Minimum 3 judges required
- Each heat gets exactly 3 judges
- All 3 judges are unique within a heat
- Judges are properly staggered across heats

