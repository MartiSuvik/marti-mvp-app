import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { MatchingEngine } from "../../lib/matchingEngine";
import { OnboardingAnswers, Agency } from "../../types";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Icon } from "../../components/Icon";
import { FEATURES, isWhitelistedEmail } from "../../config/features";

// ==============================================
// SECTION A: Business Basics Options
// ==============================================
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

// ==============================================
// SECTION B: Ads & Performance Options
// ==============================================
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
  { value: "Very inconsistent", label: "Very inconsistent (random spikes)" },
  { value: "Somewhat inconsistent", label: "Somewhat inconsistent" },
  { value: "Mostly stable", label: "Mostly stable" },
  { value: "Very stable", label: "Very stable month-to-month" },
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

// ==============================================
// SECTION C: Creative & Funnel Options
// ==============================================
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

// ==============================================
// SECTION D: Operations Options
// ==============================================
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

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, signUp, signIn } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState<"business" | "agency" | null>(null);
  const [loading, setLoading] = useState(false);
  
  // New questionnaire answers
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({
    // Section A: Business Basics
    productDescription: "",
    monthlyRevenue: "$50k–$100k",
    aov: "$30–$70",
    profitMargin: "40–55%",
    businessModel: "One-time purchase",
    // Section B: Ads & Performance
    adSpend: "$1k–$5k",
    adPlatforms: ["Meta"],
    otherPlatforms: "",
    revenueConsistency: "Mostly stable",
    profitableAds: "Not sure",
    adsExperience: "< 3 months",
    // Section C: Creative & Funnel
    monthlyCreatives: "0–3",
    testimonialCount: "< 20",
    creativeCreator: "Founder",
    // Section D: Operations
    inventoryStatus: "Regular stock",
    otherInventory: "",
    fulfillmentTime: "3–7 days",
    returnIssues: "Low",
    teamMember: "",
  });
  
  // Registration form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  
  // Agency application form state
  const [agencyName, setAgencyName] = useState("");
  const [agencyMessage, setAgencyMessage] = useState("");
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  
  // Animation state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const [verificationChecking, setVerificationChecking] = useState(false);
  
  const analysisSteps = [
    "Analyzing your business profile...",
    "Evaluating ad performance...",
    "Matching creative requirements...",
    "Calculating compatibility scores...",
    "Finalizing your top matches...",
  ];

  const totalQuestions = 17;

  const handleNext = () => {
    setStep(step + 1);
    if (step === totalQuestions) {
      startAnalysisAnimation();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  const startAnalysisAnimation = () => {
    setAnalysisProgress(0);
    setAnalysisComplete(false);
    setCurrentAnalysisStep(0);
    
    localStorage.setItem("onboardingAnswers", JSON.stringify(answers));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setAnalysisProgress(progress);
      
      if (progress < 20) setCurrentAnalysisStep(0);
      else if (progress < 40) setCurrentAnalysisStep(1);
      else if (progress < 60) setCurrentAnalysisStep(2);
      else if (progress < 80) setCurrentAnalysisStep(3);
      else setCurrentAnalysisStep(4);
      
      if (progress >= 100) {
        clearInterval(interval);
        setAnalysisComplete(true);
      }
    }, 60);
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError("");
    setLoading(true);

    try {
      if (!name.trim()) {
        setRegistrationError("Name is required");
        setLoading(false);
        return;
      }
      
      const { error } = await signUp(email, password, name);
      if (error) {
        setRegistrationError(error.message);
        showToast(error.message, "error");
      } else {
        localStorage.setItem("onboardingAnswers", JSON.stringify(answers));
        showToast("Account created! Please verify your email.", "success");
        setStep(19); // Go to verification step
      }
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setRegistrationError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerificationCheck = async () => {
    setVerificationChecking(true);
    setRegistrationError("");
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setRegistrationError("Email not verified yet. Please check your inbox and click the verification link.");
        } else {
          setRegistrationError(error.message);
        }
        showToast("Please verify your email first", "error");
      } else {
        if (FEATURES.WAITLIST_MODE && !isWhitelistedEmail(email)) {
          showToast("You're on the waitlist!", "success");
          setTimeout(() => navigate("/waitlist"), 500);
        } else {
          showToast("Email verified! Loading your matches...", "success");
          setTimeout(() => navigate("/deals"), 500);
        }
      }
    } catch (err: any) {
      setRegistrationError(err.message || "An error occurred");
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setStep(18); // Go to registration step
      startAnalysisAnimation();
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        productDescription: answers.productDescription,
        monthlyRevenue: answers.monthlyRevenue,
        aov: answers.aov,
        profitMargin: answers.profitMargin,
        businessModel: answers.businessModel,
        adSpend: answers.adSpend,
        adPlatforms: answers.adPlatforms,
        otherPlatforms: answers.otherPlatforms,
        revenueConsistency: answers.revenueConsistency,
        profitableAds: answers.profitableAds,
        adsExperience: answers.adsExperience,
        monthlyCreatives: answers.monthlyCreatives,
        testimonialCount: answers.testimonialCount,
        creativeCreator: answers.creativeCreator,
        inventoryStatus: answers.inventoryStatus,
        otherInventory: answers.otherInventory,
        fulfillmentTime: answers.fulfillmentTime,
        returnIssues: answers.returnIssues,
        teamMember: answers.teamMember,
      });

      const { data: agencies, error } = await supabase
        .from("agencies")
        .select("*");

      if (error) {
        console.error("Error fetching agencies:", error);
        const mockAgencies = generateMockAgencies();
        await createDeals(user.id, answers as OnboardingAnswers, mockAgencies);
      } else if (agencies && agencies.length > 0) {
        await createDeals(user.id, answers as OnboardingAnswers, agencies as Agency[]);
      } else {
        const mockAgencies = generateMockAgencies();
        await createDeals(user.id, answers as OnboardingAnswers, mockAgencies);
      }

      showToast("Your agency matches are ready!", "success");
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
        platforms: ["Meta", "Google", "TikTok"],
        industries: ["E-commerce"],
        spendBrackets: ["$5k–$20k", "$20k+"],
        objectives: ["Scale spend", "Creative improvement"],
        verified: true,
      },
      {
        id: "2",
        name: "Growth Partners",
        platforms: ["Meta", "Google"],
        industries: ["E-commerce", "DTC"],
        spendBrackets: ["$1k–$5k", "$5k–$20k"],
        objectives: ["Improve ROAS", "Scale spend"],
        verified: true,
      },
      {
        id: "3",
        name: "Scale Studio",
        platforms: ["Meta", "TikTok"],
        industries: ["E-commerce"],
        spendBrackets: ["$5k–$20k", "$20k+"],
        objectives: ["Creative improvement", "Scale spend"],
        verified: true,
      },
    ];
  };

  const handleAgencyApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRegistrationError("");

    try {
      if (!name.trim() || !email.trim() || !agencyName.trim()) {
        setRegistrationError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("agency_applications")
        .insert({
          contact_name: name,
          contact_email: email,
          agency_name: agencyName,
          message: agencyMessage || null,
          status: "pending",
        });

      if (error) {
        console.error("Error submitting application:", error);
        setRegistrationError("Failed to submit application. Please try again.");
        showToast("Failed to submit application", "error");
      } else {
        setApplicationSubmitted(true);
        showToast("Application submitted successfully!", "success");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setRegistrationError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Option button component for single select
  const OptionButton: React.FC<{
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ selected, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
        selected
          ? "border-primary bg-primary/10 text-gray-900 dark:text-white"
          : "border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-300"
      }`}
    >
      {children}
    </button>
  );

  // Multi-select option button
  const MultiOptionButton: React.FC<{
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ selected, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl text-left transition-all border-2 flex items-center gap-3 ${
        selected
          ? "border-primary bg-primary/10 text-gray-900 dark:text-white"
          : "border-gray-200 dark:border-gray-700 hover:border-primary/50 text-gray-700 dark:text-gray-300"
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
        selected ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
      }`}>
        {selected && <Icon name="check" className="text-white text-sm" />}
      </div>
      {children}
    </button>
  );

  const togglePlatform = (platform: string) => {
    const current = answers.adPlatforms || [];
    if (current.includes(platform)) {
      setAnswers({ ...answers, adPlatforms: current.filter(p => p !== platform) });
    } else {
      setAnswers({ ...answers, adPlatforms: [...current, platform] });
    }
  };

  const renderStep = () => {
    // Step 0: User type selection
    if (step === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to ScalingAD
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Are you a brand looking for an agency, or an agency looking for clients?
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { setUserType("business"); handleNext(); }}
              className="p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon name="store" className="text-3xl text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                I'm a Brand
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Find the perfect agency to scale your ads
              </p>
            </button>
            
            <button
              onClick={() => { setUserType("agency"); setStep(99); }}
              className="p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-all text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Icon name="business" className="text-3xl text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                I'm an Agency
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Connect with brands looking for your services
              </p>
            </button>
          </div>
        </div>
      );
    }

    // Agency application step
    if (step === 99) {
      if (applicationSubmitted) {
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <Icon name="check_circle" className="text-5xl text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Application Submitted!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Thank you for your interest! We'll review your application and get back to you within 48 hours.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        );
      }
      
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Agency Application
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us about your agency
            </p>
          </div>
          
          <form onSubmit={handleAgencyApplication} className="space-y-4">
            <Input
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@agency.com"
              required
            />
            <Input
              label="Agency Name"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Your Agency"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tell us about your agency
              </label>
              <textarea
                value={agencyMessage}
                onChange={(e) => setAgencyMessage(e.target.value)}
                placeholder="What platforms do you specialize in? What's your typical client profile?"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={4}
              />
            </div>
            
            {registrationError && (
              <p className="text-red-500 text-sm">{registrationError}</p>
            )}
            
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </div>
      );
    }

    // ==============================================
    // SECTION A: Business Basics (Steps 1-5)
    // ==============================================
    
    // Q1: What is your e-commerce selling?
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section A: Business Basics</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              What is your e-commerce selling?
            </h2>
          </div>
          <Input
            value={answers.productDescription || ""}
            onChange={(e) => setAnswers({ ...answers, productDescription: e.target.value })}
            placeholder="e.g., Sustainable skincare products, Premium fitness equipment..."
          />
        </div>
      );
    }

    // Q2: Monthly revenue
    if (step === 2) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section A: Business Basics</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              What is your average monthly revenue?
            </h2>
          </div>
          <div className="space-y-3">
            {MONTHLY_REVENUE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.monthlyRevenue === option.value}
                onClick={() => setAnswers({ ...answers, monthlyRevenue: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q3: AOV
    if (step === 3) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section A: Business Basics</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              What is your average order value (AOV)?
            </h2>
          </div>
          <div className="space-y-3">
            {AOV_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.aov === option.value}
                onClick={() => setAnswers({ ...answers, aov: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q4: Profit margin
    if (step === 4) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section A: Business Basics</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              What is your gross profit margin?
            </h2>
          </div>
          <div className="space-y-3">
            {PROFIT_MARGIN_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.profitMargin === option.value}
                onClick={() => setAnswers({ ...answers, profitMargin: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q5: Business model
    if (step === 5) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section A: Business Basics</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              What is your business model?
            </h2>
          </div>
          <div className="space-y-3">
            {BUSINESS_MODEL_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.businessModel === option.value}
                onClick={() => setAnswers({ ...answers, businessModel: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // ==============================================
    // SECTION B: Ads & Performance (Steps 6-10)
    // ==============================================

    // Q6: Ad spend
    if (step === 6) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section B: Ads & Performance</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              How much do you currently spend on ads per month?
            </h2>
          </div>
          <div className="space-y-3">
            {AD_SPEND_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.adSpend === option.value}
                onClick={() => setAnswers({ ...answers, adSpend: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q7: Ad platforms (multi-select)
    if (step === 7) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section B: Ads & Performance</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Which platforms are you advertising on?
            </h2>
            <p className="text-gray-500 text-sm mt-1">Select all that apply</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {AD_PLATFORMS_OPTIONS.map((option) => (
              <MultiOptionButton
                key={option.value}
                selected={(answers.adPlatforms || []).includes(option.value)}
                onClick={() => togglePlatform(option.value)}
              >
                {option.label}
              </MultiOptionButton>
            ))}
          </div>
          <Input
            value={answers.otherPlatforms || ""}
            onChange={(e) => setAnswers({ ...answers, otherPlatforms: e.target.value })}
            placeholder="Other platforms (optional)"
          />
        </div>
      );
    }

    // Q8: Revenue consistency
    if (step === 8) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section B: Ads & Performance</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              How consistent is your revenue?
            </h2>
          </div>
          <div className="space-y-3">
            {REVENUE_CONSISTENCY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.revenueConsistency === option.value}
                onClick={() => setAnswers({ ...answers, revenueConsistency: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q9: Profitable ads
    if (step === 9) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section B: Ads & Performance</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Have you ever been profitable on ads?
            </h2>
          </div>
          <div className="space-y-3">
            {PROFITABLE_ADS_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.profitableAds === option.value}
                onClick={() => setAnswers({ ...answers, profitableAds: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q10: Ads experience
    if (step === 10) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section B: Ads & Performance</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              How long have you been running paid ads?
            </h2>
          </div>
          <div className="space-y-3">
            {ADS_EXPERIENCE_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.adsExperience === option.value}
                onClick={() => setAnswers({ ...answers, adsExperience: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // ==============================================
    // SECTION C: Creative & Funnel (Steps 11-13)
    // ==============================================

    // Q11: Monthly creatives
    if (step === 11) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section C: Creative & Funnel</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              How many new creatives do you produce monthly?
            </h2>
          </div>
          <div className="space-y-3">
            {MONTHLY_CREATIVES_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.monthlyCreatives === option.value}
                onClick={() => setAnswers({ ...answers, monthlyCreatives: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q12: Testimonials
    if (step === 12) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section C: Creative & Funnel</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Do you have testimonials / reviews?
            </h2>
          </div>
          <div className="space-y-3">
            {TESTIMONIALS_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.testimonialCount === option.value}
                onClick={() => setAnswers({ ...answers, testimonialCount: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q13: Creative creator
    if (step === 13) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section C: Creative & Funnel</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Who creates your ad creatives?
            </h2>
          </div>
          <div className="space-y-3">
            {CREATIVE_CREATOR_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.creativeCreator === option.value}
                onClick={() => setAnswers({ ...answers, creativeCreator: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // ==============================================
    // SECTION D: Operations (Steps 14-17)
    // ==============================================

    // Q14: Inventory
    if (step === 14) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section D: Operations</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Do you have consistent inventory?
            </h2>
          </div>
          <div className="space-y-3">
            {INVENTORY_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.inventoryStatus === option.value}
                onClick={() => setAnswers({ ...answers, inventoryStatus: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
          <Input
            value={answers.otherInventory || ""}
            onChange={(e) => setAnswers({ ...answers, otherInventory: e.target.value })}
            placeholder="Other (please specify)"
          />
        </div>
      );
    }

    // Q15: Fulfillment time
    if (step === 15) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section D: Operations</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              What's your fulfillment time?
            </h2>
          </div>
          <div className="space-y-3">
            {FULFILLMENT_TIME_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.fulfillmentTime === option.value}
                onClick={() => setAnswers({ ...answers, fulfillmentTime: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q16: Return issues
    if (step === 16) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section D: Operations</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Return/refund issues?
            </h2>
          </div>
          <div className="space-y-3">
            {RETURN_ISSUES_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                selected={answers.returnIssues === option.value}
                onClick={() => setAnswers({ ...answers, returnIssues: option.value })}
              >
                {option.label}
              </OptionButton>
            ))}
          </div>
        </div>
      );
    }

    // Q17: Team member
    if (step === 17) {
      return (
        <div className="space-y-6">
          <div className="mb-6">
            <span className="text-sm text-primary font-medium">Section D: Operations</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Who executes on your side?
            </h2>
            <p className="text-gray-500 text-sm mt-1">First name and position</p>
          </div>
          <Input
            value={answers.teamMember || ""}
            onChange={(e) => setAnswers({ ...answers, teamMember: e.target.value })}
            placeholder="e.g., John, Marketing Manager"
          />
        </div>
      );
    }

    // Step 18: Registration with analysis animation
    if (step === 18) {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {analysisComplete ? "Analysis Complete!" : "Analyzing Your Profile..."}
            </h2>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-pink-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400">
              {analysisSteps[currentAnalysisStep]}
            </p>
          </div>
          
          {analysisComplete && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center p-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Icon name="check_circle" className="text-5xl text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  3 Perfect Matches Found!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create an account to see your agency recommendations
                </p>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                
                {registrationError && (
                  <p className="text-red-500 text-sm">{registrationError}</p>
                )}
                
                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                  {loading ? "Creating Account..." : "Create Account & See Matches"}
                </Button>
                
                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <a href="/login" className="text-primary hover:underline">
                    Sign in
                  </a>
                </p>
              </form>
            </div>
          )}
        </div>
      );
    }

    // Step 19: Email verification
    if (step === 19) {
      return (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="mail" className="text-4xl text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Check Your Email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We've sent a verification link to <strong>{email}</strong>. 
            Click the link to verify your account.
          </p>
          
          {registrationError && (
            <p className="text-red-500 text-sm">{registrationError}</p>
          )}
          
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={handleVerificationCheck}
              disabled={verificationChecking}
              className="w-full"
            >
              {verificationChecking ? "Checking..." : "I've Verified My Email"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStep(18)}
              className="w-full"
            >
              Use a Different Email
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Calculate progress
  const progressPercent = step > 0 && step <= totalQuestions 
    ? Math.round((step / totalQuestions) * 100) 
    : step === 0 ? 0 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar - show for steps 1-17 */}
        {step >= 1 && step <= totalQuestions && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Question {step} of {totalQuestions}</span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        <Card className="p-8">
          {renderStep()}
          
          {/* Navigation buttons - show for steps 1-17 */}
          {step >= 1 && step <= totalQuestions && (
            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={handleBack}>
                <Icon name="arrow_back" className="mr-2" />
                Back
              </Button>
              
              {step === totalQuestions ? (
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Processing..." : "Find My Matches"}
                  <Icon name="arrow_forward" className="ml-2" />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext}>
                  Continue
                  <Icon name="arrow_forward" className="ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
