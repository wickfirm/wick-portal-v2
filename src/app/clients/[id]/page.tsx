import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";
import OnboardingManager from "./onboarding-manager";
import ClientResources from "./client-resources";
import TeamManager from "./team-manager";
import AgenciesManager from "./agencies-manager";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ClientViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  if (user.role !== "SUPER_ADMIN") {
    const hasAccess = await prisma.clientTeamMember.findFirst({
      where: { clientId: params.id, userId: user.id },
    });
    if (!hasAccess) {
      redirect("/clients");
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      projects: { include: { stages: true }, orderBy: { createdAt: "desc" } },
      onboardingItems: { orderBy: { order: "asc" } },
      resources: { orderBy: { order: "asc" } },
      agencies: {
        include: { agency: true }
      },
      teamMembers: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { assignedAt: "asc" },
      },
    },
  });

  if (!client) {
    return <div style={{ padding: 48, textAlign: "center" }}>Client not found</div>;
  }

  const onboardingForClient = client.onboardingItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    serviceType: item.serviceType,
    itemType: item.itemType || "CHECKBOX",
    order: item.order,
    isRequired: item.isRequired || false,
    isCompleted: item.isCompleted,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    completedBy: item.completedBy,
    inputValue: item.inputValue,
    notes: item.notes,
    resourceUrl: item.resourceUrl,
    resourceLabel: item.resourceLabel,
  }));

  const resourcesForClient = client.resources.map(resource => ({
    id: resource.id,
    name: resource.name,
    url: resource.url,
    type: resource.type,
    order: resource.order,
  }));

  const teamForClient = client.teamMembers.map(tm => ({
    id: tm.id,
    userId: tm.userId,
    name: tm.user.name,
    email: tm.user.email,
    role: tm.user.role,
  }));

  const canManageTeam = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canAddProjects = ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const canSeeBudget = user.role === "SUPER_ADMIN";

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/clients" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Clients
          </Link>
        </div>

        {/* Client Header */}
        <div style={{ background: theme.colors.bgSecondary, padding: 32, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: theme.gradients.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: 28
              }}>
                {(client.nickname || client.name).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, margin: 0, marginBottom: 8 }}>
                  {client.name}
                  {client.nickname && (
                    <span style={{ fontWeight: 400, color: theme.colors.textMuted, marginLeft: 8 }}>({client.nickname})</span>
                  )}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    background: STATUS_STYLES[client.status]?.bg || theme.colors.bgTertiary,
                    color: STATUS_STYLES[client.status]?.color || theme.colors.textSecondary
                  }}>
                    {client.status}
                  </span>
                  {client.agencies.map(ca => (
                    <span key={ca.agency.id} style={{ 
                      padding: "4px 10px", 
                      background: theme.colors.infoBg, 
                      color: theme.colors.info, 
                      borderRadius: 20, 
                      fontSize: 12,
                      fontWeight: 500,
                    }}>
                      {ca.agency.name}
                    </span>
                  ))}
                  {client.industry && <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>• {client.industry}</span>}
                  {client.website && (
                    <a href={client.website} target="_blank" style={{ color: theme.colors.primary, fontSize: 14 }}>
                      • {client.website.replace("https://", "").replace("http://", "")}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={"/clients/" + client.id + "/onboarding"} style={{
                padding: "10px 16px",
                borderRadius: theme.borderRadius.md,
                background: client.status === "ONBOARDING" || client.status === "LEAD" ? theme.colors.warningBg : theme.colors.bgTertiary,
                color: client.status === "ONBOARDING" || client.status === "LEAD" ? theme.colors.warning : theme.colors.textSecondary,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13
              }}>
                Onboarding
              </Link>
              <Link href={"/clients/" + client.id + "/metrics"} style={{
                padding: "10px 16px",
                borderRadius: theme.borderRadius.md,
                background: theme.colors.successBg,
                color: theme.colors.success,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13
              }}>
                Metrics
              </Link>
              <Link href={"/clients/" + client.id + "/tasks"} style={{
                padding: "10px 16px",
                borderRadius: theme.borderRadius.md,
                background: theme.colors.infoBg,
                color: theme.colors.info,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13
              }}>
                Tasks
              </Link>
              <Link href={"/clients/" + client.id + "/edit"} style={{
                padding: "10px 16px",
                borderRadius: theme.borderRadius.md,
                background: theme.colors.bgTertiary,
                color: theme.colors.textSecondary,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13
              }}>
                Edit
              </Link>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left Column */}
          <div>
            {/* Contact Details */}
            <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 0, marginBottom: 20 }}>
                Contact Details
              </h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Primary Contact</div>
                  <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{client.primaryContact || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Email</div>
                  <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{client.primaryEmail || "—"}</div>
                </div>
                {canSeeBudget && (
                  <div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Monthly Retainer</div>
                    <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                      {client.monthlyRetainer ? "$" + Number(client.monthlyRetainer).toLocaleString() : "—"}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>Client Since</div>
                  <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>
                    {new Date(client.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Agencies Manager */}
            <AgenciesManager 
              clientId={client.id} 
              initialAgencies={client.agencies.map(ca => ca.agency)} 
            />

            {/* Team Members */}
            {canManageTeam && (
              <TeamManager 
                clientId={client.id} 
                initialTeam={teamForClient} 
                canEdit={canManageTeam}
              />
            )}

            {/* Client Resources */}
            <ClientResources clientId={client.id} initialResources={resourcesForClient} />
          </div>

          {/* Right Column - Onboarding */}
          <OnboardingManager clientId={client.id} clientStatus={client.status} initialItems={onboardingForClient} />
        </div>

        {/* Projects */}
        <div style={{ marginTop: 24, background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Projects ({client.projects.length})</h2>
            {canAddProjects && (
              <Link href={"/projects/new?clientId=" + client.id} style={{
                background: theme.colors.primary,
                color: "white",
                padding: "8px 16px",
                borderRadius: 6,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: 13
              }}>
                + Add Project
              </Link>
            )}
          </div>

          {client.projects.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
              No projects yet
            </div>
          ) : (
            <div>
              {client.projects.map((project, idx) => {
                const completed = project.stages.filter(s => s.isCompleted).length;
                const total = project.stages.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <Link key={project.id} href={"/projects/" + project.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: "16px 24px",
                      borderBottom: idx < client.projects.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 500, color: theme.colors.textPrimary }}>{project.name}</div>
                          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{project.serviceType.replace("_", " ")}</div>
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: STATUS_STYLES[project.status]?.bg || theme.colors.bgTertiary,
                          color: STATUS_STYLES[project.status]?.color || theme.colors.textSecondary
                        }}>
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                          <div style={{
                            height: "100%",
                            width: pct + "%",
                            background: theme.gradients.progress,
                            borderRadius: 3
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500 }}>{pct}%</span>
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
