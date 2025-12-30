import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import PortalHeader from "@/components/PortalHeader";

export const dynamic = "force-dynamic";

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
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <h1 style={{ marginTop: 0, marginBottom: 24 }}>Your Projects</h1>

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          {projects.length === 0 ? (
            <p style={{ padding: 48, textAlign: "center", color: "#888" }}>No projects yet</p>
          ) : (
            projects.map(project => {
              const completed = project.stages.filter(s => s.isCompleted).length;
              const total = project.stages.length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <Link key={project.id} href={`/portal/projects/${project.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ padding: 20, borderBottom: "1px solid #eee", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: "#333" }}>{project.name}</div>
                        <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{project.serviceType.replace("_", " ")}</div>
                      </div>
                      <span style={{
                        padding: "4px 12px", borderRadius: 4, fontSize: 12,
                        background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                        color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
                      }}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, color: "#666", minWidth: 40 }}>{pct}%</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
