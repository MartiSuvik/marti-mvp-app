import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { Job, JobStatus } from "../../types";

interface DashboardStats {
  pendingProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalEarnings: number;
  pendingPayouts: number;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-gray-500", bgColor: "bg-gray-100" },
  pending: { label: "Pending", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  declined: { label: "Declined", color: "text-red-500", bgColor: "bg-red-50" },
  unfunded: { label: "Awaiting Payment", color: "text-orange-500", bgColor: "bg-orange-50" },
  funded: { label: "Ready to Start", color: "text-blue-600", bgColor: "bg-blue-50" },
  in_progress: { label: "In Progress", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  review: { label: "Under Review", color: "text-purple-600", bgColor: "bg-purple-50" },
  revision: { label: "Revision Needed", color: "text-amber-600", bgColor: "bg-amber-50" },
  approved: { label: "Approved", color: "text-green-600", bgColor: "bg-green-50" },
  paid_out: { label: "Paid", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  cancelled: { label: "Cancelled", color: "text-gray-500", bgColor: "bg-gray-100" },
  refunded: { label: "Refunded", color: "text-red-500", bgColor: "bg-red-50" },
};

export const Dashboard: React.FC = () => {
  const { agency, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agency?.id) {
      loadDashboardData();
    }
  }, [agency?.id]);

  const loadDashboardData = async () => {
    if (!agency?.id) return;

    try {
      // Load jobs for this agency
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("agency_id", agency.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (jobs) {
        // Calculate stats
        const pending = jobs.filter((j) => j.status === "pending").length;
        const active = jobs.filter((j) =>
          ["funded", "in_progress", "review", "revision"].includes(j.status)
        ).length;
        const completed = jobs.filter((j) =>
          ["approved", "paid_out"].includes(j.status)
        ).length;

        // Calculate earnings (from paid_out jobs)
        const paidJobs = jobs.filter((j) => j.status === "paid_out");
        const totalEarnings = paidJobs.reduce(
          (sum, j) => sum + (parseFloat(j.amount) - parseFloat(j.platform_fee || 0)),
          0
        );

        // Pending payouts (approved but not yet paid)
        const approvedJobs = jobs.filter((j) => j.status === "approved");
        const pendingPayouts = approvedJobs.reduce(
          (sum, j) => sum + (parseFloat(j.amount) - parseFloat(j.platform_fee || 0)),
          0
        );

        setStats({
          pendingProjects: pending,
          activeProjects: active,
          completedProjects: completed,
          totalEarnings,
          pendingPayouts,
        });

        // Map recent jobs
        const mapped = jobs.slice(0, 5).map((j: any) => ({
          id: j.id,
          dealId: j.deal_id,
          businessId: j.business_id,
          agencyId: j.agency_id,
          title: j.title,
          description: j.description,
          amount: parseFloat(j.amount),
          currency: j.currency,
          platformFee: parseFloat(j.platform_fee || 0),
          status: j.status,
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        }));
        setRecentJobs(mapped);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {agency?.name || "Agency"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening with your jobs today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Projects</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingProjects}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Icon name="hourglass_empty" className="text-yellow-600 text-2xl" />
            </div>
          </div>
          {stats.pendingProjects > 0 && (
            <Link
              to="/agency/jobs?status=pending"
              className="mt-4 text-sm text-primary hover:underline flex items-center"
            >
              Review pending jobs <Icon name="arrow_forward" className="ml-1 text-sm" />
            </Link>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
              <p className="text-3xl font-bold text-blue-600">{stats.activeProjects}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon name="work" className="text-blue-600 text-2xl" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
              <p className="text-3xl font-bold text-green-600">
                ${stats.totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon name="payments" className="text-green-600 text-2xl" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payouts</p>
              <p className="text-3xl font-bold text-purple-600">
                ${stats.pendingPayouts.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Icon name="account_balance" className="text-purple-600 text-2xl" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stripe Connect Status */}
      {!agency?.stripeAccountId && (
        <Card className="mb-8 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Icon name="warning" className="text-yellow-600 text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Complete Stripe Setup
                </h3>
                <p className="text-sm text-gray-500">
                  Connect your Stripe account to receive payments for completed jobs.
                </p>
              </div>
            </div>
            <Link to="/agency/stripe">
              <Button variant="primary">
                <Icon name="account_balance" className="mr-2" />
                Connect Stripe
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Projects
          </h2>
          <Link to="/agency/jobs">
            <Button variant="ghost" size="sm">
              View All <Icon name="arrow_forward" className="ml-1" />
            </Button>
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Icon name="work_off" className="text-4xl text-gray-300 mb-4" />
              <p className="text-gray-500">No jobs yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Jobs will appear here when businesses assign them to you.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentJobs.map((job) => {
              const statusConfig = STATUS_CONFIG[job.status];
              return (
                <Card key={job.id} hover>
                  <Link to={`/agency/jobs/${job.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon name="work" className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${(job.amount - job.platformFee).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">Your earnings</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}
                        >
                          {statusConfig.label}
                        </span>
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
    </div>
  );
};
