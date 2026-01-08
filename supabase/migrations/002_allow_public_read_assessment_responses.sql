-- Allow public read access to assessment_responses
-- This is safe because assessments contain no personal data (only scores and answers)
-- Users can view any assessment by ID, which allows sharing of results

-- Drop ALL existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own assessments" ON assessment_responses;
DROP POLICY IF EXISTS "Public can read assessments" ON assessment_responses;

-- Create new policy that allows public read access
-- Anyone can read any assessment by ID (no personal data is exposed)
CREATE POLICY "Public can read assessments"
  ON assessment_responses
  FOR SELECT
  USING (true);
