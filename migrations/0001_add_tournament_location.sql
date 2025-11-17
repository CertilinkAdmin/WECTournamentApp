-- Add location field to tournaments table
ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "location" text;

