import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Job, Agency, JobStatus, JobPayment, JobPayout } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { AgencyLogo } from "../../components/AgencyLogo";

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

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [job, setJob] = useState<(Job & { agency?: Agency }) | null>(null);
  const [payments, setPayments] = useState<JobPayment[]>([]);
  const [payouts, setPayouts] = useState<JobPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      loadJob();
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
      // Call Supabase Edge Function to create PaymentIntent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { job_id: job.id }
      });
      
      if (error) throw error;
      
      if (data?.client_secret) {
        // For now, we'll just update the status since Stripe Elements isn't set up yet
        // In a full implementation, you'd show the Stripe payment form here
        showToast(`Payment intent created! Amount: ${data.amount} ${data.currency}`, "success");
        await updateJobStatus("funded");
        await loadPayments();
      } else {
        throw new Error("No client secret returned");
      }
    } catch (error: any) {
      console.error("Error funding job:", error);
      showToast(error.message || "Failed to fund job", "error");
    } finally {
      setActionLoading(null);
    }
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
  const agencyPayout = job.amount - job.platformFee;

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
                <span className="text-gray-500 dark:text-gray-400">Job Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(job.amount, job.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Platform Fee (10%)</span>
                <span className="text-gray-600 dark:text-gray-300">
                  -{formatCurrency(job.platformFee, job.currency)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Agency Receives</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(agencyPayout, job.currency)}
                  </span>
                </div>
              </div>
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
