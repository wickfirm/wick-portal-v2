import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  
  // Get the client associated with this user
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { client: true },
  });

  if (!dbUser?.client) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "white", padding: 48, borderRadius: 8, textAlign: "center" }}>
          <h1>No Client Assigned</h1>
          <p style={{ color: "#666" }}>Your account is not linked to a client. Please contact your account manager.</p>
          <Link href="/api/auth/signout" style={{ color: "#1976d2" }}>Sign out</Link>
        </div>
      </div>
    );
  }

  const client = dbUser.client;

  // Get client's projects
  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    include: { stages: true },
    orderBy: { createdAt: "desc" },
  });

  // Get client's tasks
  const tasks = await prisma.clientTask.findMany({
    where: { clientId: client.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get onboarding progress
  const onboardingItems = await prisma.onboardingItem.findMany({
    where: { clientId: client.id },
    orderBy: { order: "asc" },
  });

  const onboardingCompleted = onboardingItems.filter(i => i.isCompleted).length;
  const onboardingTotal = onboardingItems.length;
  const onboardingPct = onboardingTotal > 0 ? Math.round((onboardingCompleted / onboardingTotal) * 100) : 0;

  // Calculate project stats
  const activeProjects = projects.filter(p => p.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter(p => p.status === "COMPLETED").length;

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

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Welcome back!</h1>
          <p style={{ color: "#666", margin: "8px 0 0" }}>{client.name}</p>
        </div>

        {/* Onboarding Progress (if not complete) */}
        {onboardingTotal > 0 && onboardingPct < 100 && (
          <div style={{ background: "#e3f2fd", padding: 24, borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Onboarding Progress</h3>
              <span style={{ fontWeight: 500 }}>{onboardingPct}% complete</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.5)", borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${onboardingPct}%`, background: "#1976d2", borderRadius: 4 }} />
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#1565c0" }}>
              {onboardingCompleted} of {onboardingTotal} items completed
            </p>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: "bold" }}>{projects.length}</div>
            <div style={{ color: "#666" }}>Total Projects</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: "bold", color: "#1976d2" }}>{activeProjects}</div>
            <div style={{ color: "#666" }}>In Progress</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: "bold", color: "#2e7d32" }}>{completedProjects}</div>
            <div style={{ color: "#666" }}>Completed</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Recent Projects */}
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Projects</h3>
              <Link href="/portal/projects" style={{ color: "#1976d2", textDecoration: "none", fontSize: 14 }}>View all →</Link>
            </div>
            {projects.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No projects yet</p>
            ) : (
              projects.slice(0, 3).map(project => {
                const completed = project.stages.filter(s => s.isCompleted).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={project.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Link href={`/portal/projects/${project.id}`} style={{ fontWeight: 500, color: "#333", textDecoration: "none" }}>
                        {project.name}
                      </Link>
                      <span style={{ 
                        padding: "2px 8px", borderRadius: 4, fontSize: 12,
                        background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                        color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
                      }}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: "#eee", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#666" }}>{pct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recent Tasks */}
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Recent Tasks</h3>
              <Link href="/portal/tasks" style={{ color: "#1976d2", textDecoration: "none", fontSize: 14 }}>View all →</Link>
            </div>
            {tasks.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No tasks yet</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{task.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{task.category?.name || "Uncategorized"}</div>
                  </div>
                  <span style={{ 
                    padding: "2px 8px", borderRadius: 4, fontSize: 12,
                    background: task.status === "IN_PROGRESS" ? "#e3f2fd" : task.status === "COMPLETED" ? "#e8f5e9" : task.status === "ONGOING" ? "#e8f5e9" : "#fff3e0",
                    color: task.status === "IN_PROGRESS" ? "#1976d2" : task.status === "COMPLETED" ? "#2e7d32" : task.status === "ONGOING" ? "#2e7d32" : "#ef6c00"
                  }}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
