import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import OnboardingManager from "./onboarding-manager";

export const dynamic = "force-dynamic";

export default async function ClientViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { 
      projects: { include: { stages: true } },
      onboardingItems: { orderBy: { order: "asc" } }
    },
  });

  if (!client) {
    return <div style={{ padding: 48, textAlign: "center" }}>Client not found</div>;
  }

  const onboardingForClient = client.onboardingItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    order: item.order,
    isCompleted: item.isCompleted,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    completedBy: item.completedBy,
    notes: item.notes,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>← Back to Clients</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>{client.name}</h1>
            <span style={{ 
              display: "inline-block", marginTop: 8, padding: "4px 12px", borderRadius: 4, fontSize: 14,
              background: client.status === "ACTIVE" ? "#e8f5e9" : client.status === "ONBOARDING" ? "#e3f2fd" : "#f5f5f5",
              color: client.status === "ACTIVE" ? "#2e7d32" : client.status === "ONBOARDING" ? "#1976d2" : "#666"
            }}>
              {client.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/clients/${client.id}/metrics`} style={{ background: "#2e7d32", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
              📊 Metrics
            </Link>
            <Link href={`/clients/${client.id}/tasks`} style={{ background: "#1976d2", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
              Weekly Tasks
            </Link>
            <Link href={`/clients/${client.id}/edit`} style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
              Edit Client
            </Link>
          </div>
        </div>

        <OnboardingManager 
          clientId={client.id} 
          clientStatus={client.status}
          initialItems={onboardingForClient} 
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "#666", fontSize: 14, textTransform: "uppercase" }}>Client Details</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Industry</div>
              <div>{client.industry || "-"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Website</div>
              <div>{client.website ? <a href={client.website} target="_blank" style={{ color: "#1976d2" }}>{client.website}</a> : "-"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Monthly Retainer</div>
              <div>{client.monthlyRetainer ? `$${Number(client.monthlyRetainer).toLocaleString()}` : "-"}</div>
            </div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "#666", fontSize: 14, textTransform: "uppercase" }}>Contact</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Primary Contact</div>
              <div>{client.primaryContact || "-"}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888" }}>Email</div>
              <div>{client.primaryEmail ? <a href={`mailto:${client.primaryEmail}`} style={{ color: "#1976d2" }}>{client.primaryEmail}</a> : "-"}</div>
            </div>
          </div>
        </div>

        <div style={{ background: "white", padding: 24, borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Projects ({client.projects.length})</h3>
            <Link href={`/projects/new?clientId=${client.id}`} style={{ color: "#1976d2", textDecoration: "none" }}>+ Add Project</Link>
          </div>

          {client.projects.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 24 }}>No projects yet</p>
          ) : (
            <div>
              {client.projects.map((project) => {
                const completed = project.stages.filter(s => s.isCompleted).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={project.id} style={{ padding: 16, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <Link href={`/projects/${project.id}`} style={{ fontWeight: 500, color: "#333", textDecoration: "none" }}>{project.name}</Link>
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>{project.serviceType.replace("_", " ")}</span>
                      </div>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: project.status === "IN_PROGRESS" ? "#e3f2fd" : project.status === "COMPLETED" ? "#e8f5e9" : "#f5f5f5",
                        color: project.status === "IN_PROGRESS" ? "#1976d2" : project.status === "COMPLETED" ? "#2e7d32" : "#666"
                      }}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "#4caf50", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#666" }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
