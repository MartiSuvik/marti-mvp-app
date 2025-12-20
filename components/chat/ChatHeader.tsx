import React from "react";
import { Icon } from "../Icon";
import { AgencyLogo } from "../AgencyLogo";

interface ChatHeaderProps {
  name: string;
  subtitle?: string;
  logoUrl?: string;
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  subtitle,
  logoUrl,
  onClose,
}) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Back button */}
      <button
        onClick={onClose}
        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Icon name="arrow_back" className="text-xl text-gray-600 dark:text-gray-400" />
      </button>

      {/* Avatar/Logo */}
      <AgencyLogo logoUrl={logoUrl} name={name} size="sm" />

      {/* Name & subtitle */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {name}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Online indicator (optional - could add presence later) */}
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
      </div>
    </div>
  );
};
