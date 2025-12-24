import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations, ConversationWithDetails } from "../../hooks/useConversations";
import { useChat } from "../../hooks/useChat";
import { supabase } from "../../lib/supabase";
import { Icon } from "../../components/Icon";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleName,
} from "../../components/chat/ChatBubble";

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user, agencyProfile } = useAuth();
  const { conversations, loading: loadingConversations } = useConversations();
  
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const senderName = agencyProfile?.name || "Agency";

  const {
    messages,
    loading: loadingMessages,
    sendMessage,
    sending,
    markAsRead,
  } = useChat({
    conversationId: selectedConversation?.id || "",
    userId: user?.id || "",
    userType: "agency",
    senderName,
  });

  // Message input state
  const [messageText, setMessageText] = useState("");
  const [startingCall, setStartingCall] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Select conversation from URL or first available
  useEffect(() => {
    if (conversations.length > 0) {
      if (conversationId) {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
        }
      } else if (!selectedConversation) {
        // Auto-select first conversation
        setSelectedConversation(conversations[0]);
        navigate(`/agency/messages/${conversations[0].id}`, { replace: true });
      }
    }
  }, [conversations, conversationId, navigate, selectedConversation]);

  // Mark as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && !loadingMessages) {
      markAsRead();
    }
  }, [selectedConversation, loadingMessages, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (conv: ConversationWithDetails) => {
    setSelectedConversation(conv);
    navigate(`/agency/messages/${conv.id}`, { replace: true });
  };

  const handleSend = () => {
    if (messageText.trim() && !sending) {
      sendMessage(messageText.trim());
      setMessageText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleStartVideoCall = async () => {
    if (!selectedConversation || startingCall) return;

    setStartingCall(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-zoom-meeting", {
        body: {
          conversationId: selectedConversation.id,
          initiatorName: senderName,
        },
      });

      if (error || !data?.success) {
        // Post error message to chat
        await sendMessage(
          "⚠️ Video call service couldn't launch right now. Development team is on it.",
          "system"
        );
        return;
      }

      // Post the join link to chat with special formatting
      await sendMessage(
        `📹 I've started a video call! Join here: ${data.joinUrl}`,
        "video_call"
      );
    } catch (err) {
      console.error("Error starting video call:", err);
      await sendMessage(
        "⚠️ Video call service couldn't launch right now. Development team is on it.",
        "system"
      );
    } finally {
      setStartingCall(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatListTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const truncateMessage = (content?: string, maxLength = 40) => {
    if (!content) return "No messages yet";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const name = conv.businessProfile?.companyName || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getClientInitials = (name?: string) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icon name="hourglass_empty" className="text-5xl text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="chat" className="text-4xl text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const hasUnread = conv.unreadCount > 0;
              const clientName = conv.businessProfile?.companyName || "Client";
              
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors ${
                    isSelected 
                      ? "bg-primary/10 border-l-2 border-l-primary" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {getClientInitials(clientName)}
                      </span>
                    </div>
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm truncate ${
                        hasUnread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {clientName}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatListTime(conv.lastMessageAt || conv.updatedAt)}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${
                      hasUnread 
                        ? "text-gray-800 dark:text-gray-200 font-medium" 
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {truncateMessage(conv.lastMessageContent)}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {hasUnread && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {getClientInitials(selectedConversation.businessProfile?.companyName)}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {selectedConversation.businessProfile?.companyName || "Client"}
                  </h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Online
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartVideoCall}
                  disabled={startingCall}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${startingCall ? "opacity-50 cursor-not-allowed" : ""}`}
                  title="Start video call"
                >
                  {startingCall ? (
                    <Icon name="hourglass_empty" className="text-gray-500 animate-spin" />
                  ) : (
                    <Icon name="videocam" className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Icon name="hourglass_empty" className="text-3xl text-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon name="chat_bubble_outline" className="text-3xl text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Start the conversation
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Send a message to begin discussing the project.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    const initials = message.senderName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "?";

                    // Special rendering for video call messages
                    if (message.messageType === "video_call") {
                      const urlMatch = message.content.match(/https:\/\/[^\s]+/);
                      const joinUrl = urlMatch ? urlMatch[0] : null;

                      return (
                        <ChatBubble key={message.id} variant={isOwn ? "sent" : "received"}>
                          {!isOwn && (
                            <ChatBubbleAvatar fallback={initials} />
                          )}
                          <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                            {!isOwn && (
                              <ChatBubbleName>{message.senderName}</ChatBubbleName>
                            )}
                            <div className={`rounded-2xl p-4 ${isOwn ? "bg-primary text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOwn ? "bg-white/20" : "bg-primary/10"}`}>
                                  <Icon name="videocam" className={isOwn ? "text-white" : "text-primary"} />
                                </div>
                                <div>
                                  <p className={`font-semibold ${isOwn ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                    Video Call
                                  </p>
                                  <p className={`text-xs ${isOwn ? "text-white/70" : "text-gray-500"}`}>
                                    Click to join the call
                                  </p>
                                </div>
                              </div>
                              {joinUrl && (
                                <a
                                  href={joinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                    isOwn
                                      ? "bg-white text-primary hover:bg-white/90"
                                      : "bg-primary text-white hover:bg-primary/90"
                                  }`}
                                >
                                  <Icon name="open_in_new" className="text-sm" />
                                  Join Meeting
                                </a>
                              )}
                            </div>
                            <ChatBubbleTimestamp>
                              {formatTime(message.createdAt)}
                            </ChatBubbleTimestamp>
                          </div>
                        </ChatBubble>
                      );
                    }

                    // Special rendering for system messages
                    if (message.messageType === "system") {
                      return (
                        <div key={message.id} className="flex justify-center my-4">
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Default text message rendering
                    return (
                      <ChatBubble key={message.id} variant={isOwn ? "sent" : "received"}>
                        {!isOwn && (
                          <ChatBubbleAvatar fallback={initials} />
                        )}
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          {!isOwn && (
                            <ChatBubbleName>{message.senderName}</ChatBubbleName>
                          )}
                          <ChatBubbleMessage variant={isOwn ? "sent" : "received"}>
                            {message.content}
                          </ChatBubbleMessage>
                          <ChatBubbleTimestamp>
                            {formatTime(message.createdAt)}
                          </ChatBubbleTimestamp>
                        </div>
                      </ChatBubble>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-end gap-3">
                {/* Attachment & Formatting buttons */}
                <div className="flex items-center gap-1 pb-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
                    <Icon name="attach_file" className="text-lg" />
                  </button>
                </div>

                {/* Text input */}
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message..."
                    rows={1}
                    disabled={sending}
                    className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50"
                    style={{ maxHeight: "120px" }}
                  />
                </div>

                {/* Right side buttons */}
                <div className="flex items-center gap-1 pb-2">
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sending}
                    className={`p-2 rounded-lg transition-colors ${
                      messageText.trim() && !sending
                        ? "text-primary hover:bg-primary/10"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <Icon name="send" className="text-lg" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Icon name="forum" className="text-4xl text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a conversation from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
