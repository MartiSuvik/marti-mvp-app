import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { UserProfile } from "../types";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { MultiSelect } from "../components/ui/MultiSelect";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/Icon";

const PLATFORMS = [
  { value: "FB/IG", label: "Facebook/Instagram" },
  { value: "Google", label: "Google Ads" },
  { value: "YouTube", label: "YouTube" },
  { value: "TikTok", label: "TikTok" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Programmatic", label: "Programmatic" },
];

const MANAGEMENT_TYPES = [
  { value: "In-house", label: "In-house" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Agency", label: "Agency" },
  { value: "Mixed", label: "Mixed" },
];

const SPEND_BRACKETS = [
  { value: "Under $5k", label: "Under $5k" },
  { value: "$5–20k", label: "$5–20k" },
  { value: "$20–50k", label: "$20–50k" },
  { value: "$50–150k", label: "$50–150k" },
  { value: "$150k+", label: "$150k+" },
];

const OBJECTIVES = [
  { value: "Improve ROAS", label: "Improve ROAS" },
  { value: "Scale spend", label: "Scale spend" },
  { value: "Fix tracking", label: "Fix tracking" },
  { value: "Expand channels", label: "Expand channels" },
  { value: "Creative improvement", label: "Creative improvement" },
];

const INDUSTRIES = [
  { value: "E-commerce", label: "E-commerce" },
  { value: "SaaS", label: "SaaS" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Finance", label: "Finance" },
  { value: "Education", label: "Education" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Fitness", label: "Fitness" },
  { value: "Other", label: "Other" },
];

export const MyBrand: React.FC = () => {
  const { profile, updateProfile, user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    companyName: "",
    websiteUrl: "",
    industry: "",
    platforms: [],
    spendBracket: "",
    objectives: [],
    currentManagement: "",
    performanceContext: "",
    growthIntent: "",
  });

  // Handle mouse move for glowing effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--x', `${x}%`);
    cardRef.current.style.setProperty('--y', `${y}%`);
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || "",
        websiteUrl: profile.websiteUrl || "",
        industry: profile.industry || "",
        platforms: profile.platforms || [],
        spendBracket: profile.spendBracket || "",
        objectives: profile.objectives || [],
        currentManagement: profile.currentManagement || "",
        performanceContext: profile.performanceContext || "",
        growthIntent: profile.growthIntent || "",
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

    // This would trigger a re-match based on updated profile
    // For MVP, we'll just show a message
    showToast(
      "Match regeneration feature coming soon! Your profile has been saved.",
      "info"
    );
  };

  // Get platform labels
  const getPlatformLabels = () => {
    return (formData.platforms || []).map(p => {
      const found = PLATFORMS.find(plat => plat.value === p);
      return found ? found.label : p;
    });
  };

  // Get objective labels  
  const getObjectiveLabels = () => {
    return (formData.objectives || []).map(o => {
      const found = OBJECTIVES.find(obj => obj.value === o);
      return found ? found.label : o;
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
          {/* Glowing Profile Card */}
          <div className="flex flex-col lg:flex-row gap-8">
            <div 
              ref={cardRef}
              className="profile-card-outer cursor-pointer"
              onMouseMove={handleMouseMove}
            >
              <div className="profile-card-dot"></div>
              <div className="profile-card-inner">
                <div className="profile-card-ray"></div>
                
                {/* Company Logo/Initial */}
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary/30">
                    {formData.companyName ? formData.companyName.charAt(0).toUpperCase() : ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-white truncate">
                      {formData.companyName || 'Set company name'}
                    </h2>
                    {formData.websiteUrl && (
                      <a 
                        href={formData.websiteUrl.startsWith('http') ? formData.websiteUrl : `https://${formData.websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary text-sm flex items-center gap-1 mt-1"
                      >
                        <Icon name="language" className="text-sm" />
                        {formData.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="relative z-10 grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-primary text-lg font-bold">
                      {formData.spendBracket || 'Not set'}
                    </div>
                    <div className="text-gray-400 text-xs">Monthly Spend</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-white text-lg font-bold">
                      {formData.industry || 'Not set'}
                    </div>
                    <div className="text-gray-400 text-xs">Industry</div>
                  </div>
                </div>

                {/* Platforms */}
                <div className="relative z-10 mt-4">
                  <div className="flex flex-wrap gap-2">
                    {getPlatformLabels().slice(0, 3).map((platform, i) => (
                      <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                        {platform}
                      </span>
                    ))}
                    {(formData.platforms?.length || 0) > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded-full">
                        +{(formData.platforms?.length || 0) - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Decorative Lines */}
                <div className="profile-card-line topl"></div>
                <div className="profile-card-line leftl"></div>
                <div className="profile-card-line bottoml"></div>
                <div className="profile-card-line rightl"></div>
              </div>
            </div>

            {/* Additional Info Cards */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Icon name="campaign" className="text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Management</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {formData.currentManagement || 'Not specified'}
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Icon name="trending_up" className="text-green-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Growth Intent</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {formData.growthIntent === 'Yes' ? 'Planning to scale' : 
                   formData.growthIntent === 'No' ? 'Maintaining current' : 
                   formData.growthIntent || 'Not specified'}
                </p>
              </Card>

              <Card className="p-5 sm:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Icon name="flag" className="text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Objectives</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getObjectiveLabels().length > 0 ? getObjectiveLabels().map((obj, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm rounded-full">
                      {obj}
                    </span>
                  )) : (
                    <span className="text-gray-500">No objectives set</span>
                  )}
                </div>
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
            <div className="space-y-6">
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

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    value={formData.companyName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="Your Company"
                    icon="business"
                  />
                  <Input
                    label="Website URL"
                    type="text"
                    value={formData.websiteUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, websiteUrl: e.target.value })
                    }
                    placeholder="yourcompany.com"
                    icon="language"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Marketing Setup
                </h3>
                <div className="space-y-4">
                  <MultiSelect
                    label="Ad Platforms"
                    options={PLATFORMS}
                    value={formData.platforms || []}
                    onChange={(value) =>
                      setFormData({ ...formData, platforms: value })
                    }
                  />
                  <Select
                    label="Current Management"
                    options={MANAGEMENT_TYPES}
                    value={formData.currentManagement || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentManagement: e.target.value,
                      })
                    }
                  />
                  <Select
                    label="Monthly Ad Spend"
                    options={SPEND_BRACKETS}
                    value={formData.spendBracket || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, spendBracket: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Goals & Context
                </h3>
                <div className="space-y-4">
                  <Select
                    label="Industry"
                    options={INDUSTRIES}
                    value={formData.industry || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                  />
                  <MultiSelect
                    label="Main Objectives"
                    options={OBJECTIVES}
                    value={formData.objectives || []}
                    onChange={(value) =>
                      setFormData({ ...formData, objectives: value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};
