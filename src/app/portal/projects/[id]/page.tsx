import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalProjectDetailPage({ params }: { params: { id: string } }) {
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

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  if (!project || project.clientId !== dbUser.client.id) {
    redirect("/portal/projects");
  }

  const completed = project.stages.filter(s => s.isCompleted).length;
  const total = project.stages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/portal/projects" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div style={{ background: theme.colors.bgSecondary, padding: 32, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, margin: 0, marginBottom: 4 }}>{project.name}</h1>
              <div style={{ fontSize: 14, color: theme.colors.textMuted }}>{project.serviceType.replace("_", " ")}</div>
            </div>
            <span style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
              color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
            }}>
              {project.status.replace("_", " ")}
            </span>
          </div>

          {project.description && (
            <p style={{ color: theme.colors.textSecondary, marginBottom: 24, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{project.description}</p>
          )}

          {/* Progress */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>Progress</span>
              <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>{completed}/{total} stages ({pct}%)</span>
            </div>
            <div style={{ height: 12, background: theme.colors.bgTertiary, borderRadius: 6 }}>
              <div style={{
                height: "100%",
                width: pct + "%",
                background: pct === 100 ? theme.colors.success : theme.gradients.progress,
                borderRadius: 6,
                transition: "width 300ms ease"
              }} />
            </div>
          </div>
        </div>

        {/* Stages */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Project Stages</h2>
          </div>

          {project.stages.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
              No stages defined yet
            </div>
          ) : (
            <div>
              {project.stages.map((stage, idx) => (
                <div key={stage.id} style={{
                  padding: "20px 24px",
                  borderBottom: idx < project.stages.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 16
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: stage.isCompleted ? theme.colors.success : theme.colors.bgTertiary,
                    color: stage.isCompleted ? "white" : theme.colors.textMuted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {stage.isCompleted ? "✓" : stage.order}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 500,
                      color: stage.isCompleted ? theme.colors.textMuted : theme.colors.textPrimary,
                      textDecoration: stage.isCompleted ? "line-through" : "none"
                    }}>
                      {stage.name}
                    </div>
                    {stage.completedAt && (
                      <div style={{ fontSize: 12, color: theme.colors.success, marginTop: 2 }}>
                        Completed on {new Date(stage.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
