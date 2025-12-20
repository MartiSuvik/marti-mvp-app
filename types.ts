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
  // New onboarding fields - Section A: Business Basics
  productDescription?: string;
  monthlyRevenue?: string;
  aov?: string;
  profitMargin?: string;
  businessModel?: string;
  // Section B: Ads & Performance
  adSpend?: string;
  adPlatforms?: string[];
  otherPlatforms?: string;
  revenueConsistency?: string;
  profitableAds?: string;
  adsExperience?: string;
  // Section C: Creative & Funnel
  monthlyCreatives?: string;
  testimonialCount?: string;
  creativeCreator?: string;
  // Section D: Operations
  inventoryStatus?: string;
  otherInventory?: string;
  fulfillmentTime?: string;
  returnIssues?: string;
  teamMember?: string;
  // Agency portal fields
  userType: "business" | "agency";
  agencyId?: string;
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
  // Agency portal fields
  ownerId?: string; // Links to auth.users.id
  contactEmail?: string;
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
  // Section A: Business Basics
  productDescription: string;
  monthlyRevenue: string;
  aov: string;
  profitMargin: string;
  businessModel: string;
  // Section B: Ads & Performance
  adSpend: string;
  adPlatforms: string[];
  otherPlatforms: string;
  revenueConsistency: string;
  profitableAds: string;
  adsExperience: string;
  // Section C: Creative & Funnel
  monthlyCreatives: string;
  testimonialCount: string;
  creativeCreator: string;
  // Section D: Operations
  inventoryStatus: string;
  otherInventory: string;
  fulfillmentTime: string;
  returnIssues: string;
  teamMember: string;
}

// ============================================
// Stripe Connect & Jobs Types
// ============================================

// Job status state machine
export type JobStatus =
  | "draft"           // Business creating job
  | "pending"         // Waiting for agency acceptance
  | "declined"        // Agency declined the job
  | "unfunded"        // Agency accepted, awaiting payment
  | "funded"          // Business paid, funds held on platform
  | "in_progress"     // Agency working
  | "review"          // Agency submitted, awaiting approval
  | "revision"        // Business requested changes
  | "approved"        // Business approved, funds releasing
  | "paid_out"        // Agency received payment
  | "cancelled"       // Job cancelled
  | "refunded";       // Funds returned to business

// Core Job interface
export interface Job {
  id: string;
  dealId: string;
  businessId: string;
  agencyId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  platformFee: number;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  // Joined data
  agency?: Agency;
  deal?: Deal;
}

// Job milestone for phased payments (future)
export interface JobMilestone {
  id: string;
  jobId: string;
  title: string;
  amount: number;
  dueDate?: string;
  status: "pending" | "in_progress" | "submitted" | "approved" | "paid";
  orderIndex: number;
}

// Stripe PaymentIntent tracking
export interface JobPayment {
  id: string;
  jobId: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  amount: number;
  status: "pending" | "succeeded" | "failed" | "refunded";
  createdAt: string;
}

// Stripe Transfer tracking (platform → agency)
export interface JobPayout {
  id: string;
  jobId: string;
  stripeTransferId: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

// Audit trail entry
export interface LedgerEntry {
  id: string;
  jobId: string;
  actorId?: string;
  eventType: string;
  details: Record<string, any>;
  createdAt: string;
}

// Extended Agency with Stripe fields
export interface AgencyWithStripe extends Agency {
  stripeAccountId?: string;
  stripeOnboardingComplete: boolean;
  stripePayoutsEnabled: boolean;
}

// Extended UserProfile with Stripe fields
export interface UserProfileWithStripe extends UserProfile {
  stripeCustomerId?: string;
}

// ============================================
// Chat / Conversations Types
// ============================================

// Conversation between a business and agency (one per deal)
export interface Conversation {
  id: string;
  dealId: string;
  businessId: string;
  agencyId: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  deal?: Deal;
  agency?: Agency;
  lastMessage?: Message;
  unreadCount?: number;
}

// Chat message
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "business" | "agency";
  senderName: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

// For realtime broadcast payload
export interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "business" | "agency";
  senderName: string;
  content: string;
  createdAt: string;
}

