import { supabase } from "./supabase";
import { MessageAttachment, AttachmentType } from "../types";

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// File type labels for display
const MIME_TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG Image",
  "image/png": "PNG Image",
  "image/webp": "WebP Image",
  "application/pdf": "PDF Document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
};

// Max file size: 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Validation errors
export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileValidationError";
  }
}

/**
 * Validate file type and size before upload
 */
export function validateFile(file: File): void {
  // Check for video uploads (block explicitly)
  if (file.type.startsWith("video/")) {
    throw new FileValidationError(
      "Video uploads aren't supported. Share a link instead."
    );
  }

  // Check for audio uploads
  if (file.type.startsWith("audio/")) {
    throw new FileValidationError(
      "Audio uploads aren't supported. Share a link instead."
    );
  }

  // Check allowed MIME types
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new FileValidationError(
      `File type not allowed. Supported types: Images (JPG, PNG, WebP), PDF, and Word documents.`
    );
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new FileValidationError(
      `File too large (${sizeMB}MB). Maximum size is 10MB.`
    );
  }
}

/**
 * Get attachment type from MIME type
 */
function getAttachmentType(mimeType: string): AttachmentType {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  return "document";
}

/**
 * Upload file to Supabase Storage
 * 
 * @param file - File to upload
 * @param conversationId - Conversation ID (used for folder path)
 * @returns MessageAttachment metadata
 */
export async function uploadChatAttachment(
  file: File,
  conversationId: string
): Promise<MessageAttachment> {
  // Validate file first
  validateFile(file);

  // Generate unique filename: {timestamp}_{original_filename}
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${timestamp}_${sanitizedName}`;
  
  // Storage path: {conversation_id}/{filename}
  const storagePath = `${conversationId}/${filename}`;

  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Generate signed URL (expires in 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(data.path, 3600); // 1 hour expiry

    if (urlError) {
      console.error("URL generation error:", urlError);
      throw new Error("Failed to generate file URL");
    }

    // Return attachment metadata
    const attachment: MessageAttachment = {
      type: getAttachmentType(file.type),
      name: file.name,
      url: urlData.signedUrl,
      size: file.size,
      mimeType: file.type,
    };

    return attachment;
  } catch (err: any) {
    console.error("File upload error:", err);
    throw err;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file type label for display
 */
export function getFileTypeLabel(mimeType: string): string {
  return MIME_TYPE_LABELS[mimeType] || "File";
}

/**
 * Check if file type is an image
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Get list of allowed file extensions for display
 */
export function getAllowedExtensions(): string {
  return "JPG, PNG, WebP, PDF, DOCX";
}
