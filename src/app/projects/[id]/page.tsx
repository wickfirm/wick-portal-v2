import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import StageManager from "./stage-manager";
import ProjectTasks from "./project-tasks";
import ProjectResources from "./project-resources";
import ProjectTimeTracking from "./project-time-tracking";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ProjectViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  // Get current user role
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { role: true },
  });

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      stages: { orderBy: { order: "asc" } },
      tasks: { 
        include: { category: true },
        orderBy: { createdAt: "desc" }
      },
      resources: { orderBy: { order: "asc" } },
      timeEntries: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      },
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

  const tasksForProject = project.tasks.map(task => ({
    id: task.id,
    name: task.name,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    category: task.category ? { name: task.category.name } : null,
  }));

  const resourcesForProject = project.resources.map(resource => ({
    id: resource.id,
    name: resource.name,
    url: resource.url,
    type: resource.type,
    order: resource.order,
  }));

  // Serialize time entries
  const timeEntriesForProject = project.timeEntries.map(entry => ({
    id: entry.id,
    duration: entry.duration,
    date: entry.date.toISOString(),
    description: entry.description,
    user: entry.user,
    task: entry.task,
  }));

  const totalProjectTime = project.timeEntries.reduce((sum, e) => sum + e.duration, 0);

  const completed = project.stages.filter(s => s.isCompleted).length;
  const total = project.stages.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/projects" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 32,
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
          marginBottom: 24
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>{project.name}</h1>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                  color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
                }}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: theme.colors.textSecondary, fontSize: 14 }}>
                <Link href={"/clients/" + project.client.id} style={{ color: theme.colors.primary, textDecoration: "none" }}>
                  {project.client.name}
                </Link>
                <span>•</span>
                <span>{project.serviceType.replace("_", " ")}</span>
              </div>
            </div>
            {isAdmin && (
              <Link href={"/projects/" + project.id + "/edit"} style={{
                padding: "10px 20px",
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13
              }}>
                Edit Project
              </Link>
            )}
          </div>

          {/* Progress Bar - Only show for ADMINs */}
          {isAdmin && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.textPrimary }}>Progress</span>
                <span style={{ fontSize: 14, color: theme.colors.textSecondary }}>{completed}/{total} stages ({pct}%)</span>
              </div>
              <div style={{ height: 10, background: theme.colors.bgTertiary, borderRadius: 5 }}>
                <div style={{
                  height: "100%",
                  width: pct + "%",
                  background: pct === 100 ? theme.colors.success : theme.gradients.progress,
                  borderRadius: 5,
                  transition: "width 300ms ease"
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Main Content */}
          <div>
            {/* Stages - Only show for ADMINs */}
            {isAdmin && (
              <StageManager
                projectId={project.id}
                initialStages={stagesForClient}
              />
            )}

            {/* Tasks */}
            <ProjectTasks
              projectId={project.id}
              clientId={project.clientId}
              initialTasks={tasksForProject}
            />
          </div>

          {/* Sidebar */}
          <div>
            {/* Time Tracking */}
            <ProjectTimeTracking
              projectId={project.id}
              totalTime={totalProjectTime}
              entries={timeEntriesForProject}
            />

            {/* Resources */}
            <ProjectResources
              projectId={project.id}
              initialResources={resourcesForProject}
            />

            {/* Project Details */}
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: 20 }}>
                Project Details
              </h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Start Date</div>
                  <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>End Date</div>
                  <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Budget</div>
                  <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                    {project.budget ? "$" + Number(project.budget).toLocaleString() : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: 12 }}>
                  Description
                </h3>
                <p style={{ color: theme.colors.textPrimary, fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
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
