// /src/lib/r2-client.ts
// Cloudflare R2 Storage Client

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'omnixia-media';

export interface UploadUrlOptions {
  key: string;
  contentType: string;
  maxSize?: number; // in bytes
  expiresIn?: number; // in seconds
}

export interface DownloadUrlOptions {
  key: string;
  expiresIn?: number; // in seconds
  downloadFilename?: string;
}

/**
 * Generate presigned URL for direct browser-to-R2 upload
 * This bypasses Vercel's function size limits
 */
export async function generateUploadUrl(options: UploadUrlOptions): Promise<string> {
  const { key, contentType, expiresIn = 3600 } = options;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, {
    expiresIn,
  });

  return url;
}

/**
 * Generate presigned URL for downloading a file
 */
export async function generateDownloadUrl(options: DownloadUrlOptions): Promise<string> {
  const { key, expiresIn = 3600, downloadFilename } = options;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: downloadFilename
      ? `attachment; filename="${downloadFilename}"`
      : undefined,
  });

  const url = await getSignedUrl(r2Client, command, {
    expiresIn,
  });

  return url;
}

/**
 * Generate presigned URL for streaming/viewing a file inline (no download disposition)
 * Use this for videos, images, etc. that should be displayed in the browser
 */
export async function generateStreamUrl(options: { key: string; expiresIn?: number }): Promise<string> {
  const { key, expiresIn = 3600 } = options;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    // No ResponseContentDisposition - allows inline display
  });

  const url = await getSignedUrl(r2Client, command, {
    expiresIn,
  });

  return url;
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Check if a file exists in R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get file metadata from R2
 */
export async function getFileMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);
  
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
    etag: response.ETag,
  };
}

/**
 * Generate R2 key path for a file
 * Format: agency-{slug}/client-{id}/folder-{id}/{uuid}-{filename}
 */
export function generateR2Key(params: {
  agencySlug: string;
  clientId?: string;
  folderId: string;
  filename: string;
  uuid: string;
}): string {
  const { agencySlug, clientId, folderId, filename, uuid } = params;
  
  // Sanitize filename
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  const parts = [
    `agency-${agencySlug}`,
  ];
  
  if (clientId) {
    parts.push(`client-${clientId}`);
  }
  
  parts.push(`folder-${folderId}`);
  parts.push(`${uuid}-${sanitized}`);
  
  return parts.join('/');
}

/**
 * Get public URL for a file (if bucket is public)
 * For private buckets, use generateDownloadUrl instead
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL not configured');
  }
  return `${publicUrl}/${key}`;
}

export default r2Client;
