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
      // Query conversation_members table for total unread count
      const { data, error } = await supabase
        .from("conversation_members")
        .select("unread_count")
        .eq("user_id", user.id);

      if (error) throw error;

      // Sum up all unread counts
      const total = (data || []).reduce((sum, member) => sum + (member.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to realtime updates for conversation_members changes
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    // Subscribe to conversation_members table changes for this user
    const channel: RealtimeChannel = supabase
      .channel("unread-count-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch count when this user's memberships change
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
