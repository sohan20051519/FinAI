-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_plan JSONB NOT NULL, -- Stores MealPlan object
  budget NUMERIC,
  people INTEGER,
  region TEXT,
  preferences TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL, -- Stores ChatMessage[] array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_created_at ON meal_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_plans
DROP POLICY IF EXISTS "Users can view their own meal plans" ON meal_plans;
CREATE POLICY "Users can view their own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own meal plans" ON meal_plans;
CREATE POLICY "Users can insert their own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own meal plans" ON meal_plans;
CREATE POLICY "Users can update their own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own meal plans" ON meal_plans;
CREATE POLICY "Users can delete their own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
DROP POLICY IF EXISTS "Users can view their own chat messages" ON chat_messages;
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chat messages" ON chat_messages;
CREATE POLICY "Users can insert their own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own chat messages" ON chat_messages;
CREATE POLICY "Users can update their own chat messages"
  ON chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chat messages" ON chat_messages;
CREATE POLICY "Users can delete their own chat messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipe JSONB NOT NULL, -- Stores Recipe object
  ingredients TEXT,
  preferences TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grocery_lists table
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL, -- Stores GroceryItem[] array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_created_at ON grocery_lists(created_at DESC);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes
DROP POLICY IF EXISTS "Users can view their own recipes" ON recipes;
CREATE POLICY "Users can view their own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recipes" ON recipes;
CREATE POLICY "Users can insert their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recipes" ON recipes;
CREATE POLICY "Users can update their own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recipes" ON recipes;
CREATE POLICY "Users can delete their own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for grocery_lists
DROP POLICY IF EXISTS "Users can view their own grocery lists" ON grocery_lists;
CREATE POLICY "Users can view their own grocery lists"
  ON grocery_lists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own grocery lists" ON grocery_lists;
CREATE POLICY "Users can insert their own grocery lists"
  ON grocery_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own grocery lists" ON grocery_lists;
CREATE POLICY "Users can update their own grocery lists"
  ON grocery_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own grocery lists" ON grocery_lists;
CREATE POLICY "Users can delete their own grocery lists"
  ON grocery_lists FOR DELETE
  USING (auth.uid() = user_id);

