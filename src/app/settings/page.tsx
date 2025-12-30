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

  const configItems = [
    {
      title: "Stage Templates",
      description: "Configure project stages for each service type",
      href: "/settings/stage-templates",
      icon: "📋",
    },
    {
      title: "Onboarding Templates",
      description: "Configure default onboarding checklist items",
      href: "/settings/onboarding",
      icon: "✅",
    },
    {
      title: "Task Categories",
      description: "Manage categories for weekly task tracking",
      href: "/settings/task-categories",
      icon: "📁",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Settings</h1>

        <div style={{ display: "grid", gap: 16 }}>
          {configItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{ 
                background: "white", 
                padding: 24, 
                borderRadius: 8, 
                display: "flex", 
                alignItems: "center", 
                gap: 16,
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}>
                <div style={{ fontSize: 32 }}>{item.icon}</div>
                <div>
                  <h3 style={{ margin: 0, color: "#333" }}>{item.title}</h3>
                  <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>{item.description}</p>
                </div>
                <div style={{ marginLeft: "auto", color: "#888" }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
