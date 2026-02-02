"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type PartnerAgency = {
  id: string;
  name: string;
  createdAt: string;
};

const icons = {
  building: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  emptyBuilding: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const avatarColors = ["#76527c", "#5f4263", "#3d6b73", "#8a6030", "#34a853"];
function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

export default function PartnerAgenciesPage() {
  const { data: session, status } = useSession();
  const currentUser = session?.user as any;

  useEffect(() => {
    if (currentUser?.role === "MEMBER") {
      window.location.href = "/dashboard";
    }
  }, [currentUser]);

  const [showForm, setShowForm] = useState(false);
  const [newAgency, setNewAgency] = useState({ name: "" });
  const [adding, setAdding] = useState(false);
  const [editingAgency, setEditingAgency] = useState<PartnerAgency | null>(null);
  const [editForm, setEditForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(currentUser?.role);

  const { data: agencies = [], isLoading: loading, refetch } = useQuery<PartnerAgency[]>({
    queryKey: ["partner-agencies"],
    queryFn: async () => {
      const res = await fetch("/api/partner-agencies");
      if (!res.ok) throw new Error("Failed to fetch agencies");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  const filteredAgencies = agencies.filter(a =>
    !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function addAgency(e: React.FormEvent) {
    e.preventDefault();
    if (!newAgency.name.trim()) return;
    setAdding(true);
    const res = await fetch("/api/partner-agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAgency),
    });
    if (res.ok) { setNewAgency({ name: "" }); setShowForm(false); refetch(); }
    setAdding(false);
  }

  function openEditModal(agency: PartnerAgency) {
    setEditingAgency(agency);
    setEditForm({ name: agency.name });
  }

  async function saveEdit() {
    if (!editingAgency) return;
    setSaving(true);
    const res = await fetch(`/api/partner-agencies/${editingAgency.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditingAgency(null); refetch(); }
    setSaving(false);
  }

  async function deleteAgency(agency: PartnerAgency) {
    if (!confirm(`Delete ${agency.name}?`)) return;
    await fetch(`/api/partner-agencies/${agency.id}`, { method: "DELETE" });
    refetch();
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ width: 200, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ width: 340, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
            </div>
            <div style={{ width: 180, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary }} />
                  <div style={{ width: 48, height: 28, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                </div>
                <div style={{ width: 110, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div style={{ height: 46, background: theme.colors.bgSecondary, borderRadius: 10, marginBottom: 20, border: `1px solid ${theme.colors.borderLight}` }} />
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: "18px 22px", borderBottom: i < 3 ? `1px solid ${theme.colors.bgTertiary}` : "none", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, background: theme.colors.bgTertiary, borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 160, height: 18, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: 100, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 48px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, ...anim(0.05) }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
              Partner Agencies
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
              Manage external agencies that collaborate on your client projects
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                background: theme.gradients.primary,
                color: "white",
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: theme.shadows.button,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {icons.plus} Add Agency
            </button>
          )}
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28, ...anim(0.1) }}>
          <div
            style={{
              background: theme.colors.bgSecondary, padding: "20px 22px", borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(118,82,124,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.primary }}>{icons.building}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1 }}>{agencies.length}</div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>Total Agencies</div>
          </div>
          <div
            style={{
              background: theme.colors.bgSecondary, padding: "20px 22px", borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`, transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.infoBg, display: "flex", alignItems: "center", justifyContent: "center", color: theme.colors.info }}>{icons.info}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1 }}>
                {agencies.length > 0 ? new Date(agencies[agencies.length - 1].createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
              </div>
            </div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: 500 }}>Latest Added</div>
          </div>
        </div>

        {/* Info Box */}
        <div style={{ ...anim(0.12), marginBottom: 20 }}>
          <div style={{
            background: theme.colors.infoBg, border: `1px solid ${theme.colors.info}20`,
            borderRadius: 12, padding: 16, display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <div style={{ color: theme.colors.info, flexShrink: 0, marginTop: 1 }}>{icons.info}</div>
            <p style={{ fontSize: 13, color: theme.colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: theme.colors.info }}>What are Partner Agencies?</strong> External companies (like ATC, UDMS) that collaborate with you on specific client projects. Assign them when creating/editing clients.
            </p>
          </div>
        </div>

        {/* Add Form */}
        {showForm && isAdmin && (
          <div style={{
            background: theme.colors.bgSecondary, borderRadius: 14, padding: 24, marginBottom: 20,
            border: `1px solid ${theme.colors.borderLight}`,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16, marginTop: 0 }}>Add New Partner Agency</h3>
            <form onSubmit={addAgency}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13, color: theme.colors.textPrimary }}>Agency Name</label>
                <input
                  type="text"
                  value={newAgency.name}
                  onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                  placeholder="e.g., ATC, UDMS"
                  required
                  style={{
                    width: "100%", padding: "10px 14px", border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: 10, fontSize: 14, color: theme.colors.textPrimary, background: theme.colors.bgPrimary,
                    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" as const,
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
                  onBlur={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: "10px 20px", border: `1px solid ${theme.colors.borderLight}`, borderRadius: 10,
                  background: theme.colors.bgSecondary, color: theme.colors.textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}>Cancel</button>
                <button type="submit" disabled={adding} style={{
                  padding: "10px 20px", background: adding ? theme.colors.bgTertiary : theme.gradients.primary,
                  color: adding ? theme.colors.textMuted : "white", border: "none", borderRadius: 10,
                  fontSize: 13, fontWeight: 500, cursor: adding ? "not-allowed" : "pointer",
                  boxShadow: adding ? "none" : theme.shadows.button,
                }}>{adding ? "Adding..." : "Add Agency"}</button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 20, ...anim(0.15) }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: theme.colors.textMuted, display: "flex", alignItems: "center" }}>
              {icons.search}
            </div>
            <input
              type="text"
              placeholder="Search agencies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "10px 16px 10px 40px", borderRadius: 10,
                border: `1px solid ${theme.colors.borderLight}`, background: theme.colors.bgSecondary,
                color: theme.colors.textPrimary, fontSize: 14, outline: "none", transition: "border-color 0.15s",
                boxSizing: "border-box" as const,
              }}
              onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
            />
          </div>
        </div>

        {/* Agencies List */}
        <div style={anim(0.2)}>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 16, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
            {filteredAgencies.length === 0 ? (
              <div style={{ padding: 64, textAlign: "center" }}>
                <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>{icons.emptyBuilding}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                  {searchQuery ? "No agencies found" : "No partner agencies yet"}
                </div>
                <div style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  {searchQuery ? "Try adjusting your search" : "Add your first partner agency to get started"}
                </div>
              </div>
            ) : (
              filteredAgencies.map((agency, idx) => (
                <div
                  key={agency.id}
                  style={{
                    padding: "18px 22px",
                    borderBottom: idx < filteredAgencies.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                    display: "flex", alignItems: "center", gap: 14,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.colors.bgPrimary}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: getAvatarColor(agency.name),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 600, fontSize: 18, flexShrink: 0,
                  }}>
                    {agency.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 2 }}>{agency.name}</div>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                      Added {new Date(agency.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => openEditModal(agency)}
                        title="Edit"
                        style={{
                          width: 34, height: 34, borderRadius: 8, border: "none",
                          background: "transparent", color: theme.colors.textMuted,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = theme.colors.infoBg; e.currentTarget.style.color = theme.colors.info; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}
                      >{icons.edit}</button>
                      <button
                        onClick={() => deleteAgency(agency)}
                        title="Delete"
                        style={{
                          width: 34, height: 34, borderRadius: 8, border: "none",
                          background: "transparent", color: theme.colors.textMuted,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = theme.colors.errorBg; e.currentTarget.style.color = theme.colors.error; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}
                      >{icons.trash}</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingAgency && (
        <>
          <div onClick={() => setEditingAgency(null)} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000,
          }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: theme.colors.bgSecondary, borderRadius: 16, padding: 32, width: 440,
            zIndex: 1001, boxShadow: theme.shadows.lg,
          }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 24px 0" }}>
              Edit Partner Agency
            </h3>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13, color: theme.colors.textPrimary }}>Agency Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px", border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: 10, fontSize: 14, color: theme.colors.textPrimary, background: theme.colors.bgPrimary,
                  outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" as const,
                }}
                onFocus={e => e.currentTarget.style.borderColor = theme.colors.primary}
                onBlur={e => e.currentTarget.style.borderColor = theme.colors.borderLight}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditingAgency(null)} style={{
                flex: 1, padding: "10px 20px", border: `1px solid ${theme.colors.borderLight}`, borderRadius: 10,
                background: theme.colors.bgSecondary, color: theme.colors.textSecondary, fontWeight: 500, fontSize: 13, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={{
                flex: 1, padding: "10px 20px", background: saving ? theme.colors.bgTertiary : theme.gradients.primary,
                color: saving ? theme.colors.textMuted : "white", border: "none", borderRadius: 10,
                fontWeight: 500, fontSize: 13, cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : theme.shadows.button,
              }}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
