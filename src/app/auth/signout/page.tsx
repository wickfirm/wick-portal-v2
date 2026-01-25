"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { theme } from "@/lib/theme";

export default function SignOutPage() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    
    // Sign out from NextAuth (clears session token)
    await signOut({ 
      callbackUrl: "/login",
      redirect: false // Don't auto-redirect, we'll do it manually
    });
    
    // Force clear any remaining cookies (belt & suspenders approach)
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      // Clear for current domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      // Clear for parent domain (.omnixia.ai)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.omnixia.ai`;
    });
    
    // Hard redirect to login with full page reload to clear all state
    window.location.href = "/login";
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.colors.bgPrimary,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: theme.colors.bgSecondary,
        padding: 40,
        borderRadius: theme.borderRadius.xl,
        border: `1px solid ${theme.colors.borderLight}`,
        boxShadow: theme.shadows.lg,
        maxWidth: 400,
        width: "100%",
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{
          width: 64,
          height: 64,
          background: theme.gradients.accent,
          borderRadius: theme.borderRadius.lg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <span style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>W</span>
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginTop: 0,
          marginBottom: 8,
        }}>
          Sign Out
        </h1>

        <p style={{
          color: theme.colors.textSecondary,
          fontSize: 15,
          marginBottom: 32,
          lineHeight: 1.5,
        }}>
          Are you sure you want to sign out of Wick Portal?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              padding: "14px 24px",
              background: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontSize: 15,
              fontWeight: 500,
              cursor: signingOut ? "not-allowed" : "pointer",
              opacity: signingOut ? 0.7 : 1,
              transition: "all 150ms ease",
            }}
          >
            {signingOut ? "Signing out..." : "Yes, Sign Out"}
          </button>

          <Link
            href="/dashboard"
            style={{
              padding: "14px 24px",
              background: theme.colors.bgTertiary,
              color: theme.colors.textSecondary,
              border: `1px solid ${theme.colors.borderMedium}`,
              borderRadius: theme.borderRadius.md,
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 150ms ease",
            }}
          >
            Cancel
          </Link>
        </div>

        <p style={{
          color: theme.colors.textMuted,
          fontSize: 13,
          marginTop: 24,
          marginBottom: 0,
        }}>
          You can always sign back in with your credentials.
        </p>
      </div>
    </div>
  );
}
