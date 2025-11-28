import React from "react";
import { Icon } from "../Icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconPosition?: "left" | "right";
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] touch-manipulation";

  const variants = {
    primary:
      "bg-gradient-to-r from-primary to-pink-600 text-white hover:from-primary/90 hover:to-pink-600/90 focus:ring-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all duration-300",
    secondary:
      "bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white hover:from-gray-900 hover:to-gray-950 dark:hover:from-gray-600 dark:hover:to-gray-700 focus:ring-gray-500 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-300",
    outline:
      "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary/50 dark:hover:border-primary/50 focus:ring-gray-500 active:scale-95 transition-all duration-300",
    ghost:
      "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 active:scale-95 transition-all duration-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-5 py-2.5 text-sm min-h-[44px]",
    lg: "px-6 py-3 text-base min-h-[48px]",
  };

  const iconSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Icon
            name="hourglass_empty"
            className={`${iconSizes[size]} mr-2 animate-spin`}
          />
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Icon name={icon} className={`${iconSizes[size]} mr-2`} />
          )}
          {children}
          {icon && iconPosition === "right" && (
            <Icon name={icon} className={`${iconSizes[size]} ml-2`} />
          )}
        </>
      )}
    </button>
  );
};
