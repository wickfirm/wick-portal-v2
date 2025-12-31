import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Header from "@/components/Header";

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
      icon: "📋",
      color: "#e85a4f",
    },
    {
      title: "Onboarding Templates",
      description: "Set up default onboarding checklists for new clients",
      href: "/settings/onboarding",
      icon: "✓",
      color: "#34a853",
    },
    {
      title: "Task Categories",
      description: "Manage categories for client tasks",
      href: "/settings/task-categories",
      icon: "🏷️",
      color: "#4285f4",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Settings</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Configure your agency portal</p>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {settingsItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "white",
                padding: 24,
                borderRadius: 12,
                border: "1px solid #e8eaed",
                display: "flex",
                alignItems: "center",
                gap: 20,
                transition: "all 150ms ease",
                cursor: "pointer",
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `${item.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: "#5f6368" }}>{item.description}</div>
                </div>
                <div style={{ color: "#9aa0a6", fontSize: 20 }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
