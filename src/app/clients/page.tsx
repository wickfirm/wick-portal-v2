import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { projects: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#666", textDecoration: "none" }}>Team</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Clients</h1>
          <Link href="/clients/new" style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
            + Add Client
          </Link>
        </div>

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          {clients.length === 0 ? (
            <p style={{ padding: 24, textAlign: "center", color: "#888" }}>No clients yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Name</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Industry</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Status</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Projects</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      <strong>{client.name}</strong>
                      {client.website && <div style={{ fontSize: 12, color: "#888" }}>{client.website}</div>}
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{client.industry || "-"}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: 12,
                        background: client.status === "ACTIVE" ? "#e8f5e9" : "#f5f5f5",
                        color: client.status === "ACTIVE" ? "#2e7d32" : "#666"
                      }}>
                        {client.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{client.projects.length}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
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
