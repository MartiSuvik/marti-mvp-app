-- Migration: Add file attachments support to messages
-- Run this in Supabase SQL Editor

-- 1. Add attachments column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB;

-- 2. Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false, -- Not public, use signed URLs
  10485760, -- 10MB in bytes
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies for Storage
-- Allow authenticated users to upload to their conversations
DROP POLICY IF EXISTS "Users can upload to their conversations" ON storage.objects;
CREATE POLICY "Users can upload to their conversations"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    auth.role() = 'authenticated' AND
    -- Path format: {conversation_id}/{timestamp}_{filename}
    -- Extract conversation_id from path and verify user is participant
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM conversations 
      WHERE business_id = auth.uid() OR 
            agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- Allow users to read files from their conversations
DROP POLICY IF EXISTS "Users can view files from their conversations" ON storage.objects;
CREATE POLICY "Users can view files from their conversations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM conversations 
      WHERE business_id = auth.uid() OR 
            agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

-- Allow users to delete their own uploaded files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-attachments' AND
    auth.role() = 'authenticated' AND
    owner = auth.uid()
  );

-- 4. Add index for better query performance on attachments
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON messages USING GIN (attachments);

-- 5. Add comment to explain attachments structure
COMMENT ON COLUMN messages.attachments IS 'JSONB array of attachment objects. Each object has: type (image|document), name (filename), url (signed URL), size (bytes)';
