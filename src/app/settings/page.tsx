import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const settingsItems = [
    {
      title: "Stage Templates",
      description: "Configure default project stages for each service type",
      href: "/settings/stage-templates",
      icon: "S",
      color: theme.colors.primary,
    },
    {
      title: "Onboarding Templates",
      description: "Set up default onboarding checklists for new clients",
      href: "/settings/onboarding",
      icon: "O",
      color: theme.colors.success,
    },
    {
      title: "Task Categories",
      description: "Manage categories for client tasks",
      href: "/settings/task-categories",
      icon: "T",
      color: theme.colors.info,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Settings</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Configure your agency portal</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: theme.colors.bgSecondary,
                padding: 24,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
                display: "flex",
                alignItems: "center",
                gap: 20,
                transition: "all 150ms ease",
                cursor: "pointer",
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.borderRadius.lg,
                  background: item.color + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 600,
                  color: item.color,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>{item.description}</div>
                </div>
                <div style={{ color: theme.colors.textMuted, fontSize: 20 }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
