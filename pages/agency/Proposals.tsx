import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Icon } from "../../components/Icon";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { Proposal, Deal } from "../../types";

interface DealWithBusiness extends Deal {
  businessProfile?: {
    companyName?: string;
  };
}

export default function Proposals() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "sent" | "accepted" | "declined">("all");
  const [showDealModal, setShowDealModal] = useState(false);
  const [deals, setDeals] = useState<DealWithBusiness[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    drafts: 0,
    sent: 0,
    accepted: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoadingDeals(true);

      // Get agency_id first
      const { data: agencyData, error: agencyError } = await supabase
        .from("agencies")
        .select("id")
        .eq("owner_id", profile?.userId)
        .single();

      if (agencyError) throw agencyError;

      // Fetch active deals
      const { data, error } = await supabase
        .from("deals")
        .select(
          `
          *,
          user_profiles!deals_user_id_fkey (
            company_name
          )
        `
        )
        .eq("agency_id", agencyData.id)
        .in("status", ["new", "active", "review", "ongoing"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: DealWithBusiness[] = (data || []).map((d) => ({
        id: d.id,
        userId: d.user_id,
        agencyId: d.agency_id,
        matchScore: d.match_score,
        status: d.status,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        businessProfile: d.user_profiles ? {
          companyName: d.user_profiles.company_name,
        } : undefined,
      }));

      setDeals(mapped);
    } catch (error: any) {
      console.error("Error fetching deals:", error);
      showToast(error.message || "Failed to load deals", "error");
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleNewProposal = async () => {
    setShowDealModal(true);
    await fetchDeals();
  };

  const handleDealSelect = (dealId: string) => {
    setShowDealModal(false);
    navigate(`/agency/proposals/create?deal_id=${dealId}`);
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);

      // Get agency_id first
      const { data: agencyData, error: agencyError } = await supabase
        .from("agencies")
        .select("id")
        .eq("owner_id", profile?.userId)
        .single();

      if (agencyError) throw agencyError;

      // Fetch all proposals for this agency
      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          *,
          deals!inner(
            id,
            match_score,
            status
          )
        `
        )
        .eq("agency_id", agencyData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Proposal[] = (data || []).map((p) => ({
        id: p.id,
        dealId: p.deal_id,
        agencyId: p.agency_id,
        businessId: p.business_id,
        title: p.title,
        description: p.description,
        amount: parseFloat(p.amount),
        currency: p.currency,
        platformFee: parseFloat(p.platform_fee),
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        deal: p.deals ? {
          id: p.deals.id,
          userId: p.business_id,
          agencyId: p.agency_id,
          matchScore: p.deals.match_score,
          status: p.deals.status,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        } : undefined,
      }));

      setProposals(mapped);

      // Calculate stats
      const drafts = mapped.filter((p) => p.status === "draft").length;
      const sent = mapped.filter((p) => p.status === "sent").length;
      const accepted = mapped.filter((p) => p.status === "accepted" || p.status === "converted").length;
      const totalValue = mapped
        .filter((p) => p.status === "accepted" || p.status === "converted")
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({ drafts, sent, accepted, totalValue });
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      showToast(error.message || "Failed to load proposals", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === "all") return true;
    return proposal.status === filter;
  });

  const getStatusBadge = (status: Proposal["status"]) => {
    const badges = {
      draft: { label: "Draft", className: "bg-gray-500/20 text-gray-300" },
      sent: { label: "Sent", className: "bg-blue-500/20 text-blue-300" },
      accepted: { label: "Accepted", className: "bg-green-500/20 text-green-300" },
      declined: { label: "Declined", className: "bg-red-500/20 text-red-300" },
      converted: { label: "Converted", className: "bg-purple-500/20 text-purple-300" },
    };

    const badge = badges[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Proposals</h1>
          <p className="text-gray-400">
            Manage proposals you've sent to businesses
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewProposal}
        >
          <Icon name="add" />
          New Proposal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
              <Icon name="edit_note" className="text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.drafts}</p>
              <p className="text-sm text-gray-500">Drafts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Icon name="send" className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sent}</p>
              <p className="text-sm text-gray-500">Sent</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Icon name="check_circle" className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.accepted}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Icon name="payments" className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: "all" as const, label: "All" },
          { key: "draft" as const, label: "Drafts" },
          { key: "sent" as const, label: "Sent" },
          { key: "accepted" as const, label: "Accepted" },
          { key: "declined" as const, label: "Declined" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filter === tab.key
                ? "bg-primary text-white"
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="description" className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No proposals yet</h3>
            <p className="text-gray-400 mb-6">
              {filter === "all"
                ? "Create your first proposal to start working with clients"
                : `No ${filter} proposals found`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <Card
              key={proposal.id}
              className="p-6 hover:border-primary/50 transition-all cursor-pointer"
              hover
              onClick={() => {
                if (proposal.status === "draft") {
                  // Navigate to edit page (could create EditProposal.tsx)
                  showToast("Edit functionality coming soon", "info");
                } else {
                  // View details
                  navigate(`/agency/proposals/${proposal.id}`);
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{proposal.title}</h3>
                    {getStatusBadge(proposal.status)}
                  </div>
                  {proposal.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {proposal.description}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Icon name="payments" className="text-sm" />
                      ${proposal.amount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="schedule" className="text-sm" />
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">You'll Earn</p>
                    <p className="text-xl font-bold text-green-400">
                      ${(proposal.amount - proposal.platformFee).toLocaleString()}
                    </p>
                  </div>
                  {proposal.status === "draft" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement send from draft
                        showToast("Send from draft coming soon", "info");
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Send Now
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Deal Selection Modal */}
      {showDealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Select Client</h2>
                  <p className="text-gray-400 text-sm">
                    Choose which client to send a proposal to
                  </p>
                </div>
                <button
                  onClick={() => setShowDealModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon name="close" className="text-xl" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingDeals ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading clients...</p>
                  </div>
                </div>
              ) : deals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon name="handshake" className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Active Clients</h3>
                  <p className="text-gray-400 mb-4">
                    You don't have any active matches to send proposals to.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDealModal(false);
                      navigate("/agency/matches");
                    }}
                  >
                    View Matches
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => handleDealSelect(deal.id)}
                      className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-white">
                            {deal.businessProfile?.companyName?.[0] || "C"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                            {deal.businessProfile?.companyName || "Unknown Business"}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-500">
                              Match: {deal.matchScore}%
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500 capitalize">
                              {deal.status}
                            </span>
                          </div>
                        </div>
                        <Icon name="arrow_forward" className="text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
