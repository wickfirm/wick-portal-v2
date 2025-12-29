import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header style={{ background: "white", padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/dashboard" style={{ fontWeight: "bold", fontSize: 20, textDecoration: "none", color: "#333" }}>Wick Portal</Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <Link href="/dashboard" style={{ color: "#666", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/clients" style={{ color: "#666", textDecoration: "none" }}>Clients</Link>
            <Link href="/projects" style={{ color: "#666", textDecoration: "none" }}>Projects</Link>
            <Link href="/team" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>Team</Link>
          </nav>
        </div>
        <Link href="/api/auth/signout" style={{ color: "#666", textDecoration: "none" }}>Sign out</Link>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Team</h1>
          <Link href="/team/new" style={{ background: "#333", color: "white", padding: "10px 20px", borderRadius: 6, textDecoration: "none" }}>
            + Add Member
          </Link>
        </div>

        <div style={{ background: "white", borderRadius: 8, overflow: "hidden" }}>
          {users.length === 0 ? (
            <p style={{ padding: 24, textAlign: "center", color: "#888" }}>No team members yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9", textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Name</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Email</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Role</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Client</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Status</th>
                  <th style={{ padding: 12, borderBottom: "1px solid #eee" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      <strong>{user.name}</strong>
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{user.email}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: user.role === "ADMIN" ? "#e3f2fd" : user.role === "MANAGER" ? "#f3e5f5" : "#f5f5f5",
                        color: user.role === "ADMIN" ? "#1976d2" : user.role === "MANAGER" ? "#7b1fa2" : "#666"
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{user.client?.name || "-"}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      <span style={{ 
                        padding: "4px 8px", borderRadius: 4, fontSize: 12,
                        background: user.isActive ? "#e8f5e9" : "#ffebee",
                        color: user.isActive ? "#2e7d32" : "#c62828"
                      }}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                      <Link href={`/team/${user.id}/edit`} style={{ color: "#1976d2" }}>Edit</Link>
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
