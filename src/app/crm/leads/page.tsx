"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { theme } from "@/lib/theme";

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
  { value: "lead_qualifier", label: "Lead Qualifier" },
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "manual", label: "Manual Entry" },
];

const statusColors: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#dbeafe", color: "#1d4ed8" },
  CONTACTED: { bg: "#fef3c7", color: "#d97706" },
  QUALIFIED: { bg: "#ede9fe", color: "#7c3aed" },
  UNQUALIFIED: { bg: "#f3f4f6", color: "#6b7280" },
  CONVERTED: { bg: "#dcfce7", color: "#16a34a" },
  ARCHIVED: { bg: "#f3f4f6", color: "#9ca3af" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter]);

  const handleFilterChange = (filterType: 'status' | 'source', value: string) => {
    setIsFilterTransitioning(true);
    if (filterType === 'status') {
      setStatusFilter(value);
    } else {
      setSourceFilter(value);
    }
    setTimeout(() => setIsFilterTransitioning(false), 300);
  };

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
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      contact_form: "Contact Form",
      lead_qualifier: "Lead Qualifier",
      referral: "Referral",
      linkedin: "LinkedIn",
      manual: "Manual",
    };
    return labels[source] || source;
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>All Leads</h1>
          <p style={{
            color: theme.colors.textSecondary,
            margin: "4px 0 0",
            fontSize: 14,
          }}>{pagination?.total || 0} total leads</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: theme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: theme.shadows.button,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 20,
      }}>
        <form onSubmit={handleSearch} style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 300,
          padding: "8px 14px",
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              background: "transparent",
              color: theme.colors.textPrimary,
            }}
          />
          <button type="submit" style={{
            padding: "6px 14px",
            background: theme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}>Search</button>
        </form>

        <div style={{ display: "flex", gap: 12 }}>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: "10px 14px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 10,
              fontSize: 14,
              background: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              cursor: "pointer",
              minWidth: 140,
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            style={{
              padding: "10px 14px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 10,
              fontSize: 14,
              background: theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              cursor: "pointer",
              minWidth: 140,
            }}
          >
            {sourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div style={{
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: 12,
        overflow: "hidden",
        opacity: isFilterTransitioning ? 0 : 1,
        transform: isFilterTransitioning ? "translateY(10px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {loading ? (
          <div style={{
            padding: 60,
            textAlign: "center",
            color: theme.colors.textSecondary,
          }}>Loading leads...</div>
        ) : leads.length === 0 ? (
          <div style={{
            padding: 60,
            textAlign: "center",
            color: theme.colors.textSecondary,
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.colors.borderMedium} strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: theme.colors.textPrimary }}>No leads found</h3>
            <p style={{ margin: 0, fontSize: 14 }}>Leads from your contact forms will appear here</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary }}>
                <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>Lead</th>
                <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>Company</th>
                <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>Source</th>
                <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>Status</th>
                <th style={{ textAlign: "left", padding: "14px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>Date</th>
                <th style={{ textAlign: "right", padding: "14px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.colors.textSecondary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 14,
                      }}>
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{lead.name}</div>
                        <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{lead.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: theme.colors.textPrimary, fontSize: 14 }}>
                    {lead.company || "—"}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: theme.colors.textSecondary }}>
                    {getSourceLabel(lead.source)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 500,
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: statusColors[lead.status]?.bg || "#f3f4f6",
                        color: statusColors[lead.status]?.color || "#6b7280",
                      }}
                    >
                      {statusOptions.filter(o => o.value !== "all").map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: theme.colors.textSecondary }}>
                    {formatDate(lead.createdAt)}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <Link
                      href={`/crm/leads/${lead.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 12px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: theme.colors.primary,
                        textDecoration: "none",
                        borderRadius: 6,
                        background: theme.colors.primaryBg,
                      }}
                    >
                      View
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          padding: "20px 0",
        }}>
          <button
            disabled={pagination.page === 1}
            onClick={() => fetchLeads(pagination.page - 1)}
            style={{
              padding: "8px 16px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 8,
              background: theme.colors.bgSecondary,
              fontSize: 14,
              cursor: pagination.page === 1 ? "not-allowed" : "pointer",
              opacity: pagination.page === 1 ? 0.5 : 1,
            }}
          >Previous</button>
          <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchLeads(pagination.page + 1)}
            style={{
              padding: "8px 16px",
              border: `1px solid ${theme.colors.borderLight}`,
              borderRadius: 8,
              background: theme.colors.bgSecondary,
              fontSize: 14,
              cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer",
              opacity: pagination.page === pagination.totalPages ? 0.5 : 1,
            }}
          >Next</button>
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
    source: "manual",
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
        body: JSON.stringify(formData),
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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.colors.bgSecondary,
          borderRadius: 16,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          borderBottom: `1px solid ${theme.colors.borderLight}`,
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary }}>Add New Lead</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: theme.colors.textSecondary,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: theme.colors.textPrimary }}>Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 10,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: theme.colors.textPrimary }}>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 10,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: theme.colors.textPrimary }}>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Inc"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: theme.colors.textPrimary }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: theme.colors.textPrimary }}>Team Size</label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 10,
                    fontSize: 14,
                    background: theme.colors.bgSecondary,
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select...</option>
                  <option value="1-5">1-5 people</option>
                  <option value="6-15">6-15 people</option>
                  <option value="16-50">16-50 people</option>
                  <option value="51-100">51-100 people</option>
                  <option value="100+">100+ people</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: theme.colors.textPrimary }}>Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 10,
                    fontSize: 14,
                    background: theme.colors.bgSecondary,
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="referral">Referral</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="cold_outreach">Cold Outreach</option>
                  <option value="website">Website</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6, color: theme.colors.textPrimary }}>Notes</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Any additional information about this lead..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 10,
                  fontSize: 14,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: 8,
              fontSize: 14,
            }}>{error}</div>
          )}

          <div style={{
            display: "flex",
            gap: 12,
            marginTop: 24,
            justifyContent: "flex-end",
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: 10,
                background: theme.colors.bgSecondary,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                color: theme.colors.textPrimary,
              }}
            >Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: 10,
                background: theme.colors.primary,
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >{submitting ? "Creating..." : "Create Lead"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
