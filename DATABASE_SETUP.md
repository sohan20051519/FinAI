# Database Setup Guide

## Supabase Database Tables Setup

To store all user data in Supabase, you need to create the database tables. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration SQL

Copy and paste the entire contents of `supabase_migration.sql` into the SQL editor and click **Run** (or press Ctrl+Enter).

Alternatively, you can copy the SQL from the file:

```sql
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

-- Create RLS policies (users can only access their own data)
-- Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for fixed_expenses
CREATE POLICY "Users can view their own fixed expenses"
  ON fixed_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fixed expenses"
  ON fixed_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fixed expenses"
  ON fixed_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fixed expenses"
  ON fixed_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for incomes
CREATE POLICY "Users can view their own incomes"
  ON incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incomes"
  ON incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes"
  ON incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes"
  ON incomes FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 3: Verify Tables Created

After running the SQL, you should see:
- ✅ `user_profiles` table created
- ✅ `fixed_expenses` table created
- ✅ `expenses` table created
- ✅ `incomes` table created
- ✅ All RLS policies enabled

You can verify by going to **Table Editor** in the Supabase dashboard and checking that all 4 tables are listed.

### Step 4: Test the Application

1. Sign up or sign in to your app
2. Complete the onboarding process
3. Your data should now be saved to Supabase!
4. Sign out and sign back in - your data should persist

## What Gets Stored

- **User Profile**: Name, age, family members, monthly income, onboarding completion status
- **Fixed Expenses**: Recurring monthly expenses (rent, EMIs, subscriptions)
- **Expenses**: All expense transactions
- **Incomes**: All income transactions

## Security

All tables use Row Level Security (RLS), which means:
- Users can only see and modify their own data
- Data is automatically filtered by user ID
- No user can access another user's data

## Troubleshooting

If you see errors about tables not existing:
1. Make sure you ran the SQL migration
2. Check that you're in the correct Supabase project
3. Verify the tables exist in the Table Editor

If you see permission errors:
1. Make sure RLS policies were created
2. Check that the user is authenticated
3. Verify the user_id matches the authenticated user

