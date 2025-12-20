import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Job, Agency, JobStatus } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { AgencyLogo } from "../../components/AgencyLogo";

/**
 * Jobs Page
 * 
 * Lists all jobs for the current business user.
 * Jobs can be filtered by status and navigated to for details.
 */

// Status configuration with colors and icons
const STATUS_CONFIG: Record<JobStatus, { label: string; icon: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", icon: "edit_note", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-700" },
  pending: { label: "Pending", icon: "hourglass_empty", color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  unfunded: { label: "Awaiting Payment", icon: "payments", color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  funded: { label: "Funded", icon: "account_balance_wallet", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  in_progress: { label: "In Progress", icon: "engineering", color: "text-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  review: { label: "In Review", icon: "rate_review", color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  revision: { label: "Revision Requested", icon: "replay", color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  approved: { label: "Approved", icon: "thumb_up", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  paid_out: { label: "Paid Out", icon: "paid", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
  cancelled: { label: "Cancelled", icon: "cancel", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
  refunded: { label: "Refunded", icon: "undo", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

// Filter tabs
const FILTER_TABS = [
  { id: "all", label: "All Jobs" },
  { id: "active", label: "Active", statuses: ["pending", "unfunded", "funded", "in_progress", "review", "revision"] },
  { id: "completed", label: "Completed", statuses: ["approved", "paid_out"] },
  { id: "cancelled", label: "Cancelled", statuses: ["cancelled", "refunded"] },
];

export const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [jobs, setJobs] = useState<Array<Job & { agency?: Agency }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const loadJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          agencies (*)
        `)
        .eq("business_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map database fields to TypeScript interface
      const mappedJobs = (data || []).map((job: any) => ({
        id: job.id,
        dealId: job.deal_id,
        businessId: job.business_id,
        agencyId: job.agency_id,
        title: job.title,
        description: job.description,
        amount: parseFloat(job.amount),
        currency: job.currency,
        platformFee: parseFloat(job.platform_fee || 0),
        status: job.status as JobStatus,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        agency: job.agencies ? {
          id: job.agencies.id,
          name: job.agencies.name,
          logoUrl: job.agencies.logo_url,
          description: job.agencies.description,
          platforms: job.agencies.platforms || [],
          industries: job.agencies.industries || [],
          spendBrackets: job.agencies.spend_brackets || [],
          objectives: job.agencies.objectives || [],
          verified: job.agencies.verified || false,
        } : undefined,
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
      showToast("Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter(job => {
    if (activeFilter === "all") return true;
    const tab = FILTER_TABS.find(t => t.id === activeFilter);
    if (!tab || !tab.statuses) return true;
    return tab.statuses.includes(job.status);
  });

  // Get stats for header
  const stats = {
    total: jobs.length,
    active: jobs.filter(j => ["pending", "unfunded", "funded", "in_progress", "review", "revision"].includes(j.status)).length,
    totalValue: jobs.reduce((sum, j) => sum + j.amount, 0),
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="hourglass_empty" className="text-5xl text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your agency projects and payments
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/jobs/create")}>
          <Icon name="add" className="mr-2" />
          Create Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Icon name="work" className="text-primary text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Icon name="pending_actions" className="text-blue-500 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Icon name="payments" className="text-green-500 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
            {tab.id === "active" && stats.active > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {stats.active}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-pink-500/10 rounded-2xl mb-6">
              <Icon name="work_outline" className="text-5xl text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {activeFilter === "all" ? "No jobs yet" : `No ${activeFilter} jobs`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {activeFilter === "all" 
                ? "Create your first job to start working with an agency"
                : "Jobs matching this filter will appear here"}
            </p>
            {activeFilter === "all" && (
              <Button variant="primary" onClick={() => navigate("/jobs/create")}>
                <Icon name="add" className="mr-2" />
                Create Your First Job
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const statusConfig = STATUS_CONFIG[job.status];
            
            return (
              <Card key={job.id} hover>
                <div 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  {/* Agency Logo */}
                  <div className="flex-shrink-0">
                    <AgencyLogo
                      logoUrl={job.agency?.logoUrl}
                      name={job.agency?.name || "Agency"}
                      size="md"
                    />
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {job.agency?.name || "Unknown Agency"} • Created {formatDate(job.createdAt)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(job.amount, job.currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      <Icon name={statusConfig.icon} className="text-base" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Arrow */}
                  <Icon name="chevron_right" className="text-gray-400 hidden sm:block" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
