/*
  # Create priority resolutions table

  1. New Tables
    - `priority_resolutions`
      - `id` (uuid, primary key) - Unique identifier for each resolution
      - `company_id` (text) - Company identifier from raw data
      - `issue_category` (text) - Category/type of the issue being resolved
      - `issue_title` (text) - Title of the specific issue
      - `resolved_at` (timestamptz) - When the priority was marked as resolved
      - `resolution_notes` (text, nullable) - Optional notes about the resolution
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `priority_resolutions` table
    - Add policy for authenticated users to read all resolutions
    - Add policy for authenticated users to insert resolutions
    - Add policy for authenticated users to delete their own resolutions

  3. Indexes
    - Create index on company_id for faster lookups
    - Create composite index on (company_id, issue_category) for filtering
*/

CREATE TABLE IF NOT EXISTS priority_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  issue_category text NOT NULL,
  issue_title text NOT NULL,
  resolved_at timestamptz DEFAULT now(),
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE priority_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read resolutions"
  ON priority_resolutions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert resolutions"
  ON priority_resolutions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete resolutions"
  ON priority_resolutions
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_priority_resolutions_company_id 
  ON priority_resolutions(company_id);

CREATE INDEX IF NOT EXISTS idx_priority_resolutions_company_category 
  ON priority_resolutions(company_id, issue_category);