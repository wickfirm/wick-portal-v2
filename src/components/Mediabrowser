'use client';

import { useState, useEffect } from 'react';
import { theme } from '@/lib/theme';
import FileUploader from './FileUploader';

interface Folder {
  id: string;
  name: string;
  path: string;
  _count: {
    files: number;
    subfolders: number;
  };
}

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  uploader: {
    name: string;
  };
}

interface MediaBrowserProps {
  clientId?: string;
  projectId?: string;
  initialFolderId?: string;
}

export default function MediaBrowser({
  clientId,
  projectId,
  initialFolderId,
}: MediaBrowserProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(
    initialFolderId || null
  );
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    loadFolder();
  }, [currentFolderId]);

  const loadFolder = async () => {
    try {
      setLoading(true);

      if (currentFolderId) {
        // Load specific folder
        const res = await fetch(`/api/media/folders/${currentFolderId}`);
        const data = await res.json();
        setFolders(data.subfolders || []);
        setFiles(data.files || []);
      } else {
        // Load root folders
        const params = new URLSearchParams();
        if (clientId) params.append('clientId', clientId);
        if (projectId) params.append('projectId', projectId);

        const res = await fetch(`/api/media/folders?${params}`);
        const data = await res.json();
        setFolders(data.folders || []);
        setFiles([]);
      }
    } catch (error) {
      console.error('Failed to load folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const res = await fetch(`/api/media/download-url/${fileId}`);
      const data = await res.json();

      // Open download in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div style={{ color: theme.colors.textSecondary }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Media Hub</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            {folders.length} folders • {files.length} files
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setView('grid')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'grid' ? theme.colors.primary : 'white',
              color: view === 'grid' ? 'white' : theme.colors.textPrimary,
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'list' ? theme.colors.primary : 'white',
              color: view === 'list' ? 'white' : theme.colors.textPrimary,
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            List
          </button>
          <button
            onClick={() => setShowUploader(!showUploader)}
            style={{
              padding: '0.5rem 1rem',
              background: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + Upload Files
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {showUploader && currentFolderId && (
        <div style={{ marginBottom: '2rem' }}>
          <FileUploader
            folderId={currentFolderId}
            onUploadComplete={() => {
              setShowUploader(false);
              loadFolder();
            }}
          />
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Folders
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
              gap: '1rem',
            }}
          >
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {folder.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                  {folder._count.files} files • {folder._count.subfolders} folders
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Files
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
              gap: '1rem',
            }}
          >
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => handleDownload(file.id)}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {getFileIcon(file.mimeType)}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.originalName}
                </div>
                <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                  {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {folders.length === 0 && files.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: theme.colors.textSecondary,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            This folder is empty
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            {currentFolderId
              ? 'Upload files to get started'
              : 'Create a folder to organize your media'}
          </p>
        </div>
      )}
    </div>
  );
}
