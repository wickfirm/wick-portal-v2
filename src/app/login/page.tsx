"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function testLogin() {
    const email = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value;
    const password = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;
    
    setTestResult("Testing...");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setTestResult("Error: " + String(err));
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `linear-gradient(135deg, ${theme.colors.bgPrimary} 0%, ${theme.colors.borderLight} 100%)`,
      padding: 24
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: theme.colors.bgSecondary,
        borderRadius: theme.borderRadius.xl,
        boxShadow: theme.shadows.lg,
        padding: 40
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            background: theme.gradients.accent,
            borderRadius: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16
          }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: 24 }}>W</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: theme.colors.primary, fontSize: 12 }}>Build: Jan 3 v3</p>
          <p style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Sign in to your Wick Portal account</p>
        </div>

        {error && (
          <div style={{
            background: theme.colors.errorBg,
            color: theme.colors.error,
            padding: "12px 16px",
            borderRadius: theme.borderRadius.md,
            marginBottom: 20,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {testResult && (
          <div style={{
            background: theme.colors.infoBg,
            color: theme.colors.info,
            padding: "12px 16px",
            borderRadius: theme.borderRadius.md,
            marginBottom: 20,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            fontFamily: "monospace"
          }}>
            {testResult}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
              Email address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: theme.borderRadius.md,
                fontSize: 15,
                boxSizing: "border-box",
                transition: "border-color 150ms ease, box-shadow 150ms ease"
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: theme.borderRadius.md,
                fontSize: 15,
                boxSizing: "border-box",
                transition: "border-color 150ms ease, box-shadow 150ms ease"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: loading ? theme.colors.bgTertiary : theme.gradients.primary,
              color: loading ? theme.colors.textMuted : "white",
              border: "none",
              borderRadius: theme.borderRadius.md,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 150ms ease",
              marginBottom: 12
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={testLogin}
            style={{
              width: "100%",
              padding: 14,
              background: theme.colors.bgTertiary,
              color: theme.colors.textSecondary,
              border: `1px solid ${theme.colors.borderMedium}`,
              borderRadius: theme.borderRadius.md,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            Test Login (Debug)
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", color: theme.colors.textMuted, fontSize: 13 }}>
          © {new Date().getFullYear()} The Wick Firm. All rights reserved.
        </div>
      </div>
    </div>
  );
}
