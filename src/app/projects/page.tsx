import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getProjectFilterForUser } from "@/lib/project-assignments";
import Link from "next/link";
import Header from "@/components/Header";
import ProjectsList from "./projects-list";
import { theme, STATUS_STYLES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const user = session.user as any;

  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, agencyId: true, role: true },
  });

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  // Get project filter using new helper function
  const projectFilter = await getProjectFilterForUser(
    currentUser!.id,
    currentUser!.role,
    currentUser!.agencyId
  );

  const projects = await prisma.project.findMany({
    where: projectFilter,
    orderBy: { createdAt: "desc" },
    include: { client: true, stages: true },
  });

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === "IN_PROGRESS").length,
    completed: projects.filter(p => p.status === "COMPLETED").length,
    onHold: projects.filter(p => p.status === "ON_HOLD").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Projects</h1>
            <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>Track and manage all your projects</p>
          </div>
          {isAdmin && (
            <Link href="/projects/new" style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "12px 24px",
              borderRadius: theme.borderRadius.md,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: theme.shadows.button
            }}>
              <span style={{ fontSize: 18 }}>+</span> New Project
            </Link>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.textPrimary }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Total Projects</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.info }}>{stats.inProgress}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>In Progress</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.success }}>{stats.completed}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>Completed</div>
          </div>
          <div style={{ background: theme.colors.bgSecondary, padding: 20, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.error }}>{stats.onHold}</div>
            <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>On Hold</div>
          </div>
        </div>

        {/* Projects List */}
        <ProjectsList projects={projects} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
