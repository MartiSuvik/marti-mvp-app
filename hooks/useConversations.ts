import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Conversation, Agency, UserProfile } from "../types";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ConversationWithDetails extends Conversation {
  agency?: Agency;
  businessProfile?: {
    companyName?: string;
  };
  lastMessageContent?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface UseConversationsReturn {
  conversations: ConversationWithDetails[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const { user, agency, isAgencyUser } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      let query = supabase
        .from("conversations")
        .select(`
          *,
          agencies (*)
        `)
        .order("updated_at", { ascending: false });

      if (isAgencyUser && agency) {
        query = query.eq("agency_id", agency.id);
      } else {
        query = query.eq("business_id", user.id);
      }

      const { data: convData, error: convError } = await query;

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch business profiles for agency users (separate query since no direct FK)
      const businessProfileMap = new Map<string, string>();
      if (isAgencyUser) {
        const businessIds = [...new Set(convData.map((c: any) => c.business_id))];
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, company_name")
          .in("user_id", businessIds);
        
        if (profiles) {
          profiles.forEach((p: any) => {
            businessProfileMap.set(p.user_id, p.company_name);
          });
        }
      }

      // Fetch last message and unread count for each conversation
      const conversationIds = convData.map((c: any) => c.id);
      const senderType = isAgencyUser ? "agency" : "business";

      // Get last messages
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      // Get unread counts per conversation
      const { data: unreadData } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_type", senderType)
        .is("read_at", null);

      // Build a map of last messages per conversation
      const lastMessageMap = new Map<string, { content: string; createdAt: string }>();
      if (lastMessages) {
        for (const msg of lastMessages) {
          if (!lastMessageMap.has(msg.conversation_id)) {
            lastMessageMap.set(msg.conversation_id, {
              content: msg.content,
              createdAt: msg.created_at,
            });
          }
        }
      }

      // Build a map of unread counts per conversation
      const unreadCountMap = new Map<string, number>();
      if (unreadData) {
        for (const msg of unreadData) {
          const count = unreadCountMap.get(msg.conversation_id) || 0;
          unreadCountMap.set(msg.conversation_id, count + 1);
        }
      }

      // Map to typed conversations
      const mappedConversations: ConversationWithDetails[] = convData.map((conv: any) => {
        const lastMsg = lastMessageMap.get(conv.id);
        return {
          id: conv.id,
          dealId: conv.deal_id,
          businessId: conv.business_id,
          agencyId: conv.agency_id,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          agency: conv.agencies
            ? {
                id: conv.agencies.id,
                name: conv.agencies.name,
                logoUrl: conv.agencies.logo_url,
                description: conv.agencies.description,
                platforms: conv.agencies.platforms || [],
                industries: conv.agencies.industries || [],
                spendBrackets: conv.agencies.spend_brackets || [],
                objectives: conv.agencies.objectives || [],
                capabilities: conv.agencies.capabilities || [],
                verified: conv.agencies.verified || false,
              }
            : undefined,
          businessProfile: isAgencyUser && businessProfileMap.has(conv.business_id)
            ? { companyName: businessProfileMap.get(conv.business_id) }
            : undefined,
          lastMessageContent: lastMsg?.content,
          lastMessageAt: lastMsg?.createdAt,
          unreadCount: unreadCountMap.get(conv.id) || 0,
        };
      });

      // Sort by last message time (most recent first)
      mappedConversations.sort((a, b) => {
        const aTime = a.lastMessageAt || a.updatedAt;
        const bTime = b.lastMessageAt || b.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(mappedConversations);
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [user, agency, isAgencyUser]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    fetchConversations();

    // Subscribe to messages and conversations table changes
    const channel: RealtimeChannel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
}
