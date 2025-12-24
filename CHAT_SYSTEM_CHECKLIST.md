# Chat System & Hire Flow Implementation

## Overview

This update introduces a full messaging system between brands and agencies, triggered by the "Hire" button. When a brand clicks "Hire" on a matched agency, a conversation is created, the agency receives an email notification, and both parties can communicate via dedicated full-page chat interfaces.

### Key Features
- **Full-page Messages inbox** for both brands and agencies
- **Real-time messaging** via Supabase Realtime (already implemented in `useChat` hook)
- **Email notifications** when a brand initiates a hire conversation
- **Unread message badges** in sidebar navigation
- **Read receipts** - messages marked as read when conversation is opened

### Architecture
```
Brand clicks "Hire"
       ↓
┌──────────────────────────────────────────────────────┐
│  1. Create/get conversation (via useConversation)   │
│  2. Update deal status to "active"                  │
│  3. Call notify-agency-hire Edge Function           │
│  4. Navigate to /messages/:conversationId           │
└──────────────────────────────────────────────────────┘
       ↓
Agency receives:
  • Email notification (via Resend)
  • Unread badge on Messages nav item
  • Full conversation in /agency/messages/:id
```

---

## Implementation Checklist

### Phase 1: Database & Backend

- [ ] **1.1** Add database function/view for conversation inbox (optional optimization)
  - `get_conversations_with_unread()` returns conversations with `last_message` and `unread_count`
  
- [x] **1.2** Create `notify-agency-hire` Edge Function
  - Location: `supabase/functions/notify-agency-hire/index.ts`
  - Sends email to agency when brand clicks "Hire"
  - Uses Resend API (same pattern as `notify-agency-match`)
  - Email includes: brand name, project details, CTA to agency messages

### Phase 2: Hooks

- [x] **2.1** Create `useUnreadCount` hook
  - Location: `hooks/useUnreadCount.ts`
  - Queries messages where `read_at IS NULL` for current user
  - Subscribes to Supabase Realtime for live updates
  - Returns `{ unreadCount, loading }`

- [x] **2.2** Create `useConversations` hook (for inbox)
  - Location: `hooks/useConversations.ts`
  - Fetches all conversations for current user (brand or agency)
  - Includes last message preview and unread count per conversation
  - Subscribes to Realtime for new messages
  - Returns `{ conversations, loading, refetch }`

- [x] **2.3** Update `useChat` hook to mark messages as read
  - Add `markAsRead()` function
  - Auto-call when conversation is opened
  - Update `messages.read_at` for messages not sent by current user

### Phase 3: Brand Messages Page

- [x] **3.1** Create Messages list page
  - Location: `pages/brand/Messages.tsx`
  - Route: `/messages`
  - Shows list of all conversations with:
    - Agency logo & name
    - Last message preview (truncated)
    - Timestamp
    - Unread badge
  - Click navigates to `/messages/:conversationId`

- [x] **3.2** Create Messages chat page
  - Location: `pages/brand/MessageChat.tsx`
  - Route: `/messages/:conversationId`
  - Full-page chat interface (not drawer)
  - Reuses existing chat components: `ChatHeader`, `ChatMessages`, `ChatInput`
  - Marks messages as read on mount
  - Back button returns to `/messages`

- [x] **3.3** Add route to App.tsx
  - `/messages` → `Messages.tsx`
  - `/messages/:conversationId` → `MessageChat.tsx`

### Phase 4: Agency Messages Page

- [x] **4.1** Create Messages list page
  - Location: `pages/agency/Messages.tsx`
  - Route: `/agency/messages`
  - Same structure as brand Messages page
  - Filters conversations by agency_id

- [x] **4.2** Create Messages chat page
  - Location: `pages/agency/MessageChat.tsx`
  - Route: `/agency/messages/:conversationId`
  - Full-page chat with agency context
  - Shows brand info in header

- [x] **4.3** Add routes to App.tsx
  - `/agency/messages` → agency `Messages.tsx`
  - `/agency/messages/:conversationId` → agency `MessageChat.tsx`

### Phase 5: Sidebar Updates

- [x] **5.1** Update Brand Sidebar
  - Location: `components/Sidebar.tsx`
  - Add "Messages" nav item with `chat` icon
  - Position after "Matches"
  - Include unread badge using `useUnreadCount`

- [x] **5.2** Update Agency Sidebar
  - Location: `components/AgencySidebar.tsx`
  - Add "Messages" nav item with `chat` icon
  - Position after "Matches"
  - Include unread badge using `useUnreadCount`

### Phase 6: Hire Button Flow

- [x] **6.1** Update "Hire" button handler in Matches.tsx
  - Location: `pages/brand/Matches.tsx`
  - On click:
    1. Create conversation if doesn't exist (via `useConversation`)
    2. Update deal status to "active"
    3. Call `notify-agency-hire` Edge Function
    4. Navigate to `/messages/:conversationId`

- [x] **6.2** Add loading state to Hire button
  - Show spinner while creating conversation
  - Disable button during process

### Phase 7: Polish & Edge Cases

- [x] **7.1** Empty state for Messages pages
  - "No conversations yet" with CTA to Matches

- [x] **7.2** Error handling
  - Handle failed email sends gracefully
  - Show toast on conversation creation failure

- [ ] **7.3** Mobile responsiveness
  - Ensure chat pages work well on mobile
  - Consider back navigation on mobile

- [ ] **7.4** Realtime connection status indicator
  - Optional: Show "Connecting..." when Realtime reconnects

---

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `supabase/functions/notify-agency-hire/index.ts` | Edge function to email agency on hire |
| `hooks/useUnreadCount.ts` | Hook for unread message count with Realtime |
| `hooks/useConversations.ts` | Hook for fetching conversation inbox |
| `pages/brand/Messages.tsx` | Brand inbox page |
| `pages/brand/MessageChat.tsx` | Brand full-page chat |
| `pages/agency/Messages.tsx` | Agency inbox page |
| `pages/agency/MessageChat.tsx` | Agency full-page chat |

### Modified Files
| File | Changes |
|------|---------|
| `hooks/useChat.ts` | Add `markAsRead()` function |
| `components/Sidebar.tsx` | Add Messages nav with badge |
| `components/AgencySidebar.tsx` | Add Messages nav with badge |
| `pages/brand/Matches.tsx` | Update Hire button handler |
| `App.tsx` | Add new routes for Messages pages |

---

## Technical Notes

### Supabase Realtime
- Already configured in `useChat` hook using broadcast channels
- Will extend pattern for:
  - `useUnreadCount` - subscribe to message inserts/updates
  - `useConversations` - subscribe to new messages for last message preview

### Existing Infrastructure
- `conversations` table with RLS policies ✅
- `messages` table with `read_at` column ✅
- `useChat` and `useConversation` hooks ✅
- Chat UI components (ChatHeader, ChatMessages, ChatInput) ✅
- Resend email pattern in `notify-agency-match` ✅

### Database Schema (already exists)
```sql
-- conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) UNIQUE,
  business_id UUID REFERENCES auth.users(id),
  agency_id UUID REFERENCES agencies(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID,
  sender_type TEXT CHECK (sender_type IN ('business', 'agency')),
  sender_name TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ  -- Used for read receipts
);
```

---

## Future Enhancements (Out of Scope)

- [ ] Push notifications (web/mobile)
- [ ] Typing indicators
- [ ] File/image attachments
- [ ] Message reactions
- [ ] Message search
- [ ] Conversation archiving
- [ ] Email digest for unread messages (daily/weekly)
