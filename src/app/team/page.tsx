"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { theme, ROLE_STYLES } from "@/lib/theme";
import Link from "next/link";

type Agency = {
  id: string;
  name: string;
};

type ClientAssignment = {
  id: string;
  client: {
    id: string;
    name: string;
    nickname: string | null;
  } | null;
};

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  agencyId?: string | null;
  agency?: Agency | null;
  clientAssignments?: ClientAssignment[];
};

type Client = {
  id: string;
  name: string;
  nickname: string | null;
};

// SVG Icons
const icons = {
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  checkCircle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  userX: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  power: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  usersEmpty: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
};

const avatarColors = [
  "linear-gradient(135deg, #7c3aed, #6d28d9)",
  "linear-gradient(135deg, #ec4899, #be185d)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #22c55e, #16a34a)",
  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
];
function getAvatarColor(name: string): string {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

// Animated number component
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue}</>;
}

export default function TeamPage() {
  const { data: session, status } = useSession();
  const currentUser = session?.user as any;

  // Redirect MEMBERs - they shouldn't access this page
  useEffect(() => {
    if (currentUser?.role === "MEMBER") {
      window.location.href = "/dashboard";
    }
  }, [currentUser]);

  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "MEMBER",
    agencyId: "",
    clientIds: [] as string[],
    projectIds: [] as string[],
  });
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    agencyId: "",
    clientIds: [] as string[],
    projectIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  // Projects state
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const isClientRole = currentUser?.role === "CLIENT";
  const isExternalPartner = currentUser?.agencyId === null && currentUser?.role !== "PLATFORM_ADMIN";

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Redirect external partners - they shouldn't access team management
  useEffect(() => {
    if (isExternalPartner) {
      window.location.href = "/dashboard";
    }
  }, [isExternalPartner]);

  // Fetch team data with React Query
  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["team-data"],
    queryFn: async () => {
      const [usersRes, agenciesRes, clientsRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/agencies"),
        fetch("/api/clients"),
      ]);

      const [usersData, agenciesData, clientsData] = await Promise.all([
        usersRes.json(),
        agenciesRes.json(),
        clientsRes.json(),
      ]);

      return {
        users: Array.isArray(usersData) ? usersData : [],
        agencies: Array.isArray(agenciesData) ? agenciesData : [],
        clients: Array.isArray(clientsData) ? clientsData : (clientsData?.clients || []),
      };
    },
    enabled: status === "authenticated" && !isExternalPartner,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const users = data?.users || [];
  const agencies = data?.agencies || [];
  const clients = data?.clients || [];

  // Fetch projects when clients are selected (for new user form)
  useEffect(() => {
    if (newUser.clientIds.length > 0) {
      setLoadingProjects(true);
      const clientIdsParam = newUser.clientIds.map(id => `clientId=${id}`).join('&');
      fetch(`/api/projects?${clientIdsParam}`)
        .then(res => res.json())
        .then(data => {
          setAvailableProjects(Array.isArray(data) ? data : []);
          setLoadingProjects(false);
        })
        .catch(err => {
          console.error('Failed to fetch projects:', err);
          setLoadingProjects(false);
        });
    } else {
      setAvailableProjects([]);
    }
  }, [newUser.clientIds]);

  // Fetch projects when clients are selected (for edit form)
  useEffect(() => {
    if (editingUser && editForm.clientIds.length > 0) {
      setLoadingProjects(true);
      const clientIdsParam = editForm.clientIds.map(id => `clientId=${id}`).join('&');
      fetch(`/api/projects?${clientIdsParam}`)
        .then(res => res.json())
        .then(data => {
          setAvailableProjects(Array.isArray(data) ? data : []);
          setLoadingProjects(false);
        })
        .catch(err => {
          console.error('Failed to fetch projects:', err);
          setLoadingProjects(false);
        });
    } else if (editingUser) {
      setAvailableProjects([]);
    }
  }, [editForm.clientIds, editingUser]);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      setNewUser({ email: "", name: "", password: "", role: "MEMBER", agencyId: "", clientIds: [], projectIds: [] });
      setShowForm(false);
      refetch();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add user");
    }
    setAdding(false);
  }

  async function openEditModal(user: User) {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      role: user.role,
      agencyId: user.agencyId || "",
      clientIds: user.clientAssignments?.filter(ca => ca.client).map(ca => ca.client!.id) || [],
      projectIds: [],
    });
    try {
      const res = await fetch(`/api/users/${user.id}/project-assignments`);
      if (res.ok) {
        const projectAssignments = await res.json();
        setEditForm(prev => ({ ...prev, projectIds: projectAssignments.map((pa: any) => pa.projectId) }));
      }
    } catch (error) {
      console.error('Failed to fetch project assignments:', error);
    }
    const clientIds = user.clientAssignments?.filter(ca => ca.client).map(ca => ca.client!.id) || [];
    if (clientIds.length > 0) {
      setLoadingProjects(true);
      const clientIdsParam = clientIds.map(id => `clientId=${id}`).join('&');
      fetch(`/api/projects?${clientIdsParam}`)
        .then(res => res.json())
        .then(data => { setAvailableProjects(Array.isArray(data) ? data : []); setLoadingProjects(false); })
        .catch(err => { console.error('Failed to fetch projects:', err); setLoadingProjects(false); });
    }
  }

  async function saveEdit() {
    if (!editingUser) return;
    setSaving(true);
    const res = await fetch("/api/team/" + editingUser.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditingUser(null); refetch(); }
    else { const data = await res.json(); alert(data.error || "Failed to update user"); }
    setSaving(false);
  }

  async function toggleActive(user: User) {
    await fetch("/api/team/" + user.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    refetch();
  }

  async function deleteUser(user: User) {
    if (!confirm("Delete " + user.email + "?")) return;
    await fetch("/api/team/" + user.id, { method: "DELETE" });
    refetch();
  }

  function toggleClientSelection(clientId: string, isEdit = false) {
    if (isEdit) {
      if (editForm.clientIds.includes(clientId)) setEditForm({ ...editForm, clientIds: editForm.clientIds.filter(id => id !== clientId) });
      else setEditForm({ ...editForm, clientIds: [...editForm.clientIds, clientId] });
    } else {
      if (newUser.clientIds.includes(clientId)) setNewUser({ ...newUser, clientIds: newUser.clientIds.filter(id => id !== clientId) });
      else setNewUser({ ...newUser, clientIds: [...newUser.clientIds, clientId] });
    }
  }

  function toggleProjectSelection(projectId: string, isEdit = false) {
    if (isEdit) {
      if (editForm.projectIds.includes(projectId)) setEditForm({ ...editForm, projectIds: editForm.projectIds.filter(id => id !== projectId) });
      else setEditForm({ ...editForm, projectIds: [...editForm.projectIds, projectId] });
    } else {
      if (newUser.projectIds.includes(projectId)) setNewUser({ ...newUser, projectIds: newUser.projectIds.filter(id => id !== projectId) });
      else setNewUser({ ...newUser, projectIds: [...newUser.projectIds, projectId] });
    }
  }

  function navigateToUser(userId: string) {
    window.location.href = `/team/${userId}`;
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid " + theme.colors.borderMedium,
    borderRadius: theme.borderRadius.md,
    fontSize: 14,
    boxSizing: "border-box" as const,
    outline: "none",
  };

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ width: 120, height: 32, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ width: 260, height: 18, background: theme.colors.bgSecondary, borderRadius: 6 }} />
            </div>
            <div style={{ width: 130, height: 42, background: theme.colors.bgSecondary, borderRadius: 10 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: 14, border: `1px solid ${theme.colors.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: theme.colors.bgTertiary }} />
                  <div style={{ width: 48, height: 28, background: theme.colors.bgTertiary, borderRadius: 6 }} />
                </div>
                <div style={{ width: 100, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 42, background: theme.colors.bgSecondary, borderRadius: 10, border: `1px solid ${theme.colors.borderLight}` }} />
            {[1, 2, 3].map(i => <div key={i} style={{ width: 80, height: 42, background: theme.colors.bgSecondary, borderRadius: 10, border: `1px solid ${theme.colors.borderLight}` }} />)}
          </div>
          <div style={{ background: theme.colors.bgSecondary, borderRadius: 16, border: `1px solid ${theme.colors.borderLight}` }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ padding: "18px 22px", borderBottom: i < 5 ? `1px solid ${theme.colors.bgTertiary}` : "none", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, background: theme.colors.bgTertiary, borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: 180, height: 18, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: 240, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
                <div style={{ width: 70, height: 24, background: theme.colors.bgTertiary, borderRadius: 12 }} />
                <div style={{ width: 60, height: 24, background: theme.colors.bgTertiary, borderRadius: 12 }} />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const displayUsers = isClientRole ? users.filter((u: any) => u.role !== "CLIENT") : users;

  // Stats
  const activeCount = displayUsers.filter((u: any) => u.isActive).length;
  const inactiveCount = displayUsers.filter((u: any) => !u.isActive).length;
  const uniqueRoles = new Set(displayUsers.map((u: any) => u.role)).size;

  const statCards = [
    { label: "Total Members", value: displayUsers.length, icon: icons.users, color: theme.colors.primary, bg: "rgba(118,82,124,0.08)" },
    { label: "Active", value: activeCount, icon: icons.checkCircle, color: theme.colors.success, bg: theme.colors.successBg },
    { label: "Inactive", value: inactiveCount, icon: icons.userX, color: theme.colors.error, bg: theme.colors.errorBg },
    { label: "Roles", value: uniqueRoles, icon: icons.shield, color: theme.colors.info, bg: theme.colors.infoBg },
  ];

  // Filtering
  const filteredUsers = displayUsers.filter((user: any) => {
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (user.name || "").toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.agency?.name || "").toLowerCase().includes(q) ||
      (user.clientAssignments || []).some((ca: any) =>
        ca.client && ((ca.client.name || "").toLowerCase().includes(q) || (ca.client.nickname || "").toLowerCase().includes(q))
      );
    return matchesRole && matchesSearch;
  });

  const roleLabels: Record<string, string> = {
    ALL: "All",
    MEMBER: "Member",
    MANAGER: "Manager",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
    CLIENT: "Client",
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .team-page {
          min-height: 100vh;
          background: ${theme.colors.bgPrimary};
        }
        .team-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 24px 48px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .page-header.mounted { animation-delay: 0s; }
        .page-title {
          font-family: 'DM Serif Display', serif;
          font-size: 32px;
          font-weight: 400;
          color: ${theme.colors.textPrimary};
          margin: 0 0 6px 0;
        }
        .page-subtitle {
          color: ${theme.colors.textMuted};
          font-size: 14px;
          margin: 0;
        }
        .add-user-btn {
          background: ${theme.gradients.primary};
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(118, 82, 124, 0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .add-user-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(118, 82, 124, 0.4);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: ${theme.colors.bgSecondary};
          padding: 20px;
          border-radius: 16px;
          border: 1px solid ${theme.colors.borderLight};
          opacity: 0;
          animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          cursor: default;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          border-color: ${theme.colors.primary}30;
        }
        .stat-card.mounted:nth-child(1) { animation-delay: 0.1s; }
        .stat-card.mounted:nth-child(2) { animation-delay: 0.15s; }
        .stat-card.mounted:nth-child(3) { animation-delay: 0.2s; }
        .stat-card.mounted:nth-child(4) { animation-delay: 0.25s; }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.1);
        }
        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: ${theme.colors.textPrimary};
          line-height: 1;
        }
        .stat-label {
          font-size: 13px;
          color: ${theme.colors.textSecondary};
          font-weight: 500;
          margin-top: 8px;
        }
        .filters-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: center;
          flex-wrap: wrap;
          opacity: 0;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .filters-row.mounted { animation-delay: 0.3s; }
        .search-wrapper {
          flex: 1;
          position: relative;
          min-width: 220px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: ${theme.colors.textMuted};
          display: flex;
          align-items: center;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          border: 1px solid ${theme.colors.borderLight};
          background: ${theme.colors.bgSecondary};
          color: ${theme.colors.textPrimary};
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .search-input:focus {
          border-color: ${theme.colors.primary};
          box-shadow: 0 0 0 3px ${theme.colors.primary}15;
        }
        .filter-btn {
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid ${theme.colors.borderLight};
          background: ${theme.colors.bgSecondary};
          color: ${theme.colors.textSecondary};
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .filter-btn:hover {
          background: ${theme.colors.bgTertiary};
        }
        .filter-btn.active {
          background: ${theme.gradients.primary};
          border: none;
          color: white;
          box-shadow: 0 4px 15px rgba(118, 82, 124, 0.3);
        }
        .team-list {
          background: ${theme.colors.bgSecondary};
          border-radius: 20px;
          border: 1px solid ${theme.colors.borderLight};
          overflow: hidden;
          opacity: 0;
          animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .team-list.mounted { animation-delay: 0.35s; }
        .team-row {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid ${theme.colors.bgTertiary};
          cursor: pointer;
          opacity: 0;
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .team-row:last-child { border-bottom: none; }
        .team-row:hover {
          background: linear-gradient(90deg, ${theme.colors.primaryBg}50, transparent);
          padding-left: 28px;
        }
        .team-row:hover .team-avatar {
          transform: scale(1.08);
        }
        .team-row:hover .chevron-icon {
          transform: translateX(4px);
          opacity: 1;
        }
        .team-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 20px;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chevron-icon {
          color: ${theme.colors.textMuted};
          flex-shrink: 0;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        .empty-state {
          padding: 80px;
          text-align: center;
        }
        .add-form {
          background: ${theme.colors.bgSecondary};
          padding: 24px;
          border-radius: 14px;
          border: 1px solid ${theme.colors.borderLight};
          margin-bottom: 20px;
          opacity: 0;
          animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .filters-row { flex-wrap: wrap; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 16px; align-items: flex-start; }
        }
      `}</style>

      <div className="team-page">
        <Header />

        <main className="team-main">
          {/* Page Header */}
          <div className={`page-header ${mounted ? 'mounted' : ''}`}>
            <div>
              <h1 className="page-title">{isClientRole ? "Your Team" : "Team"}</h1>
              <p className="page-subtitle">
                {isClientRole ? "Agency team members working on your projects" : "Manage your team members"}
              </p>
            </div>
            {!isClientRole && (
              <button onClick={() => setShowForm(!showForm)} className="add-user-btn">
                {icons.plus} Add User
              </button>
            )}
          </div>

          {/* Stat Cards */}
          <div className="stats-grid">
            {statCards.map((card) => (
              <div key={card.label} className={`stat-card ${mounted ? 'mounted' : ''}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className="stat-value">
                    <AnimatedNumber value={card.value} />
                  </div>
                </div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className={`filters-row ${mounted ? 'mounted' : ''}`}>
            <div className="search-wrapper">
              <div className="search-icon">{icons.search}</div>
              <input
                type="text"
                placeholder="Search by name, email, agency, or client..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(roleLabels).map(([role, label]) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`filter-btn ${roleFilter === role ? 'active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Add User Form */}
          {showForm && !isClientRole && (
            <div className="add-form">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 20 }}>Add New User</h3>
              <form onSubmit={addUser}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Email *</label>
                    <input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required style={inputStyle} placeholder="user@example.com" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name</label>
                    <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={inputStyle} placeholder="John Smith" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Password *</label>
                    <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required style={inputStyle} placeholder="********" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Role</label>
                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="MEMBER">Member</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="CLIENT">Client</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Agency</label>
                    <select value={newUser.agencyId} onChange={e => setNewUser({ ...newUser, agencyId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                      <option value="">No Agency</option>
                      {agencies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Client Assignments */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Assign to Clients</label>
                  <div style={{ border: `1px solid ${theme.colors.borderMedium}`, borderRadius: 8, maxHeight: 150, overflow: "auto", background: theme.colors.bgPrimary }}>
                    {clients.length === 0 ? (
                      <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>No clients available</div>
                    ) : clients.map((client: any) => (
                      <label key={client.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${theme.colors.borderLight}`, background: newUser.clientIds.includes(client.id) ? theme.colors.successBg : "transparent" }}>
                        <input type="checkbox" checked={newUser.clientIds.includes(client.id)} onChange={() => toggleClientSelection(client.id)} style={{ cursor: "pointer" }} />
                        <span style={{ fontSize: 14 }}>{client.nickname || client.name}</span>
                      </label>
                    ))}
                  </div>
                  {newUser.clientIds.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textMuted }}>{newUser.clientIds.length} client(s) selected</div>}
                </div>

                {/* Project Assignments */}
                {newUser.clientIds.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Assign to Projects</label>
                    {loadingProjects ? (
                      <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>Loading projects...</div>
                    ) : (
                      <div style={{ border: `1px solid ${theme.colors.borderMedium}`, borderRadius: 8, maxHeight: 200, overflow: "auto", background: theme.colors.bgPrimary }}>
                        {availableProjects.length === 0 ? (
                          <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>No projects available for selected clients</div>
                        ) : (() => {
                          const projectsByClient: Record<string, any[]> = {};
                          availableProjects.forEach(project => { if (!projectsByClient[project.clientId]) projectsByClient[project.clientId] = []; projectsByClient[project.clientId].push(project); });
                          return Object.entries(projectsByClient).map(([clientId, projects]) => {
                            const client = clients.find((c: any) => c.id === clientId);
                            return (
                              <div key={clientId} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                                <div style={{ padding: "8px 12px", background: theme.colors.bgTertiary, fontWeight: 600, fontSize: 13 }}>{client?.nickname || client?.name}</div>
                                {projects.map(project => (
                                  <label key={project.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px 8px 24px", cursor: "pointer", borderBottom: `1px solid ${theme.colors.borderLight}`, background: newUser.projectIds.includes(project.id) ? theme.colors.successBg : "transparent" }}>
                                    <input type="checkbox" checked={newUser.projectIds.includes(project.id)} onChange={() => toggleProjectSelection(project.id)} style={{ cursor: "pointer" }} />
                                    <span style={{ fontSize: 13 }}>{project.name}</span>
                                  </label>
                                ))}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                    {newUser.projectIds.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textMuted }}>{newUser.projectIds.length} project(s) selected</div>}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button type="submit" disabled={adding} style={{ padding: "10px 20px", background: adding ? theme.colors.bgTertiary : theme.colors.primary, color: adding ? theme.colors.textMuted : "white", border: "none", borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: adding ? "not-allowed" : "pointer" }}>
                    {adding ? "Adding..." : "Add User"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Team List */}
          <div className={`team-list ${mounted ? 'mounted' : ''}`}>
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <div style={{ color: theme.colors.textMuted, marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  {icons.usersEmpty}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>
                  {searchQuery || roleFilter !== "ALL" ? "No members found" : "No team members yet"}
                </div>
                <div style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                  {searchQuery || roleFilter !== "ALL" ? "Try adjusting your search or filters" : "Add your first team member to get started"}
                </div>
              </div>
            ) : (
              filteredUsers.map((user: any, idx: number) => {
                const displayName = user.name || user.email.split("@")[0];
                const avatarBg = getAvatarColor(displayName);
                const validAssignments = (user.clientAssignments || []).filter((ca: any) => ca.client);

                return (
                  <div
                    key={user.id}
                    onClick={() => navigateToUser(user.id)}
                    className="team-row"
                    style={{ animationDelay: mounted ? `${0.4 + idx * 0.05}s` : '0s' }}
                  >
                    {/* Avatar */}
                    <div className="team-avatar" style={{ background: avatarBg }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary }}>{user.name || "Unnamed"}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: ROLE_STYLES[user.role]?.bg || theme.colors.bgTertiary, color: ROLE_STYLES[user.role]?.color || theme.colors.textSecondary }}>
                          {user.role.replace("_", " ")}
                        </span>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: user.isActive ? theme.colors.success : theme.colors.error, display: "inline-block", flexShrink: 0 }} title={user.isActive ? "Active" : "Inactive"} />
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: theme.colors.textMuted }}>
                        <span>{user.email}</span>
                        {user.agency && (
                          <Link href={`/agencies/${user.agency.id}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4, color: theme.colors.info, textDecoration: "none", fontSize: 13 }}>
                            {user.agency.name}
                          </Link>
                        )}
                        {user.agencyId === null && user.role !== "PLATFORM_ADMIN" && (
                          <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: "#f0f9ff", color: "#0284c7" }}>External</span>
                        )}
                      </div>
                    </div>

                    {/* Client Pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 200, justifyContent: "flex-end" }}>
                      {validAssignments.length > 0 && (
                        <>
                          {validAssignments.slice(0, 2).map((ca: any) => (
                            <Link key={ca.id} href={`/clients/${ca.client.id}`} onClick={e => e.stopPropagation()} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: theme.colors.successBg, color: theme.colors.success, textDecoration: "none", transition: "opacity 150ms", whiteSpace: "nowrap" as const }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                              {ca.client.nickname || ca.client.name}
                            </Link>
                          ))}
                          {validAssignments.length > 2 && <span style={{ fontSize: 11, color: theme.colors.textMuted, padding: "3px 4px" }}>+{validAssignments.length - 2}</span>}
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!isClientRole && (
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEditModal(user)} title="Edit" style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: theme.colors.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
                          onMouseEnter={e => { e.currentTarget.style.background = theme.colors.infoBg; e.currentTarget.style.color = theme.colors.info; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}>
                          {icons.edit}
                        </button>
                        <button onClick={() => toggleActive(user)} title={user.isActive ? "Deactivate" : "Activate"} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: theme.colors.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
                          onMouseEnter={e => { e.currentTarget.style.background = theme.colors.warningBg; e.currentTarget.style.color = theme.colors.warning; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}>
                          {icons.power}
                        </button>
                        <button onClick={() => deleteUser(user)} title="Delete" style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: theme.colors.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
                          onMouseEnter={e => { e.currentTarget.style.background = theme.colors.errorBg; e.currentTarget.style.color = theme.colors.error; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.colors.textMuted; }}>
                          {icons.trash}
                        </button>
                      </div>
                    )}

                    {/* Chevron */}
                    <div className="chevron-icon">{icons.chevron}</div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Edit Modal */}
        {editingUser && (
          <>
            <div onClick={() => setEditingUser(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: theme.colors.bgSecondary, borderRadius: 16, padding: 32, width: 500, maxHeight: "90vh", overflow: "auto", zIndex: 1001, boxShadow: theme.shadows.lg }}>
              <h3 style={{ margin: "0 0 24px 0", fontSize: 20, fontWeight: 600 }}>Edit User</h3>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Email</label>
                <input value={editingUser.email} disabled style={{ ...inputStyle, background: theme.colors.bgTertiary, color: theme.colors.textMuted }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Name</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} placeholder="John Smith" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Agency</label>
                  <select value={editForm.agencyId} onChange={e => setEditForm({ ...editForm, agencyId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">No Agency</option>
                    {agencies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Assign to Clients</label>
                <div style={{ border: `1px solid ${theme.colors.borderMedium}`, borderRadius: 8, maxHeight: 200, overflow: "auto", background: theme.colors.bgPrimary }}>
                  {clients.length === 0 ? (
                    <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>No clients available</div>
                  ) : clients.map((client: any) => (
                    <label key={client.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${theme.colors.borderLight}`, background: editForm.clientIds.includes(client.id) ? theme.colors.successBg : "transparent" }}>
                      <input type="checkbox" checked={editForm.clientIds.includes(client.id)} onChange={() => toggleClientSelection(client.id, true)} style={{ cursor: "pointer" }} />
                      <span style={{ fontSize: 14 }}>{client.nickname || client.name}</span>
                    </label>
                  ))}
                </div>
                {editForm.clientIds.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textMuted }}>{editForm.clientIds.length} client(s) selected</div>}
              </div>

              {/* Project Assignments */}
              {editForm.clientIds.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Assign to Projects</label>
                  {loadingProjects ? (
                    <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>Loading projects...</div>
                  ) : (
                    <div style={{ border: `1px solid ${theme.colors.borderMedium}`, borderRadius: 8, maxHeight: 200, overflow: "auto", background: theme.colors.bgPrimary }}>
                      {availableProjects.length === 0 ? (
                        <div style={{ padding: 16, color: theme.colors.textMuted, fontSize: 13 }}>No projects available for selected clients</div>
                      ) : (() => {
                        const projectsByClient: Record<string, any[]> = {};
                        availableProjects.forEach(project => { if (!projectsByClient[project.clientId]) projectsByClient[project.clientId] = []; projectsByClient[project.clientId].push(project); });
                        return Object.entries(projectsByClient).map(([clientId, projects]) => {
                          const client = clients.find((c: any) => c.id === clientId);
                          return (
                            <div key={clientId} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                              <div style={{ padding: "8px 12px", background: theme.colors.bgTertiary, fontWeight: 600, fontSize: 13 }}>{client?.nickname || client?.name}</div>
                              {projects.map(project => (
                                <label key={project.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px 8px 24px", cursor: "pointer", borderBottom: `1px solid ${theme.colors.borderLight}`, background: editForm.projectIds.includes(project.id) ? theme.colors.successBg : "transparent" }}>
                                  <input type="checkbox" checked={editForm.projectIds.includes(project.id)} onChange={() => toggleProjectSelection(project.id, true)} style={{ cursor: "pointer" }} />
                                  <span style={{ fontSize: 13 }}>{project.name}</span>
                                </label>
                              ))}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                  {editForm.projectIds.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textMuted }}>{editForm.projectIds.length} project(s) selected</div>}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: "12px 20px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={saving} style={{ flex: 1, padding: "12px 20px", background: saving ? theme.colors.bgTertiary : theme.colors.primary, color: saving ? theme.colors.textMuted : "white", border: "none", borderRadius: 8, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
