-- Create user_profiles table to store user metadata and roles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT,
  phone TEXT,
  user_role TEXT DEFAULT 'user' CHECK (user_role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Create index on user_role for admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON user_profiles(user_role);

-- Add user_id column to assessment_responses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessment_responses' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE assessment_responses 
    ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index on user_id for assessment queries
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_id ON assessment_responses(user_id);

-- Enable Row-Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable Row-Level Security on assessment_responses (if not already enabled)
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
-- Note: Role changes are prevented via trigger, not RLS
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to check if current user is admin (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND user_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (public.is_admin());

-- RLS Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  USING (public.is_admin());

-- RLS Policy: Service role can insert profiles (for edge functions)
CREATE POLICY "Service role can insert profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can read their own assessments
CREATE POLICY "Users can read own assessments"
  ON assessment_responses
  FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- RLS Policy: Users can insert their own assessments
CREATE POLICY "Users can insert own assessments"
  ON assessment_responses
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
  );

-- RLS Policy: Admins can update all assessments
CREATE POLICY "Admins can update all assessments"
  ON assessment_responses
  FOR UPDATE
  USING (public.is_admin());

-- RLS Policy: Service role can insert assessments (for edge functions)
CREATE POLICY "Service role can insert assessments"
  ON assessment_responses
  FOR INSERT
  WITH CHECK (true);

-- Function to automatically create user_profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if user is admin (check via user_profiles)
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND user_role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Prevent role changes for non-admins
  IF OLD.user_role != NEW.user_role THEN
    RAISE EXCEPTION 'Users cannot change their own role. Only admins can change user roles.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce role change restriction
DROP TRIGGER IF EXISTS prevent_user_role_change_trigger ON user_profiles;
CREATE TRIGGER prevent_user_role_change_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.user_role IS DISTINCT FROM NEW.user_role)
  EXECUTE FUNCTION public.prevent_user_role_change();

