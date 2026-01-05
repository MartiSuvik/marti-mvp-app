import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/Icon";
import type { Deal } from "../../types";

export default function CreateProposal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { agency } = useAuth();
  const { showToast } = useToast();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get deal_id from URL query params
  const searchParams = new URLSearchParams(location.search);
  const dealId = searchParams.get("deal_id");

  useEffect(() => {
    if (!dealId) {
      showToast("No deal specified", "error");
      navigate("/agency/matches");
      return;
    }

    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      setLoading(true);

      // Fetch deal with agency and business info
      const { data: dealData, error: dealError } = await supabase
        .from("deals")
        .select(
          `
          *,
          agencies (
            id,
            name,
            logo_url
          )
        `
        )
        .eq("id", dealId)
        .single();

      if (dealError) throw dealError;

      // Verify this deal belongs to the current agency
      if (dealData.agency_id !== agency?.id) {
        showToast("Unauthorized access to this deal", "error");
        navigate("/agency/matches");
        return;
      }

      setDeal({
        id: dealData.id,
        userId: dealData.user_id,
        agencyId: dealData.agency_id,
        matchScore: dealData.match_score,
        status: dealData.status,
        createdAt: dealData.created_at,
        updatedAt: dealData.updated_at,
      });
    } catch (error: any) {
      console.error("Error fetching deal:", error);
      showToast(error.message || "Failed to load deal", "error");
      navigate("/agency/matches");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    await saveProposal("draft");
  };

  const handleSendProposal = async () => {
    if (!validateForm()) return;
    await saveProposal("sent");
  };

  const saveProposal = async (status: "draft" | "sent") => {
    try {
      setSubmitting(true);

      const amount = parseFloat(formData.amount);

      const { error } = await supabase.from("proposals").insert({
        deal_id: dealId,
        agency_id: deal?.agencyId,
        business_id: deal?.userId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        amount,
        status,
      });

      if (error) throw error;

      showToast(
        status === "draft"
          ? "Proposal saved as draft"
          : "Proposal sent successfully!",
        "success"
      );
      navigate("/agency/proposals");
    } catch (error: any) {
      console.error("Error saving proposal:", error);
      showToast(error.message || "Failed to save proposal", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Proposal</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Send a proposal to the client with your project details and pricing
        </p>
      </div>

      <Card className="p-8 bg-white dark:bg-gray-900">
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Title *
            </label>
            <Input
              type="text"
              placeholder="e.g., Meta Ads Campaign Setup & Management"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              error={errors.title}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Description
            </label>
            <textarea
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[200px]"
              placeholder="Describe the scope of work, deliverables, timeline, and what the client can expect..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Include key deliverables, timeline, and success metrics
            </p>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Amount (USD) *
            </label>
            <Input
              type="number"
              placeholder="5000"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              error={errors.amount}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
            )}


          </div>

          {/* Info box */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-3">
              <Icon name="info" className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">Proposal Guidelines</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                  <li>Be clear about deliverables and timeline</li>
                  <li>Once sent, proposals cannot be edited</li>
                  <li>The client can review and accept your proposal</li>
                  <li>Payment will be held in escrow until work is approved</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex-1"
            >
              <Icon name="save" />
              Save as Draft
            </Button>
            <Button
              variant="primary"
              onClick={handleSendProposal}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Icon name="send" />
                  Send Proposal
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
