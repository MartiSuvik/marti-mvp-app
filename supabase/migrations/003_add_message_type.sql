-- Add message_type column to messages table for Zoom video calls and system messages
-- Run this in Supabase SQL Editor

-- Add message_type column with default 'text'
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' 
CHECK (message_type IN ('text', 'video_call', 'system'));

-- Comment for documentation
COMMENT ON COLUMN messages.message_type IS 'Type of message: text (default), video_call (Zoom meeting link), or system (automated notifications)';
