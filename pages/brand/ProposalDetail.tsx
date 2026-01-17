import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, parseAmount } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/Icon";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import type { Proposal, Agency } from "../../types";

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          *,
          agencies (
            id,
            name,
            logo_url,
            description,
            platforms,
            verified,
            stripe_account_id,
            stripe_onboarding_complete,
            stripe_payouts_enabled
          )
        `
        )
        .eq("id", id)
        .eq("business_id", user?.id)
        .single();

      if (error) throw error;

      setProposal({
        id: data.id,
        dealId: data.deal_id,
        agencyId: data.agency_id,
        businessId: data.business_id,
        title: data.title,
        description: data.description,
        amount: parseAmount(data.amount),
        currency: data.currency,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });

      if (data.agencies) {
        setAgency({
          id: data.agencies.id,
          name: data.agencies.name,
          logoUrl: data.agencies.logo_url,
          description: data.agencies.description,
          platforms: data.agencies.platforms,
          verified: data.agencies.verified,
          stripeAccountId: data.agencies.stripe_account_id,
          stripeOnboardingComplete: data.agencies.stripe_onboarding_complete,
          stripePayoutsEnabled: data.agencies.stripe_payouts_enabled,
        });
      }
    } catch (error: any) {
      console.error("Error fetching proposal:", error);
      showToast(error.message || "Failed to load proposal", "error");
      navigate("/brand/proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!proposal) return;

    try {
      setAccepting(true);

      // Call accept-proposal edge function
      const { data, error } = await supabase.functions.invoke(
        "accept-proposal",
        {
          body: { proposalId: proposal.id },
        }
      );

      if (error) {
        // Extract error message from edge function response
        const errorMessage = error.message || error.toString();
        throw new Error(errorMessage);
      }

      showToast("Proposal accepted!", "success");

      // Navigate to job detail page where payment can be made
      setTimeout(() => {
        navigate(`/jobs/${data.jobId}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error accepting proposal:", error);
      
      // Show user-friendly error message
      let errorMessage = "Failed to accept proposal";
      
      if (error.message?.includes("Stripe onboarding")) {
        errorMessage = "This agency hasn't completed payment setup yet. Please contact them to complete their Stripe onboarding.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, "error");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!proposal) return;

    try {
      setDeclining(true);

      const { error } = await supabase
        .from("proposals")
        .update({ status: "declined" })
        .eq("id", proposal.id);

      if (error) throw error;

      showToast("Proposal declined", "success");
      navigate("/brand/proposals");
    } catch (error: any) {
      console.error("Error declining proposal:", error);
      showToast(error.message || "Failed to decline proposal", "error");
    } finally {
      setDeclining(false);
      setShowDeclineModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  const canRespond = proposal.status === "sent";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{proposal.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Proposal from {agency?.name || "Agency"}
            </p>
          </div>
          <div>
            {proposal.status === "sent" && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                Awaiting Response
              </span>
            )}
            {proposal.status === "accepted" && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                Accepted
              </span>
            )}
            {proposal.status === "declined" && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                Declined
              </span>
            )}
            {proposal.status === "converted" && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                Converted to Job
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agency Info */}
          {agency && (
            <Card className="p-6 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-4 mb-4">
                {agency.logoUrl ? (
                  <img
                    src={agency.logoUrl}
                    alt={agency.name}
                    className="w-16 h-16 rounded-lg object-contain p-2 bg-gray-100 dark:bg-gray-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {agency.name[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{agency.name}</h3>
                    {agency.verified && (
                      <Icon name="verified" className="text-primary text-sm" />
                    )}
                  </div>
                  {agency.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {agency.description}
                    </p>
                  )}
                </div>
              </div>
              {agency.platforms && agency.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {agency.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Description */}
          <Card className="p-6 bg-white dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Description</h2>
            {proposal.description ? (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {proposal.description}
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No description provided</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card className="p-6 bg-white dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary">
                  €{proposal.amount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Pay when work is approved
              </p>
            </div>
          </Card>

          {/* Actions */}
          {canRespond && (
            <Card className="p-6 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
              
              {/* Warning if agency hasn't completed Stripe */}
              {!agency?.stripeOnboardingComplete && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex gap-2">
                    <Icon name="warning" className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This agency hasn't completed payment setup yet. You can accept, but payment will only be available once they complete Stripe onboarding.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleAccept}
                  disabled={accepting || declining}
                  className="w-full"
                >
                  {accepting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Icon name="check_circle" />
                      Accept & Proceed to Payment
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeclineModal(true)}
                  disabled={accepting || declining}
                  className="w-full"
                >
                  <Icon name="cancel" />
                  Decline Proposal
                </Button>
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6 bg-white dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Icon name="schedule" className="text-gray-400" />
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Sent</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {proposal.updatedAt !== proposal.createdAt && (
                <div className="flex items-center gap-3">
                  <Icon name="update" className="text-gray-400" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(proposal.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Decline Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onConfirm={handleDecline}
        title="Decline Proposal"
        message="Are you sure you want to decline this proposal? This action cannot be undone."
        confirmText="Decline"
        confirmVariant="outline"
      />
    </div>
  );
}
