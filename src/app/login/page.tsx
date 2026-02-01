"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user) {
        const userRole = session.user.role;
        const userAgencyId = session.user.agencyId;

        let targetSubdomain = 'dash';

        if (userRole === 'PLATFORM_ADMIN') {
          targetSubdomain = 'dash';
        } else if (userAgencyId === 'agency-wick') {
          targetSubdomain = 'wick';
        } else if (userAgencyId === 'agency-udms') {
          targetSubdomain = 'udms';
        } else if (userAgencyId === 'agency-atc') {
          targetSubdomain = 'atc';
        } else if (userAgencyId === 'agency-crepe') {
          targetSubdomain = 'crepe';
        }

        const currentHost = window.location.hostname;
        const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

        if (isLocalhost) {
          window.location.href = "/dashboard";
        } else {
          const currentSubdomain = currentHost.split('.')[0];

          if (currentSubdomain === targetSubdomain) {
            window.location.href = "/dashboard";
          } else {
            const isProduction = currentHost.includes('omnixia.ai');
            const baseDomain = isProduction ? 'omnixia.ai' : 'omnixia.vercel.app';
            window.location.href = `https://${targetSubdomain}.${baseDomain}/dashboard`;
          }
        }
      }
    }
  }

  return (
    <>
      <style>{`
        .login-page * { box-sizing: border-box; }

        .login-page {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        .login-left {
          flex: 1;
          background: #76527c;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -20%;
          right: -30%;
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(216,238,145,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-left::after {
          content: '';
          position: absolute;
          bottom: -10%;
          left: -10%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(208,228,231,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-right {
          width: 520px;
          min-width: 520px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
        }

        .login-right::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, #e8eaed, transparent);
        }

        .brand-logo {
          position: relative;
          z-index: 2;
        }

        .brand-tagline {
          position: relative;
          z-index: 2;
          max-width: 480px;
        }

        .brand-tagline h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 52px;
          font-weight: 400;
          color: #fff;
          line-height: 1.15;
          margin: 0 0 24px 0;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : 20}px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .brand-tagline p {
          font-size: 16px;
          color: rgba(255,255,255,0.7);
          line-height: 1.7;
          margin: 0;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : 20}px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
        }

        .accent-line {
          width: 48px;
          height: 3px;
          background: #d8ee91;
          border-radius: 2px;
          margin-bottom: 32px;
          opacity: ${mounted ? 1 : 0};
          transform: scaleX(${mounted ? 1 : 0});
          transform-origin: left;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
        }

        .brand-footer {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 32px;
        }

        .brand-stat {
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : 12}px);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .brand-stat:nth-child(1) { transition-delay: 0.4s; }
        .brand-stat:nth-child(2) { transition-delay: 0.5s; }
        .brand-stat:nth-child(3) { transition-delay: 0.6s; }

        .brand-stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          color: #d8ee91;
          margin-bottom: 4px;
        }

        .brand-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .form-container {
          width: 100%;
          max-width: 380px;
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : 16}px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }

        .form-header {
          margin-bottom: 36px;
        }

        .form-header h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          font-weight: 400;
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }

        .form-header p {
          font-size: 14px;
          color: #9aa0a6;
          margin: 0;
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

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .forgot-link {
          font-size: 13px;
          color: #76527c;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .forgot-link:hover {
          color: #5f4263;
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
          position: relative;
          overflow: hidden;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(118,82,124,0.35);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          background: #e8eaed;
          color: #9aa0a6;
          cursor: not-allowed;
        }

        .login-footer {
          text-align: center;
          font-size: 12px;
          color: #c0c0c0;
        }

        .geometric-dots {
          position: absolute;
          top: 40%;
          right: 48px;
          display: grid;
          grid-template-columns: repeat(4, 8px);
          gap: 16px;
          opacity: 0.15;
          z-index: 1;
        }

        .geometric-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d8ee91;
        }

        @media (max-width: 960px) {
          .login-page { flex-direction: column; }
          .login-left { min-height: 300px; padding: 32px; }
          .login-right { width: 100%; min-width: unset; }
          .brand-tagline h1 { font-size: 36px; }
        }
      `}</style>

      <div className="login-page">
        {/* Left — Brand Panel */}
        <div className="login-left">
          <div className="brand-logo">
            <img
              src="/wick-logo-white.png"
              alt="The Wick Firm"
              style={{ height: 40, opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="brand-tagline">
            <div className="accent-line" />
            <h1>Strategy meets execution.</h1>
            <p>
              Your agency command center — clients, projects, tasks,
              and performance, all in one place.
            </p>
          </div>

          <div className="brand-footer">
            <div className="brand-stat">
              <div className="brand-stat-value">100%</div>
              <div className="brand-stat-label">Visibility</div>
            </div>
            <div className="brand-stat">
              <div className="brand-stat-value">Real-time</div>
              <div className="brand-stat-label">Analytics</div>
            </div>
            <div className="brand-stat">
              <div className="brand-stat-value">One</div>
              <div className="brand-stat-label">Platform</div>
            </div>
          </div>

          {/* Decorative dots */}
          <div className="geometric-dots">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="login-right">
          <div className="form-container">
            <div className="form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your portal account</p>
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
                  name="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="form-input"
                  autoComplete="email"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="form-input"
                  autoComplete="current-password"
                />
              </div>

              <div className="form-actions">
                <div />
                <Link href="/reset-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="login-footer" style={{ marginTop: 32 }}>
              &copy; {new Date().getFullYear()} The Wick Firm. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
