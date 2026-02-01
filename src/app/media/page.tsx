'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import MediaBrowser from '@/components/MediaBrowser';
import { theme } from '@/lib/theme';

export default function MediaHubPage() {
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderName,
          clientId: selectedClient,
        }),
      });

      if (res.ok) {
        setShowCreateFolder(false);
        setFolderName('');
        // Refresh page
        window.location.reload();
      } else {
        alert('Failed to create folder');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.bgPrimary }}>
      <Header />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', fontWeight: 400, marginBottom: '0.5rem' }}>
            Media Hub
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Store, organize, and share large media files with clients
          </p>
        </div>

        {/* Create Folder Button */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setShowCreateFolder(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Create Folder
          </button>
        </div>

        {/* Create Folder Modal */}
        {showCreateFolder && (
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
            onClick={() => setShowCreateFolder(false)}
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
                Create New Folder
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
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Baladna 2024 Photoshoot"
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
                  onClick={() => setShowCreateFolder(false)}
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
                  onClick={handleCreateFolder}
                  disabled={creating || !folderName.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: creating || !folderName.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: creating || !folderName.trim() ? 0.5 : 1,
                  }}
                >
                  {creating ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Browser */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
          }}
        >
          <MediaBrowser clientId={selectedClient} />
        </div>
      </div>
    </div>
  );
}
