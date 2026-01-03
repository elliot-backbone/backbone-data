/*
  # Remove Stored Derivations (NoStoredDerivs Enforcement)

  1. Violations Detected
    - `companies.arr` - Derivable from mrr * 12
    - `companies.runway` - Derivable from cash_on_hand / monthly_burn
    - `goals.is_on_track` - Derivable from progress vs deadline

  2. Changes
    - Drop arr column from companies table
    - Drop runway column from companies table
    - Drop is_on_track column from goals table

  3. Architecture
    - All these values are already computed in derivations.js
    - This enforces the NoStoredDerivs North Star principle
    - Values will be calculated on-the-fly during runtime

  4. Impact
    - Reduces database storage
    - Eliminates risk of stale derived data
    - Forces computation layer to be single source of truth
*/

-- Drop derived columns from companies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'arr'
  ) THEN
    ALTER TABLE companies DROP COLUMN arr;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'runway'
  ) THEN
    ALTER TABLE companies DROP COLUMN runway;
  END IF;
END $$;

-- Drop derived column from goals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'is_on_track'
  ) THEN
    ALTER TABLE goals DROP COLUMN is_on_track;
  END IF;
END $$;
