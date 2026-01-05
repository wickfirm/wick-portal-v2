import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import { theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PortalResourcesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = session.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { client: true },
  });

  if (!dbUser || !dbUser.client) {
    redirect("/portal");
  }

  const clientId = dbUser.client.id;

  const resources = await prisma.clientResource.findMany({
    where: { clientId: clientId },
    orderBy: { order: "asc" },
  });

  const resourceCount = resources.length;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 16 }}>
          Resources
        </h1>
        <p style={{ color: theme.colors.textSecondary, marginBottom: 32 }}>
          Quick access to all your important documents and tools.
        </p>
        <div style={{ background: theme.colors.bgSecondary, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, padding: 24 }}>
          {resourceCount === 0 ? (
            <p style={{ textAlign: "center", color: theme.colors.textMuted }}>No resources yet</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {resources.map(function(resource) {
                return (
                  <li key={resource.id} style={{ marginBottom: 12 }}>
                    
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: theme.colors.primary, textDecoration: "none" }}
                    >
                      {resource.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
