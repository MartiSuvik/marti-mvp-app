import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Message, MessagePayload, Conversation, MessageType, MessageAttachment } from "../types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { uploadChatAttachment } from "../lib/fileUpload";

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
  sendMessage: (content: string, attachment?: File, messageType?: MessageType) => Promise<void>;
  sending: boolean;
  markAsRead: () => Promise<void>;
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
        messageType: m.message_type || "text",
        attachments: m.attachments || undefined,
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
    async (content: string, attachment?: File, messageType: MessageType = "text") => {
      // Must have either content or attachment
      if (!content.trim() && !attachment) return;
      if (!conversationId || sending) return;

      const trimmedContent = content.trim();
      setSending(true);

      try {
        let attachmentMetadata: MessageAttachment[] | undefined;

        // 1. Upload file to storage if attachment exists
        if (attachment) {
          const uploadedAttachment = await uploadChatAttachment(attachment, conversationId);
          attachmentMetadata = [uploadedAttachment];
        }

        // 2. Insert to database (persistence)
        const { data, error: insertError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            sender_type: userType,
            sender_name: senderName,
            content: trimmedContent,
            message_type: messageType,
            attachments: attachmentMetadata,
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
          messageType: data.message_type || "text",
          attachments: data.attachments || undefined,
          createdAt: data.created_at,
          readAt: data.read_at,
        };

        // Add to local state immediately
        setMessages((prev) => [...prev, newMessage]);

        // 3. Broadcast to realtime (instant delivery to other users)
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: newMessage,
          });
        }

        // 4. Update conversation updated_at
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

      } catch (err: any) {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message");
        throw err; // Re-throw so UI can handle it
      } finally {
        setSending(false);
      }
    },
    [conversationId, userId, userType, senderName, sending]
  );

  // Mark all messages from the other party as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !userId) return;

    try {
      const otherSenderType = userType === "business" ? "agency" : "business";
      
      const { error: updateError } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("sender_type", otherSenderType)
        .is("read_at", null);

      if (updateError) {
        console.error("Error marking messages as read:", updateError);
      }

      // Update local state to reflect read status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderType === otherSenderType && !msg.readAt
            ? { ...msg, readAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [conversationId, userId, userType]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    sending,
    markAsRead,
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
