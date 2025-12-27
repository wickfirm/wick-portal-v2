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
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24, background: "white", borderRadius: 8 }}>
      <h1 style={{ marginBottom: 8 }}>Wick Portal</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Sign in to continue</p>

      {error && (
        <div style={{ background: "#fee", color: "#c00", padding: 12, borderRadius: 4, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Email</label>
          <input
            name="email"
            type="email"
            required
            defaultValue="admin@thewickfirm.com"
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Password</label>
          <input
            name="password"
            type="password"
            required
            defaultValue="password123"
            style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 12, background: "#333", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
