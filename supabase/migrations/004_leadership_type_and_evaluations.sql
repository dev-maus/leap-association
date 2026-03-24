-- Allow leadership scorecard assessments alongside HATS types
ALTER TABLE assessment_responses
  DROP CONSTRAINT IF EXISTS assessment_responses_assessment_type_check;

ALTER TABLE assessment_responses
  ADD CONSTRAINT assessment_responses_assessment_type_check
  CHECK (assessment_type IN ('individual', 'team', 'leadership'));

-- Participant seminar/course evaluations (submitted via edge function)
CREATE TABLE IF NOT EXISTS participant_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seminar_title TEXT NOT NULL,
  seminar_date_location TEXT,
  presenter_names TEXT,
  ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  presenter_comments TEXT,
  most_impactful TEXT,
  program_comments TEXT,
  may_use_comments TEXT,
  contact_for_coaching BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  title TEXT,
  best_times_to_contact TEXT,
  best_ways_to_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participant_evaluations_email ON participant_evaluations(email);
CREATE INDEX IF NOT EXISTS idx_participant_evaluations_created_at ON participant_evaluations(created_at DESC);

ALTER TABLE participant_evaluations ENABLE ROW LEVEL SECURITY;

-- Admins can read all evaluations
CREATE POLICY "Admins can read participant evaluations"
  ON participant_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_role = 'admin'
    )
  );

-- Inserts use Supabase service role in edge function (bypasses RLS). No public INSERT.

-- Authenticated users can read rows linked to their account when user_id is set
CREATE POLICY "Users can read own participant evaluations"
  ON participant_evaluations
  FOR SELECT
  USING (user_id IS NOT NULL AND user_id = auth.uid());
