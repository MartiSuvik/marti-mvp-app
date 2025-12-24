import React from "react";
import { Message } from "../../types";
import { Icon } from "../Icon";
import { ChatMessageList } from "./ChatMessageList";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleName,
} from "./ChatBubble";

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
  agencyLogo?: string;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  currentUserId,
  loading,
  agencyLogo,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Icon
            name="hourglass_empty"
            className="text-4xl text-gray-400 animate-spin mx-auto mb-2"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="chat_bubble_outline" className="text-3xl text-primary" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Start the conversation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send a message to begin discussing your project.
          </p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toLocaleDateString(
      undefined,
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <ChatMessageList className="flex-1">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          {/* Date separator */}
          <div className="flex items-center justify-center my-2">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5 shadow-sm">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {group.date}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          {group.messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            const initials = message.senderName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?";

            return (
              <ChatBubble key={message.id} variant={isOwn ? "sent" : "received"}>
                {!isOwn && (
                  <ChatBubbleAvatar
                    src={agencyLogo}
                    fallback={initials}
                  />
                )}
                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <ChatBubbleName>{message.senderName}</ChatBubbleName>
                  )}
                  <ChatBubbleMessage 
                    variant={isOwn ? "sent" : "received"}
                    attachment={message.attachments?.[0]}
                  >
                    {message.content}
                  </ChatBubbleMessage>
                  <ChatBubbleTimestamp>
                    {formatTime(message.createdAt)}
                  </ChatBubbleTimestamp>
                </div>
              </ChatBubble>
            );
          })}
        </div>
      ))}
    </ChatMessageList>
  );
};
