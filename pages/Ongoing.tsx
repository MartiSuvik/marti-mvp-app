import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { Deal, Agency } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/Icon";

export const Ongoing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [deals, setDeals] = useState<Array<Deal & { agency?: Agency }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOngoingDeals();
    }
  }, [user]);

  const loadOngoingDeals = async () => {
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
        .eq("status", "ongoing")
        .order("updated_at", { ascending: false });

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
      console.error("Error loading ongoing deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (dealId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", dealId);

      if (error) throw error;

      await loadOngoingDeals();

      if (status === "active") {
        showToast("Deal moved to Active successfully!", "success");
      } else {
        showToast("Status updated successfully!", "success");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Error updating status. Please try again.", "error");
    }
  };

  const handleViewDetails = (deal: Deal & { agency?: Agency }) => {
    if (deal.agencyId) {
      navigate(`/agencies/${deal.agencyId}`);
    } else {
      showToast("Agency details not available.", "error");
    }
  };

  const statusOptions = [
    { value: "Clarity Call scheduled", icon: "event" },
    { value: "Data Shared", icon: "folder_shared" },
    { value: "Contract Sent", icon: "description" },
    { value: "In Review", icon: "hourglass_empty" },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon
              name="hourglass_empty"
              className="text-5xl text-primary animate-spin mx-auto mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400">Loading ongoing deals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Ongoing Deals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your active agency partnerships
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
              No ongoing deals
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Move deals from "Deals" to "Ongoing" to track them here
            </p>
            <Button variant="primary" onClick={() => navigate("/deals")}>
              View Deals
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {deals.map((deal) => (
            <Card key={deal.id} hover>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    {deal.agency?.logoUrl ? (
                      <img
                        src={deal.agency.logoUrl}
                        alt={deal.agency.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon
                          name="business"
                          className="text-primary text-2xl"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {deal.agency?.name || "Unknown Agency"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Match Score: {deal.matchScore}%
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Status Tracker
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateStatus(deal.id, option.value)}
                          className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                            ${
                              deal.status === option.value
                                ? "bg-primary text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }
                          `}
                        >
                          <Icon name={option.icon} className="text-base" />
                          {option.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {deal.agency?.capabilities && (
                    <div className="flex flex-wrap gap-2">
                      {deal.agency.capabilities.slice(0, 3).map((cap) => (
                        <span
                          key={cap}
                          className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(deal)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateStatus(deal.id, "active")}
                  >
                    Move to Active
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
