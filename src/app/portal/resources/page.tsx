import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PortalHeader from "@/components/PortalHeader";
import { theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

const TYPE_ICONS: Record<string, string> = {
  DRIVE: "📁",
  SHEET: "📊",
  DOC: "📄",
  SLIDE: "📽️",
  FIGMA: "🎨",
  NOTION: "📝",
  KITCHEN: "🍳",
  ANALYTICS: "📈",
  SEARCH_CONSOLE: "🔍",
  ADS: "💰",
  SOCIAL: "📱",
  LINK: "🔗",
};

const TYPE_LABELS: Record<string, string> = {
  DRIVE: "Google Drive",
  SHEET: "Spreadsheet",
  DOC: "Document",
  SLIDE: "Presentation",
  FIGMA: "Figma",
  NOTION: "Notion",
  KITCHEN: "Kitchen.co",
  ANALYTICS: "Analytics",
  SEARCH_CONSOLE: "Search Console",
  ADS: "Advertising",
  SOCIAL: "Social Media",
  LINK: "Link",
};

export default async function PortalResourcesPage() {
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

  const client = dbUser.client;

  const resources = await prisma.clientResource.findMany({
    where: { clientId: client.id },
    orderBy: { order: "asc" },
  });

  const groupedResources = resources.reduce((acc, resource) => {
    const type = resource.type || "LINK";
    if (!acc[type]) acc[type] = [];
    acc[type].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <PortalHeader userName={user.name} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Resources</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Quick access to all your important documents and tools.
          </p>
        </div>

        {resources.length === 0 ? (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            padding: 64, 
            borderRadius: theme.borderRadius.lg, 
            border: "1px solid " + theme.colors.borderLight, 
            textAlign: "center" 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: theme.colors.textPrimary, marginBottom: 8 }}>No resources yet</div>
            <div style={{ color: theme.colors.textSecondary }}>Your team will add important links and documents here.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {Object.entries(groupedResources).map(([type, items]) => (
              <div key={type} style={{
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: "1px solid " + theme.colors.borderLight,
                overflow: "hidden",
              }}>
                <div style={{ 
                  padding: "16px 20px", 
                  borderBottom: "1px solid " + theme.colors.borderLight,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: theme.colors.bgPrimary,
                }}>
                  <span style={{ fontSize: 18 }}>{TYPE_ICONS[type] || "🔗"}</span>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary }}>
                    {TYPE_LABELS[type] || type}
                  </h2>
                  <span style={{ 
                    fontSize: 12, 
                    color: theme.colors.textMuted,
                    background: theme.colors.bgTertiary,
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}>
                    {items.length}
                  </span>
                </div>
                <div>
                  {items.map((resource, idx) => (
                    
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderBottom: idx < items.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: theme.colors.infoBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18
                        }}>
                          {TYPE_ICONS[type] || "🔗"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>{resource.name}</div>
                          <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                            {resource.url.length > 50 ? resource.url.substring(0, 50) + "..." : resource.url}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        padding: "8px 14px",
                        background: theme.colors.primaryBg,
                        color: theme.colors.primary,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                      }}>
                        Open ↗
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
