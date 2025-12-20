import React, { useState, useRef } from "react";

interface AgencyLogoProps {
  logoUrl?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Smart logo component that:
 * 1. Fits the logo without truncation using object-contain
 * 2. Analyzes image brightness to set appropriate background
 * 3. Falls back to initials if no logo
 */
export const AgencyLogo: React.FC<AgencyLogoProps> = ({
  logoUrl,
  name,
  size = "md",
  className = "",
}) => {
  const [bgColor, setBgColor] = useState<"light" | "dark">("light");
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Size mappings
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const paddingClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
    xl: "p-3",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  // Analyze image brightness when loaded
  const analyzeImageBrightness = (img: HTMLImageElement) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Set canvas size (small for performance)
      const sampleSize = 50;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      // Get image data
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      let transparentPixels = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent/semi-transparent pixels
        if (a < 128) {
          transparentPixels++;
          continue;
        }

        // Calculate perceived brightness (human eye is more sensitive to green)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
      }

      const opaquePixels = pixelCount - transparentPixels;

      // If mostly transparent, use light background
      if (transparentPixels > pixelCount * 0.5) {
        setBgColor("light");
        return;
      }

      const avgBrightness = opaquePixels > 0 ? totalBrightness / opaquePixels : 128;

      // Dark logos (< 120) need light background
      // Light logos (> 150) need dark background
      if (avgBrightness > 150) {
        setBgColor("dark");
      } else {
        setBgColor("light");
      }
    } catch (error) {
      // CORS or other error - default to light
      setBgColor("light");
    }
  };

  const handleImageLoad = () => {
    if (imgRef.current) {
      analyzeImageBrightness(imgRef.current);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Background classes based on detected brightness
  const bgClasses = {
    light: "bg-white dark:bg-gray-100 border border-gray-100 dark:border-gray-200",
    dark: "bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800",
  };

  // If no logo URL or image failed to load, show initials
  if (!logoUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center shadow-lg ${className}`}
      >
        <span className={`font-bold text-primary ${textSizes[size]}`}>
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${paddingClasses[size]} rounded-xl ${bgClasses[bgColor]} flex items-center justify-center shadow-sm overflow-hidden transition-colors duration-300 ${className}`}
    >
      <img
        ref={imgRef}
        src={logoUrl}
        alt={name}
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
