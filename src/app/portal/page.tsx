import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;

  // Get client linked to this user
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { client: true },
  });

  if (!dbUser?.client) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <PortalHeader userName={user.name} />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 48, textAlign: "center" }}>
          <h1>No Client Linked</h1>
          <p style={{ color: "#666" }}>Your account is not linked to a client. Please contact support.</p>
        </main>
      </div>
    );
  }

  const client = dbUser.client;

  const [projects, tasks, onboardingItems] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: client.id },
      include: { stages: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.clientTask.findMany({
      where: { clientId: client.id, status: { not: "COMPLETED" } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.onboardingItem.findMany({
      where: { clientId: client.id },
      orderBy: { order: "asc" },
    }),
  ]);

  const completedOnboarding = onboardingItems.filter(i => i.isCompleted).length;
  const totalOnboarding = onboardingItems.length;
  const onboardingPct = totalOnboarding > 0 ? Math.round((completedOnboarding / totalOnboarding) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Welcome, {user.name}</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>{projects.length}</div>
            <div style={{ color: "#666" }}>Active Projects</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>{tasks.length}</div>
            <div style={{ color: "#666" }}>Pending Tasks</div>
          </div>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>{onboardingPct}%</div>
            <div style={{ color: "#666" }}>Onboarding Complete</div>
          </div>
        </div>

        {totalOnboarding > 0 && onboardingPct < 100 && (
          <div style={{ background: "white", padding: 24, borderRadius: 8, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0 }}>Onboarding Progress</h3>
            <div style={{ height: 8, background: "#eee", borderRadius: 4, marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${onboardingPct}%`, background: "#4caf50", borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 14, color: "#666" }}>{completedOnboarding} of {totalOnboarding} items completed</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Recent Projects</h3>
              <Link href="/portal/projects" style={{ color: "#1976d2", textDecoration: "none", fontSize: 14 }}>View all →</Link>
            </div>
            {projects.length === 0 ? (
              <p style={{ color: "#888" }}>No projects yet</p>
            ) : (
              projects.map(project => {
                const completed = project.stages.filter(s => s.isCompleted).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={project.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    <div style={{ fontWeight: 500 }}>{project.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
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

          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Upcoming Tasks</h3>
              <Link href="/portal/tasks" style={{ color: "#1976d2", textDecoration: "none", fontSize: 14 }}>View all →</Link>
            </div>
            {tasks.length === 0 ? (
              <p style={{ color: "#888" }}>No pending tasks</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                  <div style={{ fontWeight: 500 }}>{task.name}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : "No due date"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
