import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Message, MessagePayload, Conversation } from "../types";
import { RealtimeChannel } from "@supabase/supabase-js";

interface UseChatOptions {
  conversationId: string;
  userId: string;
  userType: "business" | "agency";
  senderName: string;
}

interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  sending: boolean;
}

export function useChat({
  conversationId,
  userId,
  userType,
  senderName,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load existing messages from database
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      // Map snake_case to camelCase
      const mappedMessages: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderType: m.sender_type,
        senderName: m.sender_name,
        content: m.content,
        createdAt: m.created_at,
        readAt: m.read_at,
      }));

      setMessages(mappedMessages);
    } catch (err: any) {
      console.error("Error loading messages:", err);
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    // Load initial messages
    loadMessages();

    // Create realtime channel
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: { private: true },
    });

    // Listen for new messages
    channel.on("broadcast", { event: "new_message" }, (payload) => {
      const newMessage = payload.payload as MessagePayload;
      
      // Add message to state if it's not from us (we already added it optimistically)
      setMessages((prev) => {
        // Check if message already exists (dedup)
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage as Message];
      });
    });

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`Subscribed to conversation:${conversationId}`);
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, loadMessages]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !conversationId || sending) return;

      const trimmedContent = content.trim();
      setSending(true);

      try {
        // 1. Insert to database (persistence)
        const { data, error: insertError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            sender_type: userType,
            sender_name: senderName,
            content: trimmedContent,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Map to Message type
        const newMessage: Message = {
          id: data.id,
          conversationId: data.conversation_id,
          senderId: data.sender_id,
          senderType: data.sender_type,
          senderName: data.sender_name,
          content: data.content,
          createdAt: data.created_at,
          readAt: data.read_at,
        };

        // Add to local state immediately
        setMessages((prev) => [...prev, newMessage]);

        // 2. Broadcast to realtime (instant delivery to other users)
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: newMessage,
          });
        }

        // 3. Update conversation updated_at
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

      } catch (err: any) {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [conversationId, userId, userType, senderName, sending]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    sending,
  };
}

// Helper hook to get or create a conversation for a deal
export function useConversation(dealId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealId) {
      setLoading(false);
      return;
    }

    const fetchConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("conversations")
          .select("*")
          .eq("deal_id", dealId)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 = no rows returned
          throw fetchError;
        }

        if (data) {
          setConversation({
            id: data.id,
            dealId: data.deal_id,
            businessId: data.business_id,
            agencyId: data.agency_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        } else {
          setConversation(null);
        }
      } catch (err: any) {
        console.error("Error fetching conversation:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [dealId]);

  // Create conversation if it doesn't exist
  const createConversation = useCallback(
    async (businessId: string, agencyId: string) => {
      if (!dealId) return null;

      try {
        const { data, error: createError } = await supabase
          .from("conversations")
          .insert({
            deal_id: dealId,
            business_id: businessId,
            agency_id: agencyId,
          })
          .select()
          .single();

        if (createError) throw createError;

        const newConversation: Conversation = {
          id: data.id,
          dealId: data.deal_id,
          businessId: data.business_id,
          agencyId: data.agency_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setConversation(newConversation);
        return newConversation;
      } catch (err: any) {
        console.error("Error creating conversation:", err);
        setError(err.message);
        return null;
      }
    },
    [dealId]
  );

  return {
    conversation,
    loading,
    error,
    createConversation,
  };
}
