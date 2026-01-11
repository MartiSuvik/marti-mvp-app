import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, parseAmount } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import type { Proposal } from "../../types";

interface BusinessInfo {
  id: string;
  userId: string;
  companyName: string;
  productDescription: string;
  adPlatforms: string[];
  adSpend: string;
  businessModel: string;
}

interface ProposalWithBusiness extends Omit<Proposal, 'businessId'> {
  business?: BusinessInfo;
  deliverables?: string[];
  timeline?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-100", icon: "edit_note" },
  sent: { label: "Sent", color: "text-blue-600", bgColor: "bg-blue-50", icon: "send" },
  accepted: { label: "Accepted", color: "text-green-600", bgColor: "bg-green-50", icon: "check_circle" },
  converted: { label: "Job Created", color: "text-purple-600", bgColor: "bg-purple-50", icon: "work" },
  declined: { label: "Declined", color: "text-red-600", bgColor: "bg-red-50", icon: "cancel" },
};

export default function AgencyProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agency } = useAuth();
  const { showToast } = useToast();

  const [proposal, setProposal] = useState<ProposalWithBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [linkedJobId, setLinkedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (id && agency?.id) {
      fetchProposal();
    }
  }, [id, agency?.id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);

      // Fetch proposal with deal info
      const { data: proposalData, error: proposalError } = await supabase
        .from("proposals")
        .select(`
          *,
          deals!proposals_deal_id_fkey (
            id,
            user_id,
            match_score,
            status
          )
        `)
        .eq("id", id)
        .eq("agency_id", agency?.id)
        .single();

      if (proposalError) throw proposalError;
      if (!proposalData) {
        showToast("Proposal not found", "error");
        navigate("/agency/proposals");
        return;
      }

      // Fetch business profile
      let businessInfo: BusinessInfo | undefined;
      if (proposalData.deals?.user_id) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("id, user_id, name, company_name, product_description, ad_platforms, ad_spend, business_model")
          .eq("user_id", proposalData.deals.user_id)
          .single();

        if (profileData) {
          let displayName = profileData.company_name;
          if (!displayName && profileData.name) {
            displayName = `${profileData.name}'s Business`;
          }

          businessInfo = {
            id: profileData.id,
            userId: profileData.user_id,
            companyName: displayName || "Unnamed Business",
            productDescription: profileData.product_description || "",
            adPlatforms: profileData.ad_platforms || [],
            adSpend: profileData.ad_spend || "Not specified",
            businessModel: profileData.business_model || "Not specified",
          };
        }
      }

      const mapped: ProposalWithBusiness = {
        id: proposalData.id,
        dealId: proposalData.deal_id,
        agencyId: proposalData.agency_id,
        title: proposalData.title,
        description: proposalData.description,
        amount: parseAmount(proposalData.amount || proposalData.price || 0),
        currency: proposalData.currency,
        deliverables: proposalData.deliverables || [],
        timeline: proposalData.timeline,
        status: proposalData.status,
        createdAt: proposalData.created_at,
        updatedAt: proposalData.updated_at,
        business: businessInfo,
      };

      setProposal(mapped);

      // If proposal is accepted/converted, fetch the linked job
      if (proposalData.status === "accepted" || proposalData.status === "converted") {
        const { data: jobData } = await supabase
          .from("jobs")
          .select("id")
          .eq("proposal_id", proposalData.id)
          .single();
        
        if (jobData) {
          setLinkedJobId(jobData.id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching proposal:", error);
      showToast(error.message || "Failed to load proposal", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!proposal || proposal.status !== "sent") return;

    try {
      setWithdrawing(true);

      const { error } = await supabase
        .from("proposals")
        .update({ status: "draft" })
        .eq("id", proposal.id);

      if (error) throw error;

      showToast("Proposal withdrawn successfully", "success");
      setProposal({ ...proposal, status: "draft" });
    } catch (error: any) {
      console.error("Error withdrawing proposal:", error);
      showToast(error.message || "Failed to withdraw proposal", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleEdit = () => {
    navigate(`/agency/proposals/create?deal_id=${proposal?.dealId}&edit=${proposal?.id}`);
  };

  const handleMessageBusiness = async () => {
    if (!proposal?.dealId || !agency?.id) return;

    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("deal_id", proposal.dealId)
        .maybeSingle();

      if (existing) {
        navigate(`/agency/messages/${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from("conversations")
        .insert({
          deal_id: proposal.dealId,
          business_id: proposal.business?.userId,
          agency_id: agency.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (newConvo) {
        navigate(`/agency/messages/${newConvo.id}`);
      }
    } catch (error) {
      console.error("Error opening chat:", error);
      showToast("Failed to open chat", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading proposal...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-8 text-center">
        <Icon name="error" className="text-5xl text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">Proposal not found</h2>
        <Button variant="outline" onClick={() => navigate("/agency/proposals")} className="mt-4">
          Back to Proposals
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/agency/proposals")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Icon name="arrow_back" className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {proposal.title}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
              <Icon name={statusConfig.icon} className="text-sm mr-1 align-middle" />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Sent to {proposal.business?.companyName || "Unknown Business"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {proposal.status === "draft" && (
            <Button variant="primary" onClick={handleEdit}>
              <Icon name="edit" className="mr-2" />
              Edit & Send
            </Button>
          )}
          {proposal.status === "sent" && (
            <>
              <Button variant="primary" onClick={handleMessageBusiness}>
                <Icon name="chat" className="mr-2" />
                Message
              </Button>
            </>
          )}
          {(proposal.status === "accepted" || proposal.status === "converted") && linkedJobId && (
            <Button variant="primary" onClick={() => navigate(`/agency/jobs/${linkedJobId}`)}>
              <Icon name="work" className="mr-2" />
              View Job
            </Button>
          )}
          {(proposal.status === "accepted" || proposal.status === "converted") && (
            <Button variant="outline" onClick={handleMessageBusiness}>
              <Icon name="chat" className="mr-2" />
              Message Client
            </Button>
          )}
        </div>
      </div>

      {/* Job Created Banner */}
      {(proposal.status === "accepted" || proposal.status === "converted") && linkedJobId && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <Icon name="check_circle" className="text-green-600 dark:text-green-400 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Client Accepted Your Proposal!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  A job has been created. Accept it to let the client fund the project.
                </p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/agency/jobs/${linkedJobId}`)}
            >
              <Icon name="work" className="mr-2" />
              Accept Job
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Proposal Description
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {proposal.description || "No description provided."}
              </p>
            </div>
          </Card>

          {/* Deliverables */}
          {proposal.deliverables && proposal.deliverables.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Icon name="checklist" className="mr-2 align-middle" />
                Deliverables
              </h2>
              <ul className="space-y-3">
                {proposal.deliverables.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="check" className="text-green-600 text-sm" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Timeline */}
          {proposal.timeline && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Icon name="schedule" className="mr-2 align-middle" />
                Timeline
              </h2>
              <p className="text-gray-600 dark:text-gray-300">{proposal.timeline}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pricing
            </h2>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Proposal Amount</span>
              <span className="text-2xl font-bold text-green-600">
                €{proposal.amount.toLocaleString()}
              </span>
            </div>
          </Card>

          {/* Business Info */}
          {proposal.business && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                <Icon name="business" className="mr-2 align-middle" />
                Client Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {proposal.business.companyName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {proposal.business.companyName}
                    </h3>
                    <p className="text-sm text-gray-500">{proposal.business.businessModel}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Icon name="payments" className="text-lg" />
                    <span>Ad Spend: {proposal.business.adSpend}</span>
                  </div>
                  {proposal.business.adPlatforms.length > 0 && (
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <Icon name="campaign" className="text-lg mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {proposal.business.adPlatforms.map((platform) => (
                          <span
                            key={platform}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {proposal.business.productDescription && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Product/Service:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {proposal.business.productDescription.length > 150
                        ? `${proposal.business.productDescription.substring(0, 150)}...`
                        : proposal.business.productDescription}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Status Timeline */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Icon name="history" className="mr-2 align-middle" />
              Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Icon name="add" className="text-blue-600 text-sm" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(proposal.createdAt).toLocaleDateString()} at{" "}
                    {new Date(proposal.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {proposal.status !== "draft" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Icon name="send" className="text-indigo-600 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Sent</p>
                    <p className="text-xs text-gray-500">
                      {new Date(proposal.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {proposal.status === "accepted" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Icon name="check_circle" className="text-green-600 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Accepted</p>
                    <p className="text-xs text-gray-500">Client accepted your proposal</p>
                  </div>
                </div>
              )}

              {proposal.status === "declined" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Icon name="cancel" className="text-red-600 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Declined</p>
                    <p className="text-xs text-gray-500">Client declined your proposal</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
