import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  // Get current user's agencyId
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { agencyId: true, role: true, id: true },
  });

  // Build client filter based on agency
  let clientFilter: any = {};
  if (currentUser?.agencyId) {
    // Get all users from this agency
    const agencyTeamMembers = await prisma.user.findMany({
      where: { agencyId: currentUser.agencyId },
      select: { id: true },
    });
    const teamMemberIds = agencyTeamMembers.map(u => u.id);
    
    // Filter clients where ANY team member from this agency is assigned
    clientFilter = {
      teamMembers: {
        some: {
          userId: { in: teamMemberIds }
        }
      }
    };
  }

  const clients = await prisma.client.findMany({
    where: clientFilter,
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
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Clients</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Manage your client relationships</p>
          </div>
          <Link href="/clients/new" style={{
            background: theme.gradients.primary,
            color: "white",
            padding: "12px 24px",
            borderRadius: theme.borderRadius.md,
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: theme.shadows.button
          }}>
            <span style={{ fontSize: 18 }}>+</span> Add Client
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Clients</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.success }}>{stats.active}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Active</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.info }}>{stats.onboarding}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Onboarding</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.warning }}>{stats.leads}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Leads</div>
          </div>
        </div>

        {/* Clients Table */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: `1px solid ${theme.colors.borderLight}`, overflow: "hidden" }}>
          {clients.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No clients yet</div>
              <div style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>Get started by adding your first client</div>
              <Link href="/clients/new" style={{
                background: theme.colors.primary,
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
                <tr style={{ background: theme.colors.bgPrimary }}>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${theme.colors.borderLight}` }}>Client</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${theme.colors.borderLight}` }}>Industry</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${theme.colors.borderLight}` }}>Status</th>
                  <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${theme.colors.borderLight}` }}>Projects</th>
                  <th style={{ padding: 16, textAlign: "right", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${theme.colors.borderLight}` }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} style={{ borderBottom: `1px solid ${theme.colors.bgTertiary}`, transition: "background 150ms ease" }}>
                    <td style={{ padding: 16 }}>
                      <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: theme.gradients.accent,
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
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{client.name}</div>
                          {client.website && <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{client.website.replace("https://", "").replace("http://", "")}</div>}
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: 16, color: theme.colors.textSecondary }}>{client.industry || "—"}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        background: STATUS_STYLES[client.status]?.bg || theme.colors.bgTertiary,
                        color: STATUS_STYLES[client.status]?.color || theme.colors.textSecondary
                      }}>
                        {client.status}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        background: theme.colors.bgTertiary,
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        color: theme.colors.textSecondary
                      }}>
                        {client.projects.length} project{client.projects.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td style={{ padding: 16, textAlign: "right" }}>
                      <Link href={`/clients/${client.id}`} style={{
                        color: theme.colors.primary,
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: 13,
                        marginRight: 16
                      }}>
                        View
                      </Link>
                      <Link href={`/clients/${client.id}/edit`} style={{
                        color: theme.colors.textSecondary,
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
