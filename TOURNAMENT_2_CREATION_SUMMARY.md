# Tournament 2 Creation Summary

## Overview
Created a second WEC 2025 Milano tournament with all results imported from the Google Sheets spreadsheet, including bye rounds carried over from tournament 1.

## Tournament Details
- **Tournament ID**: 28 (latest)
- **Name**: WEC 2025 Milano #2
- **Status**: COMPLETED
- **Location**: Milano
- **Total Rounds**: 5
- **Current Round**: 5

## Structure

### Participants
- **Competitors**: 9 baristas
- **Judges**: 7 judges
- **Stations**: 3 stations (A, B, C)

### Matches
- **Total Matches**: 14
- **Bye Matches**: 9 (carried over from tournament 1 structure)
- **Regular Matches**: 5 (from spreadsheet data)

### Bye Matches Created
The script replicated the bye structure from tournament 1:
- Tournament 1 had 13 bye matches in Round 1
- Tournament 2 has 9 competitors, so 9 bye matches were created
- Byes are assigned to the first 9 competitors (seeds 1-9)
- All bye matches are marked as DONE with automatic winners

### Regular Matches (from Spreadsheet)
1. **Heat 12**: Stevo (M7) vs Edwin (K9) - Scores: 32 vs 17
2. **Heat 13**: Kirill (F5) vs Anja (X1) - Scores: 29 vs 12
3. **Heat 19**: Artur (G2) vs Julian (W8) - Scores: 19 vs 8
4. **Heat 21**: Faiz (Q5) vs Christos (B1) - Scores: 10 vs 17
5. **Heat 22**: Danielle (T8) vs Stevo (J7) - Scores: 11 vs 0

## Data Imported

### Judge Scores
- **Total Detailed Scores**: 16 entries
- Judges assigned: MC (Michalis), Korn, JASPER (Jasper), Shin (Shinsaku), Ali, Junior, Tess
- Scores include:
  - CAPPUCCINO: Visual Latte Art (3pts), Taste (1pt), Tactile (1pt), Flavour (1pt), Overall (5pts)
  - ESPRESSO: Taste (1pt), Tactile (1pt), Flavour (1pt), Overall (5pts)

### Score Calculation
- Visual Latte Art: 3 points (CAPPUCCINO only)
- Taste: 1 point
- Tactile: 1 point
- Flavour: 1 point
- Overall: 5 points (separate category, added to total)

## Script Location
`scripts/create-wec2025-tournament-2-fixed.ts`

## Next Steps
1. Verify all scores match the spreadsheet
2. Check that bye matches are properly displayed in the UI
3. Ensure tournament 2 can be viewed and results displayed correctly

