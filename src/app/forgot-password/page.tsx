"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .reset-page * { box-sizing: border-box; }

        .reset-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(135deg, #f8f7fa 0%, #f0eef5 100%);
          padding: 24px;
        }

        .reset-card {
          width: 100%;
          max-width: 440px;
          background: white;
          border-radius: 20px;
          padding: 48px;
          box-shadow: 0 4px 24px rgba(118, 82, 124, 0.08), 0 1px 3px rgba(0,0,0,0.04);
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : 20}px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .reset-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .reset-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(118, 82, 124, 0.1), rgba(118, 82, 124, 0.05));
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #76527c;
        }

        .reset-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          font-weight: 400;
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }

        .reset-header p {
          font-size: 14px;
          color: #9aa0a6;
          margin: 0;
          line-height: 1.6;
        }

        .form-field {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #5f6368;
          margin-bottom: 8px;
          letter-spacing: 0.02em;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid #e8eaed;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          background: #fafafa;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #76527c;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(118,82,124,0.08);
        }

        .form-input::placeholder {
          color: #c0c0c0;
        }

        .form-error {
          background: #fce8e6;
          color: #c62828;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 3px solid #ea4335;
        }

        .submit-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #76527c, #5f4263);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 20px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(118,82,124,0.35);
        }

        .submit-btn:disabled {
          background: #e8eaed;
          color: #9aa0a6;
          cursor: not-allowed;
        }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          color: #76527c;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .back-link:hover {
          color: #5f4263;
        }

        .success-card {
          text-align: center;
        }

        .success-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, rgba(52, 168, 83, 0.1), rgba(52, 168, 83, 0.05));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #34a853;
        }

        .success-card h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: #1a1a1a;
          margin: 0 0 12px 0;
        }

        .success-card p {
          font-size: 14px;
          color: #5f6368;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }

        .email-highlight {
          font-weight: 600;
          color: #76527c;
        }
      `}</style>

      <div className="reset-page">
        <div className="reset-card">
          {success ? (
            <div className="success-card">
              <div className="success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Check your email</h2>
              <p>
                We've sent a password reset link to{" "}
                <span className="email-highlight">{email}</span>. Please check your inbox and follow the instructions to reset your password.
              </p>
              <Link href="/login" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="reset-header">
                <div className="reset-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="m7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h1>Forgot password?</h1>
                <p>No worries, we'll send you reset instructions.</p>
              </div>

              {error && (
                <div className="form-error">
                  <span style={{ fontSize: 16 }}>!</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-field">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="form-input"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <Link href="/login" className="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
