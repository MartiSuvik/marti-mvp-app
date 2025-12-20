import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";
import { ChatDrawer } from "../../components/chat";
import { Deal, Agency } from "../../types";

interface BusinessInfo {
  id: string;
  companyName: string;
  industry: string;
  platforms: string[];
  spendBracket: string;
  objectives: string[];
}

interface DealWithBusiness extends Deal {
  business?: BusinessInfo;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  new: { label: "New Match", color: "text-blue-600", bgColor: "bg-blue-50", icon: "fiber_new" },
  active: { label: "In Discussion", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: "chat" },
  review: { label: "Under Review", color: "text-purple-600", bgColor: "bg-purple-50", icon: "rate_review" },
  ongoing: { label: "Active Client", color: "text-green-600", bgColor: "bg-green-50", icon: "handshake" },
};

type FilterTab = "all" | "new" | "active" | "ongoing";

export const Matches: React.FC = () => {
  const { agency } = useAuth();
  const [deals, setDeals] = useState<DealWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealWithBusiness | null>(null);

  const handleOpenChat = (deal: DealWithBusiness) => {
    setSelectedDeal(deal);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedDeal(null);
  };

  useEffect(() => {
    if (agency?.id) {
      loadDeals();
    }
  }, [agency?.id]);

  const loadDeals = async () => {
    if (!agency?.id) return;

    try {
      // Fetch deals for this agency with business info
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          user_profiles!deals_user_id_fkey (
            id,
            company_name,
            industry,
            platforms,
            spend_bracket,
            objectives
          )
        `)
        .eq("agency_id", agency.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: DealWithBusiness[] = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          agencyId: d.agency_id,
          matchScore: d.match_score,
          status: d.status,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          business: d.user_profiles ? {
            id: d.user_profiles.id,
            companyName: d.user_profiles.company_name || "Unnamed Business",
            industry: d.user_profiles.industry || "Not specified",
            platforms: d.user_profiles.platforms || [],
            spendBracket: d.user_profiles.spend_bracket || "Not specified",
            objectives: d.user_profiles.objectives || [],
          } : undefined,
        }));
        setDeals(mapped);
      }
    } catch (error) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = deals.filter((deal) => {
    if (activeTab === "all") return true;
    return deal.status === activeTab;
  });

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All Matches", count: deals.length },
    { id: "new", label: "New", count: deals.filter((d) => d.status === "new").length },
    { id: "active", label: "In Discussion", count: deals.filter((d) => d.status === "active").length },
    { id: "ongoing", label: "Active Clients", count: deals.filter((d) => d.status === "ongoing").length },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading matched businesses...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Matched Businesses</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Businesses that have been matched with your agency based on their requirements.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Icon name="business" className="text-5xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              No matches found
            </h3>
            <p className="text-gray-400">
              {activeTab === "new"
                ? "No new business matches at the moment."
                : activeTab === "active"
                ? "No businesses currently in discussion."
                : activeTab === "ongoing"
                ? "No active clients yet."
                : "Matched businesses will appear here when they're looking for agencies like yours."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeals.map((deal) => {
            const statusConfig = STATUS_CONFIG[deal.status] || STATUS_CONFIG.new;

            return (
              <Card key={deal.id} hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Company Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">
                        {deal.business?.companyName?.charAt(0) || "B"}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {deal.business?.companyName || "Unnamed Business"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon name="category" className="text-sm" />
                          {deal.business?.industry || "Unknown Industry"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="payments" className="text-sm" />
                          {deal.business?.spendBracket || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Match Score */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{deal.matchScore}%</div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>

                    {/* Platforms */}
                    <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
                      {deal.business?.platforms?.slice(0, 3).map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"
                        >
                          {platform}
                        </span>
                      ))}
                      {(deal.business?.platforms?.length || 0) > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                          +{(deal.business?.platforms?.length || 0) - 3}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}
                    >
                      <Icon name={statusConfig.icon} className="text-sm mr-1 align-middle" />
                      {statusConfig.label}
                    </span>

                    {/* Action indicator for new matches */}
                    {deal.status === "new" && (
                      <span className="hidden lg:flex items-center gap-1 text-sm text-blue-600 font-medium">
                        <Icon name="visibility" className="text-lg" />
                        Review
                      </span>
                    )}

                    {/* Chat Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChat(deal);
                      }}
                    >
                      <Icon name="chat" className="mr-1" />
                      Chat
                    </Button>

                    <Icon name="chevron_right" className="text-gray-400" />
                  </div>
                </div>

                {/* Objectives Row */}
                {deal.business?.objectives && deal.business.objectives.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Looking for:</span>
                      <div className="flex flex-wrap gap-2">
                        {deal.business.objectives.map((obj) => (
                          <span
                            key={obj}
                            className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-lg"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Chat Drawer */}
      {selectedDeal && agency && (
        <ChatDrawer
          isOpen={chatOpen}
          onClose={handleCloseChat}
          deal={selectedDeal as Deal}
          agency={agency as Agency}
          userType="agency"
        />
      )}
    </div>
  );
};
