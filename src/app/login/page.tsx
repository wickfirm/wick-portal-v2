"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8f9fa 0%, #e8eaed 100%)",
      padding: 24
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        padding: 40
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, #e85a4f, #f8b739)",
            borderRadius: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16
          }}>
            <span style={{ color: "white", fontWeight: "bold", fontSize: 24 }}>W</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: "#5f6368", fontSize: 14 }}>Sign in to your Wick Portal account</p>
        </div>

        {error && (
          <div style={{
            background: "#fce8e6",
            color: "#ea4335",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#1a1a1a" }}>
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
                border: "1px solid #dadce0",
                borderRadius: 8,
                fontSize: 15,
                boxSizing: "border-box",
                transition: "border-color 150ms ease, box-shadow 150ms ease"
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500, fontSize: 14, color: "#1a1a1a" }}>
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
                border: "1px solid #dadce0",
                borderRadius: 8,
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
              background: loading ? "#f1f3f4" : "linear-gradient(135deg, #e85a4f, #d44a3f)",
              color: loading ? "#9aa0a6" : "white",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 150ms ease"
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", color: "#9aa0a6", fontSize: 13 }}>
          © {new Date().getFullYear()} The Wick Firm. All rights reserved.
        </div>
      </div>
    </div>
  );
}
