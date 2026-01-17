// /src/app/lead-qualifier/page.tsx
// AI Lead Qualifier Overview Dashboard

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';

interface DashboardStats {
  totalConversations: number;
  qualifiedLeads: number;
  conversionRate: number;
  avgLeadScore: number;
  recentConversations: Array<{
    id: string;
    visitorId: string;
    status: string;
    leadScore: number | null;
    messagesCount: number;
    createdAt: string;
  }>;
}

export default function LeadQualifierPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/lead-qualifier/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Use placeholder data if API not ready
        setStats({
          totalConversations: 0,
          qualifiedLeads: 0,
          conversionRate: 0,
          avgLeadScore: 0,
          recentConversations: [],
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        totalConversations: 0,
        qualifiedLeads: 0,
        conversionRate: 0,
        avgLeadScore: 0,
        recentConversations: [],
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: theme.colors.textPrimary,
            marginBottom: '0.5rem'
          }}>
            AI Lead Qualifier
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Qualify leads automatically with AI-powered conversations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/lead-qualifier/settings"
            style={{
              padding: '0.75rem 1.5rem',
              background: theme.colors.bgTertiary,
              color: theme.colors.textPrimary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            ⚙️ Settings
          </Link>
          <button
            onClick={() => setTestMode(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            🧪 Test Chat
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <StatCard
          title="Total Conversations"
          value={stats?.totalConversations || 0}
          icon="💬"
        />
        <StatCard
          title="Qualified Leads"
          value={stats?.qualifiedLeads || 0}
          icon="✅"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats?.conversionRate || 0}%`}
          icon="📈"
        />
        <StatCard
          title="Avg Lead Score"
          value={stats?.avgLeadScore || 0}
          icon="🎯"
        />
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <QuickActionCard
          title="Conversations"
          description="View all chat conversations"
          href="/lead-qualifier/conversations"
          icon="💬"
        />
        <QuickActionCard
          title="Qualified Leads"
          description="Manage qualified leads"
          href="/lead-qualifier/leads"
          icon="👥"
        />
        <QuickActionCard
          title="Analytics"
          description="Performance insights"
          href="/lead-qualifier/analytics"
          icon="📊"
        />
      </div>

      {/* Recent Conversations */}
      <section style={{
        background: theme.colors.bgSecondary,
        padding: '1.5rem',
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.borderLight}`,
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.colors.textPrimary,
          marginBottom: '1rem'
        }}>
          Recent Conversations
        </h2>

        {stats?.recentConversations && stats.recentConversations.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Visitor</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Score</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Messages</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentConversations.map((conv) => (
                <tr key={conv.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {conv.visitorId.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <StatusBadge status={conv.status} />
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {conv.leadScore ?? '-'}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {conv.messagesCount}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: theme.colors.textSecondary }}>
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: theme.colors.textSecondary 
          }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No conversations yet</p>
            <p>Start a test chat to see how the AI qualifier works</p>
          </div>
        )}
      </section>

      {/* Test Chat Modal */}
      {testMode && (
        <TestChatModal onClose={() => setTestMode(false)} />
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div style={{
      background: theme.colors.bgSecondary,
      padding: '1.5rem',
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.borderLight}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ 
            fontSize: '0.875rem', 
            color: theme.colors.textSecondary,
            marginBottom: '0.5rem' 
          }}>
            {title}
          </p>
          <p style={{ 
            fontSize: '2rem', 
            fontWeight: '600',
            color: theme.colors.textPrimary 
          }}>
            {value}
          </p>
        </div>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, href, icon }: { 
  title: string; 
  description: string; 
  href: string; 
  icon: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        background: theme.colors.bgSecondary,
        padding: '1.5rem',
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.borderLight}`,
        textDecoration: 'none',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>{icon}</span>
      <h3 style={{ 
        fontSize: '1rem', 
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: '0.25rem'
      }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
        {description}
      </p>
    </Link>
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

function TestChatModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
          agencyId: null, // Will use default/first agency config
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to get response');
      }

      setConversationId(data.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: theme.colors.bgPrimary,
        borderRadius: theme.borderRadius.lg,
        width: '100%',
        maxWidth: '500px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Test Chat</h3>
            <p style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
              Test the AI lead qualifier
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: theme.colors.textSecondary,
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {messages.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: theme.colors.textSecondary,
              marginTop: '2rem'
            }}>
              <p>👋 Start a conversation!</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Try: "I'm looking for help with SEO"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: theme.borderRadius.md,
                background: msg.role === 'user' ? theme.colors.primary : theme.colors.bgSecondary,
                color: msg.role === 'user' ? 'white' : theme.colors.textPrimary,
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgSecondary,
                color: theme.colors.textSecondary,
              }}>
                Typing...
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: theme.borderRadius.md,
              background: theme.colors.errorBg,
              color: theme.colors.error,
              fontSize: '0.875rem',
            }}>
              Error: {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: '1rem',
          borderTop: `1px solid ${theme.colors.borderLight}`,
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading || !input.trim() ? theme.colors.textMuted : theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
