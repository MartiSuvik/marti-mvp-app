import React, { useState, useEffect } from "react";
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
import { Input } from "../components/ui/Input";
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
  const { user, updateProfile, signUp, signIn } = useAuth();
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
  
  // Registration form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  
  // Animation state for step 6
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  
  // Email verification state
  const [verificationChecking, setVerificationChecking] = useState(false);
  
  const analysisSteps = [
    "Analyzing your ad platforms...",
    "Matching budget requirements...",
    "Finding industry specialists...",
    "Calculating compatibility scores...",
    "Finalizing your top matches...",
  ];

  const totalSteps = 7; // Changed to 7 for verification step

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      
      // If moving to step 6 (registration), start the analysis animation
      if (step === 5) {
        startAnalysisAnimation();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Start the fake analysis animation
  const startAnalysisAnimation = () => {
    setAnalysisProgress(0);
    setAnalysisComplete(false);
    setCurrentAnalysisStep(0);
    
    // Save answers to localStorage for after registration
    const finalAnswers: OnboardingAnswers = {
      platforms: answers.platforms && answers.platforms.length > 0 ? answers.platforms : ["FB/IG"],
      currentManagement: answers.currentManagement || "In-house",
      spendBracket: answers.spendBracket || "$5–20k",
      performanceContext: answers.performanceContext || "stable",
      objectives: answers.objectives && answers.objectives.length > 0 ? answers.objectives : ["Improve ROAS"],
      industry: answers.industry || "E-commerce",
      growthIntent: answers.growthIntent || "Yes",
    };
    localStorage.setItem("onboardingAnswers", JSON.stringify(finalAnswers));
    
    // Animate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setAnalysisProgress(progress);
      
      // Update current step text
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
  
  // Handle registration submission
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
        // Save onboarding answers to localStorage for after verification
        const finalAnswers: OnboardingAnswers = {
          platforms: answers.platforms && answers.platforms.length > 0 ? answers.platforms : ["FB/IG"],
          currentManagement: answers.currentManagement || "In-house",
          spendBracket: answers.spendBracket || "$5–20k",
          performanceContext: answers.performanceContext || "stable",
          objectives: answers.objectives && answers.objectives.length > 0 ? answers.objectives : ["Improve ROAS"],
          industry: answers.industry || "E-commerce",
          growthIntent: answers.growthIntent || "Yes",
        };
        localStorage.setItem("onboardingAnswers", JSON.stringify(finalAnswers));
        
        showToast("Account created! Please verify your email.", "success");
        setStep(7); // Go to verification step
      }
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setRegistrationError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle email verification check
  const handleVerificationCheck = async () => {
    setVerificationChecking(true);
    setRegistrationError("");
    
    try {
      // Try to sign in with the credentials
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setRegistrationError("Email not verified yet. Please check your inbox and click the verification link.");
        } else {
          setRegistrationError(error.message);
        }
        showToast("Please verify your email first", "error");
      } else {
        showToast("Email verified! Loading your matches...", "success");
        setTimeout(() => navigate("/deals"), 500);
      }
    } catch (err: any) {
      setRegistrationError(err.message || "An error occurred");
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleSubmit = async () => {
    // Build final answers
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

    // If user is not logged in, go to step 6 (registration with animation)
    if (!user) {
      setStep(6);
      startAnalysisAnimation();
      return;
    }

    // User is logged in - process normally
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
        const mockAgencies = generateMockAgencies();
        await createDeals(user.id, finalAnswers, mockAgencies);
      } else if (agencies && agencies.length > 0) {
        await createDeals(user.id, finalAnswers, agencies as Agency[]);
      } else {
        const mockAgencies = generateMockAgencies();
        await createDeals(user.id, finalAnswers, mockAgencies);
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
        
      case 6:
        return (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left side - Analysis Animation */}
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {analysisComplete ? "Analysis Complete! ✅" : "Generating Your Report..."}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {analysisComplete 
                    ? "We found 3 perfect agency matches for you!" 
                    : "Please wait while we analyze your requirements"}
                </p>
              </div>
              
              {/* Progress Animation */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                {/* Circular Progress */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${analysisProgress * 3.52} 352`}
                        className="transition-all duration-300"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#EF2E6E" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {analysisComplete ? (
                        <Icon name="check_circle" className="text-primary text-5xl" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {analysisProgress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Analysis Steps */}
                <div className="space-y-3">
                  {analysisSteps.map((stepText, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 transition-all duration-300 ${
                        index < currentAnalysisStep
                          ? "text-primary"
                          : index === currentAnalysisStep && !analysisComplete
                          ? "text-gray-900 dark:text-white"
                          : analysisComplete
                          ? "text-primary"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {index < currentAnalysisStep || analysisComplete ? (
                        <Icon name="check_circle" className="text-lg" />
                      ) : index === currentAnalysisStep && !analysisComplete ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon name="radio_button_unchecked" className="text-lg" />
                      )}
                      <span className="text-sm font-medium">{stepText}</span>
                    </div>
                  ))}
                </div>
                
                {/* Match Preview */}
                {analysisComplete && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <Icon name="verified" className="text-primary text-xl" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            3 Agencies Found
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Perfectly matched to your needs
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        We've identified agencies with proven expertise in your industry, 
                        budget range, and growth objectives. Register to see the full analysis.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - Registration Form */}
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Your Account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Register to see your in-depth analysis and connect with agencies
                </p>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  icon="person"
                />
                
                <Input
                  label="Work Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  icon="email"
                />
                
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  icon="lock"
                  helperText="At least 8 characters"
                />
                
                {registrationError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {registrationError}
                    </p>
                  </div>
                )}
                
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={loading}
                  disabled={!analysisComplete}
                >
                  {analysisComplete ? "See My Matches" : "Analyzing..."}
                  {analysisComplete && <Icon name="arrow_forward" className="ml-2" />}
                </Button>
              </form>
              
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary hover:text-pink-600 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        );
        
      case 7:
        return (
          <div className="max-w-md mx-auto text-center space-y-6 py-8">
            {/* Email Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto">
              <Icon name="mark_email_read" className="text-primary text-5xl" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent a verification link to
              </p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">
                {email}
              </p>
            </div>
            
            {/* Steps */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">1</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Open your email inbox (check spam too!)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">2</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Click the verification link in the email
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">3</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Come back here and click the button below
                </p>
              </div>
            </div>
            
            {registrationError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {registrationError}
                </p>
              </div>
            )}
            
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleVerificationCheck}
              loading={verificationChecking}
            >
              <Icon name="check_circle" className="mr-2" />
              I've Verified My Email
            </Button>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the email?{" "}
              <button
                type="button"
                onClick={() => setStep(6)}
                className="text-primary hover:text-pink-600 font-medium"
              >
                Go back and try again
              </button>
            </p>
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

      <div className={`${step >= 6 ? 'max-w-4xl' : 'max-w-2xl'} mx-auto relative z-10`}>
        {/* Progress Bar - hide on step 6 and 7 */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Step {step} of 5
              </span>
              <span className="text-sm font-semibold text-primary">
                {Math.round((step / 5) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-primary to-pink-600 h-3 rounded-full transition-all duration-500 shadow-lg shadow-primary/30"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className={step === 6 ? 'p-8' : ''}>
          {renderStep()}

          {/* Navigation buttons - hide on step 6 */}
          {step < 6 && (
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <Icon name="arrow_back" className="mr-2" />
                Back
              </Button>
              {step < 5 ? (
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
                  <Icon name="auto_awesome" className="ml-2" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
