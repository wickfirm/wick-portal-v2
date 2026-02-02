-- Migration: Seed ServiceTypeOption table with existing enum values
-- Run this AFTER running: npx prisma db push (or npx prisma migrate dev)
-- This creates the dynamic service type records that replace the hardcoded enum

INSERT INTO service_type_options (id, name, slug, icon, color, "order", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'SEO', 'SEO', '🔍', '#10B981', 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'AEO', 'AEO', '🤖', '#6366F1', 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Web Development', 'WEB_DEVELOPMENT', '💻', '#3B82F6', 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Paid Media', 'PAID_MEDIA', '📢', '#F59E0B', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Social Media', 'SOCIAL_MEDIA', '📱', '#EC4899', 5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Content', 'CONTENT', '✍️', '#8B5CF6', 6, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Branding', 'BRANDING', '🎨', '#F97316', 7, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'Consulting', 'CONSULTING', '💼', '#14B8A6', 8, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- NOTE: The API also auto-seeds on first GET request if the table is empty.
-- This SQL is provided as an alternative for manual database setup.
