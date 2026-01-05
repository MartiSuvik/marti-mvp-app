import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Job, Agency, JobStatus, JobPayment, JobPayout, Milestone, MilestoneStatus } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { AgencyLogo } from "../../components/AgencyLogo";
import { Input } from "../../components/ui/Input";

/**
 * JobDetail Page
 * 
 * Shows detailed view of a single job with all payment actions:
 * - Fund job (when unfunded)
 * - Approve work (when in review)
 * - Release payment (when approved)
 * - Request revision (when in review)
 * - Cancel job (when appropriate)
 */

// Status configuration
const STATUS_CONFIG: Record<JobStatus, { label: string; icon: string; color: string; bgColor: string; description: string }> = {
  draft: { 
    label: "Draft", 
    icon: "edit_note", 
    color: "text-gray-500", 
    bgColor: "bg-gray-100 dark:bg-gray-700",
    description: "Job is being created" 
  },
  pending: { 
    label: "Pending Acceptance", 
    icon: "hourglass_empty", 
    color: "text-yellow-500", 
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    description: "Waiting for agency to accept the job" 
  },
  unfunded: { 
    label: "Awaiting Payment", 
    icon: "payments", 
    color: "text-orange-500", 
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    description: "Agency accepted - fund the job to begin work" 
  },
  funded: { 
    label: "Funded", 
    icon: "account_balance_wallet", 
    color: "text-blue-500", 
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    description: "Payment received - agency can start work" 
  },
  in_progress: { 
    label: "In Progress", 
    icon: "engineering", 
    color: "text-indigo-500", 
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    description: "Agency is working on the job" 
  },
  review: { 
    label: "In Review", 
    icon: "rate_review", 
    color: "text-purple-500", 
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    description: "Agency submitted work - review and approve" 
  },
  revision: { 
    label: "Revision Requested", 
    icon: "replay", 
    color: "text-amber-500", 
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    description: "You requested changes - agency is revising" 
  },
  approved: { 
    label: "Approved", 
    icon: "thumb_up", 
    color: "text-green-500", 
    bgColor: "bg-green-100 dark:bg-green-900/30",
    description: "Work approved - payment is being released" 
  },
  paid_out: { 
    label: "Completed", 
    icon: "paid", 
    color: "text-green-600", 
    bgColor: "bg-green-100 dark:bg-green-900/30",
    description: "Job complete - agency has been paid" 
  },
  cancelled: { 
    label: "Cancelled", 
    icon: "cancel", 
    color: "text-red-500", 
    bgColor: "bg-red-100 dark:bg-red-900/30",
    description: "Job was cancelled" 
  },
  refunded: { 
    label: "Refunded", 
    icon: "undo", 
    color: "text-red-500", 
    bgColor: "bg-red-100 dark:bg-red-900/30",
    description: "Payment was refunded" 
  },
};

