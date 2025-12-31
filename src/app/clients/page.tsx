import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "#e6f4ea", color: "#34a853" },
  ONBOARDING: { bg: "#e8f0fe", color: "#4285f4" },
  LEAD: { bg: "#fef7e0", color: "#f9ab00" },
  PAUSED: { bg: "#fce8e6", color: "#ea4335" },
  CHURNED: { bg: "#f1f3f4", color: "#5f6368" },
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { projects: true },
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === "ACTIVE").length,
    onboarding: clients.filter(c => c.status === "ONBOARDING").length,
    leads: clients.filter(c => c.status === "LEAD").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Clients</h1>
            <p style={{ color: "#5f6368", fontSize: 15 }}>Manage your client relationships</p>
          </div>
          <Link href="/clients/new" style={{
            background: "linear-gradient(135deg, #e85a4f, #d44a3f)",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(232, 90, 79, 0.3)"
          }}>
            <span style={{ fontSize: 18 }}>+</span> Add Client
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>Total Clients</div>
          </div>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#34a853" }}>{stats.active}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>Active</div>
          </div>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#4285f4" }}>{stats.onboarding}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>Onboarding</div>
          </div>
          <div style={{ background: "white", padding: 20, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f9ab00" }}>{stats.leads}</div>
            <div style={{ fontSize: 13, color: "#5f6368" }}>Leads</div>
          </div>
        </div>

        {/* Clients Table */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
          {clients.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>No clients yet</div>
              <div style={{ color: "#5f6368", marginBottom: 24 }}>Get started by adding your first client</div>
              <Link href="/clients/new" style={{
                background: "#e85a4f",
                color: "white",
                padding: "10px 20px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 14
              }}>
                Add Client
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Client</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Industry</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Status</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Projects</th>
                  <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8eaed" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} style={{ borderBottom: "1px solid #f1f3f4", transition: "background 150ms ease" }}>
                    <td style={{ padding: 16 }}>
                      <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "linear-gradient(135deg, #e85a4f, #f8b739)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 600,
                          fontSize: 14
                        }}>
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{client.name}</div>
                          {client.website && <div style={{ fontSize: 12, color: "#9aa0a6" }}>{client.website.replace("https://", "").replace("http://", "")}</div>}
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: 16, color: "#5f6368" }}>{client.industry || "—"}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        background: STATUS_STYLES[client.status]?.bg || "#f1f3f4",
                        color: STATUS_STYLES[client.status]?.color || "#5f6368"
                      }}>
                        {client.status}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        background: "#f1f3f4",
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#5f6368"
                      }}>
                        {client.projects.length} project{client.projects.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td style={{ padding: 16, textAlign: "right" }}>
                      <Link href={`/clients/${client.id}`} style={{
                        color: "#e85a4f",
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: 13,
                        marginRight: 16
                      }}>
                        View
                      </Link>
                      <Link href={`/clients/${client.id}/edit`} style={{
                        color: "#5f6368",
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: 13
                      }}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
