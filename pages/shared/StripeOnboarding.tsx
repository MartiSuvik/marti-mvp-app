import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/Icon";

/**
 * StripeOnboarding Page
 * 
 * This page handles the Stripe Connect onboarding flow for agencies.
 * Flow:
 * 1. Agency clicks "Connect Stripe" 
 * 2. We create a Stripe Connect account via Edge Function
 * 3. Redirect agency to Stripe-hosted onboarding
 * 4. Stripe redirects back here with success/failure
 * 5. We update the agency's stripe_onboarding_complete status
 * 
 * Note: The actual Stripe API calls happen in Supabase Edge Functions
 * for security (secret keys never exposed to frontend).
 */

type OnboardingStatus = "loading" | "not_started" | "pending" | "complete" | "error";

export const StripeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [status, setStatus] = useState<OnboardingStatus>("loading");
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for return from Stripe
  const returnStatus = searchParams.get("status"); // "success" or "refresh"

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  useEffect(() => {
    // Handle return from Stripe
    if (returnStatus === "success") {
      showToast("Stripe account connected successfully!", "success");
      checkOnboardingStatus();
    } else if (returnStatus === "refresh") {
      showToast("Please complete your Stripe onboarding", "info");
      checkOnboardingStatus();
    }
  }, [returnStatus]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setStatus("not_started");
      return;
    }

    try {
      // For now, we'll check if the user has an agency profile
      // In a real implementation, this would check the agency's Stripe status
      // This is a placeholder - you'd need to link users to agencies first
      
      // Simulating: Check if we have any agency with Stripe connected
      const { data: agencies, error } = await supabase
        .from("agencies")
        .select("id, name, stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled")
        .not("stripe_account_id", "is", null)
        .limit(1);

      if (error) throw error;

      if (agencies && agencies.length > 0) {
        const agency = agencies[0];
        setStripeAccountId(agency.stripe_account_id);
        
        if (agency.stripe_onboarding_complete && agency.stripe_payouts_enabled) {
          setStatus("complete");
        } else if (agency.stripe_account_id) {
          setStatus("pending");
        } else {
          setStatus("not_started");
        }
      } else {
        setStatus("not_started");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setStatus("error");
    }
  };

  const handleStartOnboarding = async () => {
    setLoading(true);
    
    try {
      // Call Supabase Edge Function to create Connect account
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { 
          agency_id: stripeAccountId ? undefined : "YOUR_AGENCY_ID", // TODO: Get actual agency ID
          return_url: `${window.location.origin}/stripe-onboarding?status=success`,
          refresh_url: `${window.location.origin}/stripe-onboarding?status=refresh`
        }
      });
      
      if (error) throw error;
      
      if (data?.onboarding_url) {
        // Redirect to Stripe-hosted onboarding
        window.location.href = data.onboarding_url;
      } else {
        showToast("Failed to get onboarding URL", "error");
      }
      
    } catch (error: any) {
      console.error("Error starting onboarding:", error);
      showToast(error.message || "Failed to start Stripe onboarding", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshOnboarding = async () => {
    setLoading(true);
    
    try {
      // In production, this would call Edge Function to get a new Account Link
      showToast("Stripe Connect integration requires Edge Functions setup", "info");
    } catch (error: any) {
      console.error("Error refreshing onboarding:", error);
      showToast(error.message || "Failed to refresh onboarding link", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center py-16">
            <Icon name="hourglass_empty" className="text-5xl text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Checking onboarding status...</p>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <Icon name="check_circle" className="text-5xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Stripe Connected!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Your Stripe account is fully set up and ready to receive payments.
            </p>
            {stripeAccountId && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Account ID: {stripeAccountId.slice(0, 12)}...
              </p>
            )}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate("/agencies")}>
                Back to Dashboard
              </Button>
              <Button variant="primary" onClick={() => window.open("https://dashboard.stripe.com", "_blank")}>
                <Icon name="open_in_new" className="mr-2" />
                Stripe Dashboard
              </Button>
            </div>
          </div>
        );

      case "pending":
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
              <Icon name="pending" className="text-5xl text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Onboarding Incomplete
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Your Stripe account was created but onboarding isn't complete. 
              Please finish setting up your account to receive payments.
            </p>
            <Button 
              variant="primary" 
              onClick={handleRefreshOnboarding}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon name="hourglass_empty" className="mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Icon name="refresh" className="mr-2" />
                  Continue Onboarding
                </>
              )}
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <Icon name="error" className="text-5xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              We couldn't check your onboarding status. Please try again.
            </p>
            <Button variant="primary" onClick={checkOnboardingStatus}>
              <Icon name="refresh" className="mr-2" />
              Try Again
            </Button>
          </div>
        );

      case "not_started":
      default:
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full mb-6">
              <Icon name="account_balance" className="text-5xl text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connect Your Stripe Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              To receive payments from clients on ScalingAD, you need to connect a Stripe account. 
              This only takes a few minutes.
            </p>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto text-left">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <Icon name="security" className="text-primary text-2xl mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Secure Payments</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bank-level security for all transactions
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <Icon name="speed" className="text-primary text-2xl mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Fast Payouts</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get paid within 2 business days
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <Icon name="visibility" className="text-primary text-2xl mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Full Transparency</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Track all payments in real-time
                </p>
              </div>
            </div>

            <Button 
              variant="primary" 
              size="lg"
              onClick={handleStartOnboarding}
              disabled={loading}
              className="px-8"
            >
              {loading ? (
                <>
                  <Icon name="hourglass_empty" className="mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Icon name="link" className="mr-2" />
                  Connect with Stripe
                </>
              )}
            </Button>

            <p className="text-xs text-gray-400 mt-4">
              You'll be redirected to Stripe to complete verification
            </p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Icon name="arrow_back" className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Stripe Connect
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up payments to receive funds from clients
          </p>
        </div>
      </div>

      <Card>
        {renderContent()}
      </Card>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex gap-4">
          <Icon name="info" className="text-blue-500 text-2xl flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              How payments work on ScalingAD
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Clients fund jobs upfront, and funds are held securely by the platform</li>
              <li>• When you complete work and the client approves, funds are released to you</li>
              <li>• ScalingAD takes a 10% platform fee on each transaction</li>
              <li>• You'll receive payouts directly to your connected bank account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