// Milestone status configuration
const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; icon: string; color: string; bgColor: string }> = {
  pending: { label: "Pending", icon: "schedule", color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-700" },
  in_progress: { label: "In Progress", icon: "engineering", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  submitted: { label: "Submitted", icon: "rate_review", color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  revision: { label: "Revision", icon: "replay", color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  approved: { label: "Approved", icon: "thumb_up", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  paid: { label: "Paid", icon: "paid", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
};

// Milestone Card Component
interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  jobStatus: JobStatus;
  formatCurrency: (amount: number, currency?: string) => string;
  onApprove: () => void;
  onRelease: () => void;
  onRequestRevision: () => void;
  onDelete: () => void;
  isLoading: boolean;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  index,
  jobStatus,
  formatCurrency,
  onApprove,
  onRelease,
  onRequestRevision,
  onDelete,
  isLoading,
}) => {
  const statusConfig = MILESTONE_STATUS_CONFIG[milestone.status];
  const canDelete = jobStatus === "unfunded" && milestone.status === "pending";
  const canApprove = milestone.status === "submitted";
  const canRelease = milestone.status === "approved";
  const canRequestRevision = milestone.status === "submitted";

  return (
    <div className={`p-4 rounded-lg border ${milestone.status === "paid" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
      <div className="flex items-start gap-3">
        {/* Index/Check */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${milestone.status === "paid" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
          {milestone.status === "paid" ? (
            <Icon name="check" className="text-sm" />
          ) : (
            <span className="text-sm font-medium">{index + 1}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">{milestone.title}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
              <Icon name={statusConfig.icon} className="text-xs" />
              {statusConfig.label}
            </span>
          </div>
          {milestone.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{milestone.description}</p>
          )}
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(milestone.amount, milestone.currency)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canApprove && (
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              disabled={isLoading}
            >
              {isLoading ? <Icon name="hourglass_empty" className="animate-spin" /> : "Approve"}
            </Button>
          )}
          {canRequestRevision && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestRevision}
              disabled={isLoading}
            >
              Revision
            </Button>
          )}
          {canRelease && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRelease}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Icon name="hourglass_empty" className="animate-spin" /> : "Release Payment"}
            </Button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icon name="delete" className="text-lg" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [job, setJob] = useState<(Job & { agency?: Agency }) | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [payments, setPayments] = useState<JobPayment[]>([]);
  const [payouts, setPayouts] = useState<JobPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Milestone creation state
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", amount: "" });

  // Handle payment redirect result
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      showToast("Payment successful! The job is now funded.", "success");
      // Clear the query param
      setSearchParams({});
      // Reload job to get updated status
      if (id && user) {
        loadJob();
        loadPayments();
      }
    } else if (paymentStatus === "cancelled") {
      showToast("Payment was cancelled.", "info");
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    if (id && user) {
      loadJob();
      loadMilestones();
      loadPayments();
    }
  }, [id, user]);

  const loadJob = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          agencies (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setJob({
          id: data.id,
          dealId: data.deal_id,
          businessId: data.business_id,
          agencyId: data.agency_id,
          title: data.title,
          description: data.description,
          amount: parseFloat(data.amount),
          currency: data.currency,
          platformFee: parseFloat(data.platform_fee || 0),
          status: data.status as JobStatus,
          hasMilestones: data.has_milestones || false,
          totalReleased: parseFloat(data.total_released || 0),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          agency: data.agencies ? {
            id: data.agencies.id,
            name: data.agencies.name,
            logoUrl: data.agencies.logo_url,
            description: data.agencies.description,
            platforms: data.agencies.platforms || [],
            industries: data.agencies.industries || [],
            spendBrackets: data.agencies.spend_brackets || [],
            objectives: data.agencies.objectives || [],
            verified: data.agencies.verified || false,
          } : undefined,
        });
      }
    } catch (error) {
      console.error("Error loading job:", error);
      showToast("Failed to load job details", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .eq("job_id", id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      if (data) {
        setMilestones(data.map((m: any) => ({
          id: m.id,
          jobId: m.job_id,
          title: m.title,
          description: m.description,
          amount: parseFloat(m.amount),
          currency: m.currency,
          orderIndex: m.order_index,
          status: m.status as MilestoneStatus,
          stripeTransferId: m.stripe_transfer_id,
          paidAt: m.paid_at,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        })));
      }
    } catch (error) {
      console.error("Error loading milestones:", error);
    }
  };

  const loadPayments = async () => {
    try {
      const { data: paymentsData } = await supabase
        .from("job_payments")
        .select("*")
        .eq("job_id", id)
        .order("created_at", { ascending: false });

      const { data: payoutsData } = await supabase
        .from("job_payouts")
        .select("*")
        .eq("job_id", id)
        .order("created_at", { ascending: false });

      if (paymentsData) {
        setPayments(paymentsData.map((p: any) => ({
          id: p.id,
          jobId: p.job_id,
          stripePaymentIntentId: p.stripe_payment_intent_id,
          stripeChargeId: p.stripe_charge_id,
          amount: parseFloat(p.amount),
          status: p.status,
          createdAt: p.created_at,
        })));
      }

      if (payoutsData) {
        setPayouts(payoutsData.map((p: any) => ({
          id: p.id,
          jobId: p.job_id,
          stripeTransferId: p.stripe_transfer_id,
          amount: parseFloat(p.amount),
          status: p.status,
          createdAt: p.created_at,
        })));
      }
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  };

  const updateJobStatus = async (newStatus: JobStatus) => {
    if (!job) return;

    setActionLoading(newStatus);

    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", job.id);

      if (error) throw error;

      setJob({ ...job, status: newStatus });
      showToast(`Job status updated to ${STATUS_CONFIG[newStatus].label}`, "success");
    } catch (error) {
      console.error("Error updating job:", error);
      showToast("Failed to update job status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFundJob = async () => {
    if (!job) return;
    
    setActionLoading("funded");
    
    try {
      // Call Supabase Edge Function to create Stripe Invoice
      const { data, error } = await supabase.functions.invoke('create-invoice-checkout', {
        body: { 
          job_id: job.id,
        }
      });
      
      if (error) throw error;
      
      if (data?.invoice_url) {
        // Redirect to Stripe Invoice page for payment
        window.location.href = data.invoice_url;
      } else {
        throw new Error("No invoice URL returned");
      }
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      showToast(error.message || "Failed to create invoice", "error");
      setActionLoading(null);
    }
    // Note: Don't reset actionLoading here as we're redirecting
  };

  const handleApproveWork = async () => {
    if (!job) return;
    
    setActionLoading("approved");
    
    try {
      // First update status to approved
      await updateJobStatus("approved");
      
      // Then trigger the transfer to agency
      const { data, error } = await supabase.functions.invoke('transfer-to-agency', {
        body: { job_id: job.id }
      });
      
      if (error) throw error;
      
      showToast(`Work approved! ${data?.payout_amount} ${data?.currency} released to agency.`, "success");
      await loadPayments();
    } catch (error: any) {
      console.error("Error approving work:", error);
      showToast(error.message || "Failed to release funds", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async () => {
    await updateJobStatus("revision");
  };

  const handleCancelJob = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this job? This action cannot be undone."
    );
    if (!confirmed) return;

    await updateJobStatus("cancelled");
  };

  // Milestone handlers
  const handleAddMilestone = async () => {
    if (!job || !newMilestone.title || !newMilestone.amount) {
      showToast("Please enter milestone title and amount", "error");
      return;
    }

    const amount = parseFloat(newMilestone.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    // Check if total milestones exceed job amount
    const currentTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (currentTotal + amount > job.amount) {
      showToast(`Milestone total cannot exceed job amount (${formatCurrency(job.amount)})`, "error");
      return;
    }

    setActionLoading("add-milestone");

    try {
      const { error } = await supabase.from("milestones").insert({
        job_id: job.id,
        title: newMilestone.title,
        description: newMilestone.description || null,
        amount: amount,
        currency: job.currency,
        order_index: milestones.length,
        status: "pending",
      });

      if (error) throw error;

      // Mark job as having milestones
      if (!job.hasMilestones) {
        await supabase
          .from("jobs")
          .update({ has_milestones: true })
          .eq("id", job.id);
        setJob({ ...job, hasMilestones: true });
      }

      setNewMilestone({ title: "", description: "", amount: "" });
      setShowAddMilestone(false);
      await loadMilestones();
      showToast("Milestone added!", "success");
    } catch (error) {
      console.error("Error adding milestone:", error);
      showToast("Failed to add milestone", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Delete this milestone?")) return;

    try {
      const { error } = await supabase
        .from("milestones")
        .delete()
        .eq("id", milestoneId);

      if (error) throw error;

      await loadMilestones();
      showToast("Milestone deleted", "success");
    } catch (error) {
      console.error("Error deleting milestone:", error);
      showToast("Failed to delete milestone", "error");
    }
  };

  const handleApproveMilestone = async (milestone: Milestone) => {
    setActionLoading(`approve-${milestone.id}`);

    try {
      const { error } = await supabase
        .from("milestones")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", milestone.id);

      if (error) throw error;

      await loadMilestones();
      showToast("Milestone approved! You can now release payment.", "success");
    } catch (error) {
      console.error("Error approving milestone:", error);
      showToast("Failed to approve milestone", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseMilestone = async (milestone: Milestone) => {
    setActionLoading(`release-${milestone.id}`);

    try {
      const { data, error } = await supabase.functions.invoke("release-milestone", {
        body: { milestone_id: milestone.id },
      });

      if (error) throw error;

      await loadMilestones();
      await loadPayments();
      await loadJob();
      
      showToast(
        `Payment of ${formatCurrency(milestone.amount)} released to agency!`,
        "success"
      );
    } catch (error: any) {
      console.error("Error releasing milestone:", error);
      showToast(error.message || "Failed to release payment", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestMilestoneRevision = async (milestone: Milestone) => {
    setActionLoading(`revision-${milestone.id}`);

    try {
      const { error } = await supabase
        .from("milestones")
        .update({ status: "revision", updated_at: new Date().toISOString() })
        .eq("id", milestone.id);

      if (error) throw error;

      await loadMilestones();
      showToast("Revision requested", "success");
    } catch (error) {
      console.error("Error requesting revision:", error);
      showToast("Failed to request revision", "error");
    } finally {
      setActionLoading(null);
    }
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Icon name="hourglass_empty" className="text-5xl text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-16">
            <Icon name="error" className="text-5xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This job doesn't exist or you don't have access to it.
            </p>
            <Button variant="primary" onClick={() => navigate("/jobs")}>
              Back to Jobs
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/jobs")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Icon name="arrow_back" className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {job.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Created {formatDate(job.createdAt)}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <Card className="mb-6">
        <div className={`flex items-center gap-4 p-4 rounded-xl ${statusConfig.bgColor}`}>
          <div className={`w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center ${statusConfig.color}`}>
            <Icon name={statusConfig.icon} className="text-2xl" />
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{statusConfig.description}</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Details</h2>
            
            {/* Agency */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <AgencyLogo
                logoUrl={job.agency?.logoUrl}
                name={job.agency?.name || "Agency"}
                size="md"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{job.agency?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Agency Partner</p>
              </div>
              {job.agency?.verified && (
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full text-xs">
                  <Icon name="verified" className="text-sm" />
                  Verified
                </span>
              )}
            </div>

            {/* Description */}
            {job.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
          </Card>

          {/* Milestones Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Milestones
                {milestones.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({milestones.filter(m => m.status === "paid").length}/{milestones.length} completed)
                  </span>
                )}
              </h2>
              {job.status === "unfunded" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMilestone(true)}
                >
                  <Icon name="add" className="mr-1" />
                  Add Milestone
                </Button>
              )}
            </div>

            {/* Add Milestone Form */}
            {showAddMilestone && job.status === "unfunded" && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <Input
                    label="Milestone Title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    placeholder="e.g., Campaign Setup"
                  />
                  <Input
                    label="Description (optional)"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="What will be delivered"
                  />
                  <Input
                    label={`Amount (${job.currency})`}
                    type="number"
                    value={newMilestone.amount}
                    onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                    placeholder="0.00"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddMilestone}
                      disabled={actionLoading === "add-milestone"}
                    >
                      {actionLoading === "add-milestone" ? "Adding..." : "Add Milestone"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddMilestone(false);
                        setNewMilestone({ title: "", description: "", amount: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Remaining: {formatCurrency(job.amount - milestones.reduce((sum, m) => sum + m.amount, 0))} of {formatCurrency(job.amount)}
                  </p>
                </div>
              </div>
            )}

            {/* Milestones List */}
            {milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    index={index}
                    jobStatus={job.status}
                    formatCurrency={formatCurrency}
                    onApprove={() => handleApproveMilestone(milestone)}
                    onRelease={() => handleReleaseMilestone(milestone)}
                    onRequestRevision={() => handleRequestMilestoneRevision(milestone)}
                    onDelete={() => handleDeleteMilestone(milestone.id)}
                    isLoading={actionLoading?.includes(milestone.id) || false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Icon name="flag" className="text-4xl mb-2 opacity-50" />
                <p className="text-sm">No milestones defined</p>
                {job.status === "unfunded" && (
                  <p className="text-xs mt-1">
                    Add milestones to split the payment into phases, or fund the full amount at once.
                  </p>
                )}
              </div>
            )}

            {/* Milestone Summary */}
            {milestones.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total in milestones:</span>
                  <span className="font-medium">{formatCurrency(milestones.reduce((sum, m) => sum + m.amount, 0))}</span>
                </div>
                {job.amount > milestones.reduce((sum, m) => sum + m.amount, 0) && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-orange-500">Unallocated:</span>
                    <span className="text-orange-500 font-medium">
                      {formatCurrency(job.amount - milestones.reduce((sum, m) => sum + m.amount, 0))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Actions Card */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
            
            <div className="space-y-3">
              {job.status === "unfunded" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleFundJob}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "funded" ? (
                    <Icon name="hourglass_empty" className="mr-2 animate-spin" />
                  ) : (
                    <Icon name="payments" className="mr-2" />
                  )}
                  Fund Job ({formatCurrency(job.amount)})
                </Button>
              )}

              {job.status === "review" && (
                <>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleApproveWork}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "approved" ? (
                      <Icon name="hourglass_empty" className="mr-2 animate-spin" />
                    ) : (
                      <Icon name="thumb_up" className="mr-2" />
                    )}
                    Approve & Release Payment
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRequestRevision}
                    disabled={actionLoading !== null}
                  >
                    <Icon name="replay" className="mr-2" />
                    Request Revision
                  </Button>
                </>
              )}

              {["draft", "pending", "unfunded"].includes(job.status) && (
                <Button
                  variant="ghost"
                  className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleCancelJob}
                  disabled={actionLoading !== null}
                >
                  <Icon name="cancel" className="mr-2" />
                  Cancel Job
                </Button>
              )}

              {["paid_out", "cancelled", "refunded"].includes(job.status) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No actions available for this job
                </p>
              )}
            </div>
          </Card>

          {/* Payment History */}
          {(payments.length > 0 || payouts.length > 0) && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment History</h2>
              <div className="space-y-3">
                {payments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Icon name="arrow_downward" className="text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Received</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">+{formatCurrency(payment.amount)}</p>
                  </div>
                ))}
                {payouts.map(payout => (
                  <div key={payout.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Icon name="arrow_upward" className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Payout to Agency</p>
                        <p className="text-xs text-gray-500">{formatDate(payout.createdAt)}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-blue-600">-{formatCurrency(payout.amount)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Job Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(job.amount, job.currency)}
                </span>
              </div>
              
              {milestones.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Released</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(job.totalReleased || 0, job.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                    <span className="text-orange-500 font-medium">
                      {formatCurrency(job.amount - (job.totalReleased || 0), job.currency)}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${((job.totalReleased || 0) / job.amount) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {Math.round(((job.totalReleased || 0) / job.amount) * 100)}% released
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Quick Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Info</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Job ID</p>
                <p className="font-mono text-gray-900 dark:text-white text-xs">{job.id}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Currency</p>
                <p className="text-gray-900 dark:text-white">{job.currency}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-gray-900 dark:text-white">{formatDate(job.updatedAt)}</p>
              </div>
            </div>
          </Card>

          {/* Help */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Icon name="help" className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">Need help?</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Contact our support team if you have any issues with this job.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/30"
                  onClick={() => navigate("/support")}
                >
                  Get Support
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
