import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true, stages: { orderBy: { order: "asc" } } },
  });

  if (!project) {
    return <div style={{ padding: 48, textAlign: "center" }}>Project not found</div>;
  }

  const completed = project.stages.filter(s => s.isCompleted).length;
  const total = project.stages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
            <Link href="/projects" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>← Back to Projects</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>{project.name}</h1>
            <Link href={`/clients/${project.client.id}`} style={{ color: "#666", textDecoration: "none" }}>{project.client.name}</Link>
            <div style={{ marginTop: 8 }}>
              <span style={{ 
                display: "inline-block", padding: "4px 12px", borderRadius: 4, fontSize: 14,
                background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
              }}>
                {project.status.replace("_", " ")}
              </span>
              <span style={{ marginLeft: 8, padding: "4px 12px", borderRadius: 4, fontSize: 14, background: "#f5f5f5", color: "#666" }}>
                {project.serviceType.replace("_", " ")}
              </span>
            </div>
          </div>
          <Link href={`/projects/${project.id}/edit`} style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
            Edit Project
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "#666", fontSize: 14, textTransform: "uppercase" }}>Project Details</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Description</div>
              <div>{project.description || "-"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Start Date</div>
              <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Budget</div>
              <div>{project.budget ? `$${Number(project.budget).toLocaleString()}` : "-"}</div>
            </div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "#666", fontSize: 14, textTransform: "uppercase" }}>Progress</h3>
            <div style={{ fontSize: 48, fontWeight: "bold", marginBottom: 8 }}>{pct}%</div>
            <div style={{ height: 8, background: "#eee", borderRadius: 4, marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>{completed} of {total} stages completed</div>
          </div>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Project Stages</h3>
          
          {project.stages.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No stages defined</p>
          ) : (
            <div>
              {project.stages.map((stage, index) => (
                <div key={stage.id} style={{ display: "flex", alignItems: "center", padding: 12, borderBottom: index < project.stages.length - 1 ? "1px solid #eee" : "none" }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: "50%", marginRight: 12,
                    background: stage.isCompleted ? "#4caf50" : "#eee",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 14
                  }}>
                    {stage.isCompleted ? "✓" : stage.order}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{stage.name}</div>
                    {stage.completedAt && (
                      <div style={{ fontSize: 12, color: "#888" }}>Completed {new Date(stage.completedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                  <span style={{ 
                    padding: "4px 8px", borderRadius: 4, fontSize: 12,
                    background: stage.isCompleted ? "#e8f5e9" : "#fff3e0",
                    color: stage.isCompleted ? "#2e7d32" : "#f57c00"
                  }}>
                    {stage.isCompleted ? "Completed" : "Pending"}
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
