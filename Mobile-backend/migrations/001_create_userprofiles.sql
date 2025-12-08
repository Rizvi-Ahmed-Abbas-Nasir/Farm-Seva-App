-- Create UserProfiles table for storing farmer profile information
-- This table is separate from Supabase Auth users table

CREATE TABLE IF NOT EXISTS public."UserProfiles" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "fullName" TEXT NOT NULL,
  phone TEXT,
  state TEXT,
  location TEXT,
  role TEXT DEFAULT 'farmer' CHECK (role IN ('farmer', 'admin', 'retail')),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public."UserProfiles" ENABLE ROW LEVEL SECURITY;

-- Create policies for UserProfiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public."UserProfiles"
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON public."UserProfiles"
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public."UserProfiles"
  FOR UPDATE
  USING (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_userprofiles_id ON public."UserProfiles"(id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_userprofiles_updated_at
  BEFORE UPDATE ON public."UserProfiles"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (if needed for service role)
GRANT ALL ON public."UserProfiles" TO authenticated;
GRANT ALL ON public."UserProfiles" TO service_role;
