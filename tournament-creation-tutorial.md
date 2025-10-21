# 🏆 Tournament Creation Tutorial
## Step-by-Step Guide with Toast Notifications

### Overview
This tutorial walks you through creating a complete tournament using the ABC Tournament System. You'll see helpful toast notifications at each step to guide you through the process.

---

## 📋 **Step 1: Access Tournament Setup**

1. **Navigate to Admin View**
   - Open the application
   - Ensure you're in "Admin" role (top-right dropdown)
   - You'll see the tournament setup interface

2. **Toast Notification Expected:**
   ```
   ✅ Welcome to Tournament Setup
   Ready to create your tournament!
   ```

---

## 🏁 **Step 2: Create Tournament**

1. **Enter Tournament Details**
   - **Tournament Name**: Enter a descriptive name (e.g., "Spring Coffee Championship")
   - **Description**: Add optional details about the tournament
   - **Total Competitors**: Set the expected number (flexible - any number works!)

2. **Click "Create Tournament"**

3. **Toast Notification Expected:**
   ```
   ✅ Tournament Created Successfully
   "Spring Coffee Championship" has been created and is ready for setup.
   ```

---

## 👥 **Step 3: Add Competitors**

### Option A: Add All Competitors at Once
1. **Click "Add All Competitors"** button
2. **Toast Notification Expected:**
   ```
   ✅ Competitors Added
   Successfully added 12 competitors to the tournament.
   ```

### Option B: Select Competitors Manually
1. **Use Participant Selection Panel**
   - Browse through available competitors
   - Select at least 2 competitors (minimum requirement)
   - Select at least 3 judges (minimum requirement)

2. **Toast Notifications Expected:**
   ```
   ⚠️ Insufficient Competitors
   Please select at least 2 competitors for the tournament.
   ```
   
   ```
   ⚠️ Insufficient Judges  
   Please select at least 3 judges for the tournament.
   ```

3. **When Requirements Met:**
   ```
   ✅ Participants Selected
   12 competitors and 6 judges selected for tournament.
   ```

---

## 🎲 **Step 4: Randomize Seeds**

1. **Click "Randomize Seeds"** button
2. **Toast Notification Expected:**
   ```
   ✅ Seeds Randomized
   Participant seeds have been shuffled randomly.
   ```

3. **Visual Confirmation:**
   - See the seed numbers change in the participant list
   - Seeds are now randomized (1, 2, 3, 4, 5, 6...)

---

## 🏗️ **Step 5: Generate Bracket**

1. **Click "Generate Bracket"** button
2. **Toast Notification Expected:**
   ```
   ✅ Bracket Generated
   Tournament bracket has been created with all rounds.
   ```

3. **What Happens:**
   - Matches are created for Round 1
   - Stations A, B, C are assigned with staggered timing
   - Future rounds are prepared as placeholders
   - Byes are automatically handled for odd participant counts

---

## ⏰ **Step 6: Verify Station Timing**

**Station Assignment (Automatic):**
- **Station A**: Starts immediately
- **Station B**: Starts +10 minutes  
- **Station C**: Starts +20 minutes

**Toast Notification Expected:**
```
✅ Stations Configured
Station timing: A (immediate), B (+10min), C (+20min)
```

---

## 🧹 **Step 7: Clear Tournament (Optional)**

1. **Click "Clear Tournament"** button
2. **Toast Notification Expected:**
   ```
   ✅ Tournament Cleared
   All tournament data has been removed successfully.
   ```

3. **What Gets Cleared:**
   - All participants removed
   - All matches deleted
   - All segment times cleared
   - Database cleaned completely

---

## 🎯 **Success Indicators**

### ✅ **Tournament Ready When You See:**
- Tournament name displayed in header
- Participant count shows correct numbers
- Bracket shows matches with station assignments
- No error toasts

### ⚠️ **Common Issues & Solutions:**

**Issue**: "No tournament selected"
**Solution**: Create a tournament first

**Issue**: "Insufficient competitors"  
**Solution**: Add at least 2 competitors

**Issue**: "Insufficient judges"
**Solution**: Add at least 3 judges

**Issue**: "Bracket generation failed"
**Solution**: Ensure participants are added and seeds are set

---

## 📊 **Tournament Status Flow**

```
1. SETUP → 2. PARTICIPANTS → 3. SEEDS → 4. BRACKET → 5. READY
   ↓           ↓                ↓         ↓          ↓
Create      Add People      Randomize   Generate   Start!
Tournament   (2+ comp,      Seeds      Matches    Competition
             3+ judges)
```

---

## 🎉 **Final Success Toast**

When everything is complete, you'll see:
```
🏆 Tournament Ready!
"Spring Coffee Championship" is ready to begin with 12 competitors.
Station timing configured and bracket generated.
```

---

## 💡 **Pro Tips**

1. **Flexible Participant Counts**: The system handles any number of participants (2, 6, 7, 12, 15, 22+)
2. **Automatic Byes**: Odd participant counts get automatic byes for the top seed
3. **Station Independence**: A, B, C stations run on their own schedules
4. **Easy Reset**: Use "Clear Tournament" to start over anytime
5. **Real-time Updates**: All changes are saved immediately to the database

---

## 🚀 **You're Ready!**

Your tournament is now fully configured and ready to run. The system will handle all the complex bracket logic, station timing, and match management automatically.

**Happy Tournament Running!** ☕🏆
