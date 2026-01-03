/*
  # Allow Anonymous Access to All Tables

  ## Overview
  Since the application doesn't have authentication yet, we need to allow anonymous users (using the anon key) to access all data.

  ## Changes
  - Add SELECT, INSERT, UPDATE, DELETE policies for anonymous users on all tables:
    - firms
    - people
    - companies
    - rounds
    - goals
    - deals

  ## Security Note
  This is for development/testing purposes. In production, proper authentication should be implemented.
*/

-- Firms policies for anonymous users
CREATE POLICY "Anonymous users can read firms"
  ON firms FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert firms"
  ON firms FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update firms"
  ON firms FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete firms"
  ON firms FOR DELETE
  TO anon
  USING (true);

-- People policies for anonymous users
CREATE POLICY "Anonymous users can read people"
  ON people FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert people"
  ON people FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update people"
  ON people FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete people"
  ON people FOR DELETE
  TO anon
  USING (true);

-- Companies policies for anonymous users
CREATE POLICY "Anonymous users can read companies"
  ON companies FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert companies"
  ON companies FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update companies"
  ON companies FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete companies"
  ON companies FOR DELETE
  TO anon
  USING (true);

-- Rounds policies for anonymous users
CREATE POLICY "Anonymous users can read rounds"
  ON rounds FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert rounds"
  ON rounds FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update rounds"
  ON rounds FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete rounds"
  ON rounds FOR DELETE
  TO anon
  USING (true);

-- Goals policies for anonymous users
CREATE POLICY "Anonymous users can read goals"
  ON goals FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert goals"
  ON goals FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update goals"
  ON goals FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete goals"
  ON goals FOR DELETE
  TO anon
  USING (true);

-- Deals policies for anonymous users
CREATE POLICY "Anonymous users can read deals"
  ON deals FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert deals"
  ON deals FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update deals"
  ON deals FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete deals"
  ON deals FOR DELETE
  TO anon
  USING (true);
