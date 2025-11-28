import React, { useEffect, useState } from "react";
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            My Brand
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your business profile and regenerate matches
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Company Information
              </h2>
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
                  type="url"
                  value={formData.websiteUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                  placeholder="https://yourcompany.com"
                  icon="language"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Marketing Setup
              </h2>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Goals & Context
              </h2>
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

            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="submit" variant="primary" loading={loading}>
                Save Profile
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerateMatches}
                disabled={loading}
              >
                <Icon name="refresh" className="mr-2" />
                Regenerate Matches
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};
