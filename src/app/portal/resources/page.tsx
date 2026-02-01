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

  const resources = await prisma.clientResource.findMany({
    where: { clientId: dbUser.client.id },
    orderBy: { order: "asc" },
  });

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary }}>Resources</h1>
        <p style={{ color: theme.colors.textSecondary, marginBottom: 32 }}>Quick access to your documents.</p>
        <div style={{ background: theme.colors.bgSecondary, borderRadius: 12, border: "1px solid " + theme.colors.borderLight, overflow: "hidden" }}>
          {resources.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center", color: theme.colors.textMuted }}>No resources yet</div>
          ) : (
            <div>
              {resources.map(function(r, i) {
                return (
                  <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 16, borderBottom: i < resources.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none", textDecoration: "none", color: theme.colors.textPrimary }}>
                    <strong>{r.name}</strong>
                    <span style={{ color: theme.colors.textMuted, marginLeft: 8 }}>{r.type}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
