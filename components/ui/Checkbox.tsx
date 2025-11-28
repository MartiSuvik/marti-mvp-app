import React from "react";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className={`
            w-5 h-5 rounded border-gray-300 dark:border-gray-600
            text-primary focus:ring-primary
            bg-white dark:bg-gray-800
            ${error ? "border-red-300 dark:border-red-700" : ""}
            ${className}
          `}
          {...props}
        />
        {label && (
          <span
            className={`ml-2 text-sm text-gray-700 dark:text-gray-300 ${
              error ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {label}
          </span>
        )}
      </label>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
