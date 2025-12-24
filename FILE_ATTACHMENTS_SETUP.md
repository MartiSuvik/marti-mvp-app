# File Attachments - Setup Guide

Follow these steps to deploy the file attachments feature to your Supabase project.

---

## Step 1: Run Database Migration

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of:
   ```
   supabase/migrations/004_add_message_attachments.sql
   ```
4. Click **Run**

This will:
- Add `attachments` JSONB column to `messages` table
- Create `chat-attachments` storage bucket
- Set up RLS policies for secure file access

---

## Step 2: Verify Storage Bucket

1. Go to **Supabase Dashboard → Storage**
2. Confirm you see a bucket named **`chat-attachments`**
3. Click on the bucket and verify settings:
   - **Public**: ❌ No (should be private)
   - **File size limit**: 10485760 bytes (10 MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `application/pdf`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

## Step 3: Test RLS Policies

### Upload Policy Test
1. Open your app as a logged-in user
2. Navigate to any conversation
3. Try uploading a file
4. Verify file appears in Storage under `chat-attachments/{conversation_id}/`

### Access Control Test
1. Copy a file URL from one user's conversation
2. Log in as a different user (not in that conversation)
3. Try accessing the URL → Should be **denied**

---

## Step 4: Deploy Frontend

```bash
# Build the updated frontend
npm run build

# Deploy to your hosting platform
# (Netlify, Vercel, etc.)
```

---

## Step 5: Test End-to-End

### Test 1: Valid File Upload
- [ ] Upload a 5MB PNG image ✓
- [ ] Image displays inline in chat ✓
- [ ] Other user sees the image in realtime ✓

### Test 2: Document Upload
- [ ] Upload a PDF document ✓
- [ ] Document shows as download link ✓
- [ ] Clicking downloads the file ✓

### Test 3: Validation
- [ ] Try uploading 11MB file → **Rejected with "File too large"** ✓
- [ ] Try uploading a video → **Rejected with "Video uploads aren't supported"** ✓
- [ ] Try uploading a .zip file → **Rejected with "File type not allowed"** ✓

### Test 4: Message Variants
- [ ] Send text-only message ✓
- [ ] Send attachment-only message ✓
- [ ] Send text + attachment ✓

---

## Troubleshooting

### Issue: "Upload failed" error

**Check:**
1. Bucket exists in Storage
2. RLS policies are applied
3. User is authenticated
4. File is under 10MB
5. File type is allowed

### Issue: "Failed to generate file URL"

**Check:**
1. Storage bucket is configured correctly
2. RLS policy allows SELECT on storage.objects
3. User is a participant in the conversation

### Issue: Image doesn't load

**Check:**
1. Signed URL hasn't expired (1 hour limit)
2. Browser console for CORS errors
3. User has permission to view the conversation

### Issue: Can't upload certain file types

**Check:**
1. MIME type is in allowed list (bucket settings)
2. File extension matches MIME type
3. File isn't corrupted

---

## Rollback (If Needed)

If you need to undo the changes:

```sql
-- Remove attachments column
ALTER TABLE messages DROP COLUMN IF EXISTS attachments;

-- Delete storage bucket (will delete all files!)
-- Go to Supabase Dashboard → Storage → Delete bucket
```

⚠️ **Warning**: Deleting the bucket will permanently delete all uploaded files.

---

## Production Checklist

Before going live:

- [ ] Test file uploads from production URL
- [ ] Verify RLS policies work in production
- [ ] Test signed URL expiry (wait 1 hour, try accessing old file)
- [ ] Monitor storage usage in Supabase dashboard
- [ ] Set up alerts for approaching storage limits
- [ ] Document file retention policy for users
- [ ] Consider implementing cleanup for old files (future)

---

## Support

If you encounter issues:

1. Check Supabase logs: **Dashboard → Logs → Postgres/Storage**
2. Check browser console for JavaScript errors
3. Verify network requests in DevTools
4. Review RLS policies in **Dashboard → Authentication → Policies**

---

**Setup Complete!** 🎉

Users can now attach images and documents to chat messages with full validation and security.
