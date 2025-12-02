import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "./Icon";
import { NavItem } from "../types";

const mainNavItems: NavItem[] = [
  { label: "Deals", icon: "monetization_on", href: "/deals" },
  { label: "Ongoing", icon: "emoji_events", href: "/ongoing" },
  { label: "Agencies", icon: "people", href: "/agencies", badge: "New!" },
];

const accountNavItems: NavItem[] = [
  { label: "My Brand", icon: "account_circle", href: "/my-brand" },
  { label: "Support & Guides", icon: "description", href: "/support" },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col h-full overflow-hidden transition-all duration-300">
      {/* Logo Area */}
      <div className="p-6">
        <Link to="/deals" className="flex items-center group">
          <img 
            src="/assets/logo.svg" 
            alt="AgencyMatch" 
            className="h-10 w-auto group-hover:scale-105 transition-transform duration-300" 
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="mb-6">
          <p className="px-2 pt-2 pb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Main
          </p>
          {mainNavItems.map((item) => {
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
                {item.badge && (
                  <span className="ml-auto text-xs font-bold text-white bg-gradient-to-r from-primary to-pink-600 px-2 py-1 rounded-full shadow-lg">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div>
          <p className="px-2 pt-2 pb-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Account
          </p>
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

      {/* Support Section */}
      <div className="p-6 mt-auto border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <img
              alt="Support agent avatar"
              className="h-14 w-14 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfQoiZBS3YE1n6-dnvHJV1W03G3w3XXU-cSzT17J7l8PUJwSvNXi42EP7U4sof2BS2ZE_Mc0dqf1nbcgPbsAwCTI2Ejm77r0hkPt_J8sIE0Nf7Ju00p3Yh3HWPI3XDLxf92lw0TKrgI2DFIkUPLnZgjqDcqrG3nmRBXxl8ONl-CNzey52G1ffcMAmgzjJQ2wnykh1Pi8RPBCqEpd7YGLkwyXUUWW1AxTFzT3XL-7TOecMJrs_4dagVPXt44oLpoUr83SI1NdpKjLE"
            />
            <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            We're here to help
          </p>
          <button className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 glass border border-gray-300/50 dark:border-gray-700/50 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 mb-2">
            Chat with Us
          </button>
          <button className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-pink-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            Book a Call
          </button>
        </div>
      </div>
    </aside>
  );
};
