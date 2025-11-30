-- Migration: Update judge_detailed_scores to use cup codes instead of left/right
-- This changes the scoring system so judges select which cup code won each category
-- instead of selecting left/right positions

-- Add new columns for cup code-based scoring
ALTER TABLE "judge_detailed_scores" 
  ADD COLUMN IF NOT EXISTS "cup_code1" text,
  ADD COLUMN IF NOT EXISTS "cup_code2" text,
  ADD COLUMN IF NOT EXISTS "winner_cup_code_visual_latte_art" text,
  ADD COLUMN IF NOT EXISTS "winner_cup_code_taste" text,
  ADD COLUMN IF NOT EXISTS "winner_cup_code_tactile" text,
  ADD COLUMN IF NOT EXISTS "winner_cup_code_flavour" text,
  ADD COLUMN IF NOT EXISTS "winner_cup_code_overall" text;

-- Migrate existing data: convert left/right to cup codes
-- For existing records, we'll populate cup_code1 and cup_code2 from leftCupCode and rightCupCode
-- and set winner_cup_code fields based on the left/right selections
UPDATE "judge_detailed_scores"
SET 
  "cup_code1" = "left_cup_code",
  "cup_code2" = "right_cup_code",
  "winner_cup_code_visual_latte_art" = CASE 
    WHEN "visual_latte_art" = 'left' THEN "left_cup_code"
    WHEN "visual_latte_art" = 'right' THEN "right_cup_code"
    ELSE NULL
  END,
  "winner_cup_code_taste" = CASE 
    WHEN "taste" = 'left' THEN "left_cup_code"
    WHEN "taste" = 'right' THEN "right_cup_code"
    ELSE NULL
  END,
  "winner_cup_code_tactile" = CASE 
    WHEN "tactile" = 'left' THEN "left_cup_code"
    WHEN "tactile" = 'right' THEN "right_cup_code"
    ELSE NULL
  END,
  "winner_cup_code_flavour" = CASE 
    WHEN "flavour" = 'left' THEN "left_cup_code"
    WHEN "flavour" = 'right' THEN "right_cup_code"
    ELSE NULL
  END,
  "winner_cup_code_overall" = CASE 
    WHEN "overall" = 'left' THEN "left_cup_code"
    WHEN "overall" = 'right' THEN "right_cup_code"
    ELSE NULL
  END;

-- Make new columns NOT NULL for future records (after migration, old columns will be deprecated)
-- Note: We keep old columns for now to maintain backward compatibility during transition

