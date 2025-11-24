# Spreadsheet Data Reorganization

## Overview

Created a script that uses Excel parsing (via `xlsx` library) to reorganize the Google Sheets tournament data into a clean, structured format.

## What Was Done

### 1. **Excel Download & Parsing**
   - Downloads Google Sheets as Excel format (`.xlsx`)
   - Parses the Excel file using the `xlsx` library
   - Extracts all rows and columns from the spreadsheet

### 2. **Data Reorganization**
   The data is now organized in a hierarchical structure:
   ```
   Tournament
   └── Heats (17 total)
       └── Judge Scores
           ├── CAPPUCCINO scores
           └── ESPRESSO scores
   ```

### 3. **Data Structure**

The reorganized data follows this structure:

```typescript
interface ReorganizedTournamentData {
  heats: ReorganizedHeat[];
  summary: {
    totalHeats: number;
    totalJudges: number;
    uniqueJudges: string[];
  };
}

interface ReorganizedHeat {
  heatNumber: number;
  heatName: string;
  competitor1CupCode?: string;
  competitor2CupCode?: string;
  judgeScores: ReorganizedJudgeScore[];
}

interface ReorganizedJudgeScore {
  judgeName: string;
  beverage: 'CAPPUCCINO' | 'ESPRESSO';
  leftCupCode: string;
  rightCupCode: string;
  visualLatteArt?: 'left' | 'right'; // Only for CAPPUCCINO
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}
```

## Results

✅ **Successfully processed:**
- **17 heats** (Heat 12-31, excluding some)
- **8 unique judges** (Ali, Boss, Jasper, Junior, Korn, Michalis, Shinsaku, Tess)
- **204 rows** of raw data parsed and reorganized

## Output File

The reorganized data is saved to:
```
scripts/reorganized-tournament-data.json
```

## Benefits

1. **Structured Format**: Data is now organized by Heat → Judge → Beverage
2. **Easy to Import**: JSON format can be directly used for database imports
3. **Clean Data**: Normalized judge names, cup codes, and score values
4. **Automated**: No manual copying/pasting needed
5. **Repeatable**: Can re-run script to sync latest spreadsheet data

## Usage

### Run the reorganization script:
```bash
npx tsx scripts/reorganize-spreadsheet-data.ts
```

### Use the output JSON:
The generated `reorganized-tournament-data.json` can be:
- Imported into the database
- Used to create new tournaments
- Used to verify existing tournament data
- Used as a reference for data structure

## Next Steps

1. **Create Import Script**: Use the reorganized JSON to create a script that imports this data into the database
2. **Update Tournament Creation**: Modify `create-wec2025-tournament-2-fixed.ts` to use the reorganized JSON instead of hardcoded data
3. **Automate Sync**: Set up a cron job or webhook to automatically sync spreadsheet changes

## Excel MCP Integration

While the Excel MCP server is configured in `mcp.json`, this script uses the `xlsx` Node.js library directly for parsing. The Excel MCP could be used in the future for:
- Reading Excel files via MCP functions
- Writing reorganized data back to Excel
- Real-time spreadsheet updates

## Files Created

- `scripts/reorganize-spreadsheet-data.ts` - Main reorganization script
- `scripts/reorganized-tournament-data.json` - Output JSON file
- `EXCEL_MCP_SETUP.md` - Documentation for Excel/Google Sheets MCP setup


