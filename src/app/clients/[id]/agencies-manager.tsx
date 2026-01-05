"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

type Agency = {
  id: string;
  name: string;
};

type ClientAgency = {
  id: string;
  agencyId: string;
  agency: Agency;
};

export default function AgenciesManager({ clientId }: { clientId: string }) {
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [clientAgencies, setClientAgencies] = useState<ClientAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/agencies").then(res => res.json()),
      fetch(`/api/client-agencies?clientId=${clientId}`).then(res => res.json()),
    ]).then(([agencies, clientAgencyData]) => {
      setAllAgencies(Array.isArray(agencies) ? agencies : []);
      setClientAgencies(Array.isArray(clientAgencyData) ? clientAgencyData : []);
      setSelectedIds(Array.isArray(clientAgencyData) ? clientAgencyData.map((ca: ClientAgency) => ca.agencyId) : []);
      setLoading(false);
    });
  }, [clientId]);

  function toggleAgency(agencyId: string) {
    setSelectedIds(prev =>
      prev.includes(agencyId)
        ? prev.filter(id => id !== agencyId)
        : [...prev, agencyId]
    );
  }

  async function saveAgencies() {
    setSaving(true);
    const res = await fetch("/api/client-agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, agencyIds: selectedIds }),
    });

    if (res.ok) {
      const updated = await res.json();
      setClientAgencies(updated);
      setIsOpen(false);
    }
    setSaving(false);
  }

  if (loading) {
    return <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 14 }}>Loading agencies...</div>;
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: theme.colors.textPrimary }}>
          Agencies ({clientAgencies.length})
        </h3>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: "6px 12px",
            background: theme.colors.bgTertiary,
            color: theme.colors.textSecondary,
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Manage
        </button>
      </div>

      {/* Current Agencies Display */}
      {clientAgencies.length === 0 ? (
        <div style={{ padding: 16, background: theme.colors.bgTertiary, borderRadius: 8, color: theme.colors.textMuted, fontSize: 13, textAlign: "center" }}>
          No agencies assigned
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {clientAgencies.map(ca => (
            <span
              key={ca.id}
              style={{
                padding: "6px 14px",
                background: theme.colors.infoBg,
                color: theme.colors.info,
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {ca.agency.name}
            </span>
          ))}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            padding: 24,
            width: "100%",
            maxWidth: 400,
            maxHeight: "80vh",
            overflow: "auto",
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600 }}>Manage Agencies</h3>

            <div style={{ marginBottom: 20 }}>
              {allAgencies.length === 0 ? (
                <div style={{ padding: 16, color: theme.colors.textMuted, textAlign: "center" }}>
                  No agencies available. Create agencies in Settings first.
                </div>
              ) : (
                allAgencies.map(agency => (
                  <label
                    key={agency.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: selectedIds.includes(agency.id) ? theme.colors.infoBg : "transparent",
                      marginBottom: 8,
                      border: "1px solid " + (selectedIds.includes(agency.id) ? theme.colors.info : theme.colors.borderLight),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(agency.id)}
                      onChange={() => toggleAgency(agency.id)}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{agency.name}</span>
                  </label>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={saveAgencies}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  background: saving ? theme.colors.bgTertiary : theme.colors.primary,
                  color: saving ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedIds(clientAgencies.map(ca => ca.agencyId));
                }}
                style={{
                  padding: "12px 20px",
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textSecondary,
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
