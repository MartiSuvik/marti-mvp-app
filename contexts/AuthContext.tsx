import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { UserProfile, OnboardingAnswers, Agency } from "../types";
import { MatchingEngine } from "../lib/matchingEngine";

// Auth state machine states
type AuthState = 
  | "initializing"      // Checking session on mount
  | "unauthenticated"   // No user logged in
  | "loading_profile"   // User exists, loading profile
  | "authenticated";    // User + profile loaded

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  agency: Agency | null;
  loading: boolean;        // True during initializing or loading_profile
  isAgencyUser: boolean;
  authState: AuthState;    // Expose state for debugging
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state
  const [authState, setAuthState] = useState<AuthState>("initializing");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);

  // Refs to prevent race conditions
  const currentUserIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const initCompleteRef = useRef(false);

  // Derived state
  const loading = authState === "initializing" || authState === "loading_profile";
  const isAgencyUser = profile?.userType === "agency";

  // ============================================
  // Profile Loading
  // ============================================

  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Error loading profile:", error);
        return null;
      }

      if (!data) {
        console.log("[Auth] No profile found for user");
        return null;
      }

      // Map snake_case to camelCase
      const mappedProfile: UserProfile = {
        id: data.id,
        userId: data.user_id,
        companyName: data.company_name,
        websiteUrl: data.website_url,
        // New onboarding fields
        productDescription: data.product_description,
        monthlyRevenue: data.monthly_revenue,
        aov: data.aov,
        profitMargin: data.profit_margin,
        businessModel: data.business_model,
        adSpend: data.ad_spend,
        adPlatforms: data.ad_platforms,
        otherPlatforms: data.other_platforms,
        revenueConsistency: data.revenue_consistency,
        profitableAds: data.profitable_ads,
        adsExperience: data.ads_experience,
        monthlyCreatives: data.monthly_creatives,
        testimonialCount: data.testimonial_count,
        creativeCreator: data.creative_creator,
        inventoryStatus: data.inventory_status,
        otherInventory: data.other_inventory,
        fulfillmentTime: data.fulfillment_time,
        returnIssues: data.return_issues,
        teamMember: data.team_member,
        userType: data.user_type || "business",
        agencyId: data.agency_id,
      };

      console.log("[Auth] Profile loaded, userType:", mappedProfile.userType);
      return mappedProfile;
    } catch (error) {
      console.error("[Auth] Exception loading profile:", error);
      return null;
    }
  }, []);

  const loadAgency = useCallback(async (agencyId: string): Promise<Agency | null> => {
    try {
      const { data, error } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", agencyId)
        .single();

      if (error || !data) {
        console.error("[Auth] Error loading agency:", error);
        return null;
      }

      const mappedAgency: Agency = {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url,
        description: data.description,
        platforms: data.platforms || [],
        industries: data.industries || [],
        spendBrackets: data.spend_brackets || [],
        objectives: data.objectives || [],
        capabilities: data.capabilities || [],
        verified: data.verified || false,
        ownerId: data.owner_id,
        contactEmail: data.contact_email,
      };

      console.log("[Auth] Agency loaded:", mappedAgency.name);
      return mappedAgency;
    } catch (error) {
      console.error("[Auth] Exception loading agency:", error);
      return null;
    }
  }, []);

  // ============================================
  // Profile Creation (for new users)
  // ============================================

  const createProfileIfNeeded = useCallback(async (userId: string): Promise<void> => {
    try {
      // Check if profile exists
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) return;

      // Get onboarding data from localStorage
      let onboardingData: OnboardingAnswers | null = null;
      try {
        const stored = localStorage.getItem("onboardingAnswers");
        if (stored) onboardingData = JSON.parse(stored);
      } catch (e) {
        console.error("[Auth] Error parsing onboarding data:", e);
      }

      // Create profile
      const profileData: Record<string, any> = {
        user_id: userId,
        user_type: "business", // New users are always businesses
      };

      if (onboardingData) {
        profileData.product_description = onboardingData.productDescription;
        profileData.monthly_revenue = onboardingData.monthlyRevenue;
        profileData.aov = onboardingData.aov;
        profileData.profit_margin = onboardingData.profitMargin;
        profileData.business_model = onboardingData.businessModel;
        profileData.ad_spend = onboardingData.adSpend;
        profileData.ad_platforms = onboardingData.adPlatforms;
        profileData.other_platforms = onboardingData.otherPlatforms;
        profileData.revenue_consistency = onboardingData.revenueConsistency;
        profileData.profitable_ads = onboardingData.profitableAds;
        profileData.ads_experience = onboardingData.adsExperience;
        profileData.monthly_creatives = onboardingData.monthlyCreatives;
        profileData.testimonial_count = onboardingData.testimonialCount;
        profileData.creative_creator = onboardingData.creativeCreator;
        profileData.inventory_status = onboardingData.inventoryStatus;
        profileData.other_inventory = onboardingData.otherInventory;
        profileData.fulfillment_time = onboardingData.fulfillmentTime;
        profileData.return_issues = onboardingData.returnIssues;
        profileData.team_member = onboardingData.teamMember;
      }

      const { error } = await supabase.from("user_profiles").insert(profileData);
      
      if (error) {
        console.error("[Auth] Error creating profile:", error);
        return;
      }

      console.log("[Auth] Profile created");

      // Process matches in background
      if (onboardingData) {
        processOnboardingMatches(userId, onboardingData)
          .then(() => localStorage.removeItem("onboardingAnswers"))
          .catch(console.error);
      }
    } catch (error) {
      console.error("[Auth] createProfileIfNeeded error:", error);
    }
  }, []);

  const processOnboardingMatches = async (userId: string, answers: OnboardingAnswers) => {
    try {
      const { data: agencies } = await supabase.from("agencies").select("*");
      
      const agenciesToUse = agencies?.length ? agencies : getMockAgencies();
      const matches = MatchingEngine.generateMatches(answers, agenciesToUse);

      const deals = matches.map((match) => ({
        user_id: userId,
        agency_id: match.agency.id,
        match_score: match.matchScore,
        status: "new",
      }));

      await supabase.from("deals").insert(deals);
    } catch (error) {
      console.error("[Auth] Error processing matches:", error);
    }
  };

  // Main function to handle user state changes
  const handleUserChange = useCallback(async (newUser: User | null, newSession: Session | null) => {
    if (!isMountedRef.current) return;

    // Same user, no change needed
    if (newUser?.id === currentUserIdRef.current) {
      console.log("[Auth] Same user, skipping reload");
      return;
    }

    currentUserIdRef.current = newUser?.id || null;
    setUser(newUser);
    setSession(newSession);

    if (!newUser) {
      // User logged out
      console.log("[Auth] User logged out");
      setProfile(null);
      setAgency(null);
      setAuthState("unauthenticated");
      return;
    }

    // User logged in, load profile
    console.log("[Auth] User changed, loading profile for:", newUser.id);
    setAuthState("loading_profile");

    const loadedProfile = await loadProfile(newUser.id);

    if (!isMountedRef.current) return;

    if (loadedProfile) {
      setProfile(loadedProfile);

      // If agency user, load agency data
      if (loadedProfile.userType === "agency" && loadedProfile.agencyId) {
        const loadedAgency = await loadAgency(loadedProfile.agencyId);
        if (isMountedRef.current) {
          setAgency(loadedAgency);
        }
      } else {
        setAgency(null);
      }

      setAuthState("authenticated");
    } else {
      // No profile - might be a new user, try to create one
      console.log("[Auth] No profile, attempting to create...");
      await createProfileIfNeeded(newUser.id);
      
      // Try loading again
      const retryProfile = await loadProfile(newUser.id);
      if (isMountedRef.current) {
        setProfile(retryProfile);
        setAuthState(retryProfile ? "authenticated" : "unauthenticated");
      }
    }
  }, [loadProfile, loadAgency, createProfileIfNeeded]);

  // ============================================
  // Initialization
  // ============================================

  useEffect(() => {
    isMountedRef.current = true;

    const initialize = async () => {
      try {
        console.log("[Auth] Initializing...");
        
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMountedRef.current) return;

        await handleUserChange(currentSession?.user || null, currentSession);
        initCompleteRef.current = true;
      } catch (error) {
        console.error("[Auth] Initialization error:", error);
        if (isMountedRef.current) {
          setAuthState("unauthenticated");
        }
      }
    };

    initialize();

    // Listen for auth changes AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("[Auth] Auth event:", event);
      
      // Skip if not initialized yet (we handle initial session above)
      if (!initCompleteRef.current) {
        console.log("[Auth] Skipping event, not initialized yet");
        return;
      }

      // Skip token refresh events - user hasn't changed
      if (event === "TOKEN_REFRESHED") {
        console.log("[Auth] Token refreshed, skipping profile reload");
        return;
      }

      // Handle sign out
      if (event === "SIGNED_OUT") {
        currentUserIdRef.current = null;
        setUser(null);
        setSession(null);
        setProfile(null);
        setAgency(null);
        setAuthState("unauthenticated");
        return;
      }

      // Handle sign in
      if (event === "SIGNED_IN" && newSession?.user) {
        await handleUserChange(newSession.user, newSession);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleUserChange]);

  // ============================================
  // Auth Actions
  // ============================================

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    const loadedProfile = await loadProfile(user.id);
    if (loadedProfile) {
      setProfile(loadedProfile);
      if (loadedProfile.userType === "agency" && loadedProfile.agencyId) {
        const loadedAgency = await loadAgency(loadedProfile.agencyId);
        setAgency(loadedAgency);
      }
    }
  }, [user, loadProfile, loadAgency]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user found");

    // Map camelCase to snake_case
    const dbUpdates: Record<string, any> = {};
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.websiteUrl !== undefined) dbUpdates.website_url = updates.websiteUrl;
    // New onboarding fields
    if (updates.productDescription !== undefined) dbUpdates.product_description = updates.productDescription;
    if (updates.monthlyRevenue !== undefined) dbUpdates.monthly_revenue = updates.monthlyRevenue;
    if (updates.aov !== undefined) dbUpdates.aov = updates.aov;
    if (updates.profitMargin !== undefined) dbUpdates.profit_margin = updates.profitMargin;
    if (updates.businessModel !== undefined) dbUpdates.business_model = updates.businessModel;
    if (updates.adSpend !== undefined) dbUpdates.ad_spend = updates.adSpend;
    if (updates.adPlatforms !== undefined) dbUpdates.ad_platforms = updates.adPlatforms;
    if (updates.otherPlatforms !== undefined) dbUpdates.other_platforms = updates.otherPlatforms;
    if (updates.revenueConsistency !== undefined) dbUpdates.revenue_consistency = updates.revenueConsistency;
    if (updates.profitableAds !== undefined) dbUpdates.profitable_ads = updates.profitableAds;
    if (updates.adsExperience !== undefined) dbUpdates.ads_experience = updates.adsExperience;
    if (updates.monthlyCreatives !== undefined) dbUpdates.monthly_creatives = updates.monthlyCreatives;
    if (updates.testimonialCount !== undefined) dbUpdates.testimonial_count = updates.testimonialCount;
    if (updates.creativeCreator !== undefined) dbUpdates.creative_creator = updates.creativeCreator;
    if (updates.inventoryStatus !== undefined) dbUpdates.inventory_status = updates.inventoryStatus;
    if (updates.otherInventory !== undefined) dbUpdates.other_inventory = updates.otherInventory;
    if (updates.fulfillmentTime !== undefined) dbUpdates.fulfillment_time = updates.fulfillmentTime;
    if (updates.returnIssues !== undefined) dbUpdates.return_issues = updates.returnIssues;
    if (updates.teamMember !== undefined) dbUpdates.team_member = updates.teamMember;

    const { data, error } = await supabase
      .from("user_profiles")
      .update(dbUpdates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      const mappedProfile: UserProfile = {
        id: data.id,
        userId: data.user_id,
        companyName: data.company_name,
        websiteUrl: data.website_url,
        productDescription: data.product_description,
        monthlyRevenue: data.monthly_revenue,
        aov: data.aov,
        profitMargin: data.profit_margin,
        businessModel: data.business_model,
        adSpend: data.ad_spend,
        adPlatforms: data.ad_platforms,
        otherPlatforms: data.other_platforms,
        revenueConsistency: data.revenue_consistency,
        profitableAds: data.profitable_ads,
        adsExperience: data.ads_experience,
        monthlyCreatives: data.monthly_creatives,
        testimonialCount: data.testimonial_count,
        creativeCreator: data.creative_creator,
        inventoryStatus: data.inventory_status,
        otherInventory: data.other_inventory,
        fulfillmentTime: data.fulfillment_time,
        returnIssues: data.return_issues,
        teamMember: data.team_member,
        userType: data.user_type || "business",
        agencyId: data.agency_id,
      };
      setProfile(mappedProfile);
    }
  };

  // ============================================
  // Provider
  // ============================================

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        agency,
        loading,
        isAgencyUser,
        authState,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// ============================================
// Helpers
// ============================================

function getMockAgencies(): Agency[] {
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
}
