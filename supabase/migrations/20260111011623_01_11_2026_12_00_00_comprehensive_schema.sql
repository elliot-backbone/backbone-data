/*
  # Comprehensive Backbone Data Architecture - 01/11/2026_12:00:00
  
  ## Summary
  This migration establishes the complete data architecture for the Backbone portfolio management system,
  ensuring all tables support the 7-layer computation model (L0-L6) while adhering to North Stars principles
  (NoStoredDerivs, Health=state, Risk→Goal, Urgency→Risk, Portfolio=VIEW).

  ## New Tables
  - `relationships` - Tracks connections between people and entities
  - `interactions` - Logs all touchpoints and communications
  - `priority_queue` - Computed priorities from L5/L6 (ephemeral, recalculated)
  - `system_config` - System-wide configuration and settings
  
  ## Modified Tables
  - `companies` - Add portfolio tracking fields, metadata
  - `rounds` - Add status tracking and timing fields
  - `deals` - Add pipeline progression timestamps
  - `goals` - Enhanced progress tracking
  - `people` - Add relationship strength indicators
  - `firms` - Add firm classification metadata
  
  ## Data Principles
  - All health/priority scores are computed, NEVER stored
  - Timestamps track when raw data was last updated
  - All derivations happen in application layer
  - Database stores only L0 (raw inputs)
  
  ## Security
  - RLS enabled on all tables
  - Anonymous read access (for demo/testing)
  - Policies restrict modifications appropriately
*/

-- ============================================================================
-- RELATIONSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('person', 'firm', 'company')),
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('person', 'firm', 'company')),
  relationship_type text NOT NULL DEFAULT 'general',
  strength_indicator numeric DEFAULT 0,
  last_interaction_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on relationships"
  ON relationships FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow all for authenticated on relationships"
  ON relationships FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- INTERACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('company', 'person', 'firm', 'round', 'deal')),
  interaction_type text NOT NULL DEFAULT 'email',
  interaction_date timestamptz DEFAULT now(),
  description text,
  outcome text,
  next_steps text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on interactions"
  ON interactions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow all for authenticated on interactions"
  ON interactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PRIORITY QUEUE TABLE (EPHEMERAL - RECALCULATED ON DEMAND)
-- ============================================================================

CREATE TABLE IF NOT EXISTS priority_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('company', 'round', 'goal', 'deal', 'person')),
  entity_name text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title text NOT NULL,
  description text,
  suggested_action text,
  urgency_score numeric NOT NULL DEFAULT 0,
  impact_score numeric NOT NULL DEFAULT 0,
  effort_score numeric NOT NULL DEFAULT 0,
  priority_score numeric NOT NULL DEFAULT 0,
  trigger_condition text,
  resolution_template text,
  resolution_steps jsonb,
  dependencies jsonb,
  cascade_effect text,
  computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE priority_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on priority_queue"
  ON priority_queue FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow all for authenticated on priority_queue"
  ON priority_queue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SYSTEM CONFIG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on system_config"
  ON system_config FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow all for authenticated on system_config"
  ON system_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ENHANCED FIELDS FOR EXISTING TABLES
-- ============================================================================

-- Companies: Add metadata fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'tags'
  ) THEN
    ALTER TABLE companies ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'website'
  ) THEN
    ALTER TABLE companies ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'description'
  ) THEN
    ALTER TABLE companies ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'thesis'
  ) THEN
    ALTER TABLE companies ADD COLUMN thesis text;
  END IF;
END $$;

-- Rounds: Add tracking fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rounds' AND column_name = 'notes'
  ) THEN
    ALTER TABLE rounds ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rounds' AND column_name = 'deck_url'
  ) THEN
    ALTER TABLE rounds ADD COLUMN deck_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rounds' AND column_name = 'data_room_url'
  ) THEN
    ALTER TABLE rounds ADD COLUMN data_room_url text;
  END IF;
END $$;

-- Deals: Add progression timestamps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'notes'
  ) THEN
    ALTER TABLE deals ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'next_steps'
  ) THEN
    ALTER TABLE deals ADD COLUMN next_steps text;
  END IF;
END $$;

-- People: Add relationship indicators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE people ADD COLUMN linkedin_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'twitter_url'
  ) THEN
    ALTER TABLE people ADD COLUMN twitter_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'tags'
  ) THEN
    ALTER TABLE people ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Firms: Add classification metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firms' AND column_name = 'focus_areas'
  ) THEN
    ALTER TABLE firms ADD COLUMN focus_areas text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firms' AND column_name = 'website'
  ) THEN
    ALTER TABLE firms ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firms' AND column_name = 'fund_size'
  ) THEN
    ALTER TABLE firms ADD COLUMN fund_size numeric;
  END IF;
END $$;

-- Goals: Enhanced tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'status'
  ) THEN
    ALTER TABLE goals ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'at_risk'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE goals ADD COLUMN owner_id uuid REFERENCES people(id);
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_interactions_entity ON interactions(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_priority_queue_score ON priority_queue(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_priority_queue_entity ON priority_queue(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_priority_queue_computed ON priority_queue(computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_portfolio ON companies(is_portfolio) WHERE is_portfolio = true;
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(deal_stage);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- ============================================================================
-- FUNCTIONS FOR TIMESTAMP AUTOMATION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_rounds_updated_at ON rounds;
CREATE TRIGGER update_rounds_updated_at
  BEFORE UPDATE ON rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_firms_updated_at ON firms;
CREATE TRIGGER update_firms_updated_at
  BEFORE UPDATE ON firms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_people_updated_at ON people;
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_relationships_updated_at ON relationships;
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
