import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import StageManager from "./stage-manager";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#f1f3f4", color: "#5f6368" },
  PENDING_APPROVAL: { bg: "#fef7e0", color: "#f9ab00" },
  IN_PROGRESS: { bg: "#e8f0fe", color: "#4285f4" },
  ON_HOLD: { bg: "#fce8e6", color: "#ea4335" },
  COMPLETED: { bg: "#e6f4ea", color: "#34a853" },
  CANCELLED: { bg: "#f1f3f4", color: "#5f6368" },
};

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
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/projects" style={{ color: "#5f6368", textDecoration: "none", fontSize: 14 }}>
            ← Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div style={{
          background: "white",
          padding: 32,
          borderRadius: 12,
          border: "1px solid #e8eaed",
          marginBottom: 24
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{project.name}</h1>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: STATUS_STYLES[project.status]?.bg || "#f1f3f4",
                  color: STATUS_STYLES[project.status]?.color || "#5f6368"
                }}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#5f6368", fontSize: 14 }}>
                <Link href={`/clients/${project.client.id}`} style={{ color: "#e85a4f", textDecoration: "none" }}>
                  {project.client.name}
                </Link>
                <span>•</span>
                <span>{project.serviceType.replace("_", " ")}</span>
              </div>
            </div>
            <Link href={`/projects/${project.id}/edit`} style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "#f1f3f4",
              color: "#5f6368",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 13
            }}>
              Edit Project
            </Link>
          </div>

          {/* Progress Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>Progress</span>
              <span style={{ fontSize: 14, color: "#5f6368" }}>{completed}/{total} stages ({pct}%)</span>
            </div>
            <div style={{ height: 10, background: "#f1f3f4", borderRadius: 5 }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: pct === 100 ? "#34a853" : "linear-gradient(90deg, #e85a4f, #f8b739)",
                borderRadius: 5,
                transition: "width 300ms ease"
              }} />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Stages */}
          <div>
            <StageManager
              projectId={project.id}
              initialStages={stagesForClient}
            />
          </div>

          {/* Sidebar */}
          <div>
            {/* Project Details */}
            <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed", marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: 20 }}>
                Project Details
              </h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Start Date</div>
                  <div style={{ fontWeight: 500, color: "#1a1a1a" }}>
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>End Date</div>
                  <div style={{ fontWeight: 500, color: "#1a1a1a" }}>
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Budget</div>
                  <div style={{ fontWeight: 500, color: "#1a1a1a" }}>
                    {project.budget ? `$${Number(project.budget).toLocaleString()}` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: 12 }}>
                  Description
                </h3>
                <p style={{ color: "#1a1a1a", fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                  {project.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
