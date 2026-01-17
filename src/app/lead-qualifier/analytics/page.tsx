// /src/app/lead-qualifier/analytics/page.tsx
// Analytics dashboard for lead qualifier

'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { LeadQualifierNav, Breadcrumbs } from '@/components/LeadQualifierNav';

interface AnalyticsData {
  totalConversations: number;
  qualifiedLeads: number;
  conversionRate: number;
  avgLeadScore: number;
  avgMessagesPerConversation: number;
  statusBreakdown: {
    ACTIVE: number;
    QUALIFIED: number;
    DISQUALIFIED: number;
    BOOKED: number;
  };
  recentActivity: Array<{
    date: string;
    conversations: number;
    qualified: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/lead-qualifier/analytics');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        // Use placeholder data
        setData({
          totalConversations: 0,
          qualifiedLeads: 0,
          conversionRate: 0,
          avgLeadScore: 0,
          avgMessagesPerConversation: 0,
          statusBreakdown: {
            ACTIVE: 0,
            QUALIFIED: 0,
            DISQUALIFIED: 0,
            BOOKED: 0,
          },
          recentActivity: [],
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setData({
        totalConversations: 0,
        qualifiedLeads: 0,
        conversionRate: 0,
        avgLeadScore: 0,
        avgMessagesPerConversation: 0,
        statusBreakdown: {
          ACTIVE: 0,
          QUALIFIED: 0,
          DISQUALIFIED: 0,
          BOOKED: 0,
        },
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading analytics...</p>
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
          { label: 'Analytics' },
        ]} />

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: theme.colors.textPrimary,
        }}>
          Analytics
        </h1>
        <p style={{ color: theme.colors.textSecondary, marginTop: '0.25rem' }}>
          Track your AI lead qualifier performance
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <MetricCard
          title="Total Conversations"
          value={data?.totalConversations || 0}
          icon="💬"
        />
        <MetricCard
          title="Qualified Leads"
          value={data?.qualifiedLeads || 0}
          icon="✅"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data?.conversionRate || 0}%`}
          icon="📈"
          description="Qualified / Total"
        />
        <MetricCard
          title="Avg Lead Score"
          value={data?.avgLeadScore || 0}
          icon="🎯"
          description="Out of 100"
        />
      </div>

      {/* Additional Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* Status Breakdown */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: '1.5rem',
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            Conversation Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <StatusBar 
              label="Active" 
              count={data?.statusBreakdown.ACTIVE || 0} 
              total={data?.totalConversations || 1}
              color={theme.colors.info}
            />
            <StatusBar 
              label="Qualified" 
              count={data?.statusBreakdown.QUALIFIED || 0} 
              total={data?.totalConversations || 1}
              color={theme.colors.success}
            />
            <StatusBar 
              label="Disqualified" 
              count={data?.statusBreakdown.DISQUALIFIED || 0} 
              total={data?.totalConversations || 1}
              color={theme.colors.warning}
            />
            <StatusBar 
              label="Booked" 
              count={data?.statusBreakdown.BOOKED || 0} 
              total={data?.totalConversations || 1}
              color={theme.colors.primary}
            />
          </div>
        </div>

        {/* Performance Insights */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: '1.5rem',
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            Performance Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <InsightItem
              label="Avg Messages Per Conversation"
              value={data?.avgMessagesPerConversation || 0}
              description="More messages = better engagement"
            />
            <InsightItem
              label="Qualification Rate"
              value={`${data?.conversionRate || 0}%`}
              description={
                (data?.conversionRate || 0) >= 20 
                  ? "Great! Industry average is ~15-20%"
                  : "Tip: Adjust BANT weights or threshold"
              }
            />
            <InsightItem
              label="Avg Lead Score"
              value={data?.avgLeadScore || 0}
              description={
                (data?.avgLeadScore || 0) >= 60
                  ? "High quality leads!"
                  : "Consider refining qualification criteria"
              }
            />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{
        background: theme.colors.infoBg,
        padding: '1.5rem',
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.info}20`,
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600',
          marginBottom: '0.75rem',
          color: theme.colors.info
        }}>
          💡 Tips to Improve Performance
        </h3>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '1.25rem',
          color: theme.colors.textSecondary,
          fontSize: '0.875rem',
          lineHeight: '1.8',
        }}>
          <li>If conversion rate is low, try lowering the qualification threshold in Settings</li>
          <li>Add case studies to help the AI showcase your work</li>
          <li>Review disqualified conversations to refine targeting</li>
          <li>Ensure services match what visitors are looking for</li>
        </ul>
      </div>
    </div>
    </>
  );
}

function MetricCard({ title, value, icon, description }: { 
  title: string; 
  value: string | number; 
  icon: string;
  description?: string;
}) {
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
          {description && (
            <p style={{ 
              fontSize: '0.75rem', 
              color: theme.colors.textMuted,
              marginTop: '0.25rem'
            }}>
              {description}
            </p>
          )}
        </div>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: '500' }}>{count} ({percentage}%)</span>
      </div>
      <div style={{
        height: '8px',
        background: theme.colors.bgTertiary,
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function InsightItem({ label, value, description }: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.25rem',
      }}>
        <span style={{ fontSize: '0.875rem' }}>{label}</span>
        <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>{value}</span>
      </div>
      <p style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
        {description}
      </p>
    </div>
  );
}
