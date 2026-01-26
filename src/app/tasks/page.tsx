"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import TasksList from "./tasks-list";
import { theme } from "@/lib/theme";

type Task = {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string | null;
  notes: string | null;
  nextSteps: string | null;
  ownerType: string;
  externalLink: string | null;
  externalLinkLabel: string | null;
  internalLink: string | null;
  internalLinkLabel: string | null;
  assigneeId: string | null;
  client: {
    id: string;
    name: string;
  };
  assignee: {
    id: string;
    name: string | null;
  } | null;
};

type Client = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  clientId: string;
};

type TeamMember = {
  id: string;
  name: string | null;
};

type TasksData = {
  tasks: Task[];
  clients: Client[];
  projects: Project[];
  teamMembers: TeamMember[];
  stats: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  currentUser: {
    id: string;
    role: string;
  };
};

// Loading skeleton component
function TasksPageSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header Skeleton */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 120, height: 36, background: theme.colors.bgSecondary, borderRadius: 8, marginBottom: 8 }} />
          <div style={{ width: 280, height: 20, background: theme.colors.bgSecondary, borderRadius: 6 }} />
        </div>

        {/* Stats Skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
              <div style={{ width: 80, height: 40, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 8 }} />
              <div style={{ width: 100, height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>

        {/* Tasks List Skeleton */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight, padding: 24 }}>
          <div style={{ width: 200, height: 24, background: theme.colors.bgTertiary, borderRadius: 6, marginBottom: 20 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ padding: "16px 0", borderBottom: i < 5 ? "1px solid " + theme.colors.bgTertiary : "none" }}>
              <div style={{ width: "60%", height: 20, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: "40%", height: 16, background: theme.colors.bgTertiary, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Error component
function TasksError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ 
          background: theme.colors.errorBg, 
          border: "1px solid " + theme.colors.error, 
          borderRadius: theme.borderRadius.lg, 
          padding: 48, 
          textAlign: "center" 
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: theme.colors.error, marginBottom: 8 }}>
            Failed to load tasks
          </h2>
          <p style={{ color: theme.colors.textSecondary, marginBottom: 24 }}>
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={retry}
            style={{
              background: theme.gradients.primary,
              color: "white",
              padding: "12px 24px",
              borderRadius: theme.borderRadius.md,
              border: "none",
              fontWeight: 500,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </main>
    </div>
  );
}

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch tasks data with React Query
  const { data, isLoading, error, refetch } = useQuery<TasksData>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/list");
      if (!res.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return res.json();
    },
    enabled: status === "authenticated",
    staleTime: 2 * 60 * 1000, // 2 minutes (tasks change frequently)
  });

  // Show loading state while checking authentication
  if (status === "loading") {
    return <TasksPageSkeleton />;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) return null;

  // Show loading skeleton while fetching data
  if (isLoading) {
    return <TasksPageSkeleton />;
  }

  // Show error state
  if (error) {
    return <TasksError error={error as Error} retry={() => refetch()} />;
  }

  // Show error if no data
  if (!data) {
    return <TasksError error={new Error("No data received")} retry={() => refetch()} />;
  }

  const { tasks, clients, projects, teamMembers, stats, currentUser } = data;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            Tasks
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Manage and track all your tasks
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Total Tasks</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.info, marginBottom: 4 }}>
              {stats.inProgress}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>In Progress</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.success, marginBottom: 4 }}>
              {stats.completed}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Completed</div>
          </div>

          <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: theme.colors.error, marginBottom: 4 }}>
              {stats.overdue}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Overdue</div>
          </div>
        </div>

        {/* Tasks List Component */}
        <TasksList 
          initialTasks={tasks}
          clients={clients}
          projects={projects}
          teamMembers={teamMembers}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />
      </main>
    </div>
  );
}
