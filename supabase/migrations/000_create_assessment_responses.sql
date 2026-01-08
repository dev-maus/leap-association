-- Complete schema for assessment_responses table
-- This table stores HATS (Habits, Abilities, Talents, Skills) assessment results

CREATE TABLE IF NOT EXISTS assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('individual', 'team')),
  
  -- LEAP dimension scores (JSONB object with: leadership, effectiveness, accountability, productivity)
  scores JSONB NOT NULL,
  
  -- HATS category scores
  habit_score INTEGER NOT NULL,
  ability_score INTEGER NOT NULL,
  talent_score INTEGER NOT NULL,
  skill_score INTEGER NOT NULL,
  
  -- Detailed answers array (JSONB array of answer objects)
  -- Each answer object contains: question_id, category, score, question_text
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_id ON assessment_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_type ON assessment_responses(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_created_at ON assessment_responses(created_at DESC);

-- Create GIN index for JSONB searches on scores and answers
CREATE INDEX IF NOT EXISTS idx_assessment_responses_scores ON assessment_responses USING GIN (scores);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_answers ON assessment_responses USING GIN (answers);

-- Enable Row-Level Security
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own assessments
CREATE POLICY "Users can read own assessments"
  ON assessment_responses
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- RLS Policy: Users can insert their own assessments
CREATE POLICY "Users can insert own assessments"
  ON assessment_responses
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- RLS Policy: Admins can update all assessments
CREATE POLICY "Admins can update all assessments"
  ON assessment_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- RLS Policy: Service role can insert assessments (for edge functions)
CREATE POLICY "Service role can insert assessments"
  ON assessment_responses
  FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assessment_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_assessment_responses_updated_at ON assessment_responses;
CREATE TRIGGER update_assessment_responses_updated_at
  BEFORE UPDATE ON assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_responses_updated_at();

