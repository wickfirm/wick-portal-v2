// /src/app/lead-qualifier/leads/[id]/page.tsx
// Individual lead detail and management page

'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { LeadQualifierNav, Breadcrumbs } from '@/components/LeadQualifierNav';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  budgetRange: string | null;
  authority: string | null;
  need: string | null;
  timeline: string | null;
  industry: string | null;
  qualificationScore: number | null;
  createdAt: string;
  qualifiedAt: string | null;
  conversation: {
    id: string;
    status: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  async function fetchLead() {
    try {
      const res = await fetch(`/api/lead-qualifier/leads/${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to load lead:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/lead-qualifier/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        setLead(updated);
        setEditing(false);
      } else {
        alert('Failed to update lead');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/lead-qualifier/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Lead deleted successfully');
        router.push('/lead-qualifier/leads');
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete lead');
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/lead-qualifier/conversations/${lead?.conversation.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchLead(); // Reload to get updated status
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading lead...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: theme.colors.error }}>Lead not found</p>
        <Link href="/lead-qualifier/leads" style={{ color: theme.colors.primary }}>
          ← Back to Leads
        </Link>
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
          { label: 'Qualified Leads', href: '/lead-qualifier/leads' },
          { label: lead.name },
        ]} />

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '600',
              color: theme.colors.textPrimary,
            }}>
              {lead.name}
            </h1>
          </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
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
                Edit Lead
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: theme.colors.error,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: saving ? theme.colors.textMuted : theme.colors.success,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(lead);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textPrimary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Contact Information */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Contact Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Field
                label="Name"
                value={formData.name}
                editing={editing}
                onChange={(value) => setFormData({ ...formData, name: value })}
              />
              <Field
                label="Email"
                value={formData.email}
                editing={editing}
                onChange={(value) => setFormData({ ...formData, email: value })}
              />
              <Field
                label="Company"
                value={formData.company}
                editing={editing}
                onChange={(value) => setFormData({ ...formData, company: value })}
              />
              <Field
                label="Phone"
                value={formData.phone}
                editing={editing}
                onChange={(value) => setFormData({ ...formData, phone: value })}
              />
            </div>
          </div>

          {/* BANT Qualification */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              BANT Qualification
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Field
                label="Budget Range"
                value={formData.budgetRange}
                editing={editing}
                onChange={(value) => setFormData({ ...formData, budgetRange: value })}
              />
              <Field
                label="Authority"
                value={formData.authority}
                editing={editing}
                onChange={(value) => setFormData({ ...formData, authority: value })}
              />
              <Field
                label="Timeline"
                value={formData.timeline}
                editing={editing}
                onChange={(value) => setFormData({ ...formData, timeline: value })}
              />
              <Field
                label="Qualification Score"
                value={formData.qualificationScore?.toString()}
                editing={editing}
                type="number"
                onChange={(value) => setFormData({ ...formData, qualificationScore: parseInt(value) || null })}
              />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <Field
                label="Need / Requirements"
                value={formData.need}
                editing={editing}
                multiline
                onChange={(value) => setFormData({ ...formData, need: value })}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Card */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Status
            </h3>
            <StatusBadge status={lead.conversation.status} />
            
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, marginBottom: '0.75rem' }}>
                Change Status:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['ACTIVE', 'QUALIFIED', 'DISQUALIFIED', 'BOOKED'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={lead.conversation.status === status}
                    style={{
                      padding: '0.5rem',
                      background: lead.conversation.status === status 
                        ? theme.colors.bgTertiary 
                        : theme.colors.bgPrimary,
                      color: theme.colors.textPrimary,
                      border: `1px solid ${theme.colors.borderLight}`,
                      borderRadius: theme.borderRadius.sm,
                      cursor: lead.conversation.status === status ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      opacity: lead.conversation.status === status ? 0.5 : 1,
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                href={`/lead-qualifier/conversations/${lead.conversation.id}`}
                style={{
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
                View Full Conversation
              </Link>
              <button
                onClick={() => window.location.href = `mailto:${lead.email}`}
                style={{
                  padding: '0.75rem',
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textPrimary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Send Email
              </button>
              {lead.phone && (
                <button
                  onClick={() => window.location.href = `tel:${lead.phone}`}
                  style={{
                    padding: '0.75rem',
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textPrimary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  Call
                </button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.borderLight}`,
            padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Metadata
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <MetaItem label="Created" value={new Date(lead.createdAt).toLocaleString()} />
              {lead.qualifiedAt && (
                <MetaItem label="Qualified" value={new Date(lead.qualifiedAt).toLocaleString()} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function Field({ label, value, editing, multiline, type = 'text', onChange }: {
  label: string;
  value?: string | null;
  editing: boolean;
  multiline?: boolean;
  type?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: theme.colors.textSecondary,
        marginBottom: '0.5rem',
      }}>
        {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.textPrimary,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.textPrimary,
              fontSize: '0.875rem',
            }}
          />
        )
      ) : (
        <p style={{
          fontSize: '0.875rem',
          color: theme.colors.textPrimary,
          padding: '0.75rem',
          background: theme.colors.bgTertiary,
          borderRadius: theme.borderRadius.md,
          minHeight: multiline ? '100px' : 'auto',
          whiteSpace: multiline ? 'pre-wrap' : 'normal',
        }}>
          {value || <span style={{ color: theme.colors.textMuted }}>Not provided</span>}
        </p>
      )}
    </div>
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

function MetaItem({ label, value }: { label: string; value: string }) {
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
