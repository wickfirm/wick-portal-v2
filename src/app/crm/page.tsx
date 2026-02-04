"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  totalLeads: number;
  websiteLeads: number;
  aiLeads: number;
  clientProspects: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  teamSize: string | null;
  status: string;
  source: string;
  createdAt: string;
}

interface SourceStat {
  source: string;
  count: number;
}

export default function CRMDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pipelineStats, setPipelineStats] = useState<PipelineStage[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<SourceStat[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/crm/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data.stats);
      setPipelineStats(data.pipelineStats);
      setLeadsBySource(data.leadsBySource);
      setRecentLeads(data.recentLeads);
    } catch (err) {
      setError("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "#3b82f6",
      CONTACTED: "#f59e0b",
      QUALIFIED: "#8b5cf6",
      UNQUALIFIED: "#6b7280",
      CONVERTED: "#22c55e",
      ARCHIVED: "#9ca3af",
    };
    return colors[status] || "#6b7280";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="crm-loading">
        <div className="spinner"></div>
        <p>Loading CRM data...</p>
        <style jsx>{`
          .crm-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 16px;
            color: var(--text-secondary, #6b7280);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color, #e5e7eb);
            border-top-color: var(--primary-color, #7c3aed);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crm-error">
        <p>{error}</p>
        <button onClick={fetchStats}>Retry</button>
      </div>
    );
  }

  const totalPipelineCount = pipelineStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="crm-dashboard">
      {/* Header */}
      <div className="crm-header">
        <div>
          <h1>CRM Overview</h1>
          <p>Track and manage your leads from all sources</p>
        </div>
        <Link href="/crm/leads" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Lead
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalLeads || 0}</span>
            <span className="stat-label">Total Leads</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon new">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.newLeads || 0}</span>
            <span className="stat-label">New Leads</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon qualified">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.qualifiedLeads || 0}</span>
            <span className="stat-label">Qualified</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon converted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.convertedLeads || 0}</span>
            <span className="stat-label">Converted</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rate">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.conversionRate || 0}%</span>
            <span className="stat-label">Conversion Rate</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon week">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.leadsThisWeek || 0}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Pipeline & Recent Leads */}
      <div className="crm-grid">
        {/* Pipeline */}
        <div className="crm-card pipeline-card">
          <div className="card-header">
            <h2>Sales Pipeline</h2>
            <Link href="/crm/pipeline" className="view-all">View Pipeline →</Link>
          </div>
          <div className="pipeline-visual">
            {pipelineStats.map((stage, i) => (
              <div key={stage.stage} className="pipeline-stage">
                <div className="stage-header">
                  <span className="stage-name">{stage.stage}</span>
                  <span className="stage-count">{stage.count}</span>
                </div>
                <div className="stage-bar-bg">
                  <div
                    className="stage-bar"
                    style={{
                      width: totalPipelineCount > 0
                        ? `${(stage.count / totalPipelineCount) * 100}%`
                        : "0%",
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="crm-card sources-card">
          <div className="card-header">
            <h2>Lead Sources</h2>
          </div>
          <div className="sources-list">
            {leadsBySource.length === 0 ? (
              <p className="no-data">No leads yet</p>
            ) : (
              leadsBySource.map((s) => (
                <div key={s.source} className="source-item">
                  <span className="source-name">
                    {s.source === "contact_form" ? "Contact Form" :
                     s.source === "newsletter" ? "Newsletter" :
                     s.source === "manual" ? "Manual Entry" :
                     s.source}
                  </span>
                  <span className="source-count">{s.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="crm-card recent-card">
          <div className="card-header">
            <h2>Recent Leads</h2>
            <Link href="/crm/leads" className="view-all">View All →</Link>
          </div>
          <div className="recent-list">
            {recentLeads.length === 0 ? (
              <p className="no-data">No leads yet. Leads from contact forms will appear here.</p>
            ) : (
              recentLeads.map((lead) => (
                <Link href={`/crm/leads/${lead.id}`} key={lead.id} className="lead-item">
                  <div className="lead-avatar">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="lead-info">
                    <span className="lead-name">{lead.name}</span>
                    <span className="lead-company">{lead.company || lead.email}</span>
                  </div>
                  <div className="lead-meta">
                    <span
                      className="lead-status"
                      style={{ backgroundColor: `${getStatusColor(lead.status)}20`, color: getStatusColor(lead.status) }}
                    >
                      {lead.status}
                    </span>
                    <span className="lead-time">{formatDate(lead.createdAt)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .crm-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .crm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .crm-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary, #111827);
          margin: 0;
        }

        .crm-header p {
          color: var(--text-secondary, #6b7280);
          margin: 4px 0 0;
          font-size: 14px;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--primary-color, #7c3aed);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s;
        }

        .btn-primary:hover {
          background: var(--primary-dark, #6d28d9);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }

        .stat-card {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card.highlight {
          background: linear-gradient(135deg, var(--primary-color, #7c3aed) 0%, #9333ea 100%);
          border: none;
          color: white;
        }

        .stat-card.highlight .stat-label {
          color: rgba(255, 255, 255, 0.8);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon.total {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .stat-icon.new {
          background: #dbeafe;
          color: #3b82f6;
        }

        .stat-icon.qualified {
          background: #ede9fe;
          color: #8b5cf6;
        }

        .stat-icon.converted {
          background: #dcfce7;
          color: #22c55e;
        }

        .stat-icon.rate {
          background: #fef3c7;
          color: #f59e0b;
        }

        .stat-icon.week {
          background: #fce7f3;
          color: #ec4899;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
          margin-top: 4px;
        }

        .crm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .crm-card {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          padding: 20px;
        }

        .recent-card {
          grid-column: span 2;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-header h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary, #111827);
        }

        .view-all {
          font-size: 13px;
          color: var(--primary-color, #7c3aed);
          text-decoration: none;
        }

        .view-all:hover {
          text-decoration: underline;
        }

        .pipeline-visual {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pipeline-stage {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stage-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .stage-name {
          color: var(--text-secondary, #6b7280);
        }

        .stage-count {
          font-weight: 600;
          color: var(--text-primary, #111827);
        }

        .stage-bar-bg {
          height: 8px;
          background: var(--border-color, #e5e7eb);
          border-radius: 4px;
          overflow: hidden;
        }

        .stage-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .source-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--hover-bg, #f9fafb);
          border-radius: 8px;
        }

        .source-name {
          font-size: 14px;
          color: var(--text-primary, #111827);
        }

        .source-count {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-color, #7c3aed);
        }

        .recent-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .lead-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--hover-bg, #f9fafb);
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.15s;
        }

        .lead-item:hover {
          background: var(--border-color, #e5e7eb);
        }

        .lead-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary-color, #7c3aed), #9333ea);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          flex-shrink: 0;
        }

        .lead-info {
          flex: 1;
          min-width: 0;
        }

        .lead-name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #111827);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lead-company {
          display: block;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lead-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .lead-status {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .lead-time {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
        }

        .no-data {
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          text-align: center;
          padding: 24px;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .crm-grid {
            grid-template-columns: 1fr;
          }

          .recent-card {
            grid-column: span 1;
          }

          .recent-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .crm-header {
            flex-direction: column;
            gap: 16px;
          }

          .stat-card {
            padding: 16px;
          }

          .stat-value {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
