// /src/app/lead-qualifier/page.tsx
// AI Lead Qualifier Overview Dashboard

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { LeadQualifierNav } from '@/components/LeadQualifierNav';

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
      <>
        <LeadQualifierNav />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: theme.colors.textSecondary,
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${theme.colors.bgTertiary}`,
            borderTop: `3px solid ${theme.colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 16,
          }} />
          <div style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard...</div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </>
    );
  }

  return (
    <div>
      <LeadQualifierNav />
      <div style={{ padding: '0 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Actions</th>
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
                  <td style={{ padding: '0.75rem' }}>
                    <Link
                      href={`/lead-qualifier/conversations/${conv.id}`}
                      style={{
                        fontSize: '0.875rem',
                        color: theme.colors.primary,
                        textDecoration: 'none',
                      }}
                    >
                      View
                    </Link>
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
        <TestChatModal onClose={() => { setTestMode(false); fetchStats(); }} />
      )}
    </div>
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
  const [leadScore, setLeadScore] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Strip JSON blocks from visible message
  function cleanMessage(content: string): string {
    // Remove JSON code blocks that contain lead scoring data
    return content.replace(/```json\s*\{[\s\S]*?"leadScore"[\s\S]*?\}\s*```/g, '').trim();
  }

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
          agencyId: null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to get response');
      }

      setConversationId(data.conversationId);
      
      // Clean the message to hide JSON blocks
      const cleanedMessage = cleanMessage(data.message);
      setMessages(prev => [...prev, { role: 'assistant', content: cleanedMessage }]);
      
      // Track lead score if available
      if (data.leadScore) {
        setLeadScore(data.leadScore);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Shift+Enter for new line, Enter alone to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
        height: '650px',
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
              {leadScore && (
                <span style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.125rem 0.5rem',
                  background: leadScore >= 70 ? theme.colors.successBg : theme.colors.warningBg,
                  color: leadScore >= 70 ? theme.colors.success : theme.colors.warning,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: '0.7rem',
                  fontWeight: '600',
                }}>
                  Score: {leadScore}
                </span>
              )}
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
              <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👋</p>
              <p>Start a conversation!</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                Try: "I'm looking for help with SEO"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' 
                  ? '1rem 1rem 0.25rem 1rem' 
                  : '1rem 1rem 1rem 0.25rem',
                background: msg.role === 'user' ? theme.colors.primary : theme.colors.bgSecondary,
                color: msg.role === 'user' ? 'white' : theme.colors.textPrimary,
                fontSize: '0.9rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '1rem 1rem 1rem 0.25rem',
                background: theme.colors.bgSecondary,
                color: theme.colors.textSecondary,
              }}>
                <span className="typing-dots">Typing</span>
                <style>{`
                  .typing-dots::after {
                    content: '';
                    animation: dots 1.5s steps(4, end) infinite;
                  }
                  @keyframes dots {
                    0%, 20% { content: ''; }
                    40% { content: '.'; }
                    60% { content: '..'; }
                    80%, 100% { content: '...'; }
                  }
                `}</style>
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
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '1rem',
          borderTop: `1px solid ${theme.colors.borderLight}`,
          background: theme.colors.bgSecondary,
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Shift+Enter for new line)"
              disabled={loading}
              rows={2}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.md,
                fontSize: '0.875rem',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.4',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '0.75rem 1.25rem',
                background: loading || !input.trim() ? theme.colors.textMuted : theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                height: 'fit-content',
              }}
            >
              Send
            </button>
          </div>
          <p style={{ 
            fontSize: '0.7rem', 
            color: theme.colors.textMuted, 
            marginTop: '0.5rem',
            textAlign: 'center' 
          }}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
