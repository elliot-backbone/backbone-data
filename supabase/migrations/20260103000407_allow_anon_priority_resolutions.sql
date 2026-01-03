/*
  # Allow Anonymous Access to Priority Resolutions

  ## Overview
  Allow anonymous users to access priority_resolutions table for marking priorities as resolved.

  ## Changes
  - Add SELECT, INSERT, UPDATE, DELETE policies for anonymous users on priority_resolutions table
*/

-- Priority resolutions policies for anonymous users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'priority_resolutions' 
    AND policyname = 'Anonymous users can read priority_resolutions'
  ) THEN
    CREATE POLICY "Anonymous users can read priority_resolutions"
      ON priority_resolutions FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'priority_resolutions' 
    AND policyname = 'Anonymous users can insert priority_resolutions'
  ) THEN
    CREATE POLICY "Anonymous users can insert priority_resolutions"
      ON priority_resolutions FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'priority_resolutions' 
    AND policyname = 'Anonymous users can update priority_resolutions'
  ) THEN
    CREATE POLICY "Anonymous users can update priority_resolutions"
      ON priority_resolutions FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'priority_resolutions' 
    AND policyname = 'Anonymous users can delete priority_resolutions'
  ) THEN
    CREATE POLICY "Anonymous users can delete priority_resolutions"
      ON priority_resolutions FOR DELETE
      TO anon
      USING (true);
  END IF;
END $$;
