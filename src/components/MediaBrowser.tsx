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
  
  // Preview modal
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    type: 'file' | 'folder';
    id: string;
    name: string;
    x: number;
    y: number;
  } | null>(null);
  
  // Rename modal state
  const [renameModal, setRenameModal] = useState<{
    type: 'file' | 'folder';
    id: string;
    currentName: string;
  } | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadFolder();
  }, [currentFolderId]);

  useEffect(() => {
    // Close context menu on click
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadFolder = async () => {
    try {
      setLoading(true);

      if (currentFolderId) {
        const res = await fetch(`/api/media/folders/${currentFolderId}`);
        const data = await res.json();
        setFolders(data.subfolders || []);
        setFiles(data.files || []);
      } else {
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

  const handlePreview = async (file: MediaFile) => {
    try {
      const res = await fetch(`/api/media/download-url/${file.id}`);
      const data = await res.json();
      setPreviewFile(file);
      setPreviewUrl(data.downloadUrl);
    } catch (error) {
      console.error('Failed to get preview URL:', error);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const res = await fetch(`/api/media/download-url/${fileId}`);
      const data = await res.json();
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const res = await fetch(`/api/media/files/${fileId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadFolder();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? It must be empty.')) return;

    try {
      const res = await fetch(`/api/media/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadFolder();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
      alert('Failed to delete folder');
    }
  };

  const handleRenameFile = async () => {
    if (!renameModal || !newName.trim()) return;

    try {
      const res = await fetch(`/api/media/files/${renameModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: newName,
        }),
      });

      if (res.ok) {
        setRenameModal(null);
        setNewName('');
        loadFolder();
      } else {
        alert('Failed to rename file');
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
      alert('Failed to rename file');
    }
  };

  const handleRenameFolder = async () => {
    if (!renameModal || !newName.trim()) return;

    try {
      const res = await fetch(`/api/media/folders/${renameModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
        }),
      });

      if (res.ok) {
        setRenameModal(null);
        setNewName('');
        loadFolder();
      } else {
        alert('Failed to rename folder');
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
      alert('Failed to rename folder');
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
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType === 'text/plain') return '📃';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    type: 'folder',
                    id: folder.id,
                    name: folder.name,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    type: 'file',
                    id: file.id,
                    name: file.originalName,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                style={{
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                }}
                onClick={() => handlePreview(file)}
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '150px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'file' && (
            <>
              <button
                onClick={() => {
                  const file = files.find(f => f.id === contextMenu.id);
                  if (file) handlePreview(file);
                  setContextMenu(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                👁️ Preview
              </button>
              <button
                onClick={() => {
                  handleDownload(contextMenu.id);
                  setContextMenu(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ⬇️ Download
              </button>
            </>
          )}
          <button
            onClick={() => {
              setRenameModal({
                type: contextMenu.type,
                id: contextMenu.id,
                currentName: contextMenu.name,
              });
              setNewName(contextMenu.name);
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✏️ Rename
          </button>
          <button
            onClick={() => {
              if (contextMenu.type === 'file') {
                handleDeleteFile(contextMenu.id);
              } else {
                handleDeleteFolder(contextMenu.id);
              }
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#EF4444',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEF2F2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && previewUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
          onClick={() => {
            setPreviewFile(null);
            setPreviewUrl(null);
          }}
        >
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setPreviewFile(null);
                setPreviewUrl(null);
              }}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {/* File name */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                left: '0',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                maxWidth: 'calc(100% - 50px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {previewFile.originalName}
            </div>

            {/* Preview content */}
            {previewFile.mimeType.startsWith('image/') && (
              <img
                src={previewUrl}
                alt={previewFile.originalName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                }}
              />
            )}
            
            {previewFile.mimeType.startsWith('video/') && (
              <video
                src={previewUrl}
                controls
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                }}
              />
            )}
            
            {previewFile.mimeType === 'application/pdf' && (
              <object
                data={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                type="application/pdf"
                style={{
                  width: '80vw',
                  height: '90vh',
                  border: 'none',
                }}
              >
                <p style={{ padding: '2rem', background: 'white', borderRadius: '8px' }}>
                  PDF preview not available in this browser.{' '}
                  <button
                    onClick={() => window.open(previewUrl, '_blank')}
                    style={{
                      color: theme.colors.primary,
                      background: 'none',
                      border: 'none',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Open in new tab
                  </button>
                </p>
              </object>
            )}

            {!previewFile.mimeType.startsWith('image/') &&
             !previewFile.mimeType.startsWith('video/') &&
             previewFile.mimeType !== 'application/pdf' && (
              <div
                style={{
                  background: 'white',
                  padding: '3rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {getFileIcon(previewFile.mimeType)}
                </div>
                <p style={{ marginBottom: '1rem' }}>
                  Preview not available for this file type
                </p>
                <button
                  onClick={() => handleDownload(previewFile.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Download File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setRenameModal(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Rename {renameModal.type === 'file' ? 'File' : 'Folder'}
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}
              >
                New Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRenameModal(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={renameModal.type === 'file' ? handleRenameFile : handleRenameFolder}
                disabled={!newName.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !newName.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: !newName.trim() ? 0.5 : 1,
                }}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
