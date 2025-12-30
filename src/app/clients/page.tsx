import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { projects: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header userName={user.name} userRole={user.role} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Clients</h1>
          <Link href="/clients/new" style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
            + Add Client
          </Link>
        </div>

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          {clients.length === 0 ? (
            <p style={{ padding: 48, textAlign: "center", color: "#888" }}>No clients yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Name</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Industry</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Status</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Projects</th>
                  <th style={{ padding: 12, borderBottom: "2px solid #eee" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>
                      <Link href={`/clients/${client.id}`} style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>
                        {client.name}
                      </Link>
                    </td>
                    <td style={{ padding: 12, color: "#666" }}>{client.industry || "-"}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: client.status === "ACTIVE" ? "#e8f5e9" : client.status === "ONBOARDING" ? "#e3f2fd" : "#f5f5f5",
                        color: client.status === "ACTIVE" ? "#2e7d32" : client.status === "ONBOARDING" ? "#1976d2" : "#666"
                      }}>
                        {client.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: "#666" }}>{client.projects.length}</td>
                    <td style={{ padding: 12 }}>
                      <Link href={`/clients/${client.id}`} style={{ color: "#1976d2", marginRight: 12 }}>View</Link>
                      <Link href={`/clients/${client.id}/edit`} style={{ color: "#666" }}>Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
