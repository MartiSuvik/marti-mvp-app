import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Icon } from "../components/Icon";

interface LoginProps {
  initialMode?: "login" | "signup";
}

export const Login: React.FC<LoginProps> = ({ initialMode }) => {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Check if coming from onboarding
  const hasOnboardingData = localStorage.getItem("onboardingAnswers") !== null;
  
  useEffect(() => {
    // If coming from onboarding, default to signup mode
    if (hasOnboardingData && !initialMode) {
      setIsSignUp(true);
    }
  }, [hasOnboardingData, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError("Name is required");
          showToast("Name is required", "error");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          setError(error.message);
          showToast(error.message, "error");
        } else {
          // Check if we have onboarding data to process
          if (hasOnboardingData) {
            showToast("Account created! Generating your matches...", "success");
            // The onboarding data will be processed after auth state updates
            // Navigate to a processing page or directly to deals
            setTimeout(() => navigate("/deals"), 500);
          } else {
            showToast("Account created successfully!", "success");
            setTimeout(() => navigate("/onboarding"), 500);
          }
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          showToast(error.message, "error");
        } else {
          showToast("Welcome back!", "success");
          setTimeout(() => navigate("/deals"), 500);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-blue-500/10 animate-gradient"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img 
            src="https://res.cloudinary.com/effichat/image/upload/v1764713504/mywc0fu8gvdtxlwf02dh.svg" 
            alt="ScalingAD" 
            className="h-14 w-auto mx-auto mb-6" 
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {isSignUp
              ? "Sign up to get matched with the perfect agency"
              : "Sign in to your account"}
          </p>
        </div>

        <div className="glass rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-200/50 dark:border-gray-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                icon="person"
              />
            )}

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
              helperText={isSignUp ? "At least 8 characters" : ""}
            />

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 animate-fade-in">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-sm text-primary hover:text-pink-600 dark:hover:text-pink-400 font-medium"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};
