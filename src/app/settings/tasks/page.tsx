import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function TaskSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const taskSettings = [
    {
      title: "Categories",
      description: "Organize tasks into categories like Content, Technical, Design",
      href: "/settings/tasks/categories",
      icon: "📁",
      color: theme.colors.info,
    },
    {
      title: "Statuses",
      description: "Configure task status options like To Do, In Progress, Completed",
      href: "/settings/tasks/statuses",
      icon: "🔄",
      color: theme.colors.warning,
    },
    {
      title: "Priorities",
      description: "Set up priority levels like High, Medium, Low",
      href: "/settings/tasks/priorities",
      icon: "⚡",
      color: theme.colors.error,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>Task Settings</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Configure how tasks are organized and tracked</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {taskSettings.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: theme.colors.bgSecondary,
                padding: 20,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 150ms ease",
                cursor: "pointer",
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.borderRadius.md,
                  background: item.color + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{item.description}</div>
                </div>
                <div style={{ color: theme.colors.textMuted, fontSize: 18 }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
