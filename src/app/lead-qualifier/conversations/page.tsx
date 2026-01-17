// /src/app/lead-qualifier/conversations/page.tsx
// Conversations list page

'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { LeadQualifierNav, Breadcrumbs } from '@/components/LeadQualifierNav';

interface Conversation {
  id: string;
  visitorId: string;
  channel: string;
  status: string;
  leadScore: number | null;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
  lead?: {
    name: string;
    email: string;
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      const res = await fetch('/api/lead-qualifier/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredConversations = filter === 'ALL' 
    ? conversations 
    : conversations.filter(c => c.status === filter);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading conversations...</p>
      </div>
    );
  }

  return (
    <>
      <LeadQualifierNav />
      <div style={{ padding: '0 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: 'Lead Qualifier', href: '/lead-qualifier' },
          { label: 'Conversations' },
        ]} />

        {/* Header */}
        <div style={{ 
          marginBottom: '2rem' 
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: theme.colors.textPrimary,
          }}>
            Conversations
          </h1>
        </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        {['ALL', 'ACTIVE', 'QUALIFIED', 'DISQUALIFIED', 'BOOKED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '0.5rem 1rem',
              background: filter === status ? theme.colors.primary : theme.colors.bgSecondary,
              color: filter === status ? 'white' : theme.colors.textPrimary,
              border: `1px solid ${filter === status ? theme.colors.primary : theme.colors.borderLight}`,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div style={{
        background: theme.colors.bgSecondary,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.borderLight}`,
        overflow: 'hidden',
      }}>
        {filteredConversations.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Visitor / Lead</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Channel</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Score</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Messages</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((conv) => (
                <tr key={conv.id} style={{ borderTop: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={{ padding: '1rem' }}>
                    {conv.lead ? (
                      <div>
                        <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>{conv.lead.name}</p>
                        <p style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>{conv.lead.email}</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
                        {conv.visitorId.slice(0, 12)}...
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: theme.colors.bgTertiary,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                    }}>
                      {conv.channel}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <StatusBadge status={conv.status} />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {conv.leadScore ? (
                      <span style={{
                        fontWeight: '600',
                        color: conv.leadScore >= 70 ? theme.colors.success : 
                               conv.leadScore >= 40 ? theme.colors.warning : 
                               theme.colors.textSecondary,
                      }}>
                        {conv.leadScore}
                      </span>
                    ) : (
                      <span style={{ color: theme.colors.textMuted }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {conv.messagesCount}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: theme.colors.textSecondary }}>
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Link
                      href={`/lead-qualifier/conversations/${conv.id}`}
                      style={{
                        padding: '0.5rem 1rem',
                        background: theme.colors.bgTertiary,
                        color: theme.colors.textPrimary,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '0.75rem',
                        textDecoration: 'none',
                      }}
                    >
                      View Chat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem',
            color: theme.colors.textSecondary 
          }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No conversations found</p>
            <p>Conversations will appear here when visitors chat with the AI</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: theme.colors.infoBg, text: theme.colors.info },
    QUALIFIED: { bg: theme.colors.successBg, text: theme.colors.success },
    DISQUALIFIED: { bg: theme.colors.warningBg, text: theme.colors.warning },
    BOOKED: { bg: theme.colors.primaryBg, text: theme.colors.primary },
  };

  const style = colors[status] || colors.ACTIVE;

  return (
    <span style={{
      padding: '0.25rem 0.75rem',
      borderRadius: theme.borderRadius.sm,
      fontSize: '0.75rem',
      fontWeight: '500',
      background: style.bg,
      color: style.text,
    }}>
      {status}
    </span>
  );
}
