"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import TasksManager from "@/components/TasksManager";
import { theme } from "@/lib/theme";

export default function ClientTasksPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { data: session } = useSession();
  const user = session?.user as any;
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then(res => res.json())
      .then(data => {
        setClient(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load client:", err);
        setLoading(false);
      });
  }, [clientId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          <div style={{ textAlign: "center", padding: 64, color: theme.colors.textMuted }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href={`/clients/${clientId}`} style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to {client?.name}
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            {client?.name} - Tasks
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            Manage all tasks for this client
          </p>
        </div>

        <TasksManager
          context="client"
          clientId={clientId}
          showClientColumn={false}
          currentUserId={user?.id}
          currentUserRole={user?.role}
        />
      </main>
    </div>
  );
}
