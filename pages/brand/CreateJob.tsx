import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Deal, Agency } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Icon } from "../../components/Icon";
import { AgencyLogo } from "../../components/AgencyLogo";

/**
 * CreateJob Page
 * 
 * Multi-step wizard to create a new job:
 * 1. Select agency (from ongoing deals or pre-selected via URL)
 * 2. Enter job details (title, description, amount)
 * 3. Review and submit
 */

interface JobFormData {
  agencyId: string;
  dealId: string;
  title: string;
  description: string;
  amount: string;
  currency: string;
}

const PLATFORM_FEE_PERCENT = 0.10; // 10%

export const CreateJob: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Get pre-selected deal from URL
  const preselectedDealId = searchParams.get("deal");

  const [step, setStep] = useState(preselectedDealId ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [ongoingDeals, setOngoingDeals] = useState<Array<Deal & { agency?: Agency }>>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);

  const [formData, setFormData] = useState<JobFormData>({
    agencyId: "",
    dealId: preselectedDealId || "",
    title: "",
    description: "",
    amount: "",
    currency: "USD",
  });

  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  useEffect(() => {
    if (user) {
      loadOngoingDeals();
    }
  }, [user]);

  useEffect(() => {
    // If preselected deal, find and set the agency
    if (preselectedDealId && ongoingDeals.length > 0) {
      const deal = ongoingDeals.find(d => d.id === preselectedDealId);
      if (deal) {
        setFormData(prev => ({
          ...prev,
          dealId: deal.id,
          agencyId: deal.agencyId,
        }));
        setSelectedAgency(deal.agency || null);
      }
    }
  }, [preselectedDealId, ongoingDeals]);

  const loadOngoingDeals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          agencies (*)
        `)
        .eq("user_id", user.id)
        .eq("status", "ongoing")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mappedDeals = (data || []).map((deal: any) => ({
        id: deal.id,
        userId: deal.user_id,
        agencyId: deal.agency_id,
        matchScore: deal.match_score || 0,
        status: deal.status,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
        agency: deal.agencies ? {
          id: deal.agencies.id,
          name: deal.agencies.name,
          logoUrl: deal.agencies.logo_url,
          description: deal.agencies.description,
          platforms: deal.agencies.platforms || [],
          industries: deal.agencies.industries || [],
          spendBrackets: deal.agencies.spend_brackets || [],
          objectives: deal.agencies.objectives || [],
          verified: deal.agencies.verified || false,
        } : undefined,
      }));

      setOngoingDeals(mappedDeals);
    } catch (error) {
      console.error("Error loading deals:", error);
      showToast("Failed to load agencies", "error");
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleSelectAgency = (deal: Deal & { agency?: Agency }) => {
    setFormData(prev => ({
      ...prev,
      dealId: deal.id,
      agencyId: deal.agencyId,
    }));
    setSelectedAgency(deal.agency || null);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep2 = () => {
    if (!formData.title.trim()) {
      showToast("Please enter a job title", "error");
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateStep2()) return;

    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      const platformFee = amount * PLATFORM_FEE_PERCENT;

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          deal_id: formData.dealId,
          business_id: user.id,
          agency_id: formData.agencyId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          amount: amount,
          currency: formData.currency,
          platform_fee: platformFee,
          status: "pending", // Start as pending, waiting for agency acceptance
        })
        .select()
        .single();

      if (error) throw error;

      showToast("Job created successfully!", "success");
      navigate(`/jobs/${data.id}`);
    } catch (error) {
      console.error("Error creating job:", error);
      showToast("Failed to create job", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const amount = parseFloat(formData.amount) || 0;
  const platformFee = amount * PLATFORM_FEE_PERCENT;
  const agencyReceives = amount - platformFee;

  // Step indicators
  const steps = [
    { id: 1, label: "Select Agency" },
    { id: 2, label: "Job Details" },
    { id: 3, label: "Review" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/jobs")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Icon name="arrow_back" className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Create New Job
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Set up a new project with your agency partner
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s.id
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {step > s.id ? (
                  <Icon name="check" className="text-lg" />
                ) : (
                  s.id
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium hidden sm:inline ${
                  step >= s.id
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  step > s.id
                    ? "bg-primary"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Agency */}
      {step === 1 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select an Agency
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Choose from your ongoing partnerships
          </p>

          {loadingDeals ? (
            <div className="text-center py-12">
              <Icon name="hourglass_empty" className="text-4xl text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading agencies...</p>
            </div>
          ) : ongoingDeals.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="business" className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Ongoing Partnerships
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Move a deal to "Ongoing" status first to create jobs
              </p>
              <Button variant="primary" onClick={() => navigate("/deals")}>
                View Deals
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ongoingDeals.map(deal => (
                <button
                  key={deal.id}
                  onClick={() => handleSelectAgency(deal)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors text-left"
                >
                  <AgencyLogo
                    logoUrl={deal.agency?.logoUrl}
                    name={deal.agency?.name || "Agency"}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {deal.agency?.name || "Unknown Agency"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Match Score: {deal.matchScore}%
                    </p>
                  </div>
                  {deal.agency?.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full text-xs">
                      <Icon name="verified" className="text-sm" />
                      Verified
                    </span>
                  )}
                  <Icon name="chevron_right" className="text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Job Details */}
      {step === 2 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Job Details
          </h2>

          {/* Selected Agency */}
          {selectedAgency && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
              <AgencyLogo
                logoUrl={selectedAgency.logoUrl}
                name={selectedAgency.name}
                size="sm"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{selectedAgency.name}</p>
                <p className="text-xs text-gray-500">Selected Agency</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-primary text-sm font-medium hover:underline"
              >
                Change
              </button>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Job Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Q1 Meta Ads Campaign"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the scope of work, deliverables, timeline..."
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="5000"
                min="1"
                step="0.01"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Fee Breakdown */}
            {amount > 0 && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Job Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(amount, formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Fee (10%)</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      -{formatCurrency(platformFee, formData.currency)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Agency Receives</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(agencyReceives, formData.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep(1)}>
              <Icon name="arrow_back" className="mr-2" />
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => validateStep2() && setStep(3)}
            >
              Review
              <Icon name="arrow_forward" className="ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Review Your Job
          </h2>

          <div className="space-y-6">
            {/* Agency */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              {selectedAgency?.logoUrl ? (
                <img src={selectedAgency.logoUrl} alt={selectedAgency.name} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="business" className="text-primary text-xl" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedAgency?.name}</p>
                <p className="text-sm text-gray-500">Agency Partner</p>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Job Title</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formData.title}</p>
              </div>
              {formData.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Job Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(amount, formData.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform Fee (10%)</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    -{formatCurrency(platformFee, formData.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="font-medium text-gray-900 dark:text-white">Agency Receives</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(agencyReceives, formData.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex gap-3">
                <Icon name="info" className="text-blue-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">What happens next?</p>
                  <ul className="mt-1 text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• The agency will be notified of your job request</li>
                    <li>• Once they accept, you'll be prompted to fund the job</li>
                    <li>• Funds are held securely until you approve the completed work</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep(2)}>
              <Icon name="arrow_back" className="mr-2" />
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="hourglass_empty" className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon name="check" className="mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
