import React from "react";
import { Message } from "../../types";

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] ${isOwn ? "order-2" : "order-1"}`}>
        {/* Sender name (only for other person's messages) */}
        {!isOwn && (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">
            {message.senderName}
          </p>
        )}
        
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? "bg-primary text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        
        {/* Timestamp */}
        <p
          className={`text-[10px] text-gray-400 dark:text-gray-500 mt-1 ${
            isOwn ? "text-right mr-1" : "text-left ml-1"
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};
