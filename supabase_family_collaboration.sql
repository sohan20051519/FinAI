-- Family Collaboration Tables
-- This migration adds support for family groups, member roles, and shared grocery lists

-- Create family_groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family_members table (role-based access)
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'viewer')),
  can_edit BOOLEAN DEFAULT FALSE,
  can_view BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_group_id, user_id)
);

-- Create shared_grocery_lists table
CREATE TABLE IF NOT EXISTS shared_grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_family_groups_created_by ON family_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_family_members_group_id ON family_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_grocery_lists_group_id ON shared_grocery_lists(family_group_id);
CREATE INDEX IF NOT EXISTS idx_shared_grocery_lists_created_by ON shared_grocery_lists(created_by);

-- Create a security definer function to check if user is a member of a group
-- This bypasses RLS to avoid recursion
-- SECURITY DEFINER runs with the privileges of the function owner (service_role in Supabase)
-- which bypasses RLS checks automatically
CREATE OR REPLACE FUNCTION is_family_member(group_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This query bypasses RLS because the function runs with SECURITY DEFINER
  -- which uses the privileges of the function owner (bypasses RLS)
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_group_id = group_id
    AND user_id = check_user_id
  );
END;
$$;

-- Create a security definer function to check if user is a parent member
CREATE OR REPLACE FUNCTION is_family_parent(group_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This query bypasses RLS because the function runs with SECURITY DEFINER
  -- which uses the privileges of the function owner (bypasses RLS)
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_group_id = group_id
    AND user_id = check_user_id
    AND role = 'parent'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_family_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_family_parent(UUID, UUID) TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_grocery_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_groups
-- Use security definer function to avoid recursion
DROP POLICY IF EXISTS "Users can view their family groups" ON family_groups;
CREATE POLICY "Users can view their family groups"
  ON family_groups FOR SELECT
  USING (
    created_by = auth.uid() OR
    -- Use security definer function to check membership without recursion
    is_family_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create family groups" ON family_groups;
CREATE POLICY "Users can create family groups"
  ON family_groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Parents can update family groups" ON family_groups;
CREATE POLICY "Parents can update family groups"
  ON family_groups FOR UPDATE
  USING (
    created_by = auth.uid() OR
    -- Check if user is a parent member using security definer function (avoids recursion)
    is_family_parent(id, auth.uid())
  );

DROP POLICY IF EXISTS "Creators can delete family groups" ON family_groups;
CREATE POLICY "Creators can delete family groups"
  ON family_groups FOR DELETE
  USING (
    -- Only the creator can delete their family group
    created_by = auth.uid()
  );

-- RLS Policies for family_members
-- Use security definer function to check membership without recursion
DROP POLICY IF EXISTS "Users can view family members in their groups" ON family_members;
CREATE POLICY "Users can view family members in their groups"
  ON family_members FOR SELECT
  USING (
    -- Users can always see their own membership
    user_id = auth.uid() OR
    -- Users can see members if they created the family group
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    -- Users can see members if they are a member of the group (using security definer function)
    is_family_member(family_group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Parents can add family members" ON family_members;
CREATE POLICY "Parents can add family members"
  ON family_members FOR INSERT
  WITH CHECK (
    -- Group creators can always add members
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    -- Users can add themselves (when joining a group)
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Parents and creators can remove family members" ON family_members;
CREATE POLICY "Parents and creators can remove family members"
  ON family_members FOR DELETE
  USING (
    -- Group creators can remove any member
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    -- Parent members can remove other members (using security definer function to avoid recursion)
    is_family_parent(family_group_id, auth.uid())
  );

-- RLS Policies for shared_grocery_lists
-- Note: These policies query family_members, but that's OK because family_members policy doesn't query shared_grocery_lists
DROP POLICY IF EXISTS "Family members can view shared grocery lists" ON shared_grocery_lists;
CREATE POLICY "Family members can view shared grocery lists"
  ON shared_grocery_lists FOR SELECT
  USING (
    created_by = auth.uid() OR
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    family_group_id IN (
      SELECT family_group_id FROM family_members
      WHERE user_id = auth.uid()
      AND can_view = TRUE
    )
  );

DROP POLICY IF EXISTS "Family members can create shared grocery lists" ON shared_grocery_lists;
CREATE POLICY "Family members can create shared grocery lists"
  ON shared_grocery_lists FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    family_group_id IN (
      SELECT family_group_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Editors can update shared grocery lists" ON shared_grocery_lists;
CREATE POLICY "Editors can update shared grocery lists"
  ON shared_grocery_lists FOR UPDATE
  USING (
    created_by = auth.uid() OR
    family_group_id IN (
      SELECT family_group_id FROM family_members
      WHERE user_id = auth.uid()
      AND can_edit = TRUE
    )
  );

DROP POLICY IF EXISTS "Creators and parents can delete shared grocery lists" ON shared_grocery_lists;
CREATE POLICY "Creators and parents can delete shared grocery lists"
  ON shared_grocery_lists FOR DELETE
  USING (
    created_by = auth.uid() OR
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    family_group_id IN (
      SELECT family_group_id FROM family_members
      WHERE user_id = auth.uid()
      AND role = 'parent'
    )
  );

