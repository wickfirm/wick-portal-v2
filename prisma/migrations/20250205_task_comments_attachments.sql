-- Migration: Add Task Comments and Attachments System
-- Run this in your production database

-- 1. Create task_comments table
CREATE TABLE IF NOT EXISTS "task_comments" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "task_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- 2. Create task_comment_attachments table
CREATE TABLE IF NOT EXISTS "task_comment_attachments" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "comment_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "r2_key" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_comment_attachments_pkey" PRIMARY KEY ("id")
);

-- 3. Create task_attachments table
CREATE TABLE IF NOT EXISTS "task_attachments" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "task_id" TEXT NOT NULL,
    "media_file_id" TEXT,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "r2_key" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- 4. Add foreign key constraints for task_comments
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "client_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "task_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Add foreign key constraints for task_comment_attachments
ALTER TABLE "task_comment_attachments" ADD CONSTRAINT "task_comment_attachments_comment_id_fkey"
    FOREIGN KEY ("comment_id") REFERENCES "task_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_comment_attachments" ADD CONSTRAINT "task_comment_attachments_uploaded_by_fkey"
    FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Add foreign key constraints for task_attachments
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "client_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_media_file_id_fkey"
    FOREIGN KEY ("media_file_id") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_fkey"
    FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS "task_comments_task_id_idx" ON "task_comments"("task_id");
CREATE INDEX IF NOT EXISTS "task_comments_author_id_idx" ON "task_comments"("author_id");
CREATE INDEX IF NOT EXISTS "task_comments_parent_id_idx" ON "task_comments"("parent_id");
CREATE INDEX IF NOT EXISTS "task_comments_created_at_idx" ON "task_comments"("created_at");

CREATE INDEX IF NOT EXISTS "task_comment_attachments_comment_id_idx" ON "task_comment_attachments"("comment_id");
CREATE INDEX IF NOT EXISTS "task_comment_attachments_uploaded_by_idx" ON "task_comment_attachments"("uploaded_by");

CREATE INDEX IF NOT EXISTS "task_attachments_task_id_idx" ON "task_attachments"("task_id");
CREATE INDEX IF NOT EXISTS "task_attachments_media_file_id_idx" ON "task_attachments"("media_file_id");
CREATE INDEX IF NOT EXISTS "task_attachments_uploaded_by_idx" ON "task_attachments"("uploaded_by");
