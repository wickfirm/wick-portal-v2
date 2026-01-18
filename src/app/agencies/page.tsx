"use client";

import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function AgenciesPage() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{
          background: "#fef3c7",
          border: "2px solid #f59e0b",
          borderRadius: 12,
          padding: 48,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🚧</div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 600, 
            marginBottom: 16, 
            color: "#92400e" 
          }}>
            Partner Agencies - Under Construction
          </h1>
          <p style={{ fontSize: 16, marginBottom: 16, color: "#78350f" }}>
            This page is being rebuilt to properly manage partner agencies (ATC, collaborators).
          </p>
          <div style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            padding: 24,
            marginTop: 32,
            textAlign: "left"
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#92400e" }}>
              What are Partner Agencies?
            </h3>
            <p style={{ fontSize: 14, color: "#78350f", marginBottom: 12 }}>
              Partner agencies are external companies (like ATC, UDMS) that collaborate with you on specific client projects.
            </p>
            <p style={{ fontSize: 14, color: "#78350f", marginBottom: 12 }}>
              When you assign a partner agency to a client, it shows on the client's dashboard for transparency.
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 24, marginBottom: 12, color: "#92400e" }}>
              Temporary Workaround
            </h3>
            <p style={{ fontSize: 14, color: "#78350f" }}>
              You can assign partner agencies to clients when creating/editing them in the Clients page.
            </p>
          </div>
          
          <a 
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: 32,
              padding: "12px 24px",
              background: theme.colors.primary,
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            ← Back to Dashboard
          </a>
        </div>
      </main>
    </div>
  );
}
