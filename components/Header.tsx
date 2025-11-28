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
    <header className="sticky top-0 z-20 border-b border-gray-200/20 dark:border-gray-800/20">
      {/* Gradient background overlay - similar to postedapp.com */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-900/70 backdrop-blur-lg"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-purple-500/6 to-blue-500/8 dark:from-primary/12 dark:via-purple-500/10 dark:to-blue-500/12"></div>
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-purple-500/3 dark:from-primary/5 dark:via-transparent dark:to-purple-500/5 animate-gradient opacity-50"></div>

      <div className="relative px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2 transition-colors"
          >
            <Icon name="chevron_left" className="text-xl align-middle" />
          </button>

          <span className="font-medium text-gray-900 dark:text-white">
            {getPageTitle()}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleInvite}
            className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300/30 dark:border-gray-700/30 rounded-xl shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-105 transition-all duration-300"
          >
            <Icon
              name="send"
              className="mr-2 text-lg transform -rotate-45 mb-1"
            />
            Invite
          </button>
          <div className="relative group">
            <div className="cursor-pointer">
              {user?.user_metadata?.avatar_url ? (
                <img
                  alt="User avatar"
                  className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                  src={user.user_metadata.avatar_url}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <Icon
                    name="account_circle"
                    className="text-2xl text-primary"
                  />
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
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
