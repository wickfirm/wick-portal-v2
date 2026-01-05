"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

type Agency = {
  id: string;
  name: string;
};

export default function AgenciesManager({ 
  clientId, 
  initialAgencies 
}: { 
  clientId: string; 
  initialAgencies: Agency[];
}) {
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies);
  const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialAgencies.map(a => a.id)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showModal) {
      fetch("/api/agencies")
        .then(res => res.json())
        .then(data => setAllAgencies(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [showModal]);

  async function saveAgencies() {
    setSaving(true);
    try {
      const res = await fetch("/api/client-agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          agencyIds: Array.from(selectedIds),
        }),
      });
      
      if (res.ok) {
        const updated = allAgencies.filter(a => selectedIds.has(a.id));
        setAgencies(updated);
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to save agencies:", error);
    }
    setSaving(false);
  }

  function toggleAgency(agencyId: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(agencyId)) {
      newSet.delete(agencyId);
    } else {
      newSet.add(agencyId);
    }
    setSelectedIds(newSet);
  }

  return (
    <div style={{ 
      background: theme.colors.bgSecondary, 
      padding: 24, 
      borderRadius: theme.borderRadius.lg, 
      border: "1px solid " + theme.colors.borderLight, 
      marginBottom: 24 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ 
          fontSize: 14, 
          fontWeight: 600, 
          color: theme.colors.textSecondary, 
          textTransform: "uppercase", 
          letterSpacing: "0.5px", 
          margin: 0 
        }}>
          Agencies
        </h3>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "6px 12px",
            background: theme.colors.bgTertiary,
            color: theme.colors.textSecondary,
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Manage
        </button>
      </div>

      {agencies.length === 0 ? (
        <div style={{ color: theme.colors.textMuted, fontSize: 13 }}>No agencies assigned</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {agencies.map(agency => (
            <span
              key={agency.id}
              style={{
                padding: "4px 10px",
                background: theme.colors.infoBg,
                color: theme.colors.info,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {agency.name}
            </span>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 1000,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: theme.colors.bgSecondary,
            borderRadius: 12,
            padding: 24,
            width: 400,
            maxHeight: "80vh",
            overflow: "auto",
            zIndex: 1001,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 600 }}>
              Assign Agencies
            </h3>

            {allAgencies.length === 0 ? (
              <div style={{ color: theme.colors.textMuted, padding: 20, textAlign: "center" }}>
                Loading agencies...
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {allAgencies.map(agency => (
                  <label
                    key={agency.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      background: selectedIds.has(agency.id) ? theme.colors.infoBg : theme.colors.bgPrimary,
                      borderRadius: 8,
                      cursor: "pointer",
                      border: "1px solid " + (selectedIds.has(agency.id) ? theme.colors.info : theme.colors.borderLight),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(agency.id)}
                      onChange={() => toggleAgency(agency.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                      {agency.name}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
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
              <button
                onClick={saveAgencies}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "10px 16px",
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
