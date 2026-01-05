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
      title: "Account",
      description: "Manage your profile and change your password",
      href: "/settings/account",
      icon: "👤",
      color: theme.colors.purple,
      roles: ["SUPER_ADMIN", "ADMIN", "MEMBER"],
    },
    {
      title: "Agencies",
      description: "Manage agencies that service your clients",
      href: "/settings/agencies",
      icon: "🏢",
      color: theme.colors.warning,
      roles: ["SUPER_ADMIN"],
    },
    {
      title: "Stage Templates",
      description: "Configure default project stages for each service type",
      href: "/settings/stage-templates",
      icon: "📋",
      color: theme.colors.primary,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Onboarding Templates",
      description: "Set up default onboarding checklists for new clients",
      href: "/settings/onboarding",
      icon: "✅",
      color: theme.colors.success,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: "Task Categories",
      description: "Manage categories for client tasks",
      href: "/settings/task-categories",
      icon: "📁",
      color: theme.colors.info,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  // Filter settings based on user role
  const visibleItems = settingsItems.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Settings</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Configure your agency portal</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {visibleItems.map((item) => (
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
