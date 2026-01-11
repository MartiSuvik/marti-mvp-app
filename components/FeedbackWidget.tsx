import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Sleekplan Feedback Widget
 * Allows authenticated users to submit feedback and bug reports
 */
export const SleekplanWidget: React.FC = () => {
  const { user, profile } = useAuth();

  useEffect(() => {
    const win = window as any;

    // Initialize Sleekplan
    win.$sleek = win.$sleek || [];
    win.SLEEK_PRODUCT_ID = 116700084;

    // Only load script if not already loaded
    if (!document.getElementById("sleekplan-sdk")) {
      const script = document.createElement("script");
      script.src = "https://client.sleekplan.com/sdk/e.js";
      script.async = true;
      script.id = "sleekplan-sdk";
      document.getElementsByTagName("head")[0].appendChild(script);

      // Optional: Set user data when SDK loads
      script.onload = () => {
        if (win.$sleek && typeof win.$sleek.setUser === "function") {
          win.$sleek.setUser({
            mail: user?.email || undefined,
            id: user?.id || undefined,
            name: profile?.companyName || user?.email || "User",
          });
        }
      };
    }
  }, [user, profile]);

  return null;
};
