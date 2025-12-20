import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Icon } from "./Icon";
import { Button } from "./ui/Button";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/deals") return "Deals";
    if (path === "/ongoing") return "Ongoing";
    if (path === "/agencies") return "Agencies";
    if (path === "/my-brand") return "My Brand";
    if (path === "/support") return "Support & Guides";
    return "Dashboard";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleInvite = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      // Generate invite link (can be enhanced with backend)
      const inviteLink = `${window.location.origin}/login?ref=${user.id}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);

      showToast(
        "Invite link copied to clipboard! Share it with your network.",
        "success"
      );
    } catch (error) {
      console.error("Error generating invite:", error);
      // Fallback: show the link
      const inviteLink = `${window.location.origin}/login?ref=${user.id}`;
      navigator.clipboard
        .writeText(inviteLink)
        .then(() => {
          showToast("Invite link copied to clipboard!", "success");
        })
        .catch(() => {
          showToast("Error generating invite link", "error");
        });
    }
  };

  return (
    <header className="sticky top-0 z-20 glass border-b border-white/10 dark:border-gray-900/90">
      <div className="relative px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400"></div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="cursor-pointer">
              {user?.user_metadata?.avatar_url ? (
                <img
                  alt="User avatar"
                  className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                  src={user.user_metadata.avatar_url}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center bg-gradient-to-r from-primary to-pink-600 text-white hover:from-primary/90 hover:to-pink-600/90 focus:ring-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all duration-300">
                  <Icon
                    name="account_circle"
                    className="text-2xl text-white"
                  />
                </div>
              )}
            </div>
            <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/30 dark:border-gray-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-3">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                    {user?.user_metadata?.name ||
                      profile?.companyName ||
                      "User"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 break-words mt-1">
                    {user?.email}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors mt-1"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
