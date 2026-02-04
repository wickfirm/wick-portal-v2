"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  teamSize: string | null;
  message: string;
  source: string;
  sourceUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  status: string;
  notes: string | null;
  assignedTo: string | null;
  followUpAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: "NEW", label: "New", color: "#3b82f6" },
  { value: "CONTACTED", label: "Contacted", color: "#f59e0b" },
  { value: "QUALIFIED", label: "Qualified", color: "#8b5cf6" },
  { value: "UNQUALIFIED", label: "Unqualified", color: "#6b7280" },
  { value: "CONVERTED", label: "Converted", color: "#22c55e" },
  { value: "ARCHIVED", label: "Archived", color: "#9ca3af" },
];

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLead();
  }, [params.id]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/crm/leads");
          return;
        }
        throw new Error("Failed to fetch lead");
      }
      const data = await res.json();
      setLead(data.lead);
      setFormData(data.lead);
    } catch (err) {
      setError("Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/crm/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      const data = await res.json();
      setLead(data.lead);
      setEditMode(false);
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setLead(data.lead);
      setFormData(data.lead);
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const res = await fetch(`/api/crm/leads/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      router.push("/crm/leads");
    } catch (err) {
      setError("Failed to delete lead");
    }
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "#6b7280";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading lead...</p>
        <style jsx>{`
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 16px;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color, #e5e7eb);
            border-top-color: var(--primary-color, #7c3aed);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!lead) {
    return <div>Lead not found</div>;
  }

  return (
    <div className="lead-detail">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/crm">CRM</Link>
        <span>/</span>
        <Link href="/crm/leads">Leads</Link>
        <span>/</span>
        <span>{lead.name}</span>
      </div>

      {/* Header */}
      <div className="detail-header">
        <div className="lead-identity">
          <div className="lead-avatar">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            {editMode ? (
              <input
                className="edit-name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            ) : (
              <h1>{lead.name}</h1>
            )}
            <p>{lead.company || lead.email}</p>
          </div>
        </div>
        <div className="header-actions">
          {editMode ? (
            <>
              <button className="btn-secondary" onClick={() => { setEditMode(false); setFormData(lead); }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setEditMode(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
              <a href={`mailto:${lead.email}`} className="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Send Email
              </a>
              <button className="btn-danger" onClick={handleDelete}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Status Bar */}
      <div className="status-bar">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            className={`status-btn ${lead.status === status.value ? "active" : ""}`}
            onClick={() => handleStatusChange(status.value)}
            style={{
              "--status-color": status.color,
            } as React.CSSProperties}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="detail-grid">
        {/* Left Column - Info */}
        <div className="detail-card">
          <h2>Contact Information</h2>
          <div className="info-list">
            <div className="info-item">
              <label>Email</label>
              {editMode ? (
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <a href={`mailto:${lead.email}`}>{lead.email}</a>
              )}
            </div>
            <div className="info-item">
              <label>Phone</label>
              {editMode ? (
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <span>{lead.phone || "-"}</span>
              )}
            </div>
            <div className="info-item">
              <label>Company</label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.company || ""}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              ) : (
                <span>{lead.company || "-"}</span>
              )}
            </div>
            <div className="info-item">
              <label>Team Size</label>
              {editMode ? (
                <select
                  value={formData.teamSize || ""}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="1-5">1-5 people</option>
                  <option value="6-15">6-15 people</option>
                  <option value="16-50">16-50 people</option>
                  <option value="51-100">51-100 people</option>
                  <option value="100+">100+ people</option>
                </select>
              ) : (
                <span>{lead.teamSize || "-"}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Message */}
        <div className="detail-card">
          <h2>Message</h2>
          <div className="message-content">
            {lead.message || "No message provided"}
          </div>
        </div>

        {/* Notes */}
        <div className="detail-card notes-card">
          <h2>Internal Notes</h2>
          {editMode ? (
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add internal notes about this lead..."
              rows={4}
            />
          ) : (
            <div className="notes-content">
              {lead.notes || "No notes yet. Click Edit to add notes."}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="detail-card">
          <h2>Lead Details</h2>
          <div className="info-list">
            <div className="info-item">
              <label>Source</label>
              <span className="source-badge">
                {lead.source === "contact_form" ? "Contact Form" :
                 lead.source === "newsletter" ? "Newsletter" :
                 lead.source === "manual" ? "Manual Entry" :
                 lead.source}
              </span>
            </div>
            <div className="info-item">
              <label>Created</label>
              <span>{formatDate(lead.createdAt)}</span>
            </div>
            <div className="info-item">
              <label>Last Updated</label>
              <span>{formatDate(lead.updatedAt)}</span>
            </div>
            {lead.respondedAt && (
              <div className="info-item">
                <label>First Response</label>
                <span>{formatDate(lead.respondedAt)}</span>
              </div>
            )}
            {lead.utmSource && (
              <div className="info-item">
                <label>UTM Source</label>
                <span>{lead.utmSource}</span>
              </div>
            )}
            {lead.utmMedium && (
              <div className="info-item">
                <label>UTM Medium</label>
                <span>{lead.utmMedium}</span>
              </div>
            )}
            {lead.utmCampaign && (
              <div className="info-item">
                <label>UTM Campaign</label>
                <span>{lead.utmCampaign}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .lead-detail {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
        }

        .breadcrumb a {
          color: var(--text-secondary, #6b7280);
          text-decoration: none;
        }

        .breadcrumb a:hover {
          color: var(--primary-color, #7c3aed);
        }

        .breadcrumb span:last-child {
          color: var(--text-primary, #111827);
          font-weight: 500;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .lead-identity {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .lead-avatar {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--primary-color, #7c3aed), #9333ea);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 24px;
        }

        .lead-identity h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }

        .lead-identity p {
          margin: 4px 0 0;
          color: var(--text-secondary, #6b7280);
        }

        .edit-name {
          font-size: 24px;
          font-weight: 600;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          padding: 4px 8px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-secondary, .btn-primary, .btn-danger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--border-color, #e5e7eb);
          color: var(--text-primary, #111827);
        }

        .btn-primary {
          background: var(--primary-color, #7c3aed);
          border: none;
          color: white;
        }

        .btn-danger {
          background: transparent;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px;
        }

        .btn-danger:hover {
          background: #fef2f2;
        }

        .error-banner {
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
        }

        .status-bar {
          display: flex;
          gap: 8px;
          padding: 16px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          overflow-x: auto;
        }

        .status-btn {
          padding: 8px 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }

        .status-btn:hover {
          border-color: var(--status-color);
          color: var(--status-color);
        }

        .status-btn.active {
          background: var(--status-color);
          border-color: var(--status-color);
          color: white;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .detail-card {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          padding: 20px;
        }

        .notes-card {
          grid-column: span 2;
        }

        .detail-card h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--text-primary, #111827);
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary, #6b7280);
        }

        .info-item span, .info-item a {
          font-size: 14px;
          color: var(--text-primary, #111827);
        }

        .info-item a {
          color: var(--primary-color, #7c3aed);
          text-decoration: none;
        }

        .info-item a:hover {
          text-decoration: underline;
        }

        .info-item input, .info-item select {
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 14px;
        }

        .source-badge {
          display: inline-block;
          padding: 4px 10px;
          background: var(--hover-bg, #f3f4f6);
          border-radius: 6px;
          font-size: 13px;
        }

        .message-content, .notes-content {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary, #111827);
          white-space: pre-wrap;
        }

        .notes-content {
          color: var(--text-secondary, #6b7280);
          font-style: italic;
        }

        .detail-card textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
        }

        @media (max-width: 768px) {
          .detail-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .notes-card {
            grid-column: span 1;
          }

          .status-bar {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
