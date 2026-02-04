"use client";

import { useState, useEffect } from "react";
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
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "CONVERTED", label: "Converted" },
  { value: "ARCHIVED", label: "Archived" },
];

const sourceOptions = [
  { value: "all", label: "All Sources" },
  { value: "contact_form", label: "Contact Form" },
  { value: "newsletter", label: "Newsletter" },
  { value: "manual", label: "Manual Entry" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter]);

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/crm/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update lead");

      // Update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (error) {
      console.error("Error updating lead:", error);
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
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="leads-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>All Leads</h1>
          <p>{pagination?.total || 0} total leads</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="filter-selects">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            {sourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="leads-table-wrapper">
        {loading ? (
          <div className="loading">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <h3>No leads found</h3>
            <p>Leads from your contact forms will appear here</p>
          </div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Company</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="lead-cell">
                      <div className="lead-avatar">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="lead-details">
                        <span className="lead-name">{lead.name}</span>
                        <span className="lead-email">{lead.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="company-name">{lead.company || "-"}</span>
                    {lead.teamSize && (
                      <span className="team-size">{lead.teamSize}</span>
                    )}
                  </td>
                  <td>
                    <span className="source-badge">
                      {lead.source === "contact_form" ? "Contact Form" :
                       lead.source === "newsletter" ? "Newsletter" :
                       lead.source === "manual" ? "Manual" :
                       lead.source}
                    </span>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      style={{
                        backgroundColor: `${getStatusColor(lead.status)}15`,
                        color: getStatusColor(lead.status),
                        borderColor: `${getStatusColor(lead.status)}30`,
                      }}
                    >
                      {statusOptions.slice(1).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="date">{formatDate(lead.createdAt)}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <Link href={`/crm/leads/${lead.id}`} className="action-btn view">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                      <a href={`mailto:${lead.email}`} className="action-btn email">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => fetchLeads(pagination.page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchLeads(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchLeads();
          }}
        />
      )}

      <style jsx>{`
        .leads-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: var(--text-primary, #111827);
        }

        .page-header p {
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
        }

        .btn-primary:hover {
          background: var(--primary-dark, #6d28d9);
        }

        .filters-bar {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-form {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 300px;
          padding: 8px 12px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
        }

        .search-form svg {
          color: var(--text-secondary, #6b7280);
          flex-shrink: 0;
        }

        .search-form input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
        }

        .search-form button {
          padding: 6px 12px;
          background: var(--primary-color, #7c3aed);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .filter-selects {
          display: flex;
          gap: 12px;
        }

        .filter-selects select {
          padding: 10px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 14px;
          background: var(--card-bg, #fff);
          cursor: pointer;
        }

        .leads-table-wrapper {
          background: var(--card-bg, #fff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
        }

        .leads-table {
          width: 100%;
          border-collapse: collapse;
        }

        .leads-table th {
          text-align: left;
          padding: 14px 16px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary, #6b7280);
          background: var(--hover-bg, #f9fafb);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .leads-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .leads-table tr:last-child td {
          border-bottom: none;
        }

        .leads-table tr:hover {
          background: var(--hover-bg, #f9fafb);
        }

        .lead-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lead-avatar {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary-color, #7c3aed), #9333ea);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .lead-details {
          display: flex;
          flex-direction: column;
        }

        .lead-name {
          font-weight: 500;
          color: var(--text-primary, #111827);
        }

        .lead-email {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .company-name {
          display: block;
          color: var(--text-primary, #111827);
        }

        .team-size {
          display: block;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .source-badge {
          display: inline-block;
          padding: 4px 10px;
          background: var(--hover-bg, #f3f4f6);
          border-radius: 6px;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .status-select {
          padding: 6px 10px;
          border: 1px solid;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          padding-right: 28px;
        }

        .date {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: var(--hover-bg, #f3f4f6);
          color: var(--primary-color, #7c3aed);
        }

        .loading, .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: var(--text-secondary, #6b7280);
        }

        .empty-state svg {
          margin-bottom: 16px;
          color: var(--border-color, #e5e7eb);
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px;
          color: var(--text-primary, #111827);
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
        }

        .pagination button {
          padding: 8px 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: var(--card-bg, #fff);
          font-size: 14px;
          cursor: pointer;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination span {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
        }

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-form {
            min-width: auto;
          }

          .leads-table-wrapper {
            overflow-x: auto;
          }

          .leads-table {
            min-width: 700px;
          }
        }
      `}</style>
    </div>
  );
}

// Add Lead Modal Component
function AddLeadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    teamSize: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source: "manual" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create lead");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Lead</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Smith"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@company.com"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Team Size</label>
            <select
              value={formData.teamSize}
              onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="1-5">1-5 people</option>
              <option value="6-15">6-15 people</option>
              <option value="16-50">16-50 people</option>
              <option value="51-100">51-100 people</option>
              <option value="100+">100+ people</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Any additional information about this lead..."
              rows={3}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            padding: 20px;
          }

          .modal {
            background: var(--card-bg, #fff);
            border-radius: 16px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
          }

          .modal-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }

          .close-btn {
            background: none;
            border: none;
            padding: 4px;
            cursor: pointer;
            color: var(--text-secondary, #6b7280);
          }

          form {
            padding: 24px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 6px;
            color: var(--text-primary, #111827);
          }

          input, select, textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px;
            font-size: 14px;
          }

          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--primary-color, #7c3aed);
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
          }

          textarea {
            resize: vertical;
          }

          .error {
            padding: 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            color: #dc2626;
            font-size: 14px;
            margin-bottom: 16px;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 24px;
          }

          .btn-secondary {
            padding: 10px 16px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px;
            background: transparent;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }

          .btn-primary {
            padding: 10px 16px;
            background: var(--primary-color, #7c3aed);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}
