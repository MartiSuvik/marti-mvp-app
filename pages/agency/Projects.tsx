import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { Job, JobStatus } from "../../types";

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  draft: { label: "Draft", color: "text-gray-500", bgColor: "bg-gray-100", icon: "edit" },
  pending: { label: "Pending Acceptance", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: "hourglass_empty" },
  declined: { label: "Declined", color: "text-red-500", bgColor: "bg-red-50", icon: "cancel" },
  unfunded: { label: "Awaiting Payment", color: "text-orange-500", bgColor: "bg-orange-50", icon: "payment" },
  funded: { label: "Ready to Start", color: "text-blue-600", bgColor: "bg-blue-50", icon: "play_circle" },
  in_progress: { label: "In Progress", color: "text-indigo-600", bgColor: "bg-indigo-50", icon: "pending" },
  review: { label: "Under Review", color: "text-purple-600", bgColor: "bg-purple-50", icon: "rate_review" },
  revision: { label: "Revision Needed", color: "text-amber-600", bgColor: "bg-amber-50", icon: "edit_note" },
  approved: { label: "Approved", color: "text-green-600", bgColor: "bg-green-50", icon: "check_circle" },
  paid_out: { label: "Paid", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: "paid" },
  cancelled: { label: "Cancelled", color: "text-gray-500", bgColor: "bg-gray-100", icon: "block" },
  refunded: { label: "Refunded", color: "text-red-500", bgColor: "bg-red-50", icon: "money_off" },
};

type FilterTab = "all" | "pending" | "active" | "completed";

export const Projects: React.FC = () => {
  const { agency } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>(
    (searchParams.get("status") as FilterTab) || "all"
  );

  useEffect(() => {
    if (agency?.id) {
      loadProjects();
    }
  }, [agency?.id]);

  const loadProjects = async () => {
    if (!agency?.id) return;

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("agency_id", agency.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map((j: any) => ({
          id: j.id,
          dealId: j.deal_id,
          businessId: j.business_id,
          agencyId: j.agency_id,
          title: j.title,
          description: j.description,
          amount: parseFloat(j.amount),
          currency: j.currency,
          platformFee: parseFloat(j.platform_fee || 0),
          status: j.status as JobStatus,
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        }));
        setProjects(mapped);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    switch (activeTab) {
      case "pending":
        return project.status === "pending";
      case "active":
        return ["unfunded", "funded", "in_progress", "review", "revision"].includes(project.status);
      case "completed":
        return ["approved", "paid_out", "cancelled", "declined", "refunded"].includes(project.status);
      default:
        return true;
    }
  });

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All Projects", count: projects.length },
    { id: "pending", label: "Pending", count: projects.filter((p) => p.status === "pending").length },
    {
      id: "active",
      label: "Active",
      count: projects.filter((p) =>
        ["unfunded", "funded", "in_progress", "review", "revision"].includes(p.status)
      ).length,
    },
    {
      id: "completed",
      label: "Completed",
      count: projects.filter((p) =>
        ["approved", "paid_out", "cancelled", "declined", "refunded"].includes(p.status)
      ).length,
    },
  ];

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    if (tab === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", tab);
    }
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your projects and track their progress.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon name="work_off" className="text-5xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              No projects found
            </h3>
            <p className="text-gray-400">
              {activeTab === "pending"
                ? "No pending projects waiting for your response."
                : activeTab === "active"
                ? "No active projects in progress."
                : activeTab === "completed"
                ? "No completed projects yet."
                : "Projects will appear here when businesses hire you."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status];
            const earnings = project.amount - project.platformFee;

            return (
              <Card key={project.id} hover>
                <Link to={`/agency/jobs/${project.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}
                      >
                        <Icon name={statusConfig.icon} className={`${statusConfig.color} text-xl`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Earnings */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${earnings.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Your earnings</p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}
                      >
                        {statusConfig.label}
                      </span>

                      {/* Action indicator for pending */}
                      {project.status === "pending" && (
                        <span className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
                          <Icon name="notifications_active" className="text-lg" />
                          Action Required
                        </span>
                      )}

                      <Icon name="chevron_right" className="text-gray-400" />
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
