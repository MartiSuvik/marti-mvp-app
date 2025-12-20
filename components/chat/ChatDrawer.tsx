import React, { useEffect } from "react";
import { useChat, useConversation } from "../../hooks/useChat";
import { useAuth } from "../../contexts/AuthContext";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { Agency, Deal } from "../../types";
import { Icon } from "../Icon";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  agency: Agency;
  userType: "business" | "agency";
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  deal,
  agency,
  userType,
}) => {
  const { user, profile } = useAuth();
  const { conversation, loading: loadingConversation, createConversation } = useConversation(deal.id);

  // Determine sender name based on user type
  const senderName = userType === "business" 
    ? (profile?.companyName || "Business")
    : agency.name;

  // Chat hook - only active when we have a conversation
  const {
    messages,
    loading: loadingMessages,
    sendMessage,
    sending,
    error,
  } = useChat({
    conversationId: conversation?.id || "",
    userId: user?.id || "",
    userType,
    senderName,
  });

  // Create conversation if it doesn't exist when drawer opens
  useEffect(() => {
    if (isOpen && !conversation && !loadingConversation && user) {
      createConversation(deal.userId, agency.id);
    }
  }, [isOpen, conversation, loadingConversation, user, deal.userId, agency.id, createConversation]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine display name based on user type
  const displayName = userType === "business" ? agency.name : (profile?.companyName || "Business");
  const displaySubtitle = userType === "business" ? "Marketing Agency" : "Client";
  const displayLogo = userType === "business" ? agency.logoUrl : undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <ChatHeader
          name={displayName}
          subtitle={displaySubtitle}
          logoUrl={displayLogo}
          onClose={onClose}
        />

        {/* Loading state for conversation */}
        {loadingConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Icon
                name="hourglass_empty"
                className="text-4xl text-gray-400 animate-spin mx-auto mb-2"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Setting up chat...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Icon name="error" className="text-3xl text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <ChatMessages
              messages={messages}
              currentUserId={user?.id || ""}
              loading={loadingMessages}
            />

            {/* Input */}
            <ChatInput onSend={sendMessage} sending={sending} />
          </>
        )}
      </div>
    </>
  );
};
