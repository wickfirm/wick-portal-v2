"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import TasksManager from "@/components/TasksManager";
import TasksLoadingSkeleton from "@/components/TasksLoadingSkeleton";
import { theme } from "@/lib/theme";

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{
              height: 28,
              width: 150,
              background: theme.colors.bgTertiary,
              borderRadius: 4,
              marginBottom: 8,
              animation: "pulse 1.5s ease-in-out infinite"
            }} />
            <div style={{
              height: 18,
              width: 250,
              background: theme.colors.bgTertiary,
              borderRadius: 4,
              animation: "pulse 1.5s ease-in-out 0.2s infinite"
            }} />
          </div>
          <TasksLoadingSkeleton />
        </main>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, marginBottom: 4 }}>
            All Tasks
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Manage tasks across all clients
          </p>
        </div>

        <TasksManager
          context="general"
          showClientColumn={true}
          currentUserId={user.id}
          currentUserRole={user.role}
        />
      </main>
    </div>
  );
}
