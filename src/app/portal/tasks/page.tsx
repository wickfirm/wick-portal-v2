import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import { theme, STATUS_STYLES, PRIORITY_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalTasksPage() {
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

  const tasks = await prisma.clientTask.findMany({
    where: { clientId: dbUser.client.id },
    include: { category: true },
    orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
  });

  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>Your Tasks</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track tasks assigned to you by the team.</p>
        </div>

        {/* Active Tasks */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Tasks ({pendingTasks.length})</h2>
          </div>

          {pendingTasks.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ color: theme.colors.success, marginBottom: 16, display: "flex", justifyContent: "center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>All caught up!</div>
              <div style={{ color: theme.colors.textSecondary }}>No pending tasks at the moment.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgPrimary }}>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Task</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Category</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Due Date</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Priority</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: theme.colors.textSecondary, textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTasks.map((task) => (
                    <tr key={task.id} style={{ borderBottom: "1px solid " + theme.colors.bgTertiary }}>
                      <td style={{ padding: 16 }}>
                        <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{task.name}</div>
                        {task.internalNotes && <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>{task.internalNotes}</div>}
                      </td>
                      <td style={{ padding: 16 }}>
                        {task.category ? (
                          <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{task.category.name}</span>
                        ) : (
                          <span style={{ color: theme.colors.textMuted }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: 16, fontSize: 13, color: theme.colors.textSecondary }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          background: PRIORITY_STYLES[task.priority]?.bg || theme.colors.bgTertiary,
                          color: PRIORITY_STYLES[task.priority]?.color || theme.colors.textSecondary
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          background: STATUS_STYLES[task.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[task.status]?.color || theme.colors.textSecondary
                        }}>
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.colors.textMuted }}>Completed ({completedTasks.length})</h2>
            </div>
            <div>
              {completedTasks.map((task, idx) => (
                <div key={task.id} style={{
                  padding: "16px 24px",
                  borderBottom: idx < completedTasks.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}>
                  <span style={{ color: theme.colors.success, fontSize: 16 }}>✓</span>
                  <span style={{ color: theme.colors.textMuted, textDecoration: "line-through" }}>{task.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
