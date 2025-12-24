import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseUnreadCountReturn {
  unreadCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUnreadCount(): UseUnreadCountReturn {
  const { user, profile, agency, isAgencyUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // Get conversations for this user
      let conversationIds: string[] = [];

      if (isAgencyUser && agency) {
        // Agency user: get conversations where agency_id matches
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .eq("agency_id", agency.id);
        conversationIds = (convs || []).map((c) => c.id);
      } else {
        // Business user: get conversations where business_id matches
        const { data: convs } = await supabase
          .from("conversations")
          .select("id")
          .eq("business_id", user.id);
        conversationIds = (convs || []).map((c) => c.id);
      }

      if (conversationIds.length === 0) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Count unread messages (not sent by current user, read_at is null)
      const senderType = isAgencyUser ? "agency" : "business";
      
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_type", senderType)
        .is("read_at", null);

      if (error) throw error;

      setUnreadCount(count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, agency, isAgencyUser]);

  // Subscribe to realtime updates for new messages
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    // Subscribe to messages table changes
    const channel: RealtimeChannel = supabase
      .channel("unread-count-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch count when messages change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  };
}
