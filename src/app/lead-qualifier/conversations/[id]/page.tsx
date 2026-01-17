// /src/app/lead-qualifier/conversations/[id]/page.tsx
// Individual conversation viewer with full chat history

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { useParams } from 'next/navigation';
import { LeadQualifierNav, Breadcrumbs } from '@/components/LeadQualifierNav';

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  visitorId: string;
  channel: string;
  status: string;
  leadScore: number | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  lead?: {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    budgetRange?: string;
    authority?: string;
    need?: string;
    timeline?: string;
    qualificationScore?: number;
  };
}

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  async function fetchConversation() {
    try {
      const res = await fetch(`/api/lead-qualifier/conversations/${conversationId}`);
      if (!res.ok) {
        throw new Error('Failed to load conversation');
      }
      const data = await res.json();
      setConversation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/lead-qualifier/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchConversation(); // Reload conversation
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: theme.colors.error }}>{error || 'Conversation not found'}</p>
        <Link 
          href="/lead-qualifier/conversations"
          style={{ 
            color: theme.colors.primary, 
            textDecoration: 'none',
            marginTop: '1rem',
            display: 'inline-block'
          }}
        >
          ← Back to Conversations
        </Link>
      </div>
    );
  }

  return (
    <>
      <LeadQualifierNav />
      <div style={{ padding: '0 2rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: 'Lead Qualifier', href: '/lead-qualifier' },
          { label: 'Conversations', href: '/lead-qualifier/conversations' },
          { label: conversation.lead?.name || `Conversation ${conversation.visitorId.slice(0, 8)}...` },
        ]} />

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: theme.colors.textPrimary,
          }}>
            Conversation Details
          </h1>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
        {/* Chat History */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: '1.5rem',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: theme.colors.textPrimary,
            marginBottom: '1.5rem',
          }}>
            Chat History
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}>
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'USER' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '1rem',
                    borderRadius: theme.borderRadius.md,
                    background: message.role === 'USER' ? theme.colors.primary : theme.colors.bgTertiary,
                    color: message.role === 'USER' ? 'white' : theme.colors.textPrimary,
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    marginBottom: '0.5rem',
                  }}>
                    {message.role === 'USER' ? 'Visitor' : 'AI Assistant'} • {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {/* Hide JSON blocks from display */}
                    {message.content.replace(/```json[\s\S]*?```/g, '').trim()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar - Conversation Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Card */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: '1.5rem',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: theme.colors.textPrimary,
              marginBottom: '1rem',
            }}>
              Status
            </h3>
            <StatusBadge status={conversation.status} />
            {conversation.leadScore !== null && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, marginBottom: '0.5rem' }}>
                  Lead Score
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: conversation.leadScore >= 70 ? theme.colors.success : 
                         conversation.leadScore >= 40 ? theme.colors.warning : 
                         theme.colors.textSecondary,
                }}>
                  {conversation.leadScore}
                  <span style={{ fontSize: '1rem', opacity: 0.7 }}>/100</span>
                </p>
              </div>
            )}
            
            {/* Status Change Actions */}
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, marginBottom: '0.75rem' }}>
                Change Status:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['ACTIVE', 'QUALIFIED', 'DISQUALIFIED', 'BOOKED'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={conversation.status === status || changingStatus}
                    style={{
                      padding: '0.5rem',
                      background: conversation.status === status 
                        ? theme.colors.bgTertiary 
                        : theme.colors.bgPrimary,
                      color: theme.colors.textPrimary,
                      border: `1px solid ${theme.colors.borderLight}`,
                      borderRadius: theme.borderRadius.sm,
                      cursor: conversation.status === status || changingStatus ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      opacity: conversation.status === status ? 0.5 : 1,
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lead Info Card */}
          {conversation.lead && (
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: '1.5rem',
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: theme.colors.textPrimary,
                marginBottom: '1rem',
              }}>
                Lead Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <InfoRow label="Name" value={conversation.lead.name} />
                <InfoRow label="Email" value={conversation.lead.email} />
                {conversation.lead.company && <InfoRow label="Company" value={conversation.lead.company} />}
                {conversation.lead.phone && <InfoRow label="Phone" value={conversation.lead.phone} />}
                
                {conversation.lead.budgetRange && (
                  <>
                    <div style={{ height: '1px', background: theme.colors.borderLight, margin: '0.5rem 0' }} />
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: theme.colors.textPrimary, marginTop: '0.5rem' }}>
                      BANT Qualification
                    </h4>
                    <InfoRow label="Budget" value={conversation.lead.budgetRange} />
                    {conversation.lead.authority && <InfoRow label="Authority" value={conversation.lead.authority} />}
                    {conversation.lead.timeline && <InfoRow label="Timeline" value={conversation.lead.timeline} />}
                    {conversation.lead.need && (
                      <div>
                        <p style={{ fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: '0.25rem' }}>
                          Need
                        </p>
                        <p style={{ fontSize: '0.875rem', color: theme.colors.textPrimary }}>
                          {conversation.lead.need}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <Link
                href={`/lead-qualifier/leads`}
                style={{
                  display: 'block',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: theme.colors.primary,
                  color: 'white',
                  borderRadius: theme.borderRadius.md,
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                View in Leads →
              </Link>
            </div>
          )}

          {/* Metadata Card */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: '1.5rem',
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: theme.colors.textPrimary,
              marginBottom: '1rem',
            }}>
              Metadata
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <InfoRow label="Channel" value={conversation.channel} />
              <InfoRow label="Messages" value={conversation.messages.length.toString()} />
              <InfoRow label="Started" value={new Date(conversation.createdAt).toLocaleString()} />
              <InfoRow label="Last Activity" value={new Date(conversation.updatedAt).toLocaleString()} />
            </div>
          </div>
        </div>
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
      display: 'inline-block',
      padding: '0.5rem 1rem',
      borderRadius: theme.borderRadius.sm,
      fontSize: '0.875rem',
      fontWeight: '600',
      background: style.bg,
      color: style.text,
    }}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: theme.colors.textSecondary, marginBottom: '0.25rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '0.875rem', color: theme.colors.textPrimary }}>
        {value}
      </p>
    </div>
  );
}
