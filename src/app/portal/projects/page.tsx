import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#f1f3f4", color: "#5f6368" },
  PENDING_APPROVAL: { bg: "#fef7e0", color: "#f9ab00" },
  IN_PROGRESS: { bg: "#e8f0fe", color: "#4285f4" },
  ON_HOLD: { bg: "#fce8e6", color: "#ea4335" },
  COMPLETED: { bg: "#e6f4ea", color: "#34a853" },
  CANCELLED: { bg: "#f1f3f4", color: "#5f6368" },
};

export default async function PortalProjectsPage() {
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

  const projects = await prisma.project.findMany({
    where: { clientId: dbUser.client.id },
    include: { stages: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Your Projects</h1>
          <p style={{ color: "#5f6368", fontSize: 15 }}>Track the progress of all your active projects.</p>
        </div>

        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden" }}>
          {projects.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>No projects yet</div>
              <div style={{ color: "#5f6368" }}>Projects will appear here once they're started.</div>
            </div>
          ) : (
            <div>
              {projects.map((project, idx) => {
                const completed = project.stages.filter(s => s.isCompleted).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Link key={project.id} href={`/portal/projects/${project.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: 24,
                      borderBottom: idx < projects.length - 1 ? "1px solid #f1f3f4" : "none",
                      cursor: "pointer",
                      transition: "background 150ms ease"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{project.name}</div>
                          <div style={{ fontSize: 13, color: "#9aa0a6" }}>{project.serviceType.replace("_", " ")}</div>
                        </div>
                        <span style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background: STATUS_STYLES[project.status]?.bg || "#f1f3f4",
                          color: STATUS_STYLES[project.status]?.color || "#5f6368"
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, height: 8, background: "#f1f3f4", borderRadius: 4 }}>
                          <div style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: pct === 100 ? "#34a853" : "linear-gradient(90deg, #e85a4f, #f8b739)",
                            borderRadius: 4
                          }} />
                        </div>
                        <span style={{ fontSize: 14, color: "#5f6368", fontWeight: 500, minWidth: 45 }}>{pct}%</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
