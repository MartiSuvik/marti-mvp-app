-- Migration: Add conversation_members table for proper unread tracking
-- Based on Supabase expert recommendations for scalable unread counts

-- Create conversation_members table
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When user last read this conversation
  unread_count INTEGER DEFAULT 0, -- Cached unread count for fast queries
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (conversation_id, user_id)
);

-- Add index for fast user-wide unread queries
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_unread ON conversation_members(user_id, unread_count) WHERE unread_count > 0;

-- Enable RLS
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own membership records
DROP POLICY IF EXISTS "Users can view their own memberships" ON conversation_members;
CREATE POLICY "Users can view their own memberships"
  ON conversation_members FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own memberships" ON conversation_members;
CREATE POLICY "Users can update their own memberships"
  ON conversation_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Backfill existing conversations with members
-- For each conversation, create 2 members (business + agency owner)
INSERT INTO conversation_members (conversation_id, user_id, last_read_at, unread_count)
SELECT DISTINCT
  c.id as conversation_id,
  c.business_id as user_id,
  NOW() as last_read_at,
  0 as unread_count
FROM conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM conversation_members cm 
  WHERE cm.conversation_id = c.id AND cm.user_id = c.business_id
);

INSERT INTO conversation_members (conversation_id, user_id, last_read_at, unread_count)
SELECT DISTINCT
  c.id as conversation_id,
  a.owner_id as user_id,
  NOW() as last_read_at,
  0 as unread_count
FROM conversations c
JOIN agencies a ON a.id = c.agency_id
WHERE a.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM conversation_members cm 
    WHERE cm.conversation_id = c.id AND cm.user_id = a.owner_id
  );

-- Calculate actual unread counts for existing conversations
-- (messages created after last_read_at)
UPDATE conversation_members cm
SET unread_count = (
  SELECT COUNT(*)
  FROM messages m
  WHERE m.conversation_id = cm.conversation_id
    AND m.sender_id != cm.user_id
    AND m.created_at > cm.last_read_at
);

-- Function to increment unread count when new message arrives
CREATE OR REPLACE FUNCTION increment_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread_count for all conversation members except the sender
  UPDATE conversation_members
  SET 
    unread_count = unread_count + 1,
    updated_at = NOW()
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment unread counts on new messages
DROP TRIGGER IF EXISTS trigger_increment_unread ON messages;
CREATE TRIGGER trigger_increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_counts();

-- Function to mark conversation as read for a user
-- Call this from client via RPC
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE conversation_members
  SET 
    last_read_at = NOW(),
    unread_count = 0,
    updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION mark_conversation_read(UUID, UUID) TO authenticated;

-- Function to get total unread count for a user
CREATE OR REPLACE FUNCTION get_total_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(unread_count), 0)::INTEGER
  FROM conversation_members
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_total_unread_count(UUID) TO authenticated;

-- Auto-create conversation members when new conversation is created
CREATE OR REPLACE FUNCTION create_conversation_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Add business user
  INSERT INTO conversation_members (conversation_id, user_id, last_read_at, unread_count)
  VALUES (NEW.id, NEW.business_id, NOW(), 0);
  
  -- Add agency owner (if exists)
  INSERT INTO conversation_members (conversation_id, user_id, last_read_at, unread_count)
  SELECT NEW.id, a.owner_id, NOW(), 0
  FROM agencies a
  WHERE a.id = NEW.agency_id AND a.owner_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create members for new conversations
DROP TRIGGER IF EXISTS trigger_create_conversation_members ON conversations;
CREATE TRIGGER trigger_create_conversation_members
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_members();
