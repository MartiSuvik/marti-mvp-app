import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useChat } from "../../hooks/useChat";
import { ChatMessages } from "../../components/chat/ChatMessages";
import { ChatInput } from "../../components/chat/ChatInput";
import { Icon } from "../../components/Icon";
import { Conversation } from "../../types";

interface ConversationData extends Conversation {
  businessProfile?: {
    companyName?: string;
  };
}

export const MessageChat: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, agency } = useAuth();
  const { showToast } = useToast();
  
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const senderName = agency?.name || "Agency";

  const {
    messages,
    loading: loadingMessages,
    sendMessage: sendMessageHook,
    sending,
    markAsRead,
    error: chatError,
  } = useChat({
    conversationId: conversationId || "",
    userId: user?.id || "",
    userType: "agency",
    senderName,
  });

  // Wrapper for sendMessage to handle errors
  const handleSendMessage = async (content: string, attachment?: File) => {
    try {
      await sendMessageHook(content, attachment);
    } catch (err: any) {
      showToast(err.message || "Failed to send message", "error");
    }
  };

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !agency) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("conversations")
          .select(`
            *,
            user_profiles!conversations_business_id_fkey (company_name)
          `)
          .eq("id", conversationId)
          .eq("agency_id", agency.id)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Conversation not found");
          return;
        }

        setConversation({
          id: data.id,
          dealId: data.deal_id,
          businessId: data.business_id,
          agencyId: data.agency_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          businessProfile: data.user_profiles
            ? { companyName: data.user_profiles.company_name }
            : undefined,
        });
      } catch (err: any) {
        console.error("Error fetching conversation:", err);
        setError(err.message || "Failed to load conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, agency]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (conversation && !loadingMessages) {
      markAsRead();
    }
  }, [conversation, loadingMessages, markAsRead]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icon name="hourglass_empty" className="text-5xl text-primary animate-spin" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Icon name="error" className="text-5xl text-red-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error || "Conversation not found"}</p>
        <button
          onClick={() => navigate("/agency/messages")}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  const clientName = conversation.businessProfile?.companyName || "Client";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => navigate("/agency/messages")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Icon name="arrow_back" className="text-gray-600 dark:text-gray-300" />
        </button>
        
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
          <Icon name="person" className="text-xl text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate">
            {clientName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Client
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        <ChatMessages
          messages={messages}
          currentUserId={user?.id || ""}
          loading={loadingMessages}
        />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatInput
          onSend={handleSendMessage}
          disabled={sending || !conversation}
          placeholder="Type a message..."
          sending={sending}
        />
      </div>

      {chatError && (
        <div className="absolute bottom-20 left-4 right-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {chatError}
        </div>
      )}
    </div>
  );
};
