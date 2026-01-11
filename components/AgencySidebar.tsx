import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "./Icon";
import { NavItem } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useUnreadCount } from "../hooks/useUnreadCount";

const mainNavItems: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/agency" },
  { label: "Matches", icon: "handshake", href: "/agency/deals" },
  { label: "Messages", icon: "chat", href: "/agency/messages" },
  { label: "Proposals", icon: "description", href: "/agency/proposals" },
  { label: "Projects", icon: "work", href: "/agency/jobs" },
];

const accountNavItems: NavItem[] = [
  { label: "Payouts", icon: "payments", href: "/agency/payouts" },
  { label: "My Agency", icon: "business", href: "/agency/profile" },
  { label: "Support", icon: "help_outline", href: "/agency/support" },
];

export const AgencySidebar: React.FC = () => {
  const location = useLocation();
  const { agency } = useAuth();
  const { unreadCount } = useUnreadCount();

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/agency") {
      return location.pathname === "/agency";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col h-full overflow-hidden transition-all duration-300">
      {/* Logo Area */}
      <div className="p-6">
        <Link to="/agency" className="flex items-center group">
          <img 
            src="https://res.cloudinary.com/effichat/image/upload/v1764713504/mywc0fu8gvdtxlwf02dh.svg" 
            alt="ScalingAD" 
            className="h-10 w-auto group-hover:scale-105 transition-transform duration-300" 
          />
        </Link>
        {/* Agency Badge */}
        <div className="mt-3 px-3 py-1.5 bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-lg">
          <p className="text-xs font-medium text-primary">Agency Portal</p>
          {agency && (
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {agency.name}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="mb-6">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            const showBadge = item.label === "Messages" && unreadCount > 0;
            return (
              <Link
                key={item.label}
                to={item.href || "#"}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
                  active
                    ? "bg-gradient-to-r from-primary/10 to-pink-500/10 text-primary shadow-lg shadow-primary/10"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-1"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`mr-3 text-[22px] ${
                    active
                      ? "text-primary"
                      : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                  }`}
                />
                {item.label}
                {showBadge && (
                  <span className="ml-auto text-xs font-bold text-white bg-gradient-to-r from-primary to-pink-600 px-2 py-0.5 rounded-full shadow-lg min-w-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {item.badge && !showBadge && (
                  <span className="ml-auto text-xs font-bold text-white bg-gradient-to-r from-primary to-pink-600 px-2 py-1 rounded-full shadow-lg">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div>
          {accountNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href || "#"}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
                  active
                    ? "bg-gradient-to-r from-primary/10 to-pink-500/10 text-primary shadow-lg shadow-primary/10"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 hover:translate-x-1"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`mr-3 text-[22px] ${
                    active
                      ? "text-primary"
                      : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
