import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef7e0", color: "#f9ab00" },
  IN_PROGRESS: { bg: "#e8f0fe", color: "#4285f4" },
  ONGOING: { bg: "#e6f4ea", color: "#34a853" },
  ON_HOLD: { bg: "#fce8e6", color: "#ea4335" },
  COMPLETED: { bg: "#e6f4ea", color: "#34a853" },
  FUTURE_PLAN: { bg: "#f3e5f5", color: "#7b1fa2" },
};

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: "#fce8e6", color: "#ea4335" },
  MEDIUM: { bg: "#fef7e0", color: "#f9ab00" },
  LOW: { bg: "#e6f4ea", color: "#34a853" },
};

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
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Your Tasks</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Track tasks assigned to you by the team.</p>
        </div>

        {/* Active Tasks */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Tasks ({pendingTasks.length})</h2>
          </div>

          {pendingTasks.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>All caught up!</div>
              <div style={{ color: "#5f6368" }}>No pending tasks at the moment.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase" }}>Task</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase" }}>Category</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase" }}>Due Date</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase" }}>Priority</th>
                    <th style={{ padding: 16, textAlign: "left", fontWeight: 600, fontSize: 12, color: "#5f6368", textTransform: "uppercase" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTasks.map((task) => (
                    <tr key={task.id} style={{ borderBottom: "1px solid #f1f3f4" }}>
                      <td style={{ padding: 16 }}>
                        <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{task.name}</div>
                        {task.notes && <div style={{ fontSize: 12, color: "#9aa0a6", marginTop: 2 }}>{task.notes}</div>}
                      </td>
                      <td style={{ padding: 16 }}>
                        {task.category ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: task.category.color || "#5f6368" }} />
                            <span style={{ fontSize: 13, color: "#5f6368" }}>{task.category.name}</span>
                          </span>
                        ) : (
                          <span style={{ color: "#9aa0a6" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: 16, fontSize: 13, color: "#5f6368" }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: 16 }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          background: PRIORITY_STYLES[task.priority]?.bg || "#f1f3f4",
                          color: PRIORITY_STYLES[task.priority]?.color || "#5f6368"
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
                          background: STATUS_STYLES[task.status]?.bg || "#f1f3f4",
                          color: STATUS_STYLES[task.status]?.color || "#5f6368"
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
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#9aa0a6" }}>Completed ({completedTasks.length})</h2>
            </div>
            <div>
              {completedTasks.map((task, idx) => (
                <div key={task.id} style={{
                  padding: "16px 24px",
                  borderBottom: idx < completedTasks.length - 1 ? "1px solid #f1f3f4" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}>
                  <span style={{ color: "#34a853", fontSize: 16 }}>✓</span>
                  <span style={{ color: "#9aa0a6", textDecoration: "line-through" }}>{task.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
