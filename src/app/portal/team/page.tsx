import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import { theme, ROLE_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalTeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { client: true },
  });

  if (!dbUser?.client) {
    redirect("/portal");
  }

  const client = dbUser.client;

  const teamMembers = await prisma.clientTeamMember.findMany({
    where: { clientId: client.id },
    include: {
      user: {
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true,
          agency: {
            select: { name: true }
          }
        },
      },
    },
    orderBy: { assignedAt: "asc" },
  });

  const clientAgencies = await prisma.clientAgency.findMany({
    where: { clientId: client.id },
    include: { agency: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Your Team</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            The people working on {client.nickname || client.name}.
          </p>
        </div>

        {clientAgencies.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
              Agencies
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {clientAgencies.map(ca => (
                <div key={ca.id} style={{
                  padding: "16px 24px",
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.borderRadius.lg,
                  border: "1px solid " + theme.colors.borderLight,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: theme.gradients.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 18
                  }}>
                    {ca.agency.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: theme.colors.textPrimary }}>{ca.agency.name}</div>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted }}>Digital Marketing Agency</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16 }}>
            Team Members ({teamMembers.length})
          </h2>

          {teamMembers.length === 0 ? (
            <div style={{ 
              background: theme.colors.bgSecondary, 
              padding: 64, 
              borderRadius: theme.borderRadius.lg, 
              border: "1px solid " + theme.colors.borderLight, 
              textAlign: "center" 
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No team members assigned yet</div>
              <div style={{ color: theme.colors.textSecondary }}>Your account manager will assign team members to your account.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {teamMembers.map(tm => (
                <div key={tm.id} style={{
                  background: theme.colors.bgSecondary,
                  padding: 24,
                  borderRadius: theme.borderRadius.lg,
                  border: "1px solid " + theme.colors.borderLight,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      background: theme.gradients.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 20
                    }}>
                      {(tm.user.name || tm.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, color: theme.colors.textPrimary, marginBottom: 4 }}>
                        {tm.user.name || tm.user.email.split("@")[0]}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
                        {tm.user.email}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 500,
                          background: ROLE_STYLES[tm.user.role]?.bg || theme.colors.bgTertiary,
                          color: ROLE_STYLES[tm.user.role]?.color || theme.colors.textSecondary
                        }}>
                          {tm.user.role.replace("_", " ")}
                        </span>
                        {tm.user.agency && (
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 500,
                            background: theme.colors.infoBg,
                            color: theme.colors.info,
                          }}>
                            {tm.user.agency.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ 
          marginTop: 32, 
          padding: 24, 
          background: theme.colors.infoBg, 
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.info + "30",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.colors.info }}>Need to reach us?</h3>
          </div>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, margin: 0 }}>
            For day-to-day communication, please use Kitchen.co or contact your account manager directly via email.
          </p>
        </div>
      </main>
    </div>
  );
}
