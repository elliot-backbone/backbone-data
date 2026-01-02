/*
  # Fix priority resolutions RLS policies

  1. Changes
    - Update RLS policies to allow anonymous (anon) access
    - Remove authentication requirement since app doesn't use auth yet

  2. Security
    - Allow anonymous users to read, insert, and delete resolutions
    - This is appropriate for a prototype/demo system
*/

DROP POLICY IF EXISTS "Anyone can read resolutions" ON priority_resolutions;
DROP POLICY IF EXISTS "Anyone can insert resolutions" ON priority_resolutions;
DROP POLICY IF EXISTS "Anyone can delete resolutions" ON priority_resolutions;

CREATE POLICY "Anyone can read resolutions"
  ON priority_resolutions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert resolutions"
  ON priority_resolutions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete resolutions"
  ON priority_resolutions
  FOR DELETE
  USING (true);
