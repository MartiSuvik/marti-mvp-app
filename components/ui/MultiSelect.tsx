import React from "react";

interface MultiSelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  required,
}) => {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        className={`
        border rounded-lg p-3 min-h-[120px] max-h-[200px] overflow-y-auto
        ${
          error
            ? "border-red-300 dark:border-red-700"
            : "border-gray-300 dark:border-gray-600"
        }
        bg-white dark:bg-gray-800
      `}
      >
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary bg-white dark:bg-gray-800"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {option.label}
              </span>
            </label>
          ))}
        </div>
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
