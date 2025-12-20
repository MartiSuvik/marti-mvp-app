import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { UserProfile } from "../../types";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { MultiSelect } from "../../components/ui/MultiSelect";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";

// ==============================================
// NEW QUESTIONNAIRE OPTIONS
// ==============================================

// Section A: Business Basics
const MONTHLY_REVENUE_OPTIONS = [
  { value: "$10k–$50k", label: "$10k–$50k" },
  { value: "$50k–$100k", label: "$50k–$100k" },
  { value: "$100k–$500k", label: "$100k–$500k" },
  { value: "Over $500k", label: "Over $500k" },
];

const AOV_OPTIONS = [
  { value: "< $30", label: "< $30" },
  { value: "$30–$70", label: "$30–$70" },
  { value: "$70–$150", label: "$70–$150" },
  { value: "$150+", label: "$150+" },
];

const PROFIT_MARGIN_OPTIONS = [
  { value: "< 40%", label: "< 40%" },
  { value: "40–55%", label: "40–55%" },
  { value: "55–70%", label: "55–70%" },
  { value: "70–85%", label: "70–85%" },
  { value: "85%+", label: "85%+" },
];

const BUSINESS_MODEL_OPTIONS = [
  { value: "One-time purchase", label: "One-time purchase" },
  { value: "Subscription", label: "Subscription" },
  { value: "Hybrid", label: "Hybrid" },
];

// Section B: Ads & Performance
const AD_SPEND_OPTIONS = [
  { value: "$0", label: "$0 (Not running ads yet)" },
  { value: "$1k–$5k", label: "$1k–$5k" },
  { value: "$5k–$20k", label: "$5k–$20k" },
  { value: "$20k+", label: "$20k+" },
];

const AD_PLATFORMS_OPTIONS = [
  { value: "Meta", label: "Meta (Facebook/Instagram)" },
  { value: "Google", label: "Google Ads" },
  { value: "TikTok", label: "TikTok" },
  { value: "None yet", label: "None yet" },
];

const REVENUE_CONSISTENCY_OPTIONS = [
  { value: "Very inconsistent", label: "Very inconsistent" },
  { value: "Somewhat inconsistent", label: "Somewhat inconsistent" },
  { value: "Mostly stable", label: "Mostly stable" },
  { value: "Very stable", label: "Very stable" },
];

const PROFITABLE_ADS_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Not sure", label: "Not sure" },
];

const ADS_EXPERIENCE_OPTIONS = [
  { value: "< 3 months", label: "< 3 months" },
  { value: "3–12 months", label: "3–12 months" },
  { value: "12+ months", label: "12+ months" },
];

// Section C: Creative & Funnel
const MONTHLY_CREATIVES_OPTIONS = [
  { value: "0–3", label: "0–3" },
  { value: "4–10", label: "4–10" },
  { value: "10–30", label: "10–30" },
  { value: "30+", label: "30+" },
];

const TESTIMONIALS_OPTIONS = [
  { value: "< 20", label: "< 20" },
  { value: "20–100", label: "20–100" },
  { value: "100+", label: "100+" },
];

