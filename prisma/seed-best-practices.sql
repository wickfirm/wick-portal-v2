-- ============================================================================
-- BEST PRACTICE SEED DATA FOR WICK FIRM / OMNIXIA PORTAL
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. TASK CATEGORIES
-- These represent the type of work/skill needed for a task
-- ============================================================================

-- Clear existing categories (optional - comment out if you want to keep existing)
-- DELETE FROM task_categories;

INSERT INTO task_categories (id, name, "order", "createdAt", "updatedAt")
VALUES
  -- Core Work Types
  (gen_random_uuid()::text, 'Strategy & Planning', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'Research & Analysis', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'Content Creation', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'Design & Creative', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'Development', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'Campaign Setup', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'Optimization', 7, NOW(), NOW()),
  (gen_random_uuid()::text, 'Reporting & Analytics', 8, NOW(), NOW()),
  -- Process Types
  (gen_random_uuid()::text, 'Client Communication', 9, NOW(), NOW()),
  (gen_random_uuid()::text, 'Internal Review', 10, NOW(), NOW()),
  (gen_random_uuid()::text, 'QA & Testing', 11, NOW(), NOW()),
  (gen_random_uuid()::text, 'Training & Documentation', 12, NOW(), NOW()),
  -- Admin Types
  (gen_random_uuid()::text, 'Account Management', 13, NOW(), NOW()),
  (gen_random_uuid()::text, 'Billing & Finance', 14, NOW(), NOW()),
  (gen_random_uuid()::text, 'Technical Setup', 15, NOW(), NOW())
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 2. STAGE TEMPLATES
-- Default project stages for each service type
-- These auto-apply when a new project is created
-- ============================================================================

-- Clear existing stage templates (optional)
-- DELETE FROM stage_templates;

