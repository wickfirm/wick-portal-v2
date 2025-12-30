import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fff3e0", color: "#ef6c00" },
  IN_PROGRESS: { bg: "#e3f2fd", color: "#1976d2" },
  ONGOING: { bg: "#e8f5e9", color: "#2e7d32" },
  ON_HOLD: { bg: "#fce4ec", color: "#c2185b" },
  COMPLETED: { bg: "#e8f5e9", color: "#2e7d32" },
  FUTURE_PLAN: { bg: "#f3e5f5", color: "#7b1fa2" },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: "#ffebee", color: "#c62828" },
  MEDIUM: { bg: "#fff3e0", color: "#ef6c00" },
  LOW: { bg: "#e8f5e9", color: "#2e7d32" },
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
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Your Tasks</h1>

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <h3 style={{ margin: 0, padding: 20, borderBottom: "1px solid #eee" }}>Active Tasks ({pendingTasks.length})</h3>
          {pendingTasks.length === 0 ? (
            <p style={{ padding: 48, textAlign: "center", color: "#888" }}>No active tasks</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Task</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Category</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Due Date</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Priority</th>
                    <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTasks.map(task => (
                    <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 500 }}>{task.name}</div>
                        {task.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{task.notes}</div>}
                      </td>
                      <td style={{ padding: 12, color: "#666" }}>{task.category?.name || "-"}</td>
                      <td style={{ padding: 12, fontSize: 13 }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          background: PRIORITY_COLORS[task.priority]?.bg || "#f5f5f5",
                          color: PRIORITY_COLORS[task.priority]?.color || "#666"
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          background: STATUS_COLORS[task.status]?.bg || "#f5f5f5",
                          color: STATUS_COLORS[task.status]?.color || "#666"
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

        {completedTasks.length > 0 && (
          <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
            <h3 style={{ margin: 0, padding: 20, borderBottom: "1px solid #eee", color: "#888" }}>Completed ({completedTasks.length})</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {completedTasks.map(task => (
                    <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 12, color: "#888", textDecoration: "line-through" }}>{task.name}</td>
                      <td style={{ padding: 12, color: "#aaa" }}>{task.category?.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
