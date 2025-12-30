import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

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
    where: { id: user.id },
    include: { client: true },
  });

  if (!dbUser?.client) redirect("/portal");

  const tasks = await prisma.clientTask.findMany({
    where: { clientId: dbUser.client.id },
    include: { category: true },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });

  const categories = await prisma.taskCategory.findMany({
    orderBy: { order: "asc" },
  });

  // Group tasks by category
  const groupedTasks = categories.map(cat => ({
    category: cat,
    tasks: tasks.filter(t => t.categoryId === cat.id),
  })).filter(g => g.tasks.length > 0);

  const uncategorizedTasks = tasks.filter(t => !t.categoryId);

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
        <h1 style={{ marginBottom: 24 }}>Weekly Tasks</h1>

        {tasks.length === 0 ? (
          <div style={{ background: "white", padding: 48, borderRadius: 8, textAlign: "center" }}>
            <p style={{ color: "#888" }}>No tasks yet. Your account manager will add tasks here during your weekly reviews.</p>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Category</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Task</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Priority</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Status</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {groupedTasks.map(group => (
                  group.tasks.map((task, idx) => (
                    <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                      {idx === 0 && (
                        <td rowSpan={group.tasks.length} style={{ padding: 12, fontWeight: 600, background: "#f9f9f9", verticalAlign: "top" }}>
                          {group.category.name}
                        </td>
                      )}
                      <td style={{ padding: 12 }}>{task.name}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: 4, fontSize: 12,
                          background: PRIORITY_COLORS[task.priority]?.bg || "#f5f5f5",
                          color: PRIORITY_COLORS[task.priority]?.color || "#666"
                        }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: 4, fontSize: 12,
                          background: STATUS_COLORS[task.status]?.bg || "#f5f5f5",
                          color: STATUS_COLORS[task.status]?.color || "#666"
                        }}>
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "#666" }}>
                        {task.notes || "-"}
                        {task.externalLink && (
                          <div style={{ marginTop: 4 }}>
                            <a href={task.externalLink} target="_blank" style={{ color: "#1976d2" }}>
                              {task.externalLinkLabel || "View Link"} ↗
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ))}

                {uncategorizedTasks.length > 0 && uncategorizedTasks.map((task, idx) => (
                  <tr key={task.id} style={{ borderBottom: "1px solid #eee" }}>
                    {idx === 0 && (
                      <td rowSpan={uncategorizedTasks.length} style={{ padding: 12, fontWeight: 600, background: "#f9f9f9", verticalAlign: "top", color: "#888" }}>
                        Other
                      </td>
                    )}
                    <td style={{ padding: 12 }}>{task.name}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: PRIORITY_COLORS[task.priority]?.bg || "#f5f5f5",
                        color: PRIORITY_COLORS[task.priority]?.color || "#666"
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: STATUS_COLORS[task.status]?.bg || "#f5f5f5",
                        color: STATUS_COLORS[task.status]?.color || "#666"
                      }}>
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: 13, color: "#666" }}>
                      {task.notes || "-"}
                      {task.externalLink && (
                        <div style={{ marginTop: 4 }}>
                          <a href={task.externalLink} target="_blank" style={{ color: "#1976d2" }}>
                            {task.externalLinkLabel || "View Link"} ↗
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
