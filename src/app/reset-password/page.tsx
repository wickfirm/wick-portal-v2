"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show error if no token
  if (!token && mounted) {
    return (
      <div className="reset-card">
        <div className="error-card">
          <div className="error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2>Invalid Reset Link</h2>
          <p>This password reset link is invalid or has expired. Please request a new one.</p>
          <Link href="/forgot-password" className="submit-btn" style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-card">
      {success ? (
        <div className="success-card">
          <div className="success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Password updated!</h2>
          <p>Your password has been reset successfully. You can now sign in with your new password.</p>
          <Link href="/login" className="submit-btn" style={{ textDecoration: "none", display: "block", textAlign: "center" }}>
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="reset-header">
            <div className="reset-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1>Set new password</h1>
            <p>Your new password must be at least 8 characters long.</p>
          </div>

          {error && (
            <div className="form-error">
              <span style={{ fontSize: 16 }}>!</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">New password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="form-input"
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                className="form-input"
                autoComplete="new-password"
              />
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                        ? "100%"
                        : password.length >= 8
                          ? "66%"
                          : "33%",
                      background: password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                        ? "#34a853"
                        : password.length >= 8
                          ? "#f9ab00"
                          : "#ea4335",
                    }}
                  />
                </div>
                <span className="strength-text">
                  {password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                    ? "Strong password"
                    : password.length >= 8
                      ? "Could be stronger"
                      : "Too weak"}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="submit-btn"
            >
              {loading ? "Resetting..." : "Reset password"}
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
  );
}

export default function ResetPasswordPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          margin-bottom: 20px;
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

        .password-wrapper {
          position: relative;
        }

        .password-wrapper .form-input {
          padding-right: 48px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9aa0a6;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .password-toggle:hover {
          color: #5f6368;
        }

        .password-strength {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background: #e8eaed;
          border-radius: 2px;
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .strength-text {
          font-size: 12px;
          color: #9aa0a6;
          white-space: nowrap;
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

        .success-card, .error-card {
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

        .error-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, rgba(234, 67, 53, 0.1), rgba(234, 67, 53, 0.05));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #ea4335;
        }

        .success-card h2, .error-card h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          font-weight: 400;
          color: #1a1a1a;
          margin: 0 0 12px 0;
        }

        .success-card p, .error-card p {
          font-size: 14px;
          color: #5f6368;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }
      `}</style>

      <div className="reset-page">
        <Suspense fallback={
          <div className="reset-card">
            <div style={{ textAlign: "center", color: "#9aa0a6" }}>Loading...</div>
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </>
  );
}
