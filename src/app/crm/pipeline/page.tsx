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
  status: string;
  source: string;
  createdAt: string;
}

const pipelineStages = [
  { id: "NEW", label: "New", color: "#3b82f6", bgColor: "#dbeafe" },
  { id: "CONTACTED", label: "Contacted", color: "#f59e0b", bgColor: "#fef3c7" },
  { id: "QUALIFIED", label: "Qualified", color: "#8b5cf6", bgColor: "#ede9fe" },
  { id: "CONVERTED", label: "Converted", color: "#22c55e", bgColor: "#dcfce7" },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/leads?limit=100");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data.leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    // Optimistically update UI
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggedLead.id ? { ...lead, status: newStatus } : lead
      )
    );

    try {
      const res = await fetch(`/api/crm/leads/${draggedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update lead");
    } catch (error) {
      console.error("Error updating lead:", error);
      // Revert on error
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === draggedLead.id ? { ...lead, status: draggedLead.status } : lead
        )
      );
    }

    setDraggedLead(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: theme.colors.textSecondary }}>
        Loading pipeline...
      </div>
    );
  }

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
          }}>Sales Pipeline</h1>
          <p style={{
            color: theme.colors.textSecondary,
            margin: "4px 0 0",
            fontSize: 14,
          }}>Drag and drop leads between stages</p>
        </div>
        <Link
          href="/crm/leads"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 18px",
            background: theme.colors.primary,
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            boxShadow: theme.shadows.button,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Lead
        </Link>
      </div>

      {/* Pipeline Board */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${pipelineStages.length}, 1fr)`,
        gap: 16,
        minHeight: "calc(100vh - 280px)",
      }}>
        {pipelineStages.map((stage) => {
          const stageLeads = getLeadsByStatus(stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              style={{
                background: theme.colors.bgSecondary,
                borderRadius: 12,
                border: `1px solid ${theme.colors.borderLight}`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Stage Header */}
              <div style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${theme.colors.borderLight}`,
                background: stage.bgColor,
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <div style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: stage.color,
                    }} />
                    <span style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: stage.color,
                    }}>{stage.label}</span>
                  </div>
                  <span style={{
                    background: stage.color,
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>{stageLeads.length}</span>
                </div>
              </div>

              {/* Stage Content */}
              <div style={{
                flex: 1,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                overflowY: "auto",
                minHeight: 200,
              }}>
                {stageLeads.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.textMuted,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}>
                    No leads
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      style={{
                        background: theme.colors.bgPrimary,
                        border: `1px solid ${theme.colors.borderLight}`,
                        borderRadius: 10,
                        padding: 14,
                        cursor: "grab",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = theme.shadows.md;
                        e.currentTarget.style.borderColor = stage.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = theme.colors.borderLight;
                      }}
                    >
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 10,
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 13,
                          flexShrink: 0,
                        }}>
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 500,
                            fontSize: 14,
                            color: theme.colors.textPrimary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>{lead.name}</div>
                          {lead.company && (
                            <div style={{
                              fontSize: 12,
                              color: theme.colors.textSecondary,
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>{lead.company}</div>
                          )}
                        </div>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: theme.colors.textMuted,
                      }}>
                        <span>{getSourceLabel(lead.source)}</span>
                        <span>{formatDate(lead.createdAt)}</span>
                      </div>
                      <Link
                        href={`/crm/leads/${lead.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "block",
                          marginTop: 10,
                          padding: "6px 0",
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: 500,
                          color: theme.colors.primary,
                          textDecoration: "none",
                          borderRadius: 6,
                          background: theme.colors.primaryBg,
                        }}
                      >
                        View Details →
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 24,
        padding: 16,
        background: theme.colors.bgSecondary,
        border: `1px solid ${theme.colors.borderLight}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textSecondary }}>
          Pipeline Stages:
        </span>
        {pipelineStages.map((stage, index) => (
          <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: stage.color,
            }} />
            <span style={{ fontSize: 13, color: theme.colors.textPrimary }}>{stage.label}</span>
            {index < pipelineStages.length - 1 && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2" style={{ marginLeft: 8 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
