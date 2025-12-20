import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { Job, JobStatus, JobPayment, JobPayout } from "../../types";

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: string; bgColor: string; icon: string; description: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    icon: "edit",
    description: "Business is drafting this project.",
  },
  pending: {
    label: "Pending Acceptance",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    icon: "hourglass_empty",
    description: "Waiting for you to accept or decline this project.",
  },
  declined: {
    label: "Declined",
    color: "text-red-500",
    bgColor: "bg-red-50",
    icon: "cancel",
    description: "You declined this project.",
  },
  unfunded: {
    label: "Awaiting Payment",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    icon: "payment",
    description: "Waiting for the business to fund this project.",
  },
  funded: {
    label: "Ready to Start",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: "play_circle",
    description: "Payment received! You can now start working on this project.",
  },
  in_progress: {
    label: "In Progress",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    icon: "pending",
    description: "You're currently working on this project.",
  },
  review: {
    label: "Under Review",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    icon: "rate_review",
    description: "Work submitted. Waiting for business approval.",
  },
  revision: {
    label: "Revision Needed",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    icon: "edit_note",
    description: "Business requested changes. Please revise and resubmit.",
  },
  approved: {
    label: "Approved",
    color: "text-green-600",
    bgColor: "bg-green-50",
    icon: "check_circle",
    description: "Work approved! Payment is being processed.",
  },
  paid_out: {
    label: "Paid",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    icon: "paid",
    description: "Payment completed. Check your Stripe dashboard.",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    icon: "block",
    description: "This project has been cancelled.",
  },
  refunded: {
    label: "Refunded",
    color: "text-red-500",
    bgColor: "bg-red-50",
    icon: "money_off",
    description: "Payment was refunded to the business.",
  },
};

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agency } = useAuth();
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [payments, setPayments] = useState<JobPayment[]>([]);
  const [payouts, setPayouts] = useState<JobPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (id && agency?.id) {
      loadJob();
    }
  }, [id, agency?.id]);

  const loadJob = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
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
        });

        // Load payments and payouts
        await loadPaymentsAndPayouts();
      }
    } catch (error) {
      console.error("Error loading job:", error);
      showToast("Failed to load job details", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsAndPayouts = async () => {
    if (!id) return;

    try {
      const [paymentsRes, payoutsRes] = await Promise.all([
        supabase
          .from("job_payments")
          .select("*")
          .eq("job_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("job_payouts")
          .select("*")
          .eq("job_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (paymentsRes.data) {
        setPayments(
          paymentsRes.data.map((p: any) => ({
            id: p.id,
            jobId: p.job_id,
            stripePaymentIntentId: p.stripe_payment_intent_id,
            stripeChargeId: p.stripe_charge_id,
            amount: parseFloat(p.amount),
            status: p.status,
            createdAt: p.created_at,
          }))
        );
      }

      if (payoutsRes.data) {
        setPayouts(
          payoutsRes.data.map((p: any) => ({
            id: p.id,
            jobId: p.job_id,
            stripeTransferId: p.stripe_transfer_id,
            amount: parseFloat(p.amount),
            status: p.status,
            createdAt: p.created_at,
          }))
        );
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

  const handleAcceptJob = async () => {
    await updateJobStatus("unfunded");
    showToast("Job accepted! Waiting for business to fund the project.", "success");
  };

  const handleDeclineJob = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to decline this project? This action cannot be undone."
    );
    if (!confirmed) return;

    await updateJobStatus("declined");
  };

  const handleStartWork = async () => {
    await updateJobStatus("in_progress");
  };

  const handleSubmitForReview = async () => {
    await updateJobStatus("review");
    showToast("Work submitted for review! Waiting for business approval.", "success");
  };

  const handleResubmit = async () => {
    await updateJobStatus("review");
    showToast("Work resubmitted for review!", "success");
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading project details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8">
        <Card>
          <div className="text-center py-12">
            <Icon name="error" className="text-5xl text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Project not found</h3>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/agency/jobs")}>
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status];
  const earnings = job.amount - job.platformFee;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back Button & Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/agency/jobs")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <Icon name="arrow_back" />
          Back to Projects
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
            <p className="text-gray-500 mt-1">
              Created {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${statusConfig.color} ${statusConfig.bgColor}`}
          >
            <Icon name={statusConfig.icon} className="mr-1 text-lg align-middle" />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Status Alert */}
      <Card className={`mb-6 border-l-4 ${statusConfig.bgColor.replace("bg-", "border-l-").replace("-50", "-500")}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${statusConfig.bgColor} flex items-center justify-center`}>
            <Icon name={statusConfig.icon} className={`${statusConfig.color} text-2xl`} />
          </div>
          <div>
            <h3 className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{statusConfig.description}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Project Details
            </h2>
            {job.description ? (
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {job.description}
              </p>
            ) : (
              <p className="text-gray-400 italic">No description provided.</p>
            )}
          </Card>

          {/* Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>

            <div className="space-y-3">
              {/* Pending - Accept/Decline */}
              {job.status === "pending" && (
                <>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleAcceptJob}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "unfunded" ? (
                      "Processing..."
                    ) : (
                      <>
                        <Icon name="check_circle" className="mr-2" />
                        Accept Job
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleDeclineJob}
                    disabled={actionLoading !== null}
                  >
                    <Icon name="cancel" className="mr-2" />
                    Decline Job
                  </Button>
                </>
              )}

              {/* Funded - Start Work */}
              {job.status === "funded" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleStartWork}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "in_progress" ? (
                    "Processing..."
                  ) : (
                    <>
                      <Icon name="play_arrow" className="mr-2" />
                      Start Work
                    </>
                  )}
                </Button>
              )}

              {/* In Progress - Submit for Review */}
              {job.status === "in_progress" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSubmitForReview}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "review" ? (
                    "Processing..."
                  ) : (
                    <>
                      <Icon name="send" className="mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              )}

              {/* Revision - Resubmit */}
              {job.status === "revision" && (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleResubmit}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "review" ? (
                    "Processing..."
                  ) : (
                    <>
                      <Icon name="refresh" className="mr-2" />
                      Resubmit Work
                    </>
                  )}
                </Button>
              )}

              {/* Waiting states */}
              {job.status === "unfunded" && (
                <div className="text-center py-4 text-gray-500">
                  <Icon name="hourglass_empty" className="text-3xl mb-2" />
                  <p>Waiting for business to fund the project...</p>
                </div>
              )}

              {job.status === "review" && (
                <div className="text-center py-4 text-gray-500">
                  <Icon name="rate_review" className="text-3xl mb-2" />
                  <p>Waiting for business to review your work...</p>
                </div>
              )}

              {job.status === "approved" && (
                <div className="text-center py-4 text-green-600">
                  <Icon name="check_circle" className="text-3xl mb-2" />
                  <p>Work approved! Payment is being processed.</p>
                </div>
              )}

              {job.status === "paid_out" && (
                <div className="text-center py-4 text-emerald-600">
                  <Icon name="paid" className="text-3xl mb-2" />
                  <p>Payment received! Check your Stripe dashboard.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment History */}
          {(payments.length > 0 || payouts.length > 0) && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment History
              </h2>
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="arrow_downward" className="text-emerald-600" />
                      <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">
                          Payout Received
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payout.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-700">
                        +${payout.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{payout.status}</p>
                    </div>
                  </div>
                ))}
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="payment" className="text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-400">
                          Business Payment
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-700">
                        ${payment.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{payment.status}</p>
                    </div>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Job Amount</span>
                <span className="font-medium">${job.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Fee (10%)</span>
                <span className="text-red-500">-${job.platformFee.toLocaleString()}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Your Earnings</span>
                <span className="font-bold text-green-600 text-lg">
                  ${earnings.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Job ID</p>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                  {job.id}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Currency</p>
                <p className="font-medium text-gray-900 dark:text-white">{job.currency}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(job.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
