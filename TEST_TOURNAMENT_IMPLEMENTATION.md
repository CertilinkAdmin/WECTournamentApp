# Test Tournament Implementation Summary

## ✅ Completed

### 1. Test Tournament Isolation
- ✅ Test tournaments are automatically marked with "Test" prefix if not present
- ✅ Test users have unique emails per tournament: `test-barista-{tournamentId}-{index}-{timestamp}@test.com`
- ✅ Test judges have unique emails per tournament: `test-judge-{tournamentId}-{index}-{timestamp}@test.com`
- ✅ Prevents test data from mixing with real tournament data

### 2. Size Selection
- ✅ Added UI form with inputs for:
  - Tournament name (defaults to "Test Tournament")
  - Number of baristas (2-64)
  - Number of judges (1-20)
- ✅ Validation on both client and server side
- ✅ Clear error messages for invalid inputs

### 3. Stations Creation
- ✅ Stations are now created with `tournamentId` for proper partitioning
- ✅ Fixed in both regular tournament creation and test tournament creation
- ✅ Each tournament gets its own set of stations (A, B, C)

### 4. Endpoint Updates

#### POST `/api/admin/seed-test-data`
**Request Body:**
```json
{
  "tournamentName": "Test Tournament",  // Optional, defaults to "Test Tournament"
  "numBaristas": 16,                    // Required, 2-64
  "numJudges": 9                        // Required, 1-20
}
```

**Response:**
```json
{
  "success": true,
  "tournament": { ... },
  "baristasCreated": 16,
  "judgesCreated": 9,
  "stationsCreated": 3,
  "message": "Test tournament \"Test Tournament\" created with 16 baristas, 9 judges, and 3 stations"
}
```

#### DELETE `/api/admin/clear-test-data`
- ✅ Properly deletes all test tournament data
- ✅ Cleans up in correct order (scores → judges → segments → matches → participants → stations → round times → tournament)
- ✅ Identifies test tournaments by name containing "test" or "demo"
- ✅ Returns count of cleared tournaments

### 5. UI Updates
- ✅ Created `TestTournamentForm` component with:
  - Tournament name input
  - Number of baristas input (with validation)
  - Number of judges input (with validation)
  - Create button with loading state
  - Helpful tooltips and descriptions
- ✅ Integrated into AdminDashboard
- ✅ Shows success/error toasts

### 6. Data Integrity
- ✅ Judges are NOT added as participants (they judge, not compete)
- ✅ Only baristas are added as tournament participants
- ✅ All foreign key relationships maintained
- ✅ Proper cleanup order prevents constraint violations

## 🔍 Key Features

### Test Tournament Identification
Test tournaments are identified by:
1. Name containing "test" (case-insensitive)
2. Name containing "demo" (case-insensitive)
3. Users with test email patterns

### Isolation Mechanisms
1. **Unique Emails**: Each test user has a unique email including tournament ID and timestamp
2. **Tournament-Specific Stations**: Stations are created per tournament
3. **Name Prefixing**: Test tournaments automatically get "Test Tournament: " prefix if not present
4. **Separate Cleanup**: Clear test data only affects test tournaments

### Validation
- **Baristas**: Must be between 2 and 64 (power of 2 recommended for brackets)
- **Judges**: Must be between 1 and 20
- **Tournament Name**: Required, non-empty string

## 📋 Usage

### Creating a Test Tournament

1. Navigate to Admin Dashboard
2. Go to "Test Data Seeding" section
3. Enter:
   - Tournament name (optional, defaults to "Test Tournament")
   - Number of baristas (2-64)
   - Number of judges (1-20)
4. Click "Create Test Tournament"
5. Wait for success message

### Clearing Test Data

1. Navigate to Admin Dashboard
2. Click "Clear Test Data" button
3. Confirm deletion
4. All test tournaments and their data will be deleted

## 🛡️ Safety Features

1. **Automatic Marking**: Test tournaments are automatically marked
2. **Isolation**: Test data cannot mix with real tournaments
3. **Validation**: Input validation prevents invalid data
4. **Cleanup**: Proper cleanup order prevents database errors
5. **Error Handling**: Comprehensive error messages

## 🔧 Technical Details

### Database Changes
- Stations now require `tournamentId` (added in migration 0003)
- Foreign key constraints ensure referential integrity
- Indexes on `tournament_id` for performance

### API Changes
- `/api/admin/seed-test-data` - Enhanced with validation and isolation
- `/api/admin/clear-test-data` - Enhanced cleanup logic
- `/api/tournaments` - Stations created with tournament_id

### Component Changes
- `AdminDashboard.tsx` - Added TestTournamentForm component
- Form includes validation and loading states
- Clear error messages for users

## 📝 Notes

- Test tournaments are created with status "SETUP"
- Judges are created but NOT added as participants (they judge matches)
- Only baristas are added as tournament participants
- Stations A, B, C are created for each tournament
- All test users are automatically approved

## 🚀 Next Steps (Optional)

- [ ] Add preset sizes (8, 16, 32, 64 baristas)
- [ ] Add option to create test matches/brackets
- [ ] Add option to populate test scores
- [ ] Add test tournament filtering in tournament list
- [ ] Add visual indicator for test tournaments