const CREATIVE_CREATOR_OPTIONS = [
  { value: "Founder", label: "Founder" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Agency", label: "Agency" },
  { value: "In-house", label: "In-house team" },
];

// Section D: Operations
const INVENTORY_OPTIONS = [
  { value: "Few items", label: "I only have a few items" },
  { value: "Weekly orders", label: "I order once a week" },
  { value: "Regular stock", label: "I have regular stock" },
];

const FULFILLMENT_TIME_OPTIONS = [
  { value: "1–3 days", label: "1–3 days" },
  { value: "3–7 days", label: "3–7 days" },
  { value: "7–14 days", label: "7–14 days" },
  { value: "14+", label: "14+ days" },
];

const RETURN_ISSUES_OPTIONS = [
  { value: "High", label: "High" },
  { value: "Moderate", label: "Moderate" },
  { value: "Low", label: "Low" },
  { value: "None", label: "None" },
];

export const Profile: React.FC = () => {
  const { profile, updateProfile, user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompanyName, setEditingCompanyName] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState("");
  const companyNameInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    companyName: "",
    websiteUrl: "",
    // Section A
    productDescription: "",
    monthlyRevenue: "",
    aov: "",
    profitMargin: "",
    businessModel: "",
    // Section B
    adSpend: "",
    adPlatforms: [],
    otherPlatforms: "",
    revenueConsistency: "",
    profitableAds: "",
    adsExperience: "",
    // Section C
    monthlyCreatives: "",
    testimonialCount: "",
    creativeCreator: "",
    // Section D
    inventoryStatus: "",
    otherInventory: "",
    fulfillmentTime: "",
    returnIssues: "",
    teamMember: "",
  });

  // Handle inline company name editing
  const startEditingCompanyName = () => {
    setTempCompanyName(formData.companyName || "");
    setEditingCompanyName(true);
    setTimeout(() => companyNameInputRef.current?.focus(), 0);
  };

  const saveCompanyName = async () => {
    if (tempCompanyName.trim() === (formData.companyName || "")) {
      setEditingCompanyName(false);
      return;
    }
    
    try {
      await updateProfile({ companyName: tempCompanyName.trim() });
      setFormData({ ...formData, companyName: tempCompanyName.trim() });
      showToast("Company name updated!", "success");
    } catch (error) {
      console.error("Error updating company name:", error);
      showToast("Error updating company name", "error");
    }
    setEditingCompanyName(false);
  };

  const handleCompanyNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCompanyName();
    } else if (e.key === "Escape") {
      setEditingCompanyName(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || "",
        websiteUrl: profile.websiteUrl || "",
        productDescription: profile.productDescription || "",
        monthlyRevenue: profile.monthlyRevenue || "",
        aov: profile.aov || "",
        profitMargin: profile.profitMargin || "",
        businessModel: profile.businessModel || "",
        adSpend: profile.adSpend || "",
        adPlatforms: profile.adPlatforms || [],
        otherPlatforms: profile.otherPlatforms || "",
        revenueConsistency: profile.revenueConsistency || "",
        profitableAds: profile.profitableAds || "",
        adsExperience: profile.adsExperience || "",
        monthlyCreatives: profile.monthlyCreatives || "",
        testimonialCount: profile.testimonialCount || "",
        creativeCreator: profile.creativeCreator || "",
        inventoryStatus: profile.inventoryStatus || "",
        otherInventory: profile.otherInventory || "",
        fulfillmentTime: profile.fulfillmentTime || "",
        returnIssues: profile.returnIssues || "",
        teamMember: profile.teamMember || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      showToast("Profile updated successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Error updating profile. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateMatches = async () => {
    if (!user) {
      showToast("Please sign in to regenerate matches", "error");
      return;
    }
    showToast(
      "Match regeneration feature coming soon! Your profile has been saved.",
      "info"
    );
  };

  // Get platform labels
  const getPlatformLabels = () => {
    return (formData.adPlatforms || []).map(p => {
      const found = AD_PLATFORMS_OPTIONS.find(plat => plat.value === p);
      return found ? found.label : p;
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            My Brand
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Your business profile and marketing setup
          </p>
        </div>
      </div>

      {!isEditing ? (
        /* Profile Card View */
        <div className="space-y-8">
          {/* Glass Profile Card */}
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="glass rounded-2xl p-6 w-full lg:w-96">
              {/* Company Name - Inline Editable */}
              <div className="mb-6">
                {editingCompanyName ? (
                  <input
                    ref={companyNameInputRef}
                    type="text"
                    value={tempCompanyName}
                    onChange={(e) => setTempCompanyName(e.target.value)}
                    onBlur={saveCompanyName}
                    onKeyDown={handleCompanyNameKeyDown}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none w-full text-gray-900 dark:text-white"
                    placeholder="Enter company name"
                  />
                ) : (
                  <h2 
                    onClick={startEditingCompanyName}
                    className="text-[20px] font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors group flex items-center gap-2"
                  >
                    {formData.companyName || 'Click to set company name'}
                    <Icon name="edit" className="text-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                  </h2>
                )}
                {formData.websiteUrl && (
                  <a 
                    href={formData.websiteUrl.startsWith('http') ? formData.websiteUrl : `https://${formData.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary text-sm flex items-center gap-1 mt-1"
                  >
                    <Icon name="language" className="text-sm" />
                    {formData.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {formData.productDescription && (
                  <p className="text-gray-500 text-sm mt-2">{formData.productDescription}</p>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3">
                  <div className="text-gray-900 dark:text-white text-lg font-bold">
                    {formData.monthlyRevenue || 'Not set'}
                  </div>
                  <div className="text-gray-500 text-xs">Monthly Revenue</div>
                </div>
                <div className="p-3">
                  <div className="text-gray-900 dark:text-white text-lg font-bold">
                    {formData.adSpend || 'Not set'}
                  </div>
                  <div className="text-gray-500 text-xs">Ad Spend</div>
                </div>
              </div>

              {/* Platforms */}
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {getPlatformLabels().slice(0, 3).map((platform, i) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full mb-1">
                      {platform}
                    </span>
                  ))}
                  {(formData.adPlatforms?.length || 0) > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded-full">
                      +{(formData.adPlatforms?.length || 0) - 3} more
                    </span>
                  )}
                </div>
                <div className="text-gray-500 text-xs">Ad Platforms</div>
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Icon name="payments" className="text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Business Model</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {formData.businessModel || 'Not specified'}
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Icon name="trending_up" className="text-green-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AOV</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {formData.aov || 'Not specified'}
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Icon name="percent" className="text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Profit Margin</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {formData.profitMargin || 'Not specified'}
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Icon name="schedule" className="text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Ads Experience</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {formData.adsExperience || 'Not specified'}
                </p>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              <Icon name="edit" className="mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" onClick={handleRegenerateMatches}>
              <Icon name="refresh" className="mr-2" />
              Regenerate Matches
            </Button>
          </div>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Profile
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                >
                  <Icon name="close" className="mr-1" />
                  Cancel
                </Button>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    value={formData.companyName || ""}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Your Company"
                    icon="business"
                  />
                  <Input
                    label="Website URL"
                    type="text"
                    value={formData.websiteUrl || ""}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="yourcompany.com"
                    icon="language"
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="What is your e-commerce selling?"
                      value={formData.productDescription || ""}
                      onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                      placeholder="e.g., Sustainable skincare products"
                    />
                  </div>
                </div>
              </div>

              {/* Section A: Business Basics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Business Basics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Monthly Revenue"
                    options={MONTHLY_REVENUE_OPTIONS}
                    value={formData.monthlyRevenue || ""}
                    onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                  />
                  <Select
                    label="Average Order Value (AOV)"
                    options={AOV_OPTIONS}
                    value={formData.aov || ""}
                    onChange={(e) => setFormData({ ...formData, aov: e.target.value })}
                  />
                  <Select
                    label="Gross Profit Margin"
                    options={PROFIT_MARGIN_OPTIONS}
                    value={formData.profitMargin || ""}
                    onChange={(e) => setFormData({ ...formData, profitMargin: e.target.value })}
                  />
                  <Select
                    label="Business Model"
                    options={BUSINESS_MODEL_OPTIONS}
                    value={formData.businessModel || ""}
                    onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
                  />
                </div>
              </div>

              {/* Section B: Ads & Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ads & Performance
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Monthly Ad Spend"
                      options={AD_SPEND_OPTIONS}
                      value={formData.adSpend || ""}
                      onChange={(e) => setFormData({ ...formData, adSpend: e.target.value })}
                    />
                    <Select
                      label="Revenue Consistency"
                      options={REVENUE_CONSISTENCY_OPTIONS}
                      value={formData.revenueConsistency || ""}
                      onChange={(e) => setFormData({ ...formData, revenueConsistency: e.target.value })}
                    />
                  </div>
                  <MultiSelect
                    label="Ad Platforms"
                    options={AD_PLATFORMS_OPTIONS}
                    value={formData.adPlatforms || []}
                    onChange={(value) => setFormData({ ...formData, adPlatforms: value })}
                  />
                  <Input
                    label="Other Platforms"
                    value={formData.otherPlatforms || ""}
                    onChange={(e) => setFormData({ ...formData, otherPlatforms: e.target.value })}
                    placeholder="Any other platforms you use"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Profitable on Ads?"
                      options={PROFITABLE_ADS_OPTIONS}
                      value={formData.profitableAds || ""}
                      onChange={(e) => setFormData({ ...formData, profitableAds: e.target.value })}
                    />
                    <Select
                      label="Ads Experience"
                      options={ADS_EXPERIENCE_OPTIONS}
                      value={formData.adsExperience || ""}
                      onChange={(e) => setFormData({ ...formData, adsExperience: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section C: Creative & Funnel */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Creative & Funnel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Monthly Creatives"
                    options={MONTHLY_CREATIVES_OPTIONS}
                    value={formData.monthlyCreatives || ""}
                    onChange={(e) => setFormData({ ...formData, monthlyCreatives: e.target.value })}
                  />
                  <Select
                    label="Testimonials/Reviews"
                    options={TESTIMONIALS_OPTIONS}
                    value={formData.testimonialCount || ""}
                    onChange={(e) => setFormData({ ...formData, testimonialCount: e.target.value })}
                  />
                  <Select
                    label="Who Creates Creatives?"
                    options={CREATIVE_CREATOR_OPTIONS}
                    value={formData.creativeCreator || ""}
                    onChange={(e) => setFormData({ ...formData, creativeCreator: e.target.value })}
                  />
                </div>
              </div>

              {/* Section D: Operations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Operations
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Inventory Status"
                      options={INVENTORY_OPTIONS}
                      value={formData.inventoryStatus || ""}
                      onChange={(e) => setFormData({ ...formData, inventoryStatus: e.target.value })}
                    />
                    <Input
                      label="Other Inventory Details"
                      value={formData.otherInventory || ""}
                      onChange={(e) => setFormData({ ...formData, otherInventory: e.target.value })}
                      placeholder="Optional details"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Fulfillment Time"
                      options={FULFILLMENT_TIME_OPTIONS}
                      value={formData.fulfillmentTime || ""}
                      onChange={(e) => setFormData({ ...formData, fulfillmentTime: e.target.value })}
                    />
                    <Select
                      label="Return/Refund Issues"
                      options={RETURN_ISSUES_OPTIONS}
                      value={formData.returnIssues || ""}
                      onChange={(e) => setFormData({ ...formData, returnIssues: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Team Member (Name & Position)"
                    value={formData.teamMember || ""}
                    onChange={(e) => setFormData({ ...formData, teamMember: e.target.value })}
                    placeholder="e.g., John, Marketing Manager"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};
