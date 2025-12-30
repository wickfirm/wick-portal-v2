import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import StageManager from "./stage-manager";

export const dynamic = "force-dynamic";

export default async function ProjectViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { 
      client: true,
      stages: { orderBy: { order: "asc" } }
    },
  });

  if (!project) {
    return <div style={{ padding: 48, textAlign: "center" }}>Project not found</div>;
  }

  const stagesForClient = project.stages.map(stage => ({
    id: stage.id,
    name: stage.name,
    order: stage.order,
    isCompleted: stage.isCompleted,
    completedAt: stage.completedAt ? stage.completedAt.toISOString() : null,
  }));

  const completed = project.stages.filter(s => s.isCompleted).length;
  const total = project.stages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>← Back to Projects</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>{project.name}</h1>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <Link href={`/clients/${project.client.id}`} style={{ color: "#666", textDecoration: "none" }}>
                {project.client.name}
              </Link>
              <span style={{ color: "#ddd" }}>•</span>
              <span style={{ color: "#888" }}>{project.serviceType.replace("_", " ")}</span>
              <span style={{ 
                padding: "4px 8px", borderRadius: 4, fontSize: 12,
                background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
              }}>
                {project.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <Link href={`/projects/${project.id}/edit`} style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
            Edit Project
          </Link>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Progress</h3>
            <span style={{ fontSize: 14, color: "#666" }}>{completed}/{total} stages ({pct}%)</span>
          </div>
          <div style={{ height: 8, background: "#eee", borderRadius: 4 }}>
            <div style={{ 
              height: "100%", 
              width: `${pct}%`, 
              background: pct === 100 ? "#4caf50" : "#2196f3", 
              borderRadius: 4,
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>

<StageManager
  projectId={project.id}
  initialStages={stagesForClient}
/>

        {project.description && (
          <div style={{ background: "white", padding: 24, borderRadius: 8, marginTop: 24 }}>
            <h3 style={{ marginTop: 0 }}>Description</h3>
            <p style={{ color: "#666", whiteSpace: "pre-wrap" }}>{project.description}</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "#666", fontSize: 14, textTransform: "uppercase" }}>Project Details</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Start Date</div>
              <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>End Date</div>
              <div>{project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Budget</div>
              <div>{project.budget ? `$${Number(project.budget).toLocaleString()}` : "-"}</div>
            </div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "#666", fontSize: 14, textTransform: "uppercase" }}>Client</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Name</div>
              <div>
                <Link href={`/clients/${project.client.id}`} style={{ color: "#1976d2", textDecoration: "none" }}>
                  {project.client.name}
                </Link>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Industry</div>
              <div>{project.client.industry || "-"}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
