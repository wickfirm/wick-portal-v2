-- ==========================================
-- PROPOSALS MODULE - Supabase Migration
-- Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Create Enums
CREATE TYPE "proposal_status" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Step 2: Create Tables

-- Proposals (main table)
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "agency_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "brief_source" TEXT,
    "brief_content" TEXT,
    "brief_attachments" JSONB,
    "extracted_data" JSONB,
    "title" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "status" "proposal_status" NOT NULL DEFAULT 'DRAFT',
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "sections" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2),
    "tax_amount" DECIMAL(10,2),
    "discount_type" TEXT,
    "discount_value" DECIMAL(10,2),
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "startup_price" DECIMAL(10,2),
    "startup_months" INTEGER,
    "ongoing_price" DECIMAL(10,2),
    "payment_terms" JSONB,
    "payment_schedule" TEXT,
    "password" TEXT,
    "public_token" TEXT,
    "expires_at" TIMESTAMP(6),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(6),
    "time_per_section" JSONB,
    "signed_at" TIMESTAMP(6),
    "signed_by" TEXT,
    "signed_email" TEXT,
    "signature_data" TEXT,
    "signed_ip_address" TEXT,
    "signed_user_agent" TEXT,
    "payment_required" BOOLEAN NOT NULL DEFAULT false,
    "payment_status" "payment_status",
    "stripe_account_id" TEXT,
    "payment_intent_id" TEXT,
    "paid_at" TIMESTAMP(6),
    "paid_amount" DECIMAL(10,2),
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_id" TEXT,
    "created_by" TEXT NOT NULL,
    "sent_at" TIMESTAMP(6),
    "accepted_at" TIMESTAMP(6),
    "declined_at" TIMESTAMP(6),
    "declined_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- Proposal line items (services, deliverables, add-ons)
CREATE TABLE "proposal_items" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "proposal_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "description" TEXT,
    "description_ar" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estimated_hours" DECIMAL(10,2),
    "timeline" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "is_selected" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- Client questions/feedback per section
CREATE TABLE "proposal_comments" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "proposal_id" TEXT NOT NULL,
    "section_id" TEXT,
    "item_id" TEXT,
    "author" TEXT NOT NULL,
    "author_email" TEXT,
    "author_type" TEXT NOT NULL DEFAULT 'CLIENT',
    "content" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_comments_pkey" PRIMARY KEY ("id")
);

-- Audit trail (sent, viewed, signed, paid, etc.)
CREATE TABLE "proposal_activities" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "proposal_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "performed_by" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_activities_pkey" PRIMARY KEY ("id")
);

-- Reusable proposal templates
CREATE TABLE "proposal_templates" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "agency_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_type" TEXT NOT NULL,
    "industry" TEXT,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "default_items" JSONB,
    "default_currency" TEXT NOT NULL DEFAULT 'AED',
    "default_payment_terms" JSONB,
    "default_language" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_templates_pkey" PRIMARY KEY ("id")
);

-- Service packages (your 5-tier pricing: Entry Level → Enterprise)
CREATE TABLE "service_packages" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "agency_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 0,
    "tagline" TEXT,
    "tagline_ar" TEXT,
    "description" TEXT,
    "description_ar" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "startup_price" DECIMAL(10,2),
    "startup_months" INTEGER DEFAULT 3,
    "services" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create Indexes

-- Proposals indexes
CREATE UNIQUE INDEX "proposals_public_token_key" ON "proposals"("public_token");
CREATE INDEX "proposals_agency_id_idx" ON "proposals"("agency_id");
CREATE INDEX "proposals_client_id_idx" ON "proposals"("client_id");
CREATE INDEX "proposals_status_idx" ON "proposals"("status");
CREATE INDEX "proposals_created_by_idx" ON "proposals"("created_by");
CREATE INDEX "proposals_public_token_idx" ON "proposals"("public_token");
CREATE INDEX "proposals_created_at_idx" ON "proposals"("created_at");

-- Proposal items indexes
CREATE INDEX "proposal_items_proposal_id_idx" ON "proposal_items"("proposal_id");
CREATE INDEX "proposal_items_type_idx" ON "proposal_items"("type");
CREATE INDEX "proposal_items_category_idx" ON "proposal_items"("category");

-- Proposal comments indexes
CREATE INDEX "proposal_comments_proposal_id_idx" ON "proposal_comments"("proposal_id");

-- Proposal activities indexes
CREATE INDEX "proposal_activities_proposal_id_idx" ON "proposal_activities"("proposal_id");
CREATE INDEX "proposal_activities_action_idx" ON "proposal_activities"("action");
CREATE INDEX "proposal_activities_created_at_idx" ON "proposal_activities"("created_at");

-- Proposal templates indexes
CREATE INDEX "proposal_templates_agency_id_idx" ON "proposal_templates"("agency_id");
CREATE INDEX "proposal_templates_project_type_idx" ON "proposal_templates"("project_type");
CREATE INDEX "proposal_templates_is_active_idx" ON "proposal_templates"("is_active");

-- Service packages indexes
CREATE INDEX "service_packages_agency_id_idx" ON "service_packages"("agency_id");
CREATE INDEX "service_packages_is_active_idx" ON "service_packages"("is_active");
CREATE INDEX "service_packages_tier_idx" ON "service_packages"("tier");

-- Step 4: Foreign Keys

-- Proposals → clients, agencies, users, self-referencing for revisions
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_agency_id_fkey"
    FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Proposal items → proposals (cascade delete)
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_fkey"
    FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Proposal comments → proposals (cascade delete)
ALTER TABLE "proposal_comments" ADD CONSTRAINT "proposal_comments_proposal_id_fkey"
    FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Proposal activities → proposals (cascade delete)
ALTER TABLE "proposal_activities" ADD CONSTRAINT "proposal_activities_proposal_id_fkey"
    FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Service packages → agencies
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_agency_id_fkey"
    FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Enable Row Level Security (optional but recommended for Supabase)
-- ALTER TABLE "proposals" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "proposal_items" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "proposal_comments" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "proposal_activities" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "proposal_templates" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "service_packages" ENABLE ROW LEVEL SECURITY;
