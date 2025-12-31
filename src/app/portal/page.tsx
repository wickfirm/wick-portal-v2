import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";
import { theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { client: true },
  });

  if (!dbUser?.client) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <PortalHeader userName={user.name} />
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>X</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>No Client Linked</h1>
          <p style={{ color: theme.colors.textSecondary }}>Your account is not linked to a client. Please contact support.</p>
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
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Here is an overview of your projects and tasks.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.info + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
              P
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{projects.length}</div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Active Projects</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
              T
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{tasks.length}</div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Pending Tasks</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: theme.colors.success + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>
              O
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>{onboardingPct}%</div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Onboarding Complete</div>
          </div>
        </div>

        {/* Onboarding Progress */}
        {totalOnboarding > 0 && onboardingPct < 100 && (
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 16 }}>Onboarding Progress</h3>
            <div style={{ height: 10, background: theme.colors.bgTertiary, borderRadius: 5, marginBottom: 8 }}>
              <div style={{
                height: "100%",
                width: onboardingPct + "%",
                background: theme.gradients.progress,
                borderRadius: 5,
                transition: "width 300ms ease"
              }} />
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>{completedOnboarding} of {totalOnboarding} items completed</div>
          </div>
        )}

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Recent Projects */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Projects</h3>
              <Link href="/portal/projects" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>No projects yet</div>
            ) : (
              <div>
                {projects.map((project, idx) => {
                  const completed = project.stages.filter(s => s.isCompleted).length;
                  const total = project.stages.length;
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <Link key={project.id} href={"/portal/projects/" + project.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{
                        padding: "16px 24px",
                        borderBottom: idx < projects.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                        cursor: "pointer"
                      }}>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>{project.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                            <div style={{
                              height: "100%",
                              width: pct + "%",
                              background: theme.gradients.progress,
                              borderRadius: 3
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500 }}>{pct}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Tasks */}
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Upcoming Tasks</h3>
              <Link href="/portal/tasks" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            {tasks.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>No pending tasks</div>
            ) : (
              <div>
                {tasks.map((task, idx) => (
                  <div key={task.id} style={{
                    padding: "16px 24px",
                    borderBottom: idx < tasks.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  }}>
                    <div style={{ fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 4 }}>{task.name}</div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      {task.dueDate ? "Due: " + new Date(task.dueDate).toLocaleDateString() : "No due date"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
