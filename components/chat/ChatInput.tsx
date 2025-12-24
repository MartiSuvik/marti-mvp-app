import React, { useState, useRef, KeyboardEvent } from "react";
import { Icon } from "../Icon";
import { MessageAttachment } from "../../types";
import {
  validateFile,
  FileValidationError,
  formatFileSize,
  getAllowedExtensions,
} from "../../lib/fileUpload";

interface ChatInputProps {
  onSend: (message: string, attachment?: MessageAttachment) => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  sending = false,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isDisabled = sending || disabled;

  const handleSend = () => {
    if ((message.trim() || selectedFile) && !isDisabled) {
      // Can send if there's text OR a file
      onSend(message.trim(), selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
      setFileError(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Set height to scrollHeight, max 120px (about 5 lines)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file
      validateFile(file);
      setSelectedFile(file);
      setFileError(null);
    } catch (err) {
      if (err instanceof FileValidationError) {
        setFileError(err.message);
      } else {
        setFileError("Failed to select file");
      }
      setSelectedFile(null);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
  };

  // Trigger file input click
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* File error message */}
      {fileError && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <Icon name="error" className="text-red-500 text-lg flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700 dark:text-red-400">{fileError}</p>
          </div>
          <button
            onClick={() => setFileError(null)}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon
              name={selectedFile.type.startsWith("image/") ? "image" : "description"}
              className="text-blue-600 dark:text-blue-400 text-xl"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <button
            onClick={handleRemoveFile}
            disabled={sending}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isDisabled || selectedFile !== null}
        />

        {/* Attach button */}
        <button
          onClick={handleAttachClick}
          disabled={isDisabled || selectedFile !== null}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            selectedFile
              ? "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          title={`Attach file (${getAllowedExtensions()})`}
        >
          <Icon name="attach_file" className="text-xl" />
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isDisabled}
            className="w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all"
            style={{ maxHeight: "120px" }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isDisabled}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            (message.trim() || selectedFile) && !isDisabled
              ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {sending ? (
            <Icon name="hourglass_empty" className="text-xl animate-spin" />
          ) : (
            <Icon name="send" className="text-xl" />
          )}
        </button>
      </div>
      
      {/* Hint text */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
        Press Enter to send, Shift+Enter for new line • Max 10MB • {getAllowedExtensions()}
      </p>
    </div>
  );
};
