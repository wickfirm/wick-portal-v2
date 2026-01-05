import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalProjectsPage() {
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

  const projects = await prisma.project.findMany({
    where: { clientId: dbUser.client.id },
    include: { stages: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Your Projects</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track the progress of all your active projects.</p>
        </div>

        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          {projects.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>P</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No projects yet</div>
              <div style={{ color: theme.colors.textSecondary }}>Projects will appear here once they are started.</div>
            </div>
          ) : (
            <div>
              {projects.map((project, idx) => {
                const completed = project.stages.filter(s => s.isCompleted).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Link key={project.id} href={"/portal/projects/" + project.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: 24,
                      borderBottom: idx < projects.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                      cursor: "pointer",
                      transition: "background 150ms ease"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>{project.name}</div>
                          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{project.serviceType.replace("_", " ")}</div>
                        </div>
                        <span style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, height: 8, background: theme.colors.bgTertiary, borderRadius: 4 }}>
                          <div style={{
                            height: "100%",
                            width: pct + "%",
                            background: pct === 100 ? theme.colors.success : theme.gradients.progress,
                            borderRadius: 4
                          }} />
                        </div>
                        <span style={{ fontSize: 14, color: theme.colors.textSecondary, fontWeight: 500, minWidth: 45 }}>{pct}%</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
