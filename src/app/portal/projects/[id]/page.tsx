import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#f1f3f4", color: "#5f6368" },
  PENDING_APPROVAL: { bg: "#fef7e0", color: "#f9ab00" },
  IN_PROGRESS: { bg: "#e8f0fe", color: "#4285f4" },
  ON_HOLD: { bg: "#fce8e6", color: "#ea4335" },
  COMPLETED: { bg: "#e6f4ea", color: "#34a853" },
  CANCELLED: { bg: "#f1f3f4", color: "#5f6368" },
};

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
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/portal/projects" style={{ color: "#5f6368", textDecoration: "none", fontSize: 14 }}>
            ← Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div style={{ background: "white", padding: 32, borderRadius: 12, border: "1px solid #e8eaed", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", margin: 0, marginBottom: 4 }}>{project.name}</h1>
              <div style={{ fontSize: 14, color: "#9aa0a6" }}>{project.serviceType.replace("_", " ")}</div>
            </div>
            <span style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              background: STATUS_STYLES[project.status]?.bg || "#f1f3f4",
              color: STATUS_STYLES[project.status]?.color || "#5f6368"
            }}>
              {project.status.replace("_", " ")}
            </span>
          </div>

          {project.description && (
            <p style={{ color: "#5f6368", marginBottom: 24, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{project.description}</p>
          )}

          {/* Progress */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>Progress</span>
              <span style={{ fontSize: 14, color: "#5f6368" }}>{completed}/{total} stages ({pct}%)</span>
            </div>
            <div style={{ height: 12, background: "#f1f3f4", borderRadius: 6 }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: pct === 100 ? "#34a853" : "linear-gradient(90deg, #e85a4f, #f8b739)",
                borderRadius: 6,
                transition: "width 300ms ease"
              }} />
            </div>
          </div>
        </div>

        {/* Stages */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Project Stages</h2>
          </div>

          {project.stages.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#9aa0a6" }}>
              No stages defined yet
            </div>
          ) : (
            <div>
              {project.stages.map((stage, idx) => (
                <div key={stage.id} style={{
                  padding: "20px 24px",
                  borderBottom: idx < project.stages.length - 1 ? "1px solid #f1f3f4" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 16
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: stage.isCompleted ? "#34a853" : "#f1f3f4",
                    color: stage.isCompleted ? "white" : "#9aa0a6",
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
                      color: stage.isCompleted ? "#9aa0a6" : "#1a1a1a",
                      textDecoration: stage.isCompleted ? "line-through" : "none"
                    }}>
                      {stage.name}
                    </div>
                    {stage.completedAt && (
                      <div style={{ fontSize: 12, color: "#34a853", marginTop: 2 }}>
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
