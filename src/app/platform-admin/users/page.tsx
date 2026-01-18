"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  agency: {
    id: string;
    name: string;
  } | null;
};

export default function PlatformAdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentUser = session?.user as any;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [agencies, setAgencies] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "PLATFORM_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [currentUser, router]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, agencyFilter, roleFilter, users]);

  async function fetchData() {
    try {
      const [usersRes, agenciesRes] = await Promise.all([
        fetch("/api/platform-admin/users"),
        fetch("/api/platform-admin/agencies"),
      ]);

      if (usersRes.status === 403) {
        router.push("/dashboard");
        return;
      }

      const usersData = await usersRes.json();
      const agenciesData = await agenciesRes.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
      setAgencies(Array.isArray(agenciesData) ? agenciesData : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  }

  function filterUsers() {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Agency filter
    if (agencyFilter !== "all") {
      if (agencyFilter === "none") {
        filtered = filtered.filter((u) => !u.agency);
      } else {
        filtered = filtered.filter((u) => u.agency?.id === agencyFilter);
      }
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }

  const inputStyle = {
    padding: "10px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    outline: "none",
    background: theme.colors.bgPrimary,
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>
          Loading...
        </div>
      </div>
    );
  }

  if (currentUser?.role !== "PLATFORM_ADMIN") {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              👥
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                All Users
              </h1>
              <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
                {filteredUsers.length} users across all tenants
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: theme.colors.bgSecondary,
          padding: 20,
          borderRadius: 12,
          marginBottom: 24,
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                Search
              </label>
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                Tenant
              </label>
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              >
                <option value="all">All Tenants</option>
                <option value="none">No Tenant</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              >
                <option value="all">All Roles</option>
                <option value="PLATFORM_ADMIN">Platform Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="MEMBER">Member</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 12,
          border: `1px solid ${theme.colors.borderLight}`,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.colors.bgTertiary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  User
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Tenant
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Role
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Status
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: theme.colors.textSecondary }}>
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: "center", color: theme.colors.textMuted }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: theme.gradients.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: 14,
                          fontWeight: 600,
                        }}>
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name || "—"}</div>
                          <div style={{ fontSize: 13, color: theme.colors.textMuted }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      {user.agency ? (
                        <div style={{ fontSize: 14 }}>{user.agency.name}</div>
                      ) : (
                        <div style={{ fontSize: 14, color: theme.colors.textMuted }}>No agency</div>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        padding: "4px 12px",
                        background: user.role === "PLATFORM_ADMIN" ? theme.colors.warningBg :
                          user.role === "SUPER_ADMIN" ? theme.colors.infoBg :
                          theme.colors.bgTertiary,
                        color: user.role === "PLATFORM_ADMIN" ? theme.colors.warning :
                          user.role === "SUPER_ADMIN" ? theme.colors.info :
                          theme.colors.textSecondary,
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      {user.isActive ? (
                        <span style={{
                          padding: "4px 12px",
                          background: theme.colors.successBg,
                          color: theme.colors.success,
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 500,
                        }}>
                          Active
                        </span>
                      ) : (
                        <span style={{
                          padding: "4px 12px",
                          background: theme.colors.errorBg,
                          color: theme.colors.error,
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 500,
                        }}>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "16px", fontSize: 14, color: theme.colors.textSecondary }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
