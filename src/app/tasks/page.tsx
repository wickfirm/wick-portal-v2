"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import TasksManager from "@/components/TasksManager";
import TasksLoadingSkeleton from "@/components/TasksLoadingSkeleton";
import { theme } from "@/lib/theme";

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: `translateY(${mounted ? 0 : 16}px)`,
    transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              height: 32,
              width: 140,
              background: theme.colors.bgSecondary,
              borderRadius: 8,
              marginBottom: 8,
            }} />
            <div style={{
              height: 18,
              width: 260,
              background: theme.colors.bgSecondary,
              borderRadius: 6,
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

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 48px" }}>
        <div style={{ marginBottom: 28, ...anim(0.05) }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: theme.colors.textPrimary, margin: "0 0 4px 0" }}>
            All Tasks
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
            Manage tasks across all clients
          </p>
        </div>

        <div style={anim(0.1)}>
          <TasksManager
            context="general"
            showClientColumn={true}
            currentUserId={user.id}
            currentUserRole={user.role}
          />
        </div>
      </main>
    </div>
  );
}
