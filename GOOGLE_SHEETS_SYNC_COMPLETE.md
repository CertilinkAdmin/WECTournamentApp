# Google Sheets Data Sync - Complete

## Summary

Successfully synced database with Google Sheets data for Heats 12, 13, 19, 21, and 22.

## Key Understanding

**CUP CODES ARE ASSIGNED TO COMPETITORS, NOT JUDGES**

This means:
- Each competitor has a fixed cup code (e.g., Stevo = M7, Edwin = K9)
- Different judges may have different left/right cup assignments
- For example:
  - Judge A: Left = M7 (Stevo), Right = K9 (Edwin)
  - Judge B: Left = K9 (Edwin), Right = M7 (Stevo)

## Changes Made

1. **Updated Judge Name Mappings**: MC → Michalis, JASPER → Jasper, Shin → Shinsaku
2. **Synced Judge Detailed Scores**: Updated/inserted all judge scores from Google Sheets
3. **Recalculated Competitor Totals**: Fixed score calculation to account for competitor-to-cup-code mapping

## Scripts Created

- `scripts/verify-google-sheets-data.ts` - Verifies database against Google Sheets
- `scripts/sync-google-sheets-data-manual.ts` - Syncs verified scores to database

## Next Steps

To sync additional heats, add them to:
1. `VERIFIED_SCORES` - Judge detailed scores
2. `COMPETITOR_CUP_CODES` - Competitor to cup code mappings

Then run: `npx tsx scripts/sync-google-sheets-data-manual.ts`

