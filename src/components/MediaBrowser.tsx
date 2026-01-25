'use client';

import { useState, useEffect, useRef } from 'react';
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
  tags?: string[];
  description?: string;
  folder?: {
    id: string;
    name: string;
    path: string;
  };
}

interface BreadcrumbItem {
  id: string;
  name: string;
  path: string;
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
  
  // Breadcrumbs
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Drag & Drop for moving files
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  
  // Multi-select
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
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

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadFolder();
    if (currentFolderId) {
      loadBreadcrumbs();
    } else {
      setBreadcrumbs([]);
    }
  }, [currentFolderId]);

  useEffect(() => {
    // Close context menu on click
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

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

  const loadBreadcrumbs = async () => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      return;
    }

    try {
      const res = await fetch(`/api/media/folders/breadcrumbs/${currentFolderId}`);
      const data = await res.json();
      setBreadcrumbs(data.breadcrumbs || []);
    } catch (error) {
      console.error('Failed to load breadcrumbs:', error);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const params = new URLSearchParams({ q: query });
      if (clientId) params.append('clientId', clientId);
      if (projectId) params.append('projectId', projectId);

      const res = await fetch(`/api/media/search?${params}`);
      const data = await res.json();
      setSearchResults(data.files || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setIsSearching(false);
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
        setSelectedFileIds(new Set());
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
        loadBreadcrumbs();
      } else {
        alert('Failed to rename folder');
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
      alert('Failed to rename folder');
    }
  };

  // Multi-select handlers
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFileIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFileIds(newSelected);
  };

  const selectAllFiles = () => {
    setSelectedFileIds(new Set(files.map(f => f.id)));
  };

  const deselectAll = () => {
    setSelectedFileIds(new Set());
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, fileIds: string[]) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedFileIds(fileIds);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);

    if (draggedFileIds.length === 0) return;

    try {
      const res = await fetch('/api/media/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: draggedFileIds,
          targetFolderId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Moved ${data.movedCount} file(s) successfully`);
        loadFolder();
        setDraggedFileIds([]);
        setSelectedFileIds(new Set());
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to move files');
      }
    } catch (error) {
      console.error('Failed to move files:', error);
      alert('Failed to move files');
    }
  };

  const handleBulkMove = async () => {
    if (selectedFileIds.size === 0) {
      alert('No files selected');
      return;
    }

    const targetFolderId = prompt('Enter target folder ID to move selected files:');
    if (!targetFolderId) return;

    try {
      const res = await fetch('/api/media/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: Array.from(selectedFileIds),
          targetFolderId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Moved ${data.movedCount} file(s) successfully`);
        loadFolder();
        setSelectedFileIds(new Set());
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to move files');
      }
    } catch (error) {
      console.error('Failed to move files:', error);
      alert('Failed to move files');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) {
      alert('No files selected');
      return;
    }

    if (!confirm(`Delete ${selectedFileIds.size} selected file(s)?`)) return;

    try {
      await Promise.all(
        Array.from(selectedFileIds).map(fileId =>
          fetch(`/api/media/files/${fileId}`, { method: 'DELETE' })
        )
      );
      loadFolder();
      setSelectedFileIds(new Set());
    } catch (error) {
      console.error('Failed to delete files:', error);
      alert('Failed to delete files');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    return '📄';
  };

  const formatFileSize = (bytes: string) => {
    const num = parseInt(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const displayFiles = showSearchResults ? searchResults : files;

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Media Hub</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {view === 'grid' ? '📋 List' : '⊞ Grid'}
            </button>
            <button
              onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
              style={{
                padding: '0.5rem 1rem',
                background: isMultiSelectMode ? theme.colors.primary : 'white',
                color: isMultiSelectMode ? 'white' : theme.colors.textPrimary,
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ☑️ Multi-Select
            </button>
            {currentFolderId && (
              <button
                onClick={() => setShowUploader(true)}
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
                📤 Upload Files
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Search files by name, tags, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
          {isSearching && (
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.textSecondary,
            }}>
              Searching...
            </div>
          )}
          {showSearchResults && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.25rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && !showSearchResults && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: theme.colors.textSecondary,
          }}>
            <button
              onClick={() => setCurrentFolderId(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.primary,
                textDecoration: 'underline',
              }}
            >
              🏠 Home
            </button>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>/</span>
                {index === breadcrumbs.length - 1 ? (
                  <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{crumb.name}</span>
                ) : (
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.colors.primary,
                      textDecoration: 'underline',
                    }}
                  >
                    {crumb.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Search Results Header */}
        {showSearchResults && (
          <div style={{
            padding: '0.75rem',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '6px',
            fontSize: '0.875rem',
          }}>
            Found {searchResults.length} file(s) matching "{searchQuery}"
          </div>
        )}

        {/* Bulk Actions Bar */}
        {isMultiSelectMode && selectedFileIds.size > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {selectedFileIds.size} file(s) selected
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={deselectAll}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Deselect All
              </button>
              <button
                onClick={handleBulkMove}
                style={{
                  padding: '0.5rem 1rem',
                  background: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                📁 Move Selected
              </button>
              <button
                onClick={handleBulkDelete}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                🗑️ Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploader && currentFolderId && (
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
          onClick={() => setShowUploader(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FileUploader
              folderId={currentFolderId}
              onUploadComplete={() => {
                setShowUploader(false);
                loadFolder();
              }}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: theme.colors.textSecondary }}>
          Loading...
        </div>
      )}

      {/* Folders & Files Grid */}
      {!loading && (
        <div>
          {/* Folders */}
          {!showSearchResults && folders.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
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
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    style={{
                      background: dragOverFolderId === folder.id ? '#F0F9FF' : 'white',
                      border: dragOverFolderId === folder.id ? '2px dashed ' + theme.colors.primary : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: '0.25rem',
                        fontSize: '0.875rem',
                      }}
                    >
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
          {displayFiles.length > 0 && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  Files {showSearchResults && `(${displayFiles.length} results)`}
                </h2>
                {isMultiSelectMode && !showSearchResults && (
                  <button
                    onClick={selectAllFiles}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Select All
                  </button>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr',
                  gap: '1rem',
                }}
              >
                {displayFiles.map((file) => (
                  <div
                    key={file.id}
                    draggable={!showSearchResults && (isMultiSelectMode ? selectedFileIds.has(file.id) : true)}
                    onDragStart={(e) => {
                      const filesToDrag = isMultiSelectMode && selectedFileIds.has(file.id)
                        ? Array.from(selectedFileIds)
                        : [file.id];
                      handleDragStart(e, filesToDrag);
                    }}
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
                      background: selectedFileIds.has(file.id) ? '#F0F9FF' : 'white',
                      border: selectedFileIds.has(file.id) ? '2px solid ' + theme.colors.primary : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onClick={(e) => {
                      if (isMultiSelectMode) {
                        toggleFileSelection(file.id);
                      } else {
                        handlePreview(file);
                      }
                    }}
                  >
                    {isMultiSelectMode && (
                      <input
                        type="checkbox"
                        checked={selectedFileIds.has(file.id)}
                        onChange={() => {}}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          width: '1.25rem',
                          height: '1.25rem',
                          cursor: 'pointer',
                        }}
                      />
                    )}
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
                    {showSearchResults && file.folder && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: theme.colors.primary,
                        marginTop: '0.25rem',
                      }}>
                        📁 {file.folder.name}
                      </div>
                    )}
                    {file.tags && file.tags.length > 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.25rem',
                      }}>
                        {file.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.625rem',
                              padding: '0.125rem 0.375rem',
                              background: '#F3F4F6',
                              borderRadius: '4px',
                              color: theme.colors.textSecondary,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && folders.length === 0 && displayFiles.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: theme.colors.textSecondary,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {showSearchResults ? '🔍' : '📂'}
          </div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            {showSearchResults
              ? `No files found for "${searchQuery}"`
              : 'This folder is empty'}
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            {showSearchResults
              ? 'Try a different search query'
              : currentFolderId
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
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Rename {renameModal.type === 'file' ? 'File' : 'Folder'}
            </h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (renameModal.type === 'file') {
                    handleRenameFile();
                  } else {
                    handleRenameFolder();
                  }
                }
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRenameModal(null)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (renameModal.type === 'file') {
                    handleRenameFile();
                  } else {
                    handleRenameFolder();
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Rename
              </button>
            </div>
          </div>
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
          }}
          onClick={() => {
            setPreviewFile(null);
            setPreviewUrl(null);
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{previewFile.originalName}</h3>
              <button
                onClick={() => {
                  setPreviewFile(null);
                  setPreviewUrl(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            
            {previewFile.mimeType.startsWith('image/') && (
              <img
                src={previewUrl}
                alt={previewFile.originalName}
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            )}
            
            {previewFile.mimeType.startsWith('video/') && (
              <video
                src={previewUrl}
                controls
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            )}
            
            {previewFile.mimeType === 'application/pdf' && (
              <iframe
                src={previewUrl}
                style={{ width: '80vw', height: '70vh', border: 'none' }}
              />
            )}
            
            {!previewFile.mimeType.startsWith('image/') &&
             !previewFile.mimeType.startsWith('video/') &&
             previewFile.mimeType !== 'application/pdf' && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ marginBottom: '1rem' }}>Preview not available for this file type</p>
                <button
                  onClick={() => handleDownload(previewFile.id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Download File
                </button>
              </div>
            )}

            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: theme.colors.textSecondary }}>
              <div>Size: {formatFileSize(previewFile.size)}</div>
              <div>Uploaded: {formatDate(previewFile.uploadedAt)}</div>
              <div>Uploader: {previewFile.uploader.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
