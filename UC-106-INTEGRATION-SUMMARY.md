-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Resume (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  userid text NOT NULL,
  templateid uuid,
  title text NOT NULL,
  sections jsonb,
  skills jsonb,
  experience jsonb,
  aicontent jsonb,
  versiontag text,
  createdat timestamp without time zone DEFAULT now(),
  updatedat timestamp without time zone DEFAULT now(),
  CONSTRAINT Resume_pkey PRIMARY KEY (id),
  CONSTRAINT Resume_templateid_fkey FOREIGN KEY (templateid) REFERENCES public.ResumeTemplate(id)
);
CREATE TABLE public.ResumeFeedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resumeid uuid,
  reviewer text NOT NULL,
  comment text NOT NULL,
  resolved boolean DEFAULT false,
  createdat timestamp without time zone DEFAULT now(),
  CONSTRAINT ResumeFeedback_pkey PRIMARY KEY (id),
  CONSTRAINT ResumeFeedback_resumeid_fkey FOREIGN KEY (resumeid) REFERENCES public.Resume(id)
);
CREATE TABLE public.ResumeTemplate (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  preview text,
  colors jsonb,
  fonts jsonb,
  layout jsonb,
  createdat timestamp without time zone DEFAULT now(),
  updatedat timestamp without time zone DEFAULT now(),
  CONSTRAINT ResumeTemplate_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ResumeVersion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resumeid uuid,
  name text NOT NULL,
  description text,
  changes jsonb,
  createdat timestamp without time zone DEFAULT now(),
  CONSTRAINT ResumeVersion_pkey PRIMARY KEY (id),
  CONSTRAINT ResumeVersion_resumeid_fkey FOREIGN KEY (resumeid) REFERENCES public.Resume(id)
);
CREATE TABLE public.analytics_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_date timestamp without time zone NOT NULL DEFAULT now(),
  funnel jsonb,
  time_to_response jsonb,
  success_rates jsonb,
  volume jsonb,
  recommendations jsonb,
  goals jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT analytics_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.application_automation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_name text NOT NULL,
  trigger_event text NOT NULL,
  condition jsonb,
  action text NOT NULL,
  action_params jsonb,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT application_automation_rules_pkey PRIMARY KEY (id),
  CONSTRAINT application_automation_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.application_checklists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_application_id integer NOT NULL,
  item text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT application_checklists_pkey PRIMARY KEY (id),
  CONSTRAINT application_checklists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT application_checklists_job_application_id_fkey FOREIGN KEY (job_application_id) REFERENCES public.job_applications(id)
);
CREATE TABLE public.application_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_application_id text,
  scheduled_at timestamp without time zone NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT application_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT application_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.application_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_application_id integer NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by text,
  change_reason text,
  automated boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT application_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT application_status_history_job_application_id_fkey FOREIGN KEY (job_application_id) REFERENCES public.job_applications(id)
);
CREATE TABLE public.application_timeline_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_application_id integer NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamp without time zone DEFAULT now(),
  created_by text,
  CONSTRAINT application_timeline_events_pkey PRIMARY KEY (id),
  CONSTRAINT application_timeline_events_job_application_id_fkey FOREIGN KEY (job_application_id) REFERENCES public.job_applications(id)
);
CREATE TABLE public.certifications (
  id integer NOT NULL DEFAULT nextval('certifications_id_seq'::regclass),
  user_id uuid NOT NULL,
  name text NOT NULL,
  issuing_organization text NOT NULL,
  date_earned timestamp without time zone NOT NULL,
  expiration_date timestamp without time zone,
  does_not_expire boolean DEFAULT false,
  certification_number text,
  document_url text,
  verification_status USER-DEFINED DEFAULT 'PENDING'::verification_status,
  renewal_reminder_days integer,
  category text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT certifications_pkey PRIMARY KEY (id),
  CONSTRAINT certifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cl_template_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cl_template_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cl_template_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  template_id uuid,
  action text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cl_template_usage_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cl_template_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid,
  version integer NOT NULL,
  body text NOT NULL,
  changelog text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cl_template_versions_pkey PRIMARY KEY (id),
  CONSTRAINT cl_template_versions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.cl_templates(id)
);
CREATE TABLE public.cl_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sample_preview text,
  tokens jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cl_templates_pkey PRIMARY KEY (id),
  CONSTRAINT cl_templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.cl_template_categories(id)
);
CREATE TABLE public.cl_user_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  base_template_id uuid,
  title text NOT NULL,
  description text,
  body text NOT NULL,
  tokens jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cl_user_templates_pkey PRIMARY KEY (id),
  CONSTRAINT cl_user_templates_base_template_id_fkey FOREIGN KEY (base_template_id) REFERENCES public.cl_templates(id)
);
CREATE TABLE public.contact_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  user_id text NOT NULL,
  interaction_type character varying NOT NULL,
  summary text,
  date timestamp without time zone DEFAULT now(),
  relationship_strength integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT contact_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT contact_interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.professional_contacts(id)
);
CREATE TABLE public.daily_productivity (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  total_minutes integer DEFAULT 0,
  energy_average numeric,
  productivity_average numeric,
  activities_completed integer DEFAULT 0,
  burnout_score numeric,
  work_life_balance_score numeric,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT daily_productivity_pkey PRIMARY KEY (id)
);
CREATE TABLE public.discovered_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  title character varying NOT NULL,
  company character varying NOT NULL,
  linkedin_url text NOT NULL,
  snippet text,
  search_query text,
  is_saved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discovered_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT discovered_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.education (
  id integer NOT NULL DEFAULT nextval('education_id_seq'::regclass),
  user_id uuid NOT NULL,
  degree text NOT NULL,
  institution text NOT NULL,
  field_of_study text,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone,
  ongoing boolean DEFAULT false,
  gpa double precision,
  show_gpa boolean DEFAULT true,
  honors ARRAY DEFAULT '{}'::text[],
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT education_pkey PRIMARY KEY (id),
  CONSTRAINT education_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.employment (
  id integer NOT NULL DEFAULT nextval('employment_id_seq'::regclass),
  user_id uuid NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone,
  current boolean DEFAULT false,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT employment_pkey PRIMARY KEY (id),
  CONSTRAINT employment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.event_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  follow_up_needed boolean DEFAULT false,
  follow_up_due timestamp without time zone,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT event_connections_pkey PRIMARY KEY (id),
  CONSTRAINT event_connections_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.networking_events(id),
  CONSTRAINT event_connections_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.professional_contacts(id)
);
CREATE TABLE public.goal_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  target_value numeric NOT NULL,
  target_date timestamp without time zone NOT NULL,
  completed_date timestamp without time zone,
  is_completed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT goal_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT goal_milestones_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id)
);
CREATE TABLE public.goal_progress_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL,
  previous_value numeric NOT NULL,
  new_value numeric NOT NULL,
  change_type text NOT NULL,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT goal_progress_history_pkey PRIMARY KEY (id),
  CONSTRAINT goal_progress_history_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id)
);
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_type text NOT NULL,
  target integer NOT NULL,
  progress integer DEFAULT 0,
  start_date timestamp without time zone,
  end_date timestamp without time zone,
  completed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  title text,
  description text,
  category text,
  metric_type text DEFAULT 'count'::text,
  unit text,
  priority text DEFAULT 'medium'::text,
  status text DEFAULT 'not_started'::text,
  target_date timestamp without time zone,
  completed_date timestamp without time zone,
  progress_percentage numeric DEFAULT 0,
  why_important text,
  celebration_message text,
  shared_with ARRAY,
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.informational_interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  request_status character varying DEFAULT 'requested'::character varying,
  scheduled_time timestamp without time zone,
  prep_notes text,
  outcome_notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT informational_interviews_pkey PRIMARY KEY (id),
  CONSTRAINT informational_interviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT informational_interviews_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.professional_contacts(id)
);
CREATE TABLE public.interview_ai_data (
  interview_id uuid NOT NULL,
  company_research text,
  question_bank jsonb,
  mock_interview_script jsonb,
  technical_prep jsonb,
  checklist jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interview_ai_data_pkey PRIMARY KEY (interview_id),
  CONSTRAINT interview_ai_data_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id)
);
CREATE TABLE public.interview_followups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  interview_id uuid,
  company text,
  role text,
  interviewer_name text,
  type text NOT NULL CHECK (type = ANY (ARRAY['thank_you'::text, 'status_inquiry'::text, 'feedback_request'::text, 'networking'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'completed'::text, 'responded'::text])),
  channel text CHECK (channel = ANY (ARRAY['email'::text, 'linkedin'::text, 'phone'::text, 'in_person'::text])),
  suggested_send_at timestamp with time zone,
  sent_at timestamp with time zone,
  responded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interview_followups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_application_id integer,
  interview_type text NOT NULL,
  scheduled_at timestamp without time zone NOT NULL,
  location text,
  details text,
  outcome text,
  rescheduled boolean DEFAULT false,
  cancelled boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  title text,
  duration text DEFAULT '60'::text,
  interviewer_name text,
  interviewer_email text,
  notes text,
  status text DEFAULT 'scheduled'::text,
  job_id uuid,
  company_name text,
  company_type text,
  company_industry text,
  job_title text,
  interview_date timestamp without time zone,
  interview_format text,
  interview_stage text,
  offer_received boolean DEFAULT false,
  offer_accepted boolean DEFAULT false,
  performance_rating integer,
  strengths ARRAY,
  weaknesses ARRAY,
  prep_time_hours numeric,
  practice_sessions_used integer,
  feedback text,
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT interviews_job_application_id_fkey FOREIGN KEY (job_application_id) REFERENCES public.job_applications(id),
  CONSTRAINT interviews_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_applications (
  id integer NOT NULL DEFAULT nextval('job_applications_id_seq'::regclass),
  company_name text NOT NULL,
  position_title text NOT NULL,
  status USER-DEFINED DEFAULT 'APPLIED'::application_status,
  applied_date timestamp without time zone,
  notes text,
  user_id uuid NOT NULL,
  CONSTRAINT job_applications_pkey PRIMARY KEY (id),
  CONSTRAINT job_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.job_history (
  id uuid NOT NULL,
  jobid uuid NOT NULL,
  userid uuid NOT NULL,
  status text NOT NULL,
  note text,
  createdat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_history_pkey PRIMARY KEY (id),
  CONSTRAINT job_history_jobid_fkey FOREIGN KEY (jobid) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_material_history (
  id uuid NOT NULL,
  jobid uuid NOT NULL,
  userid uuid NOT NULL,
  resumeversionid uuid,
  coverletterversionid uuid,
  changedat timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_material_history_pkey PRIMARY KEY (id),
  CONSTRAINT job_material_history_jobid_fkey FOREIGN KEY (jobid) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_skills (
  job_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  req_level integer CHECK (req_level >= 0 AND req_level <= 5),
  weight double precision DEFAULT 1.0,
  CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_id),
  CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT job_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text,
  salaryMin integer,
  salaryMax integer,
  postingUrl text,
  deadline timestamp with time zone,
  description text,
  industry text,
  jobType text,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  userId uuid,
  status text NOT NULL DEFAULT '''Interested'''::text,
  statusUpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  negotiationNotes text,
  interviewNotes text,
  recruiterName text,
  recruiterEmail text,
  recruiterPhone text,
  hiringManagerName text,
  hiringManagerEmail text,
  hiringManagerPhone text,
  companySize text,
  companyWebsite text,
  companyDescription text,
  companyMission text,
  companyLogoUrl text,
  companyContactEmail text,
  companyContactPhone text,
  glassdoorRating numeric CHECK ("glassdoorRating" IS NULL OR "glassdoorRating" >= 0::numeric AND "glassdoorRating" <= 5::numeric),
  glassdoorUrl text,
  resumeVersionId uuid,
  coverLetterVersionId uuid,
  archivedAt timestamp with time zone,
  archiveReason text,
  application_source text,
  application_method text,
  response_time_days integer,
  source text,
  CONSTRAINT jobs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.learning_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  skill_name text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  difficulty text DEFAULT 'Beginner'::text,
  source text DEFAULT 'External'::text,
  CONSTRAINT learning_resources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.linked_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider character varying NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamp without time zone,
  linked_profile jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT linked_accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.market_salary_data (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  role text NOT NULL,
  location text NOT NULL,
  experience_level text,
  p25 numeric,
  median numeric,
  p75 numeric,
  average numeric,
  base_low numeric,
  base_high numeric,
  bonus numeric,
  equity numeric,
  total_low numeric,
  total_high numeric,
  source text DEFAULT 'mock'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT market_salary_data_pkey PRIMARY KEY (id)
);
CREATE TABLE public.match_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  job_id uuid,
  score double precision,
  breakdown jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT match_runs_pkey PRIMARY KEY (id),
  CONSTRAINT match_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT match_runs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.network_contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  contact_name character varying NOT NULL,
  company character varying,
  job_title character varying,
  industry character varying,
  connection_source character varying,
  relationship_strength integer CHECK (relationship_strength >= 1 AND relationship_strength <= 5),
  first_contact_date timestamp with time zone NOT NULL,
  last_interaction_date timestamp with time zone,
  total_interactions integer DEFAULT 0,
  referrals_given integer DEFAULT 0,
  referrals_received integer DEFAULT 0,
  job_opportunities_sourced integer DEFAULT 0,
  value_provided_score integer DEFAULT 0,
  value_received_score integer DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone_number character varying,
  email_address character varying,
  CONSTRAINT network_contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.networking_activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  contact_id uuid,
  activity_type character varying NOT NULL,
  activity_date timestamp with time zone NOT NULL,
  duration_minutes integer,
  outcome character varying,
  value_exchange character varying,
  event_name character varying,
  event_cost numeric,
  follow_up_required boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT networking_activities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.networking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_name character varying NOT NULL,
  event_date timestamp without time zone,
  location character varying,
  goals text,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  event_time character varying,
  event_type character varying,
  industry character varying,
  description text,
  organizer character varying,
  registration_url character varying,
  attendance_status character varying DEFAULT 'planning'::character varying,
  networking_goals ARRAY,
  target_connections integer DEFAULT 0,
  preparation_notes text,
  actual_connections_made integer DEFAULT 0,
  follow_ups_completed integer DEFAULT 0,
  roi_rating integer DEFAULT 0,
  post_event_notes text,
  cost numeric DEFAULT 0,
  time_invested_hours numeric DEFAULT 0,
  contacts_made integer DEFAULT 0,
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  leads_generated integer DEFAULT 0,
  opportunities_created integer DEFAULT 0,
  roi_score numeric,
  CONSTRAINT networking_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_application_id integer,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_job_application_id_fkey FOREIGN KEY (job_application_id) REFERENCES public.job_applications(id)
);
CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash character varying NOT NULL UNIQUE,
  expires_at timestamp without time zone NOT NULL,
  used_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.practice_interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  practice_type text NOT NULL,
  topic text,
  duration integer NOT NULL,
  performance_score integer,
  areas_improved ARRAY,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT practice_interviews_pkey PRIMARY KEY (id)
);
CREATE TABLE public.professional_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  full_name character varying NOT NULL,
  headline character varying,
  company character varying,
  role character varying,
  industry character varying,
  relationship_type character varying,
  source character varying DEFAULT 'manual'::character varying,
  linkedin_profile_url text,
  email character varying,
  phone character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT professional_contacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.professional_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  reference_type character varying,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  email text,
  phone text,
  CONSTRAINT professional_references_pkey PRIMARY KEY (id),
  CONSTRAINT professional_references_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT professional_references_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.professional_contacts(id)
);
CREATE TABLE public.project_media (
  id integer NOT NULL DEFAULT nextval('project_media_id_seq'::regclass),
  project_id integer NOT NULL,
  url text NOT NULL,
  type USER-DEFINED DEFAULT 'IMAGE'::media_type,
  caption text,
  CONSTRAINT project_media_pkey PRIMARY KEY (id),
  CONSTRAINT project_media_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id integer NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  role text,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone,
  technologies ARRAY DEFAULT '{}'::text[],
  url text,
  team_size integer,
  outcomes text,
  industry text,
  status USER-DEFINED DEFAULT 'COMPLETED'::project_status,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reference_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_application_id integer,
  reference_id uuid NOT NULL,
  status character varying DEFAULT 'requested'::character varying,
  talking_points text,
  due_date timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT reference_requests_pkey PRIMARY KEY (id),
  CONSTRAINT reference_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reference_requests_job_application_id_fkey FOREIGN KEY (job_application_id) REFERENCES public.job_applications(id),
  CONSTRAINT reference_requests_reference_id_fkey FOREIGN KEY (reference_id) REFERENCES public.professional_references(id)
);
CREATE TABLE public.referral_request_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referral_request_id uuid NOT NULL,
  old_status character varying,
  new_status character varying NOT NULL,
  changed_by text,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT referral_request_history_pkey PRIMARY KEY (id),
  CONSTRAINT fk_referral_request FOREIGN KEY (referral_request_id) REFERENCES public.referral_requests(id)
);
CREATE TABLE public.referral_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  job_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  request_template text,
  sent_date timestamp without time zone,
  follow_up_date timestamp without time zone,
  follow_up_count integer DEFAULT 0,
  response_date timestamp without time zone,
  response_type character varying,
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT referral_requests_pkey PRIMARY KEY (id),
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES public.professional_contacts(id)
);
CREATE TABLE public.relationship_maintenance_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reminder_date timestamp without time zone NOT NULL,
  reminder_type character varying,
  status character varying DEFAULT 'pending'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT relationship_maintenance_reminders_pkey PRIMARY KEY (id),
  CONSTRAINT relationship_maintenance_reminders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.professional_contacts(id),
  CONSTRAINT relationship_maintenance_reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_application_id integer,
  type text NOT NULL,
  message text NOT NULL,
  due_date timestamp without time zone,
  completed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  related_id uuid,
  related_type text,
  reminder_time timestamp without time zone,
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT reminders_job_application_id_fkey FOREIGN KEY (job_application_id) REFERENCES public.job_applications(id)
);
CREATE TABLE public.salary_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text,
  location text,
  experience_level text,
  min_salary numeric,
  max_salary numeric,
  avg_salary numeric,
  benefits text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT salary_data_pkey PRIMARY KEY (id)
);
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  userId text,
  category text,
  proficiency text,
  order integer DEFAULT 1,
  CONSTRAINT skills_pkey PRIMARY KEY (id)
);
CREATE TABLE public.success_patterns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  pattern_type text,
  pattern_data jsonb,
  confidence_score numeric,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT success_patterns_pkey PRIMARY KEY (id),
  CONSTRAINT success_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.time_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  job_id uuid,
  duration_minutes integer NOT NULL,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone,
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  productivity_rating integer CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT time_entries_pkey PRIMARY KEY (id),
  CONSTRAINT time_entries_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.user_material_defaults (
  userId uuid NOT NULL,
  defaultResumeVersionId uuid,
  defaultCoverLetterVersionId uuid,
  updatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_material_defaults_pkey PRIMARY KEY (userId)
);
CREATE TABLE public.user_skills (
  user_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  level integer CHECK (level >= 0 AND level <= 5),
  CONSTRAINT user_skills_pkey PRIMARY KEY (user_id, skill_id),
  CONSTRAINT user_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id),
  CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_weights (
  user_id uuid NOT NULL,
  skills_weight double precision DEFAULT 0.7,
  experience_weight double precision DEFAULT 0.2,
  education_weight double precision DEFAULT 0.1,
  CONSTRAINT user_weights_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_weights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password text NOT NULL,
  firstname text NOT NULL,
  lastname text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  role text,
  phone text,
  bio text,
  location character varying,
  title character varying,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  profile_picture text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);