-- SEO Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SEO', 'Discovery & Audit', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEO', 'Keyword Research & Strategy', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEO', 'Technical SEO Setup', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEO', 'On-Page Optimization', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEO', 'Content Strategy & Production', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEO', 'Link Building & Outreach', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEO', 'Monitoring & Reporting', 7, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEO', 'Ongoing Optimization', 8, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- AEO Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'AEO', 'AI Landscape Audit', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'Brand Presence Analysis', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'Knowledge Base Optimization', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'Structured Data & Schema', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'Content Optimization for AI', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'Citation Building', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'AI Visibility Monitoring', 7, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'Iteration & Scaling', 8, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Web Development Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'Discovery & Requirements', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'Information Architecture', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'Wireframing', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'UI Design', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'Development', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'Content Integration', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'QA & Testing', 7, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'Launch & Handover', 8, NOW(), NOW()),
  (gen_random_uuid()::text, 'WEB_DEVELOPMENT', 'Post-Launch Support', 9, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Paid Media Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'PAID_MEDIA', 'Account Audit & Setup', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'PAID_MEDIA', 'Audience & Market Research', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'PAID_MEDIA', 'Campaign Strategy', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'PAID_MEDIA', 'Creative Development', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'PAID_MEDIA', 'Campaign Build & Launch', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'PAID_MEDIA', 'Optimization & Scaling', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'PAID_MEDIA', 'Reporting & Analysis', 7, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Social Media Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Social Audit & Benchmark', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Strategy & Content Pillars', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Content Calendar Planning', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Content Production', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Community Management Setup', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Publishing & Engagement', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'SOCIAL_MEDIA', 'Analytics & Reporting', 7, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Content Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'CONTENT', 'Content Audit & Gap Analysis', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONTENT', 'Content Strategy', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONTENT', 'Editorial Calendar', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONTENT', 'Content Creation', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONTENT', 'Review & Approval', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONTENT', 'Publishing & Distribution', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONTENT', 'Performance Tracking', 7, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Branding Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'BRANDING', 'Brand Discovery & Research', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRANDING', 'Brand Strategy & Positioning', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRANDING', 'Visual Identity Concepts', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRANDING', 'Logo & Identity Design', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRANDING', 'Brand Collateral', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRANDING', 'Brand Guidelines', 6, NOW(), NOW()),
  (gen_random_uuid()::text, 'BRANDING', 'Brand Rollout & Handover', 7, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Consulting Stages
INSERT INTO stage_templates (id, "serviceType", name, "order", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'CONSULTING', 'Initial Assessment', 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONSULTING', 'Research & Analysis', 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONSULTING', 'Strategy Development', 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONSULTING', 'Recommendations & Roadmap', 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONSULTING', 'Implementation Support', 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'CONSULTING', 'Review & Follow-Up', 6, NOW(), NOW())
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 3. ONBOARDING TEMPLATES
-- These checklists are applied to new clients per service type
-- ============================================================================

-- Clear existing (optional)
-- DELETE FROM onboarding_template_items;
-- DELETE FROM onboarding_templates;

-- -------------------------------------------------------
-- 3.1 GENERAL Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'General Client Setup', 'Essential setup items for every new client', 'GENERAL', 1, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Company Overview & Background', 'Tell us about your business, industry, and competitive landscape', 'TEXT_INPUT', true, 1, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Brand Guidelines & Assets', 'Share your logo files, brand colors, fonts, and style guide', 'CHECKBOX', true, 2, true, 'Collect brand assets from client', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Target Audience & Personas', 'Describe your ideal customers, demographics, and pain points', 'TEXT_INPUT', true, 3, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Business Goals & KPIs', 'What are your top 3-5 goals for the next 6-12 months?', 'TEXT_INPUT', true, 4, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Competitor List', 'List your top 3-5 competitors and why you consider them competitors', 'TEXT_INPUT', true, 5, true, 'Conduct competitor analysis', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Existing Marketing Assets Review', 'Share links to any existing campaigns, reports, or materials', 'URL_INPUT', false, 6, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Communication Preferences', 'Preferred communication channel and meeting cadence', 'TEXT_INPUT', false, 7, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Key Stakeholders & Contacts', 'Who are the decision makers and points of contact?', 'TEXT_INPUT', true, 8, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'NDA / Contract Signed', 'Ensure legal agreements are in place', 'CHECKBOX', true, 9, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Kick-Off Meeting Scheduled', 'Schedule the official project kick-off call', 'CHECKBOX', true, 10, true, 'Schedule kick-off meeting with client', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.2 SEO Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'SEO Onboarding', 'Access and information needed to start SEO work', 'SEO', 2, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Google Search Console Access', 'Grant editor access to search console property', 'URL_INPUT', true, 1, true, 'Verify Google Search Console access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Google Analytics Access', 'Grant editor access to GA4 property', 'URL_INPUT', true, 2, true, 'Verify Google Analytics access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Website CMS Access', 'Provide login credentials or user accounts for the CMS', 'TEXT_INPUT', true, 3, true, 'Test CMS access and permissions', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Current SEO Tool Access', 'Share access to any existing SEO tools (Ahrefs, SEMrush, etc.)', 'TEXT_INPUT', false, 4, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Target Keywords / Topics', 'List your priority keywords or topics you want to rank for', 'TEXT_INPUT', true, 5, true, 'Review and validate target keywords', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Previous SEO Work / Reports', 'Share any existing SEO audits or strategy documents', 'URL_INPUT', false, 6, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Google Business Profile Access', 'Grant manager access to GBP if applicable', 'CHECKBOX', false, 7, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Hosting / DNS Access', 'Provide access for technical SEO changes if needed', 'TEXT_INPUT', false, 8, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Baseline SEO Audit', 'Complete technical, on-page, and off-page audit', 'CHECKBOX', true, 9, true, 'Conduct comprehensive SEO audit', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'SEO Strategy Document', 'Prepare and present the 90-day SEO roadmap', 'CHECKBOX', true, 10, true, 'Create 90-day SEO strategy document', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.3 AEO Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'AEO Onboarding', 'Setup for AI Engine Optimization services', 'AEO', 3, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Brand Information & Messaging', 'Provide your core messaging, value propositions, and USPs', 'TEXT_INPUT', true, 1, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Website URL & Key Pages', 'List your main website and important landing pages', 'URL_INPUT', true, 2, true, 'Map key pages for AI optimization', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Wikipedia / Knowledge Panel Status', 'Do you have a Wikipedia page or Google Knowledge Panel?', 'TEXT_INPUT', false, 3, true, 'Audit existing knowledge panel presence', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Structured Data Status', 'Current schema markup implementation on your website', 'CHECKBOX', true, 4, true, 'Audit current structured data implementation', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Industry-Specific AI Platforms', 'List AI tools/platforms relevant to your industry', 'TEXT_INPUT', false, 5, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'FAQ & Common Questions', 'Provide frequently asked questions about your products/services', 'TEXT_INPUT', true, 6, true, 'Build FAQ knowledge base for AI engines', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'AI Visibility Baseline Audit', 'Test brand mentions across ChatGPT, Perplexity, Gemini, etc.', 'CHECKBOX', true, 7, true, 'Conduct AI visibility baseline audit', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'AEO Strategy Document', 'Prepare the AI optimization roadmap', 'CHECKBOX', true, 8, true, 'Create AEO strategy and roadmap', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.4 Web Development Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'Web Development Onboarding', 'Information and access needed for website projects', 'WEB_DEVELOPMENT', 4, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Current Website URL', 'Your existing website (if applicable)', 'URL_INPUT', false, 1, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Domain Registrar Access', 'Where is your domain registered? (GoDaddy, Namecheap, etc.)', 'TEXT_INPUT', true, 2, true, 'Verify domain registrar access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Hosting Provider Access', 'Current hosting details or preferred hosting platform', 'TEXT_INPUT', true, 3, true, 'Set up hosting environment', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Website Inspiration & References', 'Share 3-5 websites you like and explain why', 'TEXT_INPUT', true, 4, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Sitemap / Page List', 'List all the pages you need on the new site', 'TEXT_INPUT', true, 5, true, 'Create sitemap and information architecture', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Content for Website', 'Provide copy, images, and videos for each page', 'CHECKBOX', true, 6, true, 'Collect all website content from client', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Third-Party Integrations', 'List any tools to integrate (CRM, payment, booking, etc.)', 'TEXT_INPUT', false, 7, true, 'Research and plan third-party integrations', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Email Service / SMTP Setup', 'Current email provider for contact forms', 'TEXT_INPUT', false, 8, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'SSL Certificate', 'Ensure SSL is set up for HTTPS', 'CHECKBOX', true, 9, true, 'Set up SSL certificate', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Analytics & Tracking Setup', 'Set up GA4, GTM, and conversion tracking', 'CHECKBOX', true, 10, true, 'Set up analytics and tracking codes', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.5 Paid Media Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'Paid Media Onboarding', 'Ad account access and campaign setup requirements', 'PAID_MEDIA', 5, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Meta Business Manager Access', 'Grant partner access to your Meta Business Manager', 'URL_INPUT', true, 1, true, 'Verify Meta Business Manager access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Google Ads Account Access', 'Grant manager access to Google Ads MCC', 'URL_INPUT', true, 2, true, 'Verify Google Ads access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Meta Pixel / Conversions API', 'Ensure pixel is installed and events are firing', 'CHECKBOX', true, 3, true, 'Audit and configure Meta Pixel', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Google Tag Manager Access', 'Share GTM container access for conversion tracking', 'URL_INPUT', true, 4, true, 'Set up GTM conversion tracking', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Monthly Ad Budget Confirmed', 'Confirm the monthly advertising spend budget', 'TEXT_INPUT', true, 5, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Target Audience Brief', 'Demographics, interests, behaviors, and locations to target', 'TEXT_INPUT', true, 6, true, 'Build target audience segments', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Creative Assets & Ad Copy', 'Provide images, videos, and approved copy for ads', 'CHECKBOX', true, 7, true, 'Develop initial ad creatives', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Landing Pages Ready', 'Ensure landing pages are live and optimized for conversions', 'URL_INPUT', true, 8, true, 'Audit landing pages for conversion readiness', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'LinkedIn Ads Access', 'Grant admin access to LinkedIn Campaign Manager (if applicable)', 'URL_INPUT', false, 9, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'TikTok Ads Access', 'Grant access to TikTok Ads Manager (if applicable)', 'URL_INPUT', false, 10, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Paid Media Strategy Document', 'Present campaign strategy, targeting, and budget allocation', 'CHECKBOX', true, 11, true, 'Create paid media strategy document', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.6 Social Media Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'Social Media Onboarding', 'Social account access and content setup', 'SOCIAL_MEDIA', 6, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Instagram Account Access', 'Grant admin or content creator access', 'TEXT_INPUT', true, 1, true, 'Verify Instagram account access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Facebook Page Access', 'Grant admin access via Meta Business Manager', 'TEXT_INPUT', true, 2, true, 'Verify Facebook Page access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'LinkedIn Company Page Access', 'Grant admin access to the LinkedIn page', 'TEXT_INPUT', false, 3, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'TikTok Account Access', 'Provide login or invite as collaborator', 'TEXT_INPUT', false, 4, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'X (Twitter) Account Access', 'Provide access if X management is included', 'TEXT_INPUT', false, 5, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Brand Voice & Tone Guide', 'Share your preferred tone (casual, professional, witty, etc.)', 'TEXT_INPUT', true, 6, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Content Pillars & Topics', 'What themes and topics should we focus on?', 'TEXT_INPUT', true, 7, true, 'Define content pillars and themes', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Photo & Video Library', 'Share existing brand photography and video assets', 'CHECKBOX', true, 8, true, 'Collect and organize brand media library', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Hashtag Strategy', 'Any existing hashtags or hashtag preferences?', 'TEXT_INPUT', false, 9, true, 'Research and build hashtag strategy', 'LOW', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Social Media Audit', 'Audit current presence, benchmarks, and competitor analysis', 'CHECKBOX', true, 10, true, 'Conduct social media audit', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Content Calendar Approved', 'First month content calendar reviewed and approved', 'CHECKBOX', true, 11, true, 'Create and present first month content calendar', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.7 Content Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'Content Marketing Onboarding', 'Content strategy and production setup', 'CONTENT', 7, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Blog / CMS Access', 'Grant access to publish and edit blog content', 'TEXT_INPUT', true, 1, true, 'Set up blog CMS access', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Content Guidelines & Style', 'Share any writing guidelines, style preferences, or tone docs', 'TEXT_INPUT', true, 2, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Existing Content Inventory', 'List or link to existing blog posts, guides, whitepapers', 'URL_INPUT', false, 3, true, 'Audit existing content library', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Target Topics & Keywords', 'What topics matter most to your audience?', 'TEXT_INPUT', true, 4, true, 'Build content topic cluster map', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Content Approval Process', 'Who reviews and approves content before publishing?', 'TEXT_INPUT', true, 5, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Email Marketing Platform', 'Access to Mailchimp, HubSpot, or similar (if applicable)', 'TEXT_INPUT', false, 6, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Newsletter Subscriber List', 'Current subscriber count and segmentation info', 'TEXT_INPUT', false, 7, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Content Audit & Gap Analysis', 'Full audit of existing content performance', 'CHECKBOX', true, 8, true, 'Conduct content audit and gap analysis', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Editorial Calendar Created', 'First quarter editorial calendar planned', 'CHECKBOX', true, 9, true, 'Create first quarter editorial calendar', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.8 Branding Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'Branding Onboarding', 'Discovery and assets for brand projects', 'BRANDING', 8, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Brand History & Story', 'Tell us about how and why your brand was founded', 'TEXT_INPUT', true, 1, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Mission, Vision & Values', 'Share your brand mission, vision, and core values', 'TEXT_INPUT', true, 2, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Existing Logo & Brand Assets', 'Share current logo files (AI, EPS, PNG, SVG)', 'CHECKBOX', true, 3, true, 'Collect existing brand assets', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Brand Likes & Dislikes', 'Share examples of brands you admire and ones you dislike', 'TEXT_INPUT', true, 4, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Color Preferences', 'Any colors you love or want to avoid?', 'TEXT_INPUT', false, 5, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Target Market & Positioning', 'How do you want to be perceived in your market?', 'TEXT_INPUT', true, 6, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Deliverables Confirmed', 'Confirm the list of brand deliverables (logo, stationery, social templates, etc.)', 'CHECKBOX', true, 7, true, 'Finalize branding deliverables list', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Brand Discovery Workshop', 'Schedule and conduct the brand discovery session', 'CHECKBOX', true, 8, true, 'Schedule brand discovery workshop', 'HIGH', NOW(), NOW());
END $$;

-- -------------------------------------------------------
-- 3.9 Consulting Onboarding Template
-- -------------------------------------------------------
DO $$
DECLARE
  template_id TEXT := gen_random_uuid()::text;
BEGIN
  INSERT INTO onboarding_templates (id, name, description, "serviceType", "order", "isActive", "createdAt", "updatedAt")
  VALUES (template_id, 'Consulting Onboarding', 'Information gathering for consulting engagements', 'CONSULTING', 9, true, NOW(), NOW());

  INSERT INTO onboarding_template_items (id, "templateId", name, description, "itemType", "isRequired", "order", "autoCreateTask", "taskName", "taskPriority", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, template_id, 'Business Overview Document', 'Provide a brief overview of your business model and revenue streams', 'TEXT_INPUT', true, 1, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Current Marketing Stack', 'List all tools, platforms, and software you currently use', 'TEXT_INPUT', true, 2, true, 'Audit current marketing tech stack', 'MEDIUM', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Previous Marketing Reports', 'Share any existing marketing performance reports or dashboards', 'URL_INPUT', false, 3, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Key Challenges & Pain Points', 'What are the biggest marketing challenges you face?', 'TEXT_INPUT', true, 4, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Budget Overview', 'Current marketing budget allocation across channels', 'TEXT_INPUT', true, 5, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Team Structure', 'Describe your internal marketing team and capabilities', 'TEXT_INPUT', false, 6, false, NULL, NULL, NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Analytics Access', 'Grant read access to analytics platforms for audit purposes', 'CHECKBOX', true, 7, true, 'Set up analytics access for consulting audit', 'HIGH', NOW(), NOW()),
    (gen_random_uuid()::text, template_id, 'Consulting Scope Confirmed', 'Finalize and sign off on the consulting engagement scope', 'CHECKBOX', true, 8, true, 'Finalize consulting scope document', 'HIGH', NOW(), NOW());
END $$;


-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm data was inserted)
-- ============================================================================

-- Check task categories
SELECT COUNT(*) as total_categories FROM task_categories;

-- Check stage templates by service type
SELECT "serviceType", COUNT(*) as stages FROM stage_templates GROUP BY "serviceType" ORDER BY "serviceType";

-- Check onboarding templates and items
SELECT t.name, t."serviceType", COUNT(i.id) as items
FROM onboarding_templates t
LEFT JOIN onboarding_template_items i ON i."templateId" = t.id
GROUP BY t.id, t.name, t."serviceType"
ORDER BY t."order";
