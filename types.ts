export interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
  badge?: string;
  href?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  companyName?: string;
  websiteUrl?: string;
  industry?: string;
  platforms?: string[];
  spendBracket?: string;
  objectives?: string[];
  currentManagement?: string;
  performanceContext?: string;
  growthIntent?: string;
}

export interface Agency {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  platforms?: string[];
  industries?: string[];
  spendBrackets?: string[];
  objectives?: string[];
  capabilities?: string[];
  verified: boolean;
}

export interface Deal {
  id: string;
  userId: string;
  agencyId: string;
  agency?: Agency;
  matchScore: number;
  status: "new" | "active" | "review" | "ongoing";
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingAnswers {
  platforms: string[];
  currentManagement: string;
  spendBracket: string;
  performanceContext: string;
  objectives: string[];
  industry: string;
  growthIntent: string;
}

export type Platform =
  | "FB/IG"
  | "Google"
  | "YouTube"
  | "TikTok"
  | "LinkedIn"
  | "Programmatic";
export type ManagementType = "In-house" | "Freelancer" | "Agency" | "Mixed";
export type SpendBracket =
  | "Under $5k"
  | "$5–20k"
  | "$20–50k"
  | "$50–150k"
  | "$150k+";
export type PerformanceContext =
  | "stable"
  | "inconsistent"
  | "declining"
  | "scaling well";
export type Objective =
  | "Improve ROAS"
  | "Scale spend"
  | "Fix tracking"
  | "Expand channels"
  | "Creative improvement";
export type GrowthIntent = "Yes" | "No" | "Unsure";
