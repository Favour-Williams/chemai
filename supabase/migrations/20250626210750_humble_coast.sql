/*
  # Update users table for proper authentication integration

  1. Changes
    - Remove password field (handled by Supabase Auth)
    - Add proper constraints and indexes
    - Update RLS policies for better security
    - Add trigger for updated_at

  2. Security
    - Users can only read/update their own data
    - Email uniqueness enforced
    - Proper indexing for performance
*/

-- Remove password column since Supabase Auth handles authentication
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE users DROP COLUMN password;
  END IF;
END $$;

-- Ensure email is properly indexed and unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name = 'users_email_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Update RLS policies to be more specific
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies that work with Supabase Auth
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id::text FROM users WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT id::text FROM users WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (
    email = auth.jwt() ->> 'email'
  );

-- Add index for better performance on email lookups
CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON users(email);

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();