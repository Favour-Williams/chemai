/*
  # Fix Users Table RLS Policies

  1. Security Updates
    - Drop existing conflicting policies
    - Add proper RLS policies for user profile management
    - Allow users to insert, read, and update their own profiles
    - Ensure policies work with Supabase Auth

  2. Policy Details
    - Users can insert their own profile after signup (using auth.uid())
    - Users can read their own profile data
    - Users can update their own profile information
    - All policies use auth.uid() to match the authenticated user's ID
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create proper RLS policies for users table
CREATE POLICY "Users can insert their own profile" 
  ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;