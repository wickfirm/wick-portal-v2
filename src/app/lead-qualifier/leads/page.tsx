// /src/app/lead-qualifier/leads/page.tsx
// Qualified Leads list page

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';

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
  qualificationScore: number | null;
  createdAt: string;
  qualifiedAt: string | null;
  conversation: {
    id: string;
    status: string;
  };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch('/api/lead-qualifier/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading leads...</p>
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
          <Link 
            href="/lead-qualifier"
            style={{ 
              color: theme.colors.textSecondary, 
              textDecoration: 'none',
              fontSize: '0.875rem',
              display: 'block',
              marginBottom: '0.5rem'
            }}
          >
            ← Back to Lead Qualifier
          </Link>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: theme.colors.textPrimary,
          }}>
            Qualified Leads
          </h1>
          <p style={{ color: theme.colors.textSecondary, marginTop: '0.25rem' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} captured
          </p>
        </div>
      </div>

      {/* Leads Grid */}
      {leads.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem',
        }}>
          {leads.map((lead) => (
            <div
              key={lead.id}
              style={{
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.borderLight}`,
                overflow: 'hidden',
              }}
            >
              {/* Lead Header */}
              <div style={{
                padding: '1.25rem',
                borderBottom: `1px solid ${theme.colors.borderLight}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>
                    {lead.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
                    {lead.email}
                  </p>
                  {lead.company && (
                    <p style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
                      {lead.company}
                    </p>
                  )}
                </div>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: (lead.qualificationScore || 0) >= 70 
                    ? theme.colors.successBg 
                    : theme.colors.warningBg,
                  color: (lead.qualificationScore || 0) >= 70 
                    ? theme.colors.success 
                    : theme.colors.warning,
                  borderRadius: theme.borderRadius.md,
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}>
                  Score: {lead.qualificationScore || 0}
                </div>
              </div>

              {/* BANT Details */}
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <BANTItem label="Budget" value={lead.budgetRange} />
                  <BANTItem label="Authority" value={lead.authority} />
                  <BANTItem label="Timeline" value={lead.timeline} />
                  <BANTItem label="Phone" value={lead.phone} />
                </div>
                
                {lead.need && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: theme.colors.textSecondary,
                      marginBottom: '0.25rem',
                      fontWeight: '500'
                    }}>
                      Need
                    </p>
                    <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                      {lead.need}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{
                padding: '1rem 1.25rem',
                borderTop: `1px solid ${theme.colors.borderLight}`,
                display: 'flex',
                gap: '0.75rem',
              }}>
                <Link
                  href={`/lead-qualifier/leads/${lead.id}`}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    background: theme.colors.primary,
                    color: 'white',
                    borderRadius: theme.borderRadius.md,
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  Manage Lead
                </Link>
                <Link
                  href={`/lead-qualifier/conversations/${lead.conversation.id}`}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textPrimary,
                    borderRadius: theme.borderRadius.md,
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  View Chat
                </Link>
              </div>

              {/* Date */}
              <div style={{
                padding: '0.75rem 1.25rem',
                background: theme.colors.bgTertiary,
                fontSize: '0.75rem',
                color: theme.colors.textSecondary,
              }}>
                Captured {new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
          textAlign: 'center',
          padding: '4rem',
        }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</p>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: theme.colors.textPrimary }}>
            No qualified leads yet
          </p>
          <p style={{ color: theme.colors.textSecondary }}>
            Leads will appear here when visitors are qualified by the AI
          </p>
        </div>
      )}

      {/* Convert to Client Modal */}
      {selectedLead && (
        <ConvertModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onConvert={() => {
            setSelectedLead(null);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
}

function BANTItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p style={{ 
        fontSize: '0.75rem', 
        color: theme.colors.textSecondary,
        marginBottom: '0.25rem',
        fontWeight: '500'
      }}>
        {label}
      </p>
      <p style={{ fontSize: '0.875rem' }}>
        {value || <span style={{ color: theme.colors.textMuted }}>-</span>}
      </p>
    </div>
  );
}

function ConvertModal({ lead, onClose, onConvert }: { 
  lead: Lead; 
  onClose: () => void;
  onConvert: () => void;
}) {
  const [converting, setConverting] = useState(false);

  async function handleConvert() {
    setConverting(true);
    try {
      const res = await fetch(`/api/lead-qualifier/leads/${lead.id}/convert`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Lead converted to client successfully!');
        onConvert();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to convert lead');
      }
    } catch (error) {
      console.error('Failed to convert lead:', error);
      alert('Failed to convert lead');
    } finally {
      setConverting(false);
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
        padding: '2rem',
        maxWidth: '450px',
        width: '100%',
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Convert to Client
        </h3>
        <p style={{ color: theme.colors.textSecondary, marginBottom: '1.5rem' }}>
          This will create a new client record for <strong>{lead.name}</strong> ({lead.email}).
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
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
          <button
            onClick={handleConvert}
            disabled={converting}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: converting ? theme.colors.textMuted : theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: converting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {converting ? 'Converting...' : 'Convert'}
          </button>
        </div>
      </div>
    </div>
  );
}
