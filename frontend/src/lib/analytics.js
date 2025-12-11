import posthog from 'posthog-js';

// Initialize PostHog
// Replace with your actual PostHog API key from https://app.posthog.com/project/settings
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || 'phc_development_key';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let initialized = false;

export const initAnalytics = () => {
  if (initialized || typeof window === 'undefined') return;
  
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true, // Automatically capture clicks, page views, etc.
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    batch_size: 1, // Send events immediately (for development)
    batch_interval_ms: 100, // Send every 100ms instead of default 10s
    session_recording: {
      maskAllInputs: true, // Privacy: mask sensitive inputs
      maskTextSelector: '.sensitive', // Mask elements with this class
    },
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        posthog.debug(); // Enable debug mode in development
      }
    }
  });
  
  initialized = true;
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (!initialized) return;
  posthog.capture(eventName, properties);
};

// Identify user
export const identifyUser = (userId, properties = {}) => {
  if (!initialized) return;
  posthog.identify(userId, properties);
};

// Track page views
export const trackPageView = (pageName, properties = {}) => {
  if (!initialized) return;
  posthog.capture('$pageview', { page: pageName, ...properties });
};

// Reset user (on logout)
export const resetUser = () => {
  if (!initialized) return;
  posthog.reset();
};

// Feature flags
export const isFeatureEnabled = (flagName) => {
  if (!initialized) return false;
  return posthog.isFeatureEnabled(flagName);
};

// UC-146 AC2: Track key user actions
export const trackUserAction = {
  // Registration
  registration: (method = 'email') => {
    trackEvent('user_registered', { method });
  },
  
  // Job Application
  jobApplication: (jobId, source = 'manual') => {
    trackEvent('job_applied', { job_id: jobId, source });
  },
  
  // AI Usage
  aiGenerated: (type, success = true) => {
    trackEvent('ai_generated', { type, success });
  },
  
  // Resume actions
  resumeUploaded: (fileSize, format) => {
    trackEvent('resume_uploaded', { file_size: fileSize, format });
  },
  
  resumeGenerated: (template, success) => {
    trackEvent('resume_generated', { template, success });
  },
  
  // Cover letter actions
  coverLetterGenerated: (template, success) => {
    trackEvent('cover_letter_generated', { template, success });
  },
  
  coverLetterSaved: (title) => {
    trackEvent('cover_letter_saved', { title });
  },
  
  // Interview tracking
  interviewScheduled: (jobId, format) => {
    trackEvent('interview_scheduled', { job_id: jobId, format });
  },
  
  interviewCompleted: (jobId, outcome) => {
    trackEvent('interview_completed', { job_id: jobId, outcome });
  },
  
  // Quality check
  qualityCheckPerformed: (score, hasResume, hasCoverLetter) => {
    trackEvent('quality_check_performed', { score, has_resume: hasResume, has_cover_letter: hasCoverLetter });
  },
  
  // Feature adoption
  featureUsed: (featureName) => {
    trackEvent('feature_used', { feature: featureName });
  },
};

// UC-146 AC3: Conversion funnels
export const trackFunnel = {
  // Job application funnel
  jobSearch: (query) => {
    trackEvent('funnel_job_search', { query });
  },
  
  jobViewed: (jobId) => {
    trackEvent('funnel_job_viewed', { job_id: jobId });
  },
  
  jobSaved: (jobId) => {
    trackEvent('funnel_job_saved', { job_id: jobId });
  },
  
  applicationStarted: (jobId) => {
    trackEvent('funnel_application_started', { job_id: jobId });
  },
  
  applicationSubmitted: (jobId) => {
    trackEvent('funnel_application_submitted', { job_id: jobId });
  },
  
  // Onboarding funnel
  onboardingStarted: () => {
    trackEvent('funnel_onboarding_started');
  },
  
  onboardingStep: (step) => {
    trackEvent('funnel_onboarding_step', { step });
  },
  
  onboardingCompleted: () => {
    trackEvent('funnel_onboarding_completed');
  },
  
  // AI generation funnel
  aiToolOpened: (tool) => {
    trackEvent('funnel_ai_tool_opened', { tool });
  },
  
  aiInputProvided: (tool) => {
    trackEvent('funnel_ai_input_provided', { tool });
  },
  
  aiGenerated: (tool, success) => {
    trackEvent('funnel_ai_generated', { tool, success });
  },
  
  aiContentSaved: (tool) => {
    trackEvent('funnel_ai_content_saved', { tool });
  },
};

export default posthog;
