import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import OnboardingManager from "./onboarding-manager";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "#e6f4ea", color: "#34a853" },
  ONBOARDING: { bg: "#e8f0fe", color: "#4285f4" },
  LEAD: { bg: "#fef7e0", color: "#f9ab00" },
  PAUSED: { bg: "#fce8e6", color: "#ea4335" },
  CHURNED: { bg: "#f1f3f4", color: "#5f6368" },
};

const PROJECT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#f1f3f4", color: "#5f6368" },
  PENDING_APPROVAL: { bg: "#fef7e0", color: "#f9ab00" },
  IN_PROGRESS: { bg: "#e8f0fe", color: "#4285f4" },
  ON_HOLD: { bg: "#fce8e6", color: "#ea4335" },
  COMPLETED: { bg: "#e6f4ea", color: "#34a853" },
  CANCELLED: { bg: "#f1f3f4", color: "#5f6368" },
};

export default async function ClientViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      projects: { include: { stages: true }, orderBy: { createdAt: "desc" } },
      onboardingItems: { orderBy: { order: "asc" } },
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
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/clients" style={{ color: "#5f6368", textDecoration: "none", fontSize: 14 }}>
            ← Back to Clients
          </Link>
        </div>

        {/* Client Header */}
        <div style={{
          background: "white",
          padding: 32,
          borderRadius: 12,
          border: "1px solid #e8eaed",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #e85a4f, #f8b739)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 24
            }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{client.name}</h1>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  background: STATUS_STYLES[client.status]?.bg || "#f1f3f4",
                  color: STATUS_STYLES[client.status]?.color || "#5f6368"
                }}>
                  {client.status}
                </span>
              </div>
              <div style={{ color: "#5f6368", fontSize: 14 }}>
                {client.industry && <span>{client.industry}</span>}
                {client.industry && client.website && <span style={{ margin: "0 8px" }}>•</span>}
                {client.website && (
                  <a href={client.website} target="_blank" style={{ color: "#e85a4f" }}>
                    {client.website.replace("https://", "").replace("http://", "")}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/clients/${client.id}/metrics`} style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#e6f4ea",
              color: "#34a853",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              📊 Metrics
            </Link>
            <Link href={`/clients/${client.id}/tasks`} style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#e8f0fe",
              color: "#4285f4",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              ✓ Tasks
            </Link>
            <Link href={`/clients/${client.id}/edit`} style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "#f1f3f4",
              color: "#5f6368",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 13
            }}>
              Edit
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Client Details */}
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: 20 }}>
              Client Details
            </h3>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Industry</div>
                <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{client.industry || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Website</div>
                <div style={{ fontWeight: 500, color: "#1a1a1a" }}>
                  {client.website ? (
                    <a href={client.website} target="_blank" style={{ color: "#e85a4f" }}>{client.website}</a>
                  ) : "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Monthly Retainer</div>
                <div style={{ fontWeight: 500, color: "#1a1a1a" }}>
                  {client.monthlyRetainer ? `$${Number(client.monthlyRetainer).toLocaleString()}` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e8eaed" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: 20 }}>
              Primary Contact
            </h3>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Name</div>
                <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{client.primaryContact || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#9aa0a6", marginBottom: 4 }}>Email</div>
                <div style={{ fontWeight: 500, color: "#1a1a1a" }}>
                  {client.primaryEmail ? (
                    <a href={`mailto:${client.primaryEmail}`} style={{ color: "#e85a4f" }}>{client.primaryEmail}</a>
                  ) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding */}
        <OnboardingManager
          clientId={client.id}
          clientStatus={client.status}
          initialItems={onboardingForClient}
        />

        {/* Projects */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e8eaed", overflow: "hidden", marginTop: 24 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e8eaed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Projects ({client.projects.length})</h2>
            <Link href={`/projects/new?clientId=${client.id}`} style={{ fontSize: 13, color: "#e85a4f", textDecoration: "none", fontWeight: 500 }}>
              + Add Project
            </Link>
          </div>

          {client.projects.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#9aa0a6" }}>
              No projects yet
            </div>
          ) : (
            <div>
              {client.projects.map((project, idx) => {
                const completed = project.stages.filter(s => s.isCompleted).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: "16px 24px",
                      borderBottom: idx < client.projects.length - 1 ? "1px solid #f1f3f4" : "none",
                      cursor: "pointer",
                      transition: "background 150ms ease"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 500, color: "#1a1a1a", marginBottom: 2 }}>{project.name}</div>
                          <div style={{ fontSize: 12, color: "#9aa0a6" }}>{project.serviceType.replace("_", " ")}</div>
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: PROJECT_STATUS_STYLES[project.status]?.bg || "#f1f3f4",
                          color: PROJECT_STATUS_STYLES[project.status]?.color || "#5f6368"
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, height: 6, background: "#f1f3f4", borderRadius: 3 }}>
                          <div style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #e85a4f, #f8b739)",
                            borderRadius: 3
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#5f6368", fontWeight: 500 }}>{pct}%</span>
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
