import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Deal, Agency, OnboardingAnswers } from "../../types";
import { Icon } from "../../components/Icon";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { AgencyLogo } from "../../components/AgencyLogo";
import { MatchingEngine } from "../../lib/matchingEngine";

export const Matches: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [deals, setDeals] = useState<Array<Deal & { agency?: Agency }>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hiringDealId, setHiringDealId] = useState<string | null>(null);
  
  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [dealToRemove, setDealToRemove] = useState<{ id: string; name: string } | null>(null);

  const handleHire = async (deal: Deal & { agency?: Agency }) => {
    if (!user || !deal.agency) return;
    
    setHiringDealId(deal.id);
    
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("deal_id", deal.id)
        .single();

      let conversationId: string;

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("conversations")
          .insert({
            deal_id: deal.id,
            business_id: user.id,
            agency_id: deal.agency.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;

        // Update deal status to active
        await supabase
          .from("deals")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", deal.id);

        // Send notification email to agency (non-blocking)
        supabase.functions.invoke("notify-agency-hire", {
          body: {
            dealId: deal.id,
            agencyId: deal.agency.id,
            businessUserId: user.id,
            conversationId,
          },
        }).catch(err => console.error("Failed to send hire notification:", err));

        showToast(`Started conversation with ${deal.agency.name}!`, "success");
      }

      // Navigate to the conversation
      navigate(`/messages/${conversationId}`);
    } catch (error: any) {
      console.error("Error starting conversation:", error);
      showToast("Failed to start conversation. Please try again.", "error");
    } finally {
      setHiringDealId(null);
    }
  };

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

  const removeDeal = (dealId: string, agencyName: string) => {
    setDealToRemove({ id: dealId, name: agencyName });
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!dealToRemove) return;

    try {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", dealToRemove.id);

      if (error) throw error;

      setDeals(deals.filter((d) => d.id !== dealToRemove.id));
      showToast(`${dealToRemove.name} removed from matches`, "success");
    } catch (error) {
      console.error("Error removing deal:", error);
      showToast("Error removing match. Please try again.", "error");
    } finally {
      setDealToRemove(null);
    }
  };

  const handleGenerateMatches = () => {
    // Show custom modal instead of browser confirm
    setShowGenerateModal(true);
  };

  const handleConfirmGenerate = async () => {
    // Check if profile has required data
    if (!profile || !profile.adPlatforms || profile.adPlatforms.length === 0) {
      showToast("Please complete your brand profile first", "error");
      navigate("/my-brand");
      return;
    }

    setGenerating(true);

    try {
      // Build onboarding answers from profile (new fields)
      const answers: OnboardingAnswers = {
        productDescription: profile.productDescription || "",
        monthlyRevenue: profile.monthlyRevenue || "$50k–$100k",
        aov: profile.aov || "$30–$70",
        profitMargin: profile.profitMargin || "40–55%",
        businessModel: profile.businessModel || "One-time purchase",
        adSpend: profile.adSpend || "$1k–$5k",
        adPlatforms: profile.adPlatforms || ["Meta"],
        otherPlatforms: profile.otherPlatforms || "",
        revenueConsistency: profile.revenueConsistency || "Mostly stable",
        profitableAds: profile.profitableAds || "Not sure",
        adsExperience: profile.adsExperience || "< 3 months",
        monthlyCreatives: profile.monthlyCreatives || "0–3",
        testimonialCount: profile.testimonialCount || "< 20",
        creativeCreator: profile.creativeCreator || "Founder",
        inventoryStatus: profile.inventoryStatus || "Regular stock",
        otherInventory: profile.otherInventory || "",
        fulfillmentTime: profile.fulfillmentTime || "3–7 days",
        returnIssues: profile.returnIssues || "Low",
        teamMember: profile.teamMember || "",
      };

      // Fetch all agencies
      const { data: agencies, error: agenciesError } = await supabase
        .from("agencies")
        .select("*");

      if (agenciesError) throw agenciesError;

      if (!agencies || agencies.length === 0) {
        showToast("No agencies available at this time", "error");
        setGenerating(false);
        return;
      }

      // Map agencies to proper format
      const mappedAgencies: Agency[] = agencies.map((a: any) => ({
        id: a.id,
        name: a.name,
        logoUrl: a.logo_url,
        description: a.description,
        platforms: a.platforms || [],
        industries: a.industries || [],
        spendBrackets: a.spend_brackets || [],
        objectives: a.objectives || [],
        capabilities: a.capabilities || [],
        verified: a.verified || false,
      }));

      // Generate matches using the matching engine
      const matches = MatchingEngine.generateMatches(answers, mappedAgencies);

      if (matches.length === 0) {
        showToast("No matching agencies found for your profile", "error");
        setGenerating(false);
        return;
      }

      // Get existing deal agency IDs to avoid duplicates
      const { data: existingDeals } = await supabase
        .from("deals")
        .select("agency_id")
        .eq("user_id", user!.id);

      const existingAgencyIds = new Set(existingDeals?.map((d) => d.agency_id) || []);

      // Filter out agencies that already have deals
      const newMatches = matches.filter((m) => !existingAgencyIds.has(m.agency.id));

      if (newMatches.length === 0) {
        showToast("All matching agencies are already in your matches", "info");
        setGenerating(false);
        await loadDeals();
        return;
      }

      // Create deal records for new matches
      const dealsToInsert = newMatches.map((match) => ({
        user_id: user!.id,
        agency_id: match.agency.id,
        match_score: match.matchScore,
        status: "new",
      }));

      const { error: insertError } = await supabase
        .from("deals")
        .insert(dealsToInsert);

      if (insertError) throw insertError;

      showToast(`Generated ${newMatches.length} new matches!`, "success");
      await loadDeals();
    } catch (error) {
      console.error("Error generating matches:", error);
      showToast("Error generating matches. Please try again.", "error");
    } finally {
      setGenerating(false);
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
            Matches
          </h1>
        </div>
        {deals.length > 0 && (
          <Button 
            variant="outline" 
            onClick={handleGenerateMatches}
            disabled={generating}
          >
            {generating ? (
              <>
                <Icon name="hourglass_empty" className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Icon name="refresh" className="mr-2" />
                Refresh Matches
              </>
            )}
          </Button>
        )}
      </div>

      {deals.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-pink-500/10 rounded-2xl mb-6">
              <Icon
                name="handshake"
                className="text-5xl text-primary"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Match for a new project?
            </h3>
            <Button 
              variant="primary" 
              onClick={handleGenerateMatches} 
              size="lg"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Icon name="hourglass_empty" className="animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate in 60s"
              )}
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
                  <AgencyLogo
                    logoUrl={deal.agency?.logoUrl}
                    name={deal.agency?.name || "Agency"}
                    size="md"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {deal.agency?.name || "Unknown Agency"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(deal.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => removeDeal(deal.id, deal.agency?.name || "Agency")}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove match"
                  >
                    <Icon name="close" className="text-lg" />
                  </button>
                </div>
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
                    variant="primary"
                    size="sm"
                    onClick={() => handleHire(deal)}
                    disabled={hiringDealId === deal.id}
                    className="flex-1 sm:flex-none"
                  >
                    {hiringDealId === deal.id ? (
                      <>
                        <Icon name="hourglass_empty" className="text-sm mr-1 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      "Hire"
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewDetails(deal)}
                    className="flex-1 sm:flex-none"
                  >
                    View Agency
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Matches Modal */}
      <ConfirmModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onConfirm={handleConfirmGenerate}
        onCancel={() => navigate("/my-brand")}
        title="Generate Matches"
        message="Generate based on current brand goals?"
        confirmText="Generate Matches"
        cancelText="Edit Brand Goals"
        icon="⚡️"
      />

      {/* Remove Match Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setDealToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        title="Remove Match"
        message={`Remove ${dealToRemove?.name || "this agency"} from your matches?\n\nThis action cannot be undone.`}
        confirmText="Remove"
        cancelText="Keep"
        confirmVariant="danger"
        icon="delete"
      />
    </div>
  );
};
