import React from "react";
import { AgencySidebar } from "./AgencySidebar";
import { Header } from "./Header";

interface AgencyDashboardLayoutProps {
  children: React.ReactNode;
}

export const AgencyDashboardLayout: React.FC<AgencyDashboardLayoutProps> = ({
  children,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <AgencySidebar />
      <main className="flex-1 overflow-hidden flex flex-col relative min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto scroll-smooth px-0">
          {children}
        </div>
      </main>
    </div>
  );
};
