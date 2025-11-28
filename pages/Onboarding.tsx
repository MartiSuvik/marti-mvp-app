import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { MatchingEngine } from "../lib/matchingEngine";
import { OnboardingAnswers, Agency } from "../types";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { MultiSelect } from "../components/ui/MultiSelect";
import { Card } from "../components/ui/Card";
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

const PERFORMANCE_CONTEXTS = [
  { value: "stable", label: "Stable" },
  { value: "inconsistent", label: "Inconsistent" },
  { value: "declining", label: "Declining" },
  { value: "scaling well", label: "Scaling well" },
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

const GROWTH_INTENTS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Unsure", label: "Unsure" },
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    platforms: ["FB/IG"], // Default value
    currentManagement: "In-house", // Default value
    spendBracket: "$5–20k", // Default value
    performanceContext: "stable", // Default value
    objectives: ["Improve ROAS"], // Default value
    industry: "E-commerce", // Default value
    growthIntent: "Yes", // Default value
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Use default values if not provided
    const finalAnswers: OnboardingAnswers = {
      platforms:
        answers.platforms && answers.platforms.length > 0
          ? answers.platforms
          : ["FB/IG"],
      currentManagement: answers.currentManagement || "In-house",
      spendBracket: answers.spendBracket || "$5–20k",
      performanceContext: answers.performanceContext || "stable",
      objectives:
        answers.objectives && answers.objectives.length > 0
          ? answers.objectives
          : ["Improve ROAS"],
      industry: answers.industry || "E-commerce",
      growthIntent: answers.growthIntent || "Yes",
    };

    setLoading(true);

    try {
      // Save onboarding answers to profile
      await updateProfile({
        platforms: finalAnswers.platforms,
        currentManagement: finalAnswers.currentManagement,
        spendBracket: finalAnswers.spendBracket,
        performanceContext: finalAnswers.performanceContext,
        objectives: finalAnswers.objectives,
        industry: finalAnswers.industry,
        growthIntent: finalAnswers.growthIntent,
      });

      // Get all agencies
      const { data: agencies, error } = await supabase
        .from("agencies")
        .select("*");

      if (error) {
        console.error("Error fetching agencies:", error);
        // For MVP, use mock agencies if database is empty
        const mockAgencies = generateMockAgencies();
        await createDeals(user.id, finalAnswers, mockAgencies);
      } else if (agencies && agencies.length > 0) {
        await createDeals(user.id, finalAnswers, agencies as Agency[]);
      } else {
        // Use mock agencies if none exist
        const mockAgencies = generateMockAgencies();
        await createDeals(user.id, finalAnswers, mockAgencies);
      }

      showToast(
        "Onboarding completed! Your agency matches are ready.",
        "success"
      );
      setTimeout(() => navigate("/deals"), 500);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const createDeals = async (
    userId: string,
    onboardingAnswers: OnboardingAnswers,
    agencies: Agency[]
  ) => {
    const matches = MatchingEngine.generateMatches(onboardingAnswers, agencies);

    // Create deals for top 3 matches
    const deals = matches.map((match) => ({
      user_id: userId,
      agency_id: match.agency.id,
      match_score: match.matchScore,
      status: "new",
    }));

    const { error } = await supabase.from("deals").insert(deals);

    if (error) {
      console.error("Error creating deals:", error);
    }
  };

  const generateMockAgencies = (): Agency[] => {
    return [
      {
        id: "1",
        name: "Elevate Digital",
        platforms: ["FB/IG", "Google", "TikTok"],
        industries: ["E-commerce", "SaaS"],
        spendBrackets: ["$5–20k", "$20–50k", "$50–150k"],
        objectives: ["Improve ROAS", "Scale spend", "Creative improvement"],
        capabilities: ["Social Media", "Content", "ROAS Optimization"],
        verified: true,
      },
      {
        id: "2",
        name: "Neon Strategies",
        platforms: ["Google", "YouTube", "LinkedIn"],
        industries: ["SaaS", "Finance"],
        spendBrackets: ["$20–50k", "$50–150k", "$150k+"],
        objectives: ["Scale spend", "Expand channels"],
        capabilities: ["Branding", "Design", "B2B Marketing"],
        verified: true,
      },
      {
        id: "3",
        name: "Pixel Perfect",
        platforms: ["FB/IG", "Google", "Programmatic"],
        industries: ["E-commerce", "Healthcare"],
        spendBrackets: ["Under $5k", "$5–20k", "$20–50k"],
        objectives: ["Fix tracking", "Improve ROAS"],
        capabilities: ["UI/UX", "Development", "Analytics"],
        verified: true,
      },
    ];
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              Current Ad Operations
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Let's understand your current setup</p>
            <MultiSelect
              label="Which platforms are you actively running?"
              options={PLATFORMS}
              value={answers.platforms || []}
              onChange={(value) => setAnswers({ ...answers, platforms: value })}
              required
            />
            <Select
              label="Who currently manages ads?"
              options={MANAGEMENT_TYPES}
              value={answers.currentManagement || ""}
              onChange={(e) =>
                setAnswers({ ...answers, currentManagement: e.target.value })
              }
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Monthly Ad Spend
            </h2>
            <Select
              label="What's your monthly ad spend bracket?"
              options={SPEND_BRACKETS}
              value={answers.spendBracket || ""}
              onChange={(e) =>
                setAnswers({ ...answers, spendBracket: e.target.value })
              }
              required
              helperText="We use broad brackets to avoid sensitive metrics"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Performance Context
            </h2>
            <Select
              label="How would you describe results so far?"
              options={PERFORMANCE_CONTEXTS}
              value={answers.performanceContext || ""}
              onChange={(e) =>
                setAnswers({ ...answers, performanceContext: e.target.value })
              }
              required
            />
            <MultiSelect
              label="Main objective right now"
              options={OBJECTIVES}
              value={answers.objectives || []}
              onChange={(value) =>
                setAnswers({ ...answers, objectives: value })
              }
              required
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Industry & Growth
            </h2>
            <Select
              label="Industry"
              options={INDUSTRIES}
              value={answers.industry || ""}
              onChange={(e) =>
                setAnswers({ ...answers, industry: e.target.value })
              }
              required
            />
            <Select
              label="Planning to increase spend in the next 3–6 months?"
              options={GROWTH_INTENTS}
              value={answers.growthIntent || ""}
              onChange={(e) =>
                setAnswers({ ...answers, growthIntent: e.target.value })
              }
              required
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review Your Answers
            </h2>
            <Card>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Platforms:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {answers.platforms && answers.platforms.length > 0
                      ? answers.platforms.join(", ")
                      : "FB/IG (default)"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Management:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {answers.currentManagement || "In-house (default)"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Spend Bracket:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {answers.spendBracket || "$5–20k (default)"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Performance:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {answers.performanceContext || "Stable (default)"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Objectives:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {answers.objectives && answers.objectives.length > 0
                      ? answers.objectives.join(", ")
                      : "Improve ROAS (default)"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Industry:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {answers.industry || "E-commerce (default)"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Growth Intent:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {answers.growthIntent || "Yes (default)"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8 md:py-12 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-blue-500/10 animate-gradient"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-semibold text-primary">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-primary to-pink-600 h-3 rounded-full transition-all duration-500 shadow-lg shadow-primary/30"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          {renderStep()}

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <Icon name="arrow_back" className="mr-2" />
              Back
            </Button>
            {step < totalSteps ? (
              <Button variant="primary" onClick={handleNext}>
                Next
                <Icon name="arrow_forward" className="ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
              >
                Generate Matches
                <Icon name="check" className="ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
