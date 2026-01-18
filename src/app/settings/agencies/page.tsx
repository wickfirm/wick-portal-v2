"use client";

import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function AgenciesSettingsPage() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{
          background: "#fee2e2",
          border: "2px solid #dc2626",
          borderRadius: 12,
          padding: 48,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>⚠️</div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 600, 
            marginBottom: 16, 
            color: "#991b1b" 
          }}>
            Page Temporarily Disabled
          </h1>
          <p style={{ fontSize: 16, marginBottom: 16, color: "#7f1d1d" }}>
            This page has been disabled to prevent accidental deletion of platform agencies.
          </p>
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: 24,
            marginTop: 32,
            textAlign: "left"
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#991b1b" }}>
              What happened?
            </h3>
            <p style={{ fontSize: 14, color: "#7f1d1d", marginBottom: 12 }}>
              This page was managing the <strong>multi-tenant agencies table</strong> (Wick, UDMS - the platform tenants),
              instead of the <strong>partner agencies table</strong> (ATC, collaborators).
            </p>
            <p style={{ fontSize: 14, color: "#7f1d1d", marginBottom: 12 }}>
              Deleting entries here accidentally removed the entire tenant structure.
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 24, marginBottom: 12, color: "#991b1b" }}>
              What's the fix?
            </h3>
            <p style={{ fontSize: 14, color: "#7f1d1d", marginBottom: 8 }}>
              This page will be rebuilt to manage <strong>partner agencies</strong> only (using the client_agencies table).
            </p>
            <p style={{ fontSize: 14, color: "#7f1d1d" }}>
              Platform-level tenant management will be moved to a separate admin section.
            </p>
          </div>
          
          <a 
            href="/settings"
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
            ← Back to Settings
          </a>
        </div>
      </main>
    </div>
  );
}
