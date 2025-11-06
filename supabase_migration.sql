-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  family_members INTEGER NOT NULL DEFAULT 1,
  monthly_income NUMERIC(12, 2) NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixed_expenses table
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  recurring TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  recurring TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Create a security definer function to get family member user IDs
CREATE OR REPLACE FUNCTION get_family_member_user_ids(check_user_id UUID)
RETURNS TABLE(user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This query bypasses RLS because the function runs with SECURITY DEFINER
  RETURN QUERY
  SELECT DISTINCT fm2.user_id
  FROM family_members fm1
  JOIN family_members fm2 ON fm1.family_group_id = fm2.family_group_id
  WHERE fm1.user_id = check_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_family_member_user_ids(UUID) TO authenticated;

DROP POLICY IF EXISTS "Users can view family member profiles" ON user_profiles;
CREATE POLICY "Users can view family member profiles"
  ON user_profiles FOR SELECT
  USING (
    -- Allow viewing profiles of users who are in the same family group
    -- Use security definer function to avoid recursion
    user_id IN (
      SELECT user_id FROM get_family_member_user_ids(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for fixed_expenses
DROP POLICY IF EXISTS "Users can view their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can view their own fixed expenses"
  ON fixed_expenses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can insert their own fixed expenses"
  ON fixed_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can update their own fixed expenses"
  ON fixed_expenses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fixed expenses" ON fixed_expenses;
CREATE POLICY "Users can delete their own fixed expenses"
  ON fixed_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for incomes
DROP POLICY IF EXISTS "Users can view their own incomes" ON incomes;
CREATE POLICY "Users can view their own incomes"
  ON incomes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own incomes" ON incomes;
CREATE POLICY "Users can insert their own incomes"
  ON incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own incomes" ON incomes;
CREATE POLICY "Users can update their own incomes"
  ON incomes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own incomes" ON incomes;
CREATE POLICY "Users can delete their own incomes"
  ON incomes FOR DELETE
  USING (auth.uid() = user_id);

