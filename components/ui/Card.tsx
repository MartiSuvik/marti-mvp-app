import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={`
        glass rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50
        ${
          hover
            ? "hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            : ""
        }
        ${onClick ? "cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
