"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Metrics = {
  id: string;
  month: string;
  gaSessions: number | null;
  gaUsers: number | null;
  gaPageviews: number | null;
  gaBounceRate: number | null;
  gaAvgSessionDuration: number | null;
  gscImpressions: number | null;
  gscClicks: number | null;
  gscCtr: number | null;
  gscAvgPosition: number | null;
  metaSpend: number | null;
  metaImpressions: number | null;
  metaClicks: number | null;
  metaConversions: number | null;
  metaCtr: number | null;
  metaCpc: number | null;
  metaRoas: number | null;
  notes: string | null;
};

const emptyForm = {
  month: new Date().toISOString().slice(0, 7) + "-01",
  gaSessions: "",
  gaUsers: "",
  gaPageviews: "",
  gaBounceRate: "",
  gaAvgSessionDuration: "",
  gscImpressions: "",
  gscClicks: "",
  gscCtr: "",
  gscAvgPosition: "",
  metaSpend: "",
  metaImpressions: "",
  metaClicks: "",
  metaConversions: "",
  metaCtr: "",
  metaCpc: "",
  metaRoas: "",
  notes: "",
};

export default function ClientMetricsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  async function fetchData() {
    setLoading(true);
    const [metricsRes, clientRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/metrics`),
      fetch(`/api/clients/${clientId}`),
    ]);

    const metricsData = await metricsRes.json();
    const clientData = await clientRes.json();

    setMetrics(metricsData);
    setClientName(clientData.name || "");
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: any = { month: form.month };
    
    // Only include non-empty values
    if (form.gaSessions) payload.gaSessions = parseInt(form.gaSessions);
    if (form.gaUsers) payload.gaUsers = parseInt(form.gaUsers);
    if (form.gaPageviews) payload.gaPageviews = parseInt(form.gaPageviews);
    if (form.gaBounceRate) payload.gaBounceRate = parseFloat(form.gaBounceRate);
    if (form.gaAvgSessionDuration) payload.gaAvgSessionDuration = parseInt(form.gaAvgSessionDuration);
    if (form.gscImpressions) payload.gscImpressions = parseInt(form.gscImpressions);
    if (form.gscClicks) payload.gscClicks = parseInt(form.gscClicks);
    if (form.gscCtr) payload.gscCtr = parseFloat(form.gscCtr);
    if (form.gscAvgPosition) payload.gscAvgPosition = parseFloat(form.gscAvgPosition);
    if (form.metaSpend) payload.metaSpend = parseFloat(form.metaSpend);
    if (form.metaImpressions) payload.metaImpressions = parseInt(form.metaImpressions);
    if (form.metaClicks) payload.metaClicks = parseInt(form.metaClicks);
    if (form.metaConversions) payload.metaConversions = parseInt(form.metaConversions);
    if (form.metaCtr) payload.metaCtr = parseFloat(form.metaCtr);
    if (form.metaCpc) payload.metaCpc = parseFloat(form.metaCpc);
    if (form.metaRoas) payload.metaRoas = parseFloat(form.metaRoas);
    if (form.notes) payload.notes = form.notes;

    const res = await fetch(`/api/clients/${clientId}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    }
    setSaving(false);
  }

  function editMetrics(m: Metrics) {
    setForm({
      month: m.month.split("T")[0],
      gaSessions: m.gaSessions?.toString() || "",
      gaUsers: m.gaUsers?.toString() || "",
      gaPageviews: m.gaPageviews?.toString() || "",
      gaBounceRate: m.gaBounceRate?.toString() || "",
      gaAvgSessionDuration: m.gaAvgSessionDuration?.toString() || "",
      gscImpressions: m.gscImpressions?.toString() || "",
      gscClicks: m.gscClicks?.toString() || "",
      gscCtr: m.gscCtr?.toString() || "",
      gscAvgPosition: m.gscAvgPosition?.toString() || "",
      metaSpend: m.metaSpend?.toString() || "",
      metaImpressions: m.metaImpressions?.toString() || "",
      metaClicks: m.metaClicks?.toString() || "",
      metaConversions: m.metaConversions?.toString() || "",
      metaCtr: m.metaCtr?.toString() || "",
      metaCpc: m.metaCpc?.toString() || "",
      metaRoas: m.metaRoas?.toString() || "",
      notes: m.notes || "",
    });
    setEditingId(m.id);
    setShowForm(true);
  }

  async function deleteMetrics(m: Metrics) {
    if (!confirm(`Delete metrics for ${new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}?`)) return;

    await fetch(`/api/metrics/${m.id}`, { method: "DELETE" });
    fetchData();
  }

  function formatNumber(n: number | null): string {
    if (n === null || n === undefined) return "-";
    return n.toLocaleString();
  }

  function formatDecimal(n: number | null, suffix = ""): string {
    if (n === null || n === undefined) return "-";
    return n.toFixed(2) + suffix;
  }

  function formatCurrency(n: number | null): string {
    if (n === null || n === undefined) return "-";
    return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
            <Link href="/analytics" style={{ color: "#666", textDecoration: "none" }}>Analytics</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${clientId}`} style={{ color: "#666", textDecoration: "none" }}>← Back to {clientName}</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Performance Metrics - {clientName}</h1>
          <button
            onClick={() => { setShowForm(!showForm); setForm(emptyForm); setEditingId(null); }}
            style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            + Add Metrics
          </button>
        </div>

        {showForm && (
          <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>{editingId ? "Edit Metrics" : "Add Monthly Metrics"}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Month</label>
                <input
                  type="date"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  required
                  style={{ padding: 10, border: "1px solid #ddd", borderRadius: 4 }}
                />
                <span style={{ marginLeft: 8, fontSize: 13, color: "#888" }}>Select the 1st of the month</span>
              </div>

              {/* Google Analytics */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px", color: "#1976d2" }}>📊 Google Analytics</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Sessions</label>
                    <input
                      type="number"
                      value={form.gaSessions}
                      onChange={(e) => setForm({ ...form, gaSessions: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Users</label>
                    <input
                      type="number"
                      value={form.gaUsers}
                      onChange={(e) => setForm({ ...form, gaUsers: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Pageviews</label>
                    <input
                      type="number"
                      value={form.gaPageviews}
                      onChange={(e) => setForm({ ...form, gaPageviews: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Bounce Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.gaBounceRate}
                      onChange={(e) => setForm({ ...form, gaBounceRate: e.target.value })}
                      placeholder="0.00"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Avg Duration (sec)</label>
                    <input
                      type="number"
                      value={form.gaAvgSessionDuration}
                      onChange={(e) => setForm({ ...form, gaAvgSessionDuration: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* Google Search Console */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px", color: "#2e7d32" }}>🔍 Google Search Console</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Impressions</label>
                    <input
                      type="number"
                      value={form.gscImpressions}
                      onChange={(e) => setForm({ ...form, gscImpressions: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Clicks</label>
                    <input
                      type="number"
                      value={form.gscClicks}
                      onChange={(e) => setForm({ ...form, gscClicks: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>CTR (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.gscCtr}
                      onChange={(e) => setForm({ ...form, gscCtr: e.target.value })}
                      placeholder="0.00"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Avg Position</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.gscAvgPosition}
                      onChange={(e) => setForm({ ...form, gscAvgPosition: e.target.value })}
                      placeholder="0.0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* META Ads */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px", color: "#1877f2" }}>📱 META Ads</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Spend ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.metaSpend}
                      onChange={(e) => setForm({ ...form, metaSpend: e.target.value })}
                      placeholder="0.00"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Impressions</label>
                    <input
                      type="number"
                      value={form.metaImpressions}
                      onChange={(e) => setForm({ ...form, metaImpressions: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Clicks</label>
                    <input
                      type="number"
                      value={form.metaClicks}
                      onChange={(e) => setForm({ ...form, metaClicks: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Conversions</label>
                    <input
                      type="number"
                      value={form.metaConversions}
                      onChange={(e) => setForm({ ...form, metaConversions: e.target.value })}
                      placeholder="0"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>CTR (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.metaCtr}
                      onChange={(e) => setForm({ ...form, metaCtr: e.target.value })}
                      placeholder="0.00"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>CPC ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.metaCpc}
                      onChange={(e) => setForm({ ...form, metaCpc: e.target.value })}
                      placeholder="0.00"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>ROAS</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.metaRoas}
                      onChange={(e) => setForm({ ...form, metaRoas: e.target.value })}
                      placeholder="0.00"
                      style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Monthly highlights, observations, etc."
                  style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "10px 20px", background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  {saving ? "Saving..." : editingId ? "Update Metrics" : "Save Metrics"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }}
                  style={{ padding: "10px 20px", background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Latest Metrics Summary */}
        {metrics.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
            {/* GA Card */}
            <div style={{ background: "white", padding: 24, borderRadius: 8, borderTop: "4px solid #1976d2" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1976d2" }}>📊 Google Analytics</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Sessions</div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gaSessions)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Users</div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gaUsers)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Pageviews</div>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{formatNumber(metrics[0].gaPageviews)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Bounce Rate</div>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{formatDecimal(metrics[0].gaBounceRate, "%")}</div>
                </div>
              </div>
            </div>

            {/* GSC Card */}
            <div style={{ background: "white", padding: 24, borderRadius: 8, borderTop: "4px solid #2e7d32" }}>
              <h3 style={{ margin: "0 0 16px", color: "#2e7d32" }}>🔍 Search Console</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Impressions</div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gscImpressions)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Clicks</div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatNumber(metrics[0].gscClicks)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>CTR</div>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{formatDecimal(metrics[0].gscCtr, "%")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Avg Position</div>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{formatDecimal(metrics[0].gscAvgPosition)}</div>
                </div>
              </div>
            </div>

            {/* META Card */}
            <div style={{ background: "white", padding: 24, borderRadius: 8, borderTop: "4px solid #1877f2" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1877f2" }}>📱 META Ads</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Spend</div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatCurrency(metrics[0].metaSpend)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>ROAS</div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{formatDecimal(metrics[0].metaRoas)}x</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Conversions</div>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{formatNumber(metrics[0].metaConversions)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>CPC</div>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{formatCurrency(metrics[0].metaCpc)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics History Table */}
        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          <h3 style={{ margin: 0, padding: 24, borderBottom: "1px solid #eee" }}>Metrics History</h3>
          
          {metrics.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
              No metrics recorded yet. Click "+ Add Metrics" to start tracking.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Month</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1976d2" }}>Sessions</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1976d2" }}>Users</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#2e7d32" }}>GSC Clicks</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#2e7d32" }}>Impressions</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1877f2" }}>META Spend</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee", color: "#1877f2" }}>ROAS</th>
                    <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 12, fontWeight: 500 }}>
                        {new Date(m.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </td>
                      <td style={{ padding: 12 }}>{formatNumber(m.gaSessions)}</td>
                      <td style={{ padding: 12 }}>{formatNumber(m.gaUsers)}</td>
                      <td style={{ padding: 12 }}>{formatNumber(m.gscClicks)}</td>
                      <td style={{ padding: 12 }}>{formatNumber(m.gscImpressions)}</td>
                      <td style={{ padding: 12 }}>{formatCurrency(m.metaSpend)}</td>
                      <td style={{ padding: 12 }}>{m.metaRoas ? formatDecimal(m.metaRoas) + "x" : "-"}</td>
                      <td style={{ padding: 12 }}>
                        <button
                          onClick={() => editMetrics(m)}
                          style={{ padding: "4px 8px", marginRight: 4, background: "#eee", border: "none", borderRadius: 4, cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMetrics(m)}
                          style={{ padding: "4px 8px", background: "#fee", color: "#c00", border: "none", borderRadius: 4, cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
