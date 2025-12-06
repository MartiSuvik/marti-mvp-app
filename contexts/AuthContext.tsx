import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { UserProfile, OnboardingAnswers, Agency } from "../types";
import { MatchingEngine } from "../lib/matchingEngine";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check if this is a new user who needs profile created
        await createProfileIfNeeded(session.user.id);
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Create profile for new users (called after auth is confirmed)
  const createProfileIfNeeded = async (userId: string) => {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingProfile) {
        return; // Profile already exists
      }

      // Check for stored onboarding answers
      const storedAnswers = localStorage.getItem("onboardingAnswers");
      let onboardingData: OnboardingAnswers | null = null;
      
      if (storedAnswers) {
        try {
          onboardingData = JSON.parse(storedAnswers);
        } catch (e) {
          console.error("Error parsing onboarding data:", e);
        }
      }

      // Create user profile with onboarding data if available
      const profileData: any = {
        user_id: userId,
        company_name: null,
      };

      if (onboardingData) {
        profileData.platforms = onboardingData.platforms;
        profileData.current_management = onboardingData.currentManagement;
        profileData.spend_bracket = onboardingData.spendBracket;
        profileData.performance_context = onboardingData.performanceContext;
        profileData.objectives = onboardingData.objectives;
        profileData.industry = onboardingData.industry;
        profileData.growth_intent = onboardingData.growthIntent;
      }

      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert(profileData);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return;
      }

      // If we have onboarding data, create deals
      if (onboardingData) {
        await processOnboardingMatches(userId, onboardingData);
        // Clear stored onboarding data
        localStorage.removeItem("onboardingAnswers");
      }
    } catch (error) {
      console.error("Error in createProfileIfNeeded:", error);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        // Don't throw - just set profile to null and stop loading
        setProfile(null);
        setLoading(false);
        return;
      }

      // Map snake_case from DB to camelCase for app
      if (data) {
        const mappedProfile: UserProfile = {
          id: data.id,
          userId: data.user_id,
          companyName: data.company_name,
          websiteUrl: data.website_url,
          industry: data.industry,
          platforms: data.platforms,
          spendBracket: data.spend_bracket,
          objectives: data.objectives,
          currentManagement: data.current_management,
          performanceContext: data.performance_context,
          growthIntent: data.growth_intent,
        };
        setProfile(mappedProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    // Profile creation is now handled in onAuthStateChange after the user is confirmed
    // This ensures RLS policies work correctly

    return { error };
  };

  const processOnboardingMatches = async (userId: string, answers: OnboardingAnswers) => {
    try {
      // Get all agencies
      const { data: agencies, error } = await supabase
        .from("agencies")
        .select("*");

      let agenciesToUse: Agency[];

      if (error || !agencies || agencies.length === 0) {
        // Use mock agencies if none exist
        agenciesToUse = [
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
      } else {
        agenciesToUse = agencies as Agency[];
      }

      const matches = MatchingEngine.generateMatches(answers, agenciesToUse);

      // Create deals for top 3 matches
      const deals = matches.map((match) => ({
        user_id: userId,
        agency_id: match.agency.id,
        match_score: match.matchScore,
        status: "new",
      }));

      const { error: dealsError } = await supabase.from("deals").insert(deals);

      if (dealsError) {
        console.error("Error creating deals:", dealsError);
      }
    } catch (error) {
      console.error("Error processing onboarding matches:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.error("No user found for profile update");
      throw new Error("No user found");
    }

    // Map camelCase to snake_case for DB
    const dbUpdates: any = {};

    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.websiteUrl !== undefined) dbUpdates.website_url = updates.websiteUrl;
    if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
    if (updates.platforms !== undefined) dbUpdates.platforms = updates.platforms;
    if (updates.spendBracket !== undefined) dbUpdates.spend_bracket = updates.spendBracket;
    if (updates.objectives !== undefined) dbUpdates.objectives = updates.objectives;
    if (updates.currentManagement !== undefined) dbUpdates.current_management = updates.currentManagement;
    if (updates.performanceContext !== undefined) dbUpdates.performance_context = updates.performanceContext;
    if (updates.growthIntent !== undefined) dbUpdates.growth_intent = updates.growthIntent;

    try {
      // Use update instead of upsert - profile should already exist
      const { data, error } = await supabase
        .from("user_profiles")
        .update(dbUpdates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      if (data) {
        // Map back to camelCase for app state
        const mappedProfile: UserProfile = {
          id: data.id,
          userId: data.user_id,
          companyName: data.company_name,
          websiteUrl: data.website_url,
          industry: data.industry,
          platforms: data.platforms,
          spendBracket: data.spend_bracket,
          objectives: data.objectives,
          currentManagement: data.current_management,
          performanceContext: data.performance_context,
          growthIntent: data.growth_intent,
        };
        setProfile(mappedProfile);
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
