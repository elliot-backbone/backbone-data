/*
  # Create Core Backbone Entities Schema

  ## Overview
  Creates the foundational database schema for Backbone CRM V8, implementing tables for portfolio management, investor tracking, fundraising, and goal management.

  ## New Tables
  
  ### 1. firms
  Investor firms (VC funds, angel syndicates, family offices, etc.)
  - `id` (uuid, primary key)
  - `name` (text) - Firm name
  - `firm_type` (text) - Type: vc, angel_syndicate, family_office, corporate_vc, accelerator
  - `typical_check_min` (integer) - Minimum check size
  - `typical_check_max` (integer) - Maximum check size
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. people
  Founders, investors, operators, advisors, and employees
  - `id` (uuid, primary key)
  - `first_name` (text)
  - `last_name` (text)
  - `email` (text, unique)
  - `role` (text) - founder, investor, operator, advisor, employee
  - `firm_id` (uuid, nullable) - References firms for investors
  - `title` (text, nullable)
  - `last_contacted_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. companies
  Portfolio and pipeline companies
  - `id` (uuid, primary key)
  - `name` (text)
  - `is_portfolio` (boolean) - Portfolio company vs pipeline
  - `founder_id` (uuid) - References people
  - `founded_at` (timestamptz, nullable)
  - `country` (text)
  - `cash_on_hand` (numeric) - Current cash balance
  - `monthly_burn` (numeric) - Monthly burn rate
  - `mrr` (numeric) - Monthly recurring revenue
  - `arr` (numeric) - Annual recurring revenue
  - `runway` (numeric) - Months of runway
  - `revenue_growth_rate` (numeric) - Monthly growth rate
  - `gross_margin` (numeric) - Gross margin percentage
  - `cac_payback` (integer) - CAC payback period in months
  - `stage` (text) - pre_seed, seed, series_a, series_b, series_c, growth
  - `sector` (text) - fintech, healthtech, edtech, etc.
  - `employee_count` (integer)
  - `last_material_update_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. rounds
  Fundraising rounds
  - `id` (uuid, primary key)
  - `company_id` (uuid) - References companies
  - `round_type` (text) - pre_seed, seed, seed_extension, series_a, series_b, bridge
  - `target_amount` (numeric) - Target raise amount
  - `raised_amount` (numeric) - Amount raised so far
  - `status` (text) - active, closing, closed, abandoned
  - `started_at` (timestamptz, nullable)
  - `target_close_date` (timestamptz, nullable)
  - `actual_close_date` (timestamptz, nullable)
  - `lead_investor_id` (uuid, nullable) - References people
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. goals
  Company goals (fundraising, revenue, hiring, product, partnership, operational)
  - `id` (uuid, primary key)
  - `company_id` (uuid) - References companies
  - `goal_type` (text) - fundraise, revenue, hiring, product, partnership, operational
  - `title` (text) - Goal description
  - `target_value` (text) - Target metric value
  - `current_value` (text) - Current progress value
  - `start_date` (timestamptz)
  - `target_date` (timestamptz)
  - `is_on_track` (boolean) - Calculated on-track status
  - `last_updated_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. deals
  Investor deals tied to fundraising rounds
  - `id` (uuid, primary key)
  - `round_id` (uuid) - References rounds
  - `firm_id` (uuid, nullable) - References firms
  - `person_id` (uuid) - References people (the investor contact)
  - `deal_stage` (text) - identified, contacted, meeting_scheduled, meeting_held, diligence, term_sheet, committed, closed, dropped
  - `expected_amount` (numeric, nullable) - Expected investment amount
  - `last_contact_date` (timestamptz, nullable)
  - `introduced_by_id` (uuid, nullable) - References people
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - All tables accessible to authenticated users (admin interface)
  - Policies enforce authenticated-only access
*/

-- Create firms table
CREATE TABLE IF NOT EXISTS firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  firm_type text NOT NULL DEFAULT 'vc',
  typical_check_min integer DEFAULT 0,
  typical_check_max integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read firms"
  ON firms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert firms"
  ON firms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update firms"
  ON firms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete firms"
  ON firms FOR DELETE
  TO authenticated
  USING (true);

-- Create people table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'operator',
  firm_id uuid REFERENCES firms(id) ON DELETE SET NULL,
  title text,
  last_contacted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read people"
  ON people FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert people"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update people"
  ON people FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete people"
  ON people FOR DELETE
  TO authenticated
  USING (true);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_portfolio boolean DEFAULT false,
  founder_id uuid REFERENCES people(id) ON DELETE SET NULL,
  founded_at timestamptz,
  country text DEFAULT 'US',
  cash_on_hand numeric DEFAULT 0,
  monthly_burn numeric DEFAULT 0,
  mrr numeric DEFAULT 0,
  arr numeric DEFAULT 0,
  runway numeric DEFAULT 0,
  revenue_growth_rate numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  cac_payback integer DEFAULT 0,
  stage text DEFAULT 'pre_seed',
  sector text DEFAULT 'other',
  employee_count integer DEFAULT 0,
  last_material_update_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (true);

-- Create rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  round_type text NOT NULL DEFAULT 'seed',
  target_amount numeric DEFAULT 0,
  raised_amount numeric DEFAULT 0,
  status text DEFAULT 'active',
  started_at timestamptz,
  target_close_date timestamptz,
  actual_close_date timestamptz,
  lead_investor_id uuid REFERENCES people(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rounds"
  ON rounds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rounds"
  ON rounds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rounds"
  ON rounds FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rounds"
  ON rounds FOR DELETE
  TO authenticated
  USING (true);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  goal_type text NOT NULL DEFAULT 'operational',
  title text NOT NULL,
  target_value text DEFAULT '',
  current_value text DEFAULT '',
  start_date timestamptz DEFAULT now(),
  target_date timestamptz,
  is_on_track boolean DEFAULT true,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read goals"
  ON goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete goals"
  ON goals FOR DELETE
  TO authenticated
  USING (true);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  firm_id uuid REFERENCES firms(id) ON DELETE SET NULL,
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  deal_stage text DEFAULT 'identified',
  expected_amount numeric,
  last_contact_date timestamptz,
  introduced_by_id uuid REFERENCES people(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read deals"
  ON deals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete deals"
  ON deals FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_people_firm_id ON people(firm_id);
CREATE INDEX IF NOT EXISTS idx_companies_founder_id ON companies(founder_id);
CREATE INDEX IF NOT EXISTS idx_companies_is_portfolio ON companies(is_portfolio);
CREATE INDEX IF NOT EXISTS idx_rounds_company_id ON rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_rounds_lead_investor_id ON rounds(lead_investor_id);
CREATE INDEX IF NOT EXISTS idx_goals_company_id ON goals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_round_id ON deals(round_id);
CREATE INDEX IF NOT EXISTS idx_deals_firm_id ON deals(firm_id);
CREATE INDEX IF NOT EXISTS idx_deals_person_id ON deals(person_id);
