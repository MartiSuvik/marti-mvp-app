import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
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

type OnboardingStatus = "loading" | "not_started" | "pending" | "complete" | "error" | "verifying";

export const StripeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agency } = useAuth();
  const { showToast } = useToast();
  
  const [status, setStatus] = useState<OnboardingStatus>("loading");
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationStartTime, setVerificationStartTime] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("EE");

  // Check for return from Stripe
  const returnStatus = searchParams.get("status"); // "success" or "refresh"

  useEffect(() => {
    checkOnboardingStatus();
  }, [agency]);

  useEffect(() => {
    // Handle return from Stripe
    if (returnStatus === "success") {
      verifyStripeAccount();
    } else if (returnStatus === "refresh") {
      showToast("Please complete your Stripe onboarding", "info");
      checkOnboardingStatus();
    }
  }, [returnStatus]);

  // Timeout check for verification
  useEffect(() => {
    if (status === "verifying" && verificationStartTime) {
      const elapsed = Date.now() - verificationStartTime;
      if (elapsed > 5000) {
        // Show manual refresh button after 5 seconds
        setStatus("pending");
      }
    }
  }, [status, verificationStartTime]);

  const verifyStripeAccount = async () => {
    if (!agency?.id) {
      showToast("Agency not found", "error");
      return;
    }

    setStatus("verifying");
    setVerificationStartTime(Date.now());

    try {
      // Call edge function to verify account status from Stripe API
      const { data, error } = await supabase.functions.invoke('verify-stripe-account', {
        body: { agency_id: agency.id }
      });

      if (error) throw error;

      if (data?.onboarding_complete && data?.ready_for_payouts) {
        showToast("Stripe account connected successfully!", "success");
        setStatus("complete");
        setStripeAccountId(data.stripe_account_id);
      } else {
        showToast("Onboarding incomplete. Please finish setup.", "info");
        setStatus("pending");
      }

      // Refresh status from database
      await checkOnboardingStatus();
    } catch (error: any) {
      console.error("Error verifying Stripe account:", error);
      showToast(error.message || "Failed to verify Stripe account", "error");
      setStatus("pending");
      // Still check database in case webhook already updated
      await checkOnboardingStatus();
    } finally {
      setVerificationStartTime(null);
    }
  };

  const checkOnboardingStatus = async () => {
    if (!agency?.id) {
      setStatus("not_started");
      return;
    }

    try {
      // Check the current agency's Stripe status
      const { data: agencyData, error } = await supabase
        .from("agencies")
        .select("id, name, stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled")
        .eq("id", agency.id)
        .single();

      if (error) throw error;

      if (agencyData) {
        setStripeAccountId(agencyData.stripe_account_id);
        
        if (agencyData.stripe_onboarding_complete && agencyData.stripe_payouts_enabled) {
          setStatus("complete");
        } else if (agencyData.stripe_account_id) {
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
    if (!agency?.id) {
      showToast("Agency not found", "error");
      return;
    }

    setLoading(true);
    
    try {
      // Call Supabase Edge Function to create Connect account
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { 
          agency_id: agency.id,
          country: selectedCountry,
          return_url: `${window.location.origin}/agency/payouts?status=success`,
          refresh_url: `${window.location.origin}/agency/payouts?status=refresh`
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
      // Verify account status from Stripe
      await verifyStripeAccount();
    } catch (error: any) {
      console.error("Error refreshing status:", error);
      showToast(error.message || "Failed to refresh status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    if (!agency?.id) {
      showToast("Agency not found", "error");
      return;
    }

    setLoading(true);

    try {
      // Call edge function to create login link
      const { data, error } = await supabase.functions.invoke('create-stripe-login-link', {
        body: { agency_id: agency.id }
      });

      if (error) throw error;

      if (data?.url) {
        // Open the Express dashboard in new tab
        window.open(data.url, "_blank");
      } else {
        showToast("Failed to get dashboard link", "error");
      }
    } catch (error: any) {
      console.error("Error opening Stripe dashboard:", error);
      showToast(error.message || "Failed to open Stripe dashboard", "error");
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

      case "verifying":
        return (
          <div className="text-center py-16">
            <Icon name="verified" className="text-5xl text-primary animate-pulse mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Your Stripe Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please wait while we confirm your account details...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              This usually takes just a few seconds
            </p>
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
              Your Stripe account is set up & ready to receive payments.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="primary" onClick={handleOpenStripeDashboard} disabled={loading}>
                <Icon name="open_in_new" className="mr-2" />
                See Stripe Dashboard
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
              Click below to verify your status or continue setup.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={handleRefreshOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icon name="hourglass_empty" className="mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Icon name="refresh" className="mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
              <Button 
                variant="primary" 
                onClick={handleStartOnboarding}
                disabled={loading}
              >
                <Icon name="launch" className="mr-2" />
                Continue Onboarding
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Just completed onboarding? Click "Refresh Status"
            </p>
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

            {/* Country Selector */}
            <div className="max-w-md mx-auto mb-6">
              <Select
                label="Country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                helperText="Currently only available in Estonia"
                disabled
                options={[
                  { value: "EE", label: "🇪🇪 Estonia" },
                ]}
              />
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
      <Card>
        {renderContent()}
      </Card>
    </div>
  );
};
