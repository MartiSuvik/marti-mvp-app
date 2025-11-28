import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { Deal, Agency } from "../types";
import { Icon } from "../components/Icon";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const Deals: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [deals, setDeals] = useState<Array<Deal & { agency?: Agency }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDeals();
    }
  }, [user]);

  const loadDeals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("deals")
        .select(
          `
          *,
          agencies (*)
        `
        )
        .eq("user_id", user.id)
        .in("status", ["new", "active", "review"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map database fields to TypeScript interface
      const mappedDeals = (data || []).map((deal: any) => ({
        id: deal.id,
        userId: deal.user_id,
        agencyId: deal.agency_id,
        matchScore: deal.match_score || 0,
        status: deal.status,
        createdAt: deal.created_at || new Date().toISOString(),
        updatedAt: deal.updated_at || new Date().toISOString(),
        agency: deal.agencies
          ? {
              id: deal.agencies.id,
              name: deal.agencies.name,
              logoUrl: deal.agencies.logo_url,
              description: deal.agencies.description,
              platforms: deal.agencies.platforms || [],
              industries: deal.agencies.industries || [],
              spendBrackets: deal.agencies.spend_brackets || [],
              objectives: deal.agencies.objectives || [],
              capabilities: deal.agencies.capabilities || [],
              verified: deal.agencies.verified || false,
            }
          : undefined,
      }));

      setDeals(mappedDeals);
    } catch (error) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDealStatus = async (dealId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", dealId);

      if (error) throw error;

      await loadDeals();

      // Show success message
      const statusMessages: Record<string, string> = {
        ongoing: "Deal moved to Ongoing successfully!",
        active: "Deal moved to Active successfully!",
      };
      if (statusMessages[newStatus]) {
        showToast(statusMessages[newStatus], "success");
      }
    } catch (error) {
      console.error("Error updating deal status:", error);
      showToast("Error updating deal status. Please try again.", "error");
    }
  };

  const handleViewDetails = (deal: Deal & { agency?: Agency }) => {
    if (deal.agencyId) {
      navigate(`/agencies/${deal.agencyId}`);
    } else {
      showToast("Agency details not available.", "error");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;

    const weeks = Math.floor(diffDays / 7);
    if (weeks < 4) return `${weeks}w ago`;

    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months}mo ago`;

    const years = Math.floor(diffDays / 365);
    return `${years}y ago`;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon
              name="hourglass_empty"
              className="text-5xl text-primary animate-spin mx-auto mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400">Loading deals...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Deals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your agency recommendations
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-pink-500/10 rounded-2xl mb-6">
              <Icon
                name="inbox"
                className="text-5xl text-primary"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No deals yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Complete onboarding to get your agency matches
            </p>
            <Button variant="primary" onClick={() => navigate("/onboarding")} size="lg">
              Start Onboarding
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {deals.map((deal) => (
            <Card key={deal.id} hover className="flex flex-col">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  {deal.agency?.logoUrl ? (
                    <img
                      src={deal.agency.logoUrl}
                      alt={deal.agency.name}
                      className="w-10 h-10 rounded-full shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center shadow-lg">
                      <Icon name="business" className="text-primary text-xl" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {deal.agency?.name || "Unknown Agency"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(deal.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                    deal.status === "active"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      : deal.status === "review"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                      : "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                  }`}
                >
                  {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                </span>
              </div>

              {/* Card Body */}
              <div className="mb-4 flex-1">
                {/* Requirements Match */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Requirements Match
                    </span>
                    <span className="font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
                      {deal.matchScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-primary to-pink-600 h-2.5 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${deal.matchScore}%` }}
                    ></div>
                  </div>
                  {deal.agency?.capabilities && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {deal.agency.capabilities.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium text-gray-600 dark:text-gray-300 glass px-2.5 py-1 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400 flex items-center text-xs">
                  {deal.agency?.verified && (
                    <>
                      <Icon
                        name="verified"
                        className="text-sm mr-1.5 text-blue-500"
                      />
                      Verified
                    </>
                  )}
                </span>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateDealStatus(deal.id, "ongoing")}
                    className="flex-1 sm:flex-none"
                  >
                    Move to Ongoing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(deal)}
                    className="flex-1 sm:flex-none"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
