"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";

interface Holiday {
  id: string;
  name: string;
  date: string;
  numberOfDays: number;
  country: string;
  status: "UNTOUCHABLE" | "COMPENSABLE" | "DISMISSIBLE";
  description?: string;
  isRecurring: boolean;
}

const STATUS_STYLES = {
  UNTOUCHABLE: { bg: "#dcfce7", color: "#16a34a", label: "Mandatory Holiday" },
  COMPENSABLE: { bg: "#dbeafe", color: "#2563eb", label: "Added to Leave Balance" },
  DISMISSIBLE: { bg: "#f3f4f6", color: "#6b7280", label: "Not Observed" },
};

const COUNTRY_OPTIONS = [
  { value: "AE", label: "UAE" },
  { value: "LB", label: "Lebanon" },
  { value: "AE_LB", label: "UAE & Lebanon" },
];

export default function HolidaysManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  const [formData, setFormData] = useState<{
    name: string;
    date: string;
    numberOfDays: number;
    country: string;
    status: "UNTOUCHABLE" | "COMPENSABLE" | "DISMISSIBLE";
    description: string;
    isRecurring: boolean;
  }>({
    name: "",
    date: "",
    numberOfDays: 1,
    country: "AE",
    status: "UNTOUCHABLE",
    description: "",
    isRecurring: true,
  });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/holidays");
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (error) {
      console.error("Error loading holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingHoliday
        ? `/api/hr/holidays/${editingHoliday.id}`
        : "/api/hr/holidays";
      
      const method = editingHoliday ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to save holiday");
      }

      await loadHolidays();
      handleCloseModal();
      alert(editingHoliday ? "Holiday updated!" : "Holiday added!");
    } catch (error) {
      console.error("Error saving holiday:", error);
      alert("Failed to save holiday");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/hr/holidays/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete holiday");
      }

      await loadHolidays();
      alert("Holiday deleted!");
    } catch (error) {
      console.error("Error deleting holiday:", error);
      alert("Failed to delete holiday");
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split("T")[0],
      numberOfDays: holiday.numberOfDays,
      country: holiday.country,
      status: holiday.status,
      description: holiday.description || "",
      isRecurring: holiday.isRecurring,
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingHoliday(null);
    setFormData({
      name: "",
      date: "",
      numberOfDays: 1,
      country: "AE",
      status: "UNTOUCHABLE",
      description: "",
      isRecurring: true,
    });
  };

  const filteredHolidays = holidays.filter(
    (h) => new Date(h.date).getFullYear() === selectedYear
  );

  const groupedByMonth = filteredHolidays.reduce((acc, holiday) => {
    const month = new Date(holiday.date).toLocaleString("default", { month: "long" });
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {} as Record<string, Holiday[]>);

  const stats = {
    total: filteredHolidays.length,
    untouchable: filteredHolidays.filter((h) => h.status === "UNTOUCHABLE").length,
    compensable: filteredHolidays.filter((h) => h.status === "COMPENSABLE").length,
    totalDays: filteredHolidays
      .filter((h) => h.status === "UNTOUCHABLE")
      .reduce((sum, h) => sum + h.numberOfDays, 0),
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: theme.colors.textSecondary }}>
        Loading holidays...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary, margin: 0, marginBottom: 4 }}>
            Public Holidays
          </h2>
          <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
            Manage company holidays and observances
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: "8px 12px",
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.borderMedium}`,
              fontSize: 14,
            }}
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "10px 20px",
              borderRadius: theme.borderRadius.md,
              background: theme.gradients.primary,
              color: "white",
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            + Add Holiday
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 }}>Total Holidays</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary }}>{stats.total}</div>
        </div>
        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 }}>Mandatory Days Off</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#16a34a" }}>{stats.totalDays}</div>
        </div>
        <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 }}>Compensable</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#2563eb" }}>{stats.compensable}</div>
        </div>
      </div>

      {/* Holidays List */}
      <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
        {Object.entries(groupedByMonth).length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: theme.colors.textSecondary }}>
            No holidays found for {selectedYear}
          </div>
        ) : (
          Object.entries(groupedByMonth).map(([month, monthHolidays]) => (
            <div key={month}>
              <div style={{ padding: "16px 24px", background: theme.colors.bgTertiary, borderBottom: `1px solid ${theme.colors.borderLight}`, fontWeight: 600, fontSize: 13, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {month}
              </div>
              {monthHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((holiday, idx) => (
                <div
                  key={holiday.id}
                  style={{
                    padding: "16px 24px",
                    borderBottom: idx < monthHolidays.length - 1 ? `1px solid ${theme.colors.borderLight}` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: theme.colors.textPrimary }}>
                        {holiday.name}
                      </span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                          background: STATUS_STYLES[holiday.status].bg,
                          color: STATUS_STYLES[holiday.status].color,
                        }}
                      >
                        {STATUS_STYLES[holiday.status].label}
                      </span>
                      {holiday.numberOfDays > 1 && (
                        <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                          ({holiday.numberOfDays} days)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                      {new Date(holiday.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} • {holiday.country}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleEdit(holiday)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: theme.borderRadius.md,
                        background: theme.colors.infoBg,
                        color: theme.colors.info,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(holiday.id, holiday.name)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: theme.borderRadius.md,
                        background: theme.colors.errorBg,
                        color: theme.colors.error,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: theme.colors.bgSecondary,
              borderRadius: theme.borderRadius.lg,
              padding: 32,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: theme.shadows.lg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.textPrimary, margin: 0, marginBottom: 24 }}>
              {editingHoliday ? "Edit Holiday" : "Add Holiday"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                  Holiday Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., New Year's Day"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `1px solid ${theme.colors.borderMedium}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfDays}
                    onChange={(e) => setFormData({ ...formData, numberOfDays: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: `1px solid ${theme.colors.borderMedium}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                  }}
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                  }}
                >
                  <option value="UNTOUCHABLE">Mandatory Holiday (Day Off)</option>
                  <option value="COMPENSABLE">Compensable (Added to Leave Balance)</option>
                  <option value="DISMISSIBLE">Not Observed (No Impact)</option>
                </select>
                <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textSecondary }}>
                  {formData.status === "UNTOUCHABLE" && "Everyone gets the day off"}
                  {formData.status === "COMPENSABLE" && "Not a day off, but adds to annual leave balance"}
                  {formData.status === "DISMISSIBLE" && "No holiday, no compensation"}
                </div>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  />
                  <span style={{ fontSize: 14, color: theme.colors.textPrimary }}>
                    Recurring annually (e.g., Christmas, Eid)
                  </span>
                </label>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes about this holiday..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${theme.colors.borderMedium}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  background: theme.colors.bgTertiary,
                  color: theme.colors.textSecondary,
                  border: "none",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.date}
                style={{
                  padding: "10px 20px",
                  borderRadius: theme.borderRadius.md,
                  background: !formData.name || !formData.date ? theme.colors.bgTertiary : theme.gradients.primary,
                  color: !formData.name || !formData.date ? theme.colors.textMuted : "white",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: !formData.name || !formData.date ? "not-allowed" : "pointer",
                }}
              >
                {editingHoliday ? "Update Holiday" : "Add Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
