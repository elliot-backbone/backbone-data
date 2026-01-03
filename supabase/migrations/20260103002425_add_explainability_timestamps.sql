/*
  # Add Explainability Timestamps

  ## Overview
  Adds timestamp tracking for critical input values to enable data freshness validation
  and explainability. Every input value that drives priority calculations must have
  an associated "last verified" timestamp.

  ## Changes
  
  ### Companies Table
  - `cash_on_hand_updated_at` - Tracks when cash position was last verified
  - `monthly_burn_updated_at` - Tracks when burn rate was last verified
  - `mrr_updated_at` - Tracks when MRR was last verified
  
  ### Goals Table
  - `current_value_updated_at` - Tracks when progress was last updated
  
  ### Deals Table
  - `stage_entry_date` - Tracks when deal entered current stage
  
  ## Rationale
  Per North Stars principle: "If a value can't be explained → it's a liability"
  Timestamps enable:
  - Detection of stale data driving priority scores
  - Predictive alerting (data aging toward staleness threshold)
  - Explainability of how urgency was calculated
*/

-- Add explainability timestamps to companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'cash_on_hand_updated_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN cash_on_hand_updated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'monthly_burn_updated_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN monthly_burn_updated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'mrr_updated_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN mrr_updated_at timestamptz;
  END IF;
END $$;

-- Add explainability timestamps to goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'current_value_updated_at'
  ) THEN
    ALTER TABLE goals ADD COLUMN current_value_updated_at timestamptz;
  END IF;
END $$;

-- Add explainability timestamps to deals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deals' AND column_name = 'stage_entry_date'
  ) THEN
    ALTER TABLE deals ADD COLUMN stage_entry_date timestamptz;
  END IF;
END $$;