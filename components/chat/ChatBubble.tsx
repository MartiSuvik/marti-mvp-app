import React from "react";
import { MessageAttachment } from "../../types";
import { Icon } from "../Icon";
import { formatFileSize, isImageType } from "../../lib/fileUpload";

// ============================================
// ChatBubble - Main container for chat messages
// ============================================

type BubbleVariant = "sent" | "received";

interface ChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BubbleVariant;
  children: React.ReactNode;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  variant = "received",
  children,
  className = "",
  ...props
}) => {
  const variantStyles = {
    sent: "self-end flex-row-reverse",
    received: "self-start",
  };

  return (
    <div
      className={`flex gap-2 max-w-[75%] items-end relative group ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { variant })
          : child
      )}
    </div>
  );
};

// ============================================
// ChatBubbleAvatar - User/Agency avatar
// ============================================

interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

export const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({
  src,
  fallback = "?",
  className = "",
}) => (
  <div
    className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center ${className}`}
  >
    {src ? (
      <img src={src} alt="Avatar" className="w-full h-full object-cover" />
    ) : (
      <span className="text-xs font-semibold text-primary">
        {fallback.slice(0, 2).toUpperCase()}
      </span>
    )}
  </div>
);

// ============================================
// ChatBubbleMessage - Message content bubble
// ============================================

interface ChatBubbleMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BubbleVariant;
  isLoading?: boolean;
  children?: React.ReactNode;
  attachment?: MessageAttachment;
}

export const ChatBubbleMessage: React.FC<ChatBubbleMessageProps> = ({
  variant = "received",
  isLoading = false,
  children,
  attachment,
  className = "",
  ...props
}) => {
  const variantStyles = {
    sent: "bg-primary text-white rounded-2xl rounded-br-md",
    received: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-md border border-gray-100 dark:border-gray-700",
  };

  if (isLoading) {
    return (
      <div
        className={`px-4 py-3 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Attachment (if present) */}
      {attachment && (
        <div className="mb-2">
          {isImageType(attachment.mimeType || "") ? (
            // Image attachment - display inline
            <div className="rounded-lg overflow-hidden max-w-sm">
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full h-auto"
                loading="lazy"
              />
              <div className={`px-3 py-2 text-xs ${
                variant === "sent" 
                  ? "bg-white/10 text-white/80" 
                  : "bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{attachment.name}</span>
                  <span className="flex-shrink-0">{formatFileSize(attachment.size)}</span>
                </div>
              </div>
            </div>
          ) : (
            // Document attachment - download link
            <a
              href={attachment.url}
              download={attachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                variant === "sent"
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-900 dark:text-white"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                variant === "sent"
                  ? "bg-white/20"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}>
                <Icon name="description" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className={`text-xs ${
                  variant === "sent"
                    ? "text-white/70"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <Icon name="download" className="text-lg flex-shrink-0" />
            </a>
          )}
        </div>
      )}

      {/* Text content (if present) */}
      {children && (
        <div className="px-4 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {children}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// ChatBubbleTimestamp - Message timestamp
// ============================================

interface ChatBubbleTimestampProps {
  timestamp: string;
  variant?: BubbleVariant;
  className?: string;
}

export const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
  timestamp,
  variant = "received",
  className = "",
}) => (
  <span
    className={`text-[10px] text-gray-400 dark:text-gray-500 mt-1 block ${
      variant === "sent" ? "text-right" : "text-left"
    } ${className}`}
  >
    {timestamp}
  </span>
);

// ============================================
// ChatBubbleName - Sender name label
// ============================================

interface ChatBubbleNameProps {
  name: string;
  className?: string;
}

export const ChatBubbleName: React.FC<ChatBubbleNameProps> = ({
  name,
  className = "",
}) => (
  <span className={`text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block ${className}`}>
    {name}
  </span>
);
