-- Replace overly permissive assessment read policy with proper RLS
-- This migration restricts access to assessments to prevent enumeration attacks

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can read assessments" ON assessment_responses;

-- Drop any conflicting policies that might exist
DROP POLICY IF EXISTS "Users can read own assessments" ON assessment_responses;
DROP POLICY IF EXISTS "Admins can read all assessments" ON assessment_responses;

-- Allow users to read their own assessments
CREATE POLICY "Users can read own assessments"
  ON assessment_responses
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow admins to read all assessments
CREATE POLICY "Admins can read all assessments"
  ON assessment_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Note: For sharing assessment results by ID, a separate sharing mechanism
-- with signed tokens should be implemented instead of allowing public access
