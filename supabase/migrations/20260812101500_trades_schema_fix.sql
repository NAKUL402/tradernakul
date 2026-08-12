-- ============================================================================
-- TRADERNAKUL: Fix missing columns from UI in the trades table
-- ============================================================================

-- 1. Add missing columns expected by the frontend
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS trade_no NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lots TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS mistakes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reason TEXT DEFAULT '';

-- 2. Modify `rrr` to TEXT because the UI allows free text inputs (like "1:3")
ALTER TABLE public.trades 
  ALTER COLUMN rrr TYPE TEXT USING rrr::text;
