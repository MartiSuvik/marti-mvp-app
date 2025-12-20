import React from "react";
import { Button } from "./Button";
import { Icon } from "../Icon";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void; // Optional separate cancel action
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  icon?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  icon = "help_outline",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            confirmVariant === "danger" 
              ? "bg-red-100 dark:bg-red-900/40" 
              : "bg-gradient-to-br from-primary/20 to-pink-500/20"
          }`}>
            <Icon 
              name={icon} 
              className={`text-3xl ${
                confirmVariant === "danger" 
                  ? "text-red-500" 
                  : "text-primary"
              }`} 
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (onCancel) {
                onCancel();
              }
              onClose();
            }}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant === "danger" ? "primary" : "primary"}
            className={`flex-1 ${confirmVariant === "danger" ? "!bg-red-500 hover:!bg-red-600" : ""}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
