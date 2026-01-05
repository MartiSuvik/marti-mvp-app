import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Icon } from "../../components/Icon";
import { Card } from "../../components/ui/Card";
import type { Proposal, Agency } from "../../types";

interface ProposalWithAgency extends Proposal {
  agency?: Agency;
}

export default function Proposals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [proposals, setProposals] = useState<ProposalWithAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "accepted" | "declined">("all");

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);

      // Fetch all proposals for this business
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
            verified
          )
        `
        )
        .eq("business_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: ProposalWithAgency[] = (data || []).map((p) => ({
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
        agency: p.agencies ? {
          id: p.agencies.id,
          name: p.agencies.name,
          logoUrl: p.agencies.logo_url,
          description: p.agencies.description,
          platforms: p.agencies.platforms,
          verified: p.agencies.verified,
        } : undefined,
      }));

      setProposals(mapped);

      // Calculate stats
      const pending = mapped.filter((p) => p.status === "sent").length;
      const accepted = mapped.filter((p) => p.status === "accepted" || p.status === "converted").length;
      const totalValue = mapped
        .filter((p) => p.status === "accepted" || p.status === "converted")
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({ pending, accepted, totalValue });
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
      draft: { label: "Draft", className: "bg-gray-500/20 text-gray-800" },
      sent: { label: "Pending", className: "bg-blue-500/20 text-blue-800" },
      accepted: { label: "Accepted", className: "bg-green-500/20 text-green-800" },
      declined: { label: "Declined", className: "bg-red-500/20 text-red-800" },
      converted: { label: "Converted", className: "bg-purple-500/20 text-purple-800" },
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Proposals</h1>
        <p className="text-gray-400">
          Review proposals from your matched agencies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Icon name="hourglass_empty" className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending Review</p>
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
          { key: "sent" as const, label: "Pending" },
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="description" className="text-3xl text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No proposals yet</h3>
            <p className="text-gray-400">
              {filter === "all"
                ? "When agencies send you proposals, they'll appear here. Start by connecting with agencies from your matches."
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
              onClick={() => navigate(`/proposals/${proposal.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {/* Agency Logo */}
                  {proposal.agency?.logoUrl ? (
                    <img
                      src={proposal.agency.logoUrl}
                      alt={proposal.agency.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">
                        {proposal.agency?.name?.[0] || "A"}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold truncate">{proposal.title}</h3>
                      {getStatusBadge(proposal.status)}
                      {proposal.agency?.verified && (
                        <Icon name="verified" className="text-primary text-sm flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      From {proposal.agency?.name || "Unknown Agency"}
                    </p>
                    {proposal.description && (
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                        {proposal.description}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Icon name="schedule" className="text-sm" />
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                      {proposal.agency?.platforms && proposal.agency.platforms.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Icon name="language" className="text-sm" />
                          {proposal.agency.platforms.slice(0, 2).join(", ")}
                          {proposal.agency.platforms.length > 2 && " +more"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      ${proposal.amount.toLocaleString()}
                    </p>
                  </div>
                  {proposal.status === "sent" && (
                    <span className="text-sm font-medium text-blue-400">
                      Action Required →
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
