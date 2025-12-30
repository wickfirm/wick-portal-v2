import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { client: true },
  });

  if (!dbUser?.client) redirect("/portal");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { stages: { orderBy: { order: "asc" } }, client: true },
  });

  // Security: Make sure project belongs to this client
  if (!project || project.clientId !== dbUser.client.id) {
    redirect("/portal/projects");
  }

  const completed = project.stages.filter(s => s.isCompleted).length;
  const total = project.stages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontWeight: "bold", fontSize: 20, color: "#333" }}>Wick Portal</span>
<nav style={{ display: "flex", gap: 16 }}>
  <Link href="/portal" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
  <Link href="/portal/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
  <Link href="/portal/tasks" style={{ color: "#666", textDecoration: "none" }}>Tasks</Link>
  <Link href="/portal/metrics" style={{ color: "#666", textDecoration: "none" }}>Metrics</Link>
</nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#666" }}>{user.name}</span>
          <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/portal/projects" style={{ color: "#666", textDecoration: "none" }}>← Back to Projects</Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0 }}>{project.name}</h1>
              <span style={{ color: "#888" }}>{project.serviceType.replace("_", " ")}</span>
            </div>
            <span style={{ 
              padding: "8px 16px", borderRadius: 4, fontSize: 14,
              background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
              color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
            }}>
              {project.status.replace("_", " ")}
            </span>
          </div>

          {project.description && (
            <p style={{ color: "#666", marginBottom: 24 }}>{project.description}</p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>Progress</div>
              <div style={{ fontSize: 24, fontWeight: "bold" }}>{pct}%</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>Start Date</div>
              <div style={{ fontWeight: 500 }}>{project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>Budget</div>
              <div style={{ fontWeight: 500 }}>{project.budget ? `$${Number(project.budget).toLocaleString()}` : "-"}</div>
            </div>
          </div>

          <div style={{ height: 8, background: "#eee", borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Project Stages</h2>

          {project.stages.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No stages defined yet</p>
          ) : (
            <div>
              {project.stages.map((stage, index) => (
                <div key={stage.id} style={{ display: "flex", alignItems: "center", padding: 16, borderBottom: index < project.stages.length - 1 ? "1px solid #eee" : "none" }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: "50%", marginRight: 16,
                    background: stage.isCompleted ? "#4caf50" : "#eee",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: stage.isCompleted ? "white" : "#888", fontWeight: 500
                  }}>
                    {stage.isCompleted ? "✓" : stage.order}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: stage.isCompleted ? "#888" : "#333", textDecoration: stage.isCompleted ? "line-through" : "none" }}>
                      {stage.name}
                    </div>
                    {stage.completedAt && (
                      <div style={{ fontSize: 12, color: "#4caf50" }}>
                        Completed on {new Date(stage.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <span style={{ 
                    padding: "4px 12px", borderRadius: 4, fontSize: 12,
                    background: stage.isCompleted ? "#e8f5e9" : "#fff3e0",
                    color: stage.isCompleted ? "#2e7d32" : "#ef6c00"
                  }}>
                    {stage.isCompleted ? "Completed" : "In Progress"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
