import React, { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "../Icon";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  smooth?: boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  children,
  smooth = true,
  className = "",
  ...props
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Check if scrolled to bottom
  const checkIfAtBottom = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setAutoScrollEnabled(true);
    }
  }, [smooth]);

  // Disable auto-scroll when user scrolls up
  const handleScroll = useCallback(() => {
    checkIfAtBottom();
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      if (!atBottom) {
        setAutoScrollEnabled(false);
      }
    }
  }, [checkIfAtBottom]);

  // Auto-scroll when new content is added
  useEffect(() => {
    if (autoScrollEnabled && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, [children, autoScrollEnabled, smooth]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex flex-col w-full h-full p-4 overflow-y-auto ${className}`}
        {...props}
      >
        <div className="flex flex-col gap-4">{children}</div>
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10"
          aria-label="Scroll to bottom"
        >
          <Icon name="keyboard_arrow_down" className="text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
};
