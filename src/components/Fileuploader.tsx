'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { theme } from '@/lib/theme';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

interface FileUploaderProps {
  folderId: string;
  onUploadComplete?: (fileIds: string[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
}

export default function FileUploader({
  folderId,
  onUploadComplete,
  maxFiles = 10,
  maxSizeBytes = 5 * 1024 * 1024 * 1024, // 5GB
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    try {
      // Get presigned upload URL
      const urlResponse = await fetch('/api/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileId } = await urlResponse.json();

      // Upload directly to R2 with progress tracking
      const xhr = new XMLHttpRequest();

      return new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploads((prev) =>
              prev.map((u) =>
                u.file === file ? { ...u, progress } : u
              )
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((prev) =>
              prev.map((u) =>
                u.file === file
                  ? { ...u, status: 'complete', progress: 100 }
                  : u
              )
            );
            resolve(fileId);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.file === file
            ? {
                ...u,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : u
        )
      );
      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Validate file count
      if (acceptedFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file sizes
      const oversized = acceptedFiles.filter((f) => f.size > maxSizeBytes);
      if (oversized.length > 0) {
        alert(
          `Files too large: ${oversized.map((f) => f.name).join(', ')}\nMax size: ${Math.round(maxSizeBytes / 1024 / 1024 / 1024)}GB`
        );
        return;
      }

      setIsUploading(true);

      // Initialize upload tracking
      const newUploads: FileUploadProgress[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'uploading',
      }));
      setUploads(newUploads);

      // Upload all files
      try {
        const fileIds = await Promise.all(
          acceptedFiles.map((file) => uploadFile(file))
        );
        onUploadComplete?.(fileIds);
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [folderId, maxFiles, maxSizeBytes, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <div>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? theme.colors.primary : '#E5E7EB'}`,
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          background: isDragActive ? `${theme.colors.primary}08` : '#F9FAFB',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
        <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
          or click to browse • Max {maxFiles} files • Up to{' '}
          {Math.round(maxSizeBytes / 1024 / 1024 / 1024)}GB each
        </p>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Uploading {uploads.length} file{uploads.length > 1 ? 's' : ''}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {uploads.map((upload, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {upload.status === 'complete'
                        ? '✅'
                        : upload.status === 'error'
                        ? '❌'
                        : '⏳'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {upload.file.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: theme.colors.textSecondary,
                        }}
                      >
                        {formatFileSize(upload.file.size)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {upload.status === 'error'
                      ? upload.error
                      : `${upload.progress}%`}
                  </div>
                </div>
                {upload.status === 'uploading' && (
                  <div
                    style={{
                      height: '4px',
                      background: '#E5E7EB',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: theme.colors.primary,
                        width: `${upload.progress}%`,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
