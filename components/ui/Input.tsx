import React from "react";
import { Icon } from "../Icon";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  helperText,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon name={icon} className="text-xl" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-300
            ${icon ? "pl-11" : ""}
            ${
              error
                ? "border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20"
                : "border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-primary focus:shadow-lg focus:shadow-primary/20"
            }
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2
            hover:border-primary/50 dark:hover:border-primary/50
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
