"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import CalendarView from "@/components/CalendarView";
import { theme } from "@/lib/theme";

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  const user = session.user as any;

  return (
    <>
      <Header />
      <main
        style={{
          padding: "24px 32px",
          minHeight: "100vh",
          background: theme.colors.bgPrimary,
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: theme.colors.textPrimary,
              fontFamily: "'DM Serif Display', serif",
              margin: 0,
            }}
          >
            Calendar
          </h1>
        </div>

        <CalendarView
          currentUserId={user.id}
          currentUserRole={user.role}
        />
      </main>
    </>
  );
}
