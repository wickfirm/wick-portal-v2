'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MediaBrowser from '@/components/MediaBrowser';
import { theme } from '@/lib/theme';

const icons = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

export default function MediaHubPage() {
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

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

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 48px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, ...anim(0.05) }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: '0 0 4px 0' }}>
              Media Hub
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
              Store, organize, and share large media files with clients
            </p>
          </div>
          <button
            onClick={() => setShowCreateFolder(true)}
            style={{
              padding: '10px 22px',
              background: theme.gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: theme.shadows.button,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {icons.plus} Create Folder
          </button>
        </div>

        {/* Create Folder Modal */}
        {showCreateFolder && (
          <>
            <div
              onClick={() => setShowCreateFolder(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: theme.colors.bgSecondary,
                borderRadius: 16,
                padding: 32,
                maxWidth: 500,
                width: '90%',
                zIndex: 1001,
                boxShadow: theme.shadows.lg,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
                Create New Folder
              </h3>
              <p style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 24 }}>
                Organize your media files into folders
              </p>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g., Baladna 2024 Photoshoot"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 10,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                    background: theme.colors.bgPrimary,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box' as const,
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
                  onBlur={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreateFolder(false)}
                  style={{
                    padding: '10px 22px',
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 10,
                    background: theme.colors.bgSecondary,
                    color: theme.colors.textSecondary,
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 13,
                    transition: 'all 0.15s ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={creating || !folderName.trim()}
                  style={{
                    padding: '10px 22px',
                    background: creating || !folderName.trim() ? theme.colors.bgTertiary : theme.gradients.primary,
                    color: creating || !folderName.trim() ? theme.colors.textMuted : 'white',
                    border: 'none',
                    borderRadius: 10,
                    cursor: creating || !folderName.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                    fontSize: 13,
                    boxShadow: creating || !folderName.trim() ? 'none' : theme.shadows.button,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {creating ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Media Browser */}
        <div style={{ ...anim(0.1) }}>
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 14,
            border: `1px solid ${theme.colors.borderLight}`,
            overflow: 'hidden',
          }}>
            <MediaBrowser clientId={selectedClient} />
          </div>
        </div>
      </main>
    </div>
  );
}
