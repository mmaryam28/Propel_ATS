-- UC-113: Email Integration for Application Tracking
-- Run this in Supabase SQL editor

-- Table to store user's Gmail OAuth tokens
CREATE TABLE IF NOT EXISTS public.gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "tokenExpiry" TIMESTAMP WITH TIME ZONE,
  "scope" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT gmail_tokens_userId_unique UNIQUE ("userId")
);

-- Table to store email metadata linked to job applications
CREATE TABLE IF NOT EXISTS public.job_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "jobId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emailId" TEXT NOT NULL, -- Gmail message ID
  "threadId" TEXT,
  subject TEXT,
  "fromEmail" TEXT,
  "fromName" TEXT,
  "receivedDate" TIMESTAMP WITH TIME ZONE,
  snippet TEXT, -- Email preview/summary
  "isRead" BOOLEAN DEFAULT false,
  labels TEXT[], -- Gmail labels
  "linkedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT job_emails_emailId_unique UNIQUE ("emailId", "userId")
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_userId ON public.gmail_tokens ("userId");
CREATE INDEX IF NOT EXISTS idx_job_emails_jobId ON public.job_emails ("jobId");
CREATE INDEX IF NOT EXISTS idx_job_emails_userId ON public.job_emails ("userId");
CREATE INDEX IF NOT EXISTS idx_job_emails_emailId ON public.job_emails ("emailId");
CREATE INDEX IF NOT EXISTS idx_job_emails_receivedDate ON public.job_emails ("receivedDate" DESC);

-- Update trigger for gmail_tokens
CREATE OR REPLACE FUNCTION update_gmail_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gmail_tokens_updated_at
  BEFORE UPDATE ON public.gmail_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_gmail_tokens_updated_at();

-- Update trigger for job_emails
CREATE OR REPLACE FUNCTION update_job_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_emails_updated_at
  BEFORE UPDATE ON public.job_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_job_emails_updated_at();

COMMENT ON TABLE public.gmail_tokens IS 'Stores Gmail OAuth tokens for users who opt-in to email integration';
COMMENT ON TABLE public.job_emails IS 'Stores metadata of emails manually linked to job applications';
