-- Family Chat and Join Requests Tables
-- This migration adds support for WhatsApp-like family chat, file sharing, and join requests

-- Create family_join_requests table
CREATE TABLE IF NOT EXISTS family_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  UNIQUE(family_group_id, user_id)
);

-- Create family_chat_messages table
CREATE TABLE IF NOT EXISTS family_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'grocery_list')),
  content TEXT, -- For text messages
  file_url TEXT, -- For images and voice recordings
  file_name TEXT, -- Original file name
  grocery_list_data JSONB, -- For grocery list shares
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_join_requests_group_id ON family_join_requests(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_join_requests_user_id ON family_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_family_join_requests_status ON family_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_family_chat_messages_group_id ON family_chat_messages(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_chat_messages_created_at ON family_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE family_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_join_requests
DROP POLICY IF EXISTS "Users can view join requests for their groups" ON family_join_requests;
CREATE POLICY "Users can view join requests for their groups"
  ON family_join_requests FOR SELECT
  USING (
    -- Group creators can see all requests
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    -- Users can see their own requests
    user_id = auth.uid() OR
    -- Parents can see requests
    is_family_parent(family_group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create join requests" ON family_join_requests;
CREATE POLICY "Users can create join requests"
  ON family_join_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update join requests" ON family_join_requests;
CREATE POLICY "Parents can update join requests"
  ON family_join_requests FOR UPDATE
  USING (
    -- Group creators can approve/reject
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    -- Parents can approve/reject
    is_family_parent(family_group_id, auth.uid())
  )
  WITH CHECK (
    -- Group creators can approve/reject
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    -- Parents can approve/reject
    is_family_parent(family_group_id, auth.uid())
  );

-- RLS Policies for family_chat_messages
DROP POLICY IF EXISTS "Family members can view chat messages" ON family_chat_messages;
CREATE POLICY "Family members can view chat messages"
  ON family_chat_messages FOR SELECT
  USING (
    -- Group creator can always view messages
    family_group_id IN (
      SELECT id FROM family_groups
      WHERE created_by = auth.uid()
    ) OR
    -- Use security definer function to check membership
    is_family_member(family_group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Family members can send chat messages" ON family_chat_messages;
CREATE POLICY "Family members can send chat messages"
  ON family_chat_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND (
      -- Group creator can always send messages
      family_group_id IN (
        SELECT id FROM family_groups
        WHERE created_by = auth.uid()
      ) OR
      -- Use security definer function to check membership
      is_family_member(family_group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON family_chat_messages;
CREATE POLICY "Users can update their own messages"
  ON family_chat_messages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON family_chat_messages;
CREATE POLICY "Users can delete their own messages"
  ON family_chat_messages FOR DELETE
  USING (user_id = auth.uid());

-- Note: You need to create a storage bucket named 'family-chat-files' in Supabase Dashboard
-- Go to Storage > Create Bucket > Name: family-chat-files > Public: Yes
-- Then add the following storage policies:

-- Storage Policy: Allow family members to upload files
-- INSERT policy: Allow authenticated users to upload to their family group folders
-- SELECT policy: Allow family members to view files
-- UPDATE policy: Allow users to update their own files
-- DELETE policy: Allow users to delete their own files

