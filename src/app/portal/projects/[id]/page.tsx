import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";

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
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/portal/projects" style={{ color: "#666", textDecoration: "none" }}>← Back to Projects</Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ margin: 0 }}>{project.name}</h1>
              <div style={{ color: "#888", marginTop: 4 }}>{project.serviceType.replace("_", " ")}</div>
            </div>
            <span style={{
              padding: "6px 16px", borderRadius: 4, fontSize: 14,
              background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
              color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
            }}>
              {project.status.replace("_", " ")}
            </span>
          </div>

          {project.description && (
            <p style={{ color: "#666", marginTop: 16, whiteSpace: "pre-wrap" }}>{project.description}</p>
          )}
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Progress</h3>
            <span style={{ fontSize: 14, color: "#666" }}>{completed}/{total} stages ({pct}%)</span>
          </div>

          <div style={{ height: 8, background: "#eee", borderRadius: 4, marginBottom: 24 }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: pct === 100 ? "#4caf50" : "#2196f3",
              borderRadius: 4,
              transition: "width 0.3s ease"
            }} />
          </div>

          <h4 style={{ margin: "0 0 16px 0", color: "#666" }}>Stages</h4>
          {project.stages.length === 0 ? (
            <p style={{ color: "#888" }}>No stages defined yet</p>
          ) : (
            project.stages.map((stage, idx) => (
              <div key={stage.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderBottom: idx < project.stages.length - 1 ? "1px solid #eee" : "none"
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: stage.isCompleted ? "#4caf50" : "#eee",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12
                }}>
                  {stage.isCompleted ? "✓" : stage.order}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 500,
                    color: stage.isCompleted ? "#888" : "#333",
                    textDecoration: stage.isCompleted ? "line-through" : "none"
                  }}>
                    {stage.name}
                  </div>
                  {stage.completedAt && (
                    <div style={{ fontSize: 12, color: "#4caf50", marginTop: 2 }}>
                      Completed on {new Date(stage.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
