-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agencies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  description text,
  platforms ARRAY DEFAULT '{}'::text[],
  industries ARRAY DEFAULT '{}'::text[],
  spend_brackets ARRAY DEFAULT '{}'::text[],
  objectives ARRAY DEFAULT '{}'::text[],
  capabilities ARRAY DEFAULT '{}'::text[],
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,
  owner_id uuid,
  contact_email text,
  CONSTRAINT agencies_pkey PRIMARY KEY (id),
  CONSTRAINT agencies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.agency_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  agency_name text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agency_applications_pkey PRIMARY KEY (id),
  CONSTRAINT agency_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.conversation_members (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamp with time zone DEFAULT now(),
  unread_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_members_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  deal_id uuid NOT NULL UNIQUE,
  business_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id),
  CONSTRAINT conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES auth.users(id),
  CONSTRAINT conversations_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.deals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  match_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'active'::text, 'review'::text, 'ongoing'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deals_pkey PRIMARY KEY (id),
  CONSTRAINT deals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT deals_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.job_milestones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'submitted'::text, 'approved'::text, 'paid'::text])),
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT job_milestones_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_payments_pkey PRIMARY KEY (id),
  CONSTRAINT job_payments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_payouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  stripe_transfer_id text,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_payouts_pkey PRIMARY KEY (id),
  CONSTRAINT job_payouts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  deal_id uuid,
  business_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'unfunded'::text, 'funded'::text, 'in_progress'::text, 'review'::text, 'revision'::text, 'approved'::text, 'paid_out'::text, 'cancelled'::text, 'refunded'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  proposal_id uuid,
  source text DEFAULT 'direct'::text CHECK (source = ANY (ARRAY['proposal'::text, 'direct'::text])),
  stripe_invoice_id text,
  has_milestones boolean DEFAULT false,
  total_released numeric DEFAULT 0,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id),
  CONSTRAINT jobs_business_id_fkey FOREIGN KEY (business_id) REFERENCES auth.users(id),
  CONSTRAINT jobs_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT jobs_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id)
);
CREATE TABLE public.ledger_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid,
  actor_id uuid,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ledger_entries_pkey PRIMARY KEY (id),
  CONSTRAINT ledger_entries_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT ledger_entries_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type = ANY (ARRAY['business'::text, 'agency'::text])),
  sender_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  message_type text DEFAULT 'text'::text CHECK (message_type = ANY (ARRAY['text'::text, 'video_call'::text, 'system'::text])),
  attachments jsonb,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.milestones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  order_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'submitted'::text, 'approved'::text, 'paid'::text, 'revision'::text])),
  stripe_transfer_id text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT milestones_pkey PRIMARY KEY (id),
  CONSTRAINT milestones_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.proposals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  deal_id uuid NOT NULL,
  agency_id uuid NOT NULL,
  business_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text NOT NULL DEFAULT 'USD'::text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'accepted'::text, 'declined'::text, 'converted'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT proposals_pkey PRIMARY KEY (id),
  CONSTRAINT proposals_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id),
  CONSTRAINT proposals_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id),
  CONSTRAINT proposals_business_id_fkey FOREIGN KEY (business_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  company_name text,
  website_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stripe_customer_id text,
  user_type text DEFAULT 'business'::text CHECK (user_type = ANY (ARRAY['business'::text, 'agency'::text])),
  agency_id uuid,
  onboarding_complete boolean DEFAULT false,
  product_description text,
  monthly_revenue text,
  aov text,
  profit_margin text,
  business_model text,
  ad_spend text,
  ad_platforms ARRAY DEFAULT '{}'::text[],
  other_platforms text,
  revenue_consistency text,
  profitable_ads text,
  ads_experience text,
  monthly_creatives text,
  testimonial_count text,
  creative_creator text,
  inventory_status text,
  other_inventory text,
  fulfillment_time text,
  return_issues text,
  team_member text,
  name text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_profiles_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);