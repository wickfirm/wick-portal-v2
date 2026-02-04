"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// SVG Icons
const icons = {
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  chaos: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  money: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  clock: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  users: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  zap: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  pieChart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  calendar: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  shield: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  arrowRight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  play: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  twitter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};

// Omnixia Logo Component
function OmnixiaLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#00b4d8" />
        </linearGradient>
      </defs>
      {/* Stylized swirl logo representing flow/integration */}
      <path
        d="M50 10C28 10 10 28 10 50s18 40 40 40 40-18 40-40S72 10 50 10zm0 65c-14 0-25-11-25-25s11-25 25-25c6 0 12 2 16 6l-16 19 20-5c-3 17-17 30-35 30z"
        fill="url(#logoGradient)"
      />
      <circle cx="50" cy="50" r="8" fill="#0a0f2c" />
    </svg>
  );
}

export default function MarketingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Navigation */}
      <nav className={`marketing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <OmnixiaLogo size={40} />
            <span className="nav-logo-text">omnixia</span>
          </Link>

          <div className="nav-links">
            <Link href="/features" className="nav-link">Features</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/blog" className="nav-link">Blog</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </div>

          <div className="nav-cta">
            <Link href="https://wick.omnixia.ai/login" className="btn btn-ghost">Sign In</Link>
            <Link href="/contact" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient hero-gradient-1" />
          <div className="hero-gradient hero-gradient-2" />
          <div className="hero-grid" />
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Now in Beta - Early Access Available
            </div>

            <h1 className="hero-title">
              One Platform.<br />
              <span className="hero-title-gradient">Zero Chaos.</span>
            </h1>

            <p className="hero-subtitle">
              Stop juggling 10+ disconnected tools. Omnixia unifies your CRM, projects,
              time tracking, invoicing, and team management in one beautiful platform
              built for modern agencies.
            </p>

            <div className="hero-cta">
              <Link href="/contact" className="btn btn-primary btn-lg">
                Request Early Access {icons.arrowRight}
              </Link>
              <button className="btn btn-outline btn-lg">
                {icons.play} Watch Demo
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">85%</div>
                <div className="hero-stat-label">Less Tool Switching</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">10+</div>
                <div className="hero-stat-label">Hours Saved Weekly</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">$2K+</div>
                <div className="hero-stat-label">Monthly Tool Savings</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-dashboard" style={{ padding: "20px", minHeight: "400px" }}>
              {/* Dashboard Preview - Simplified representation */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Header bar */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #00d4ff, #00b4d8)" }} />
                  <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.1)", borderRadius: "5px", maxWidth: "150px" }} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {[
                    { label: "Active Projects", value: "24", color: "#00d4ff" },
                    { label: "Hours This Week", value: "186", color: "#22c55e" },
                    { label: "Revenue MTD", value: "$84K", color: "#a855f7" },
                  ].map((stat, i) => (
                    <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", borderLeft: `3px solid ${stat.color}` }}>
                      <div style={{ fontSize: "24px", fontWeight: "700", color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Project list preview */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.7)", marginBottom: "12px" }}>Active Projects</div>
                  {[
                    { name: "Brand Refresh", client: "Acme Corp", progress: 75 },
                    { name: "Q1 Campaign", client: "TechStart", progress: 45 },
                    { name: "Website Redesign", client: "FinanceX", progress: 90 },
                  ].map((project, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `hsl(${180 + i * 30}, 70%, 50%)`, opacity: 0.2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: "#fff" }}>{project.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{project.client}</div>
                      </div>
                      <div style={{ width: "60px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${project.progress}%`, height: "100%", background: "#00d4ff", borderRadius: "2px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="pain-points">
        <div className="pain-points-container">
          <div className="section-header">
            <span className="section-tag">The Problem</span>
            <h2 className="section-title">
              Your Agency is Drowning in Tools
            </h2>
            <p className="section-subtitle">
              You're paying for Asana + Harvest + HubSpot + QuickBooks + Slack + Notion +
              a dozen more. They don't talk to each other. Your team wastes hours copying
              data between them.
            </p>
          </div>

          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-icon">{icons.chaos}</div>
              <h3 className="pain-title">Tool Chaos</h3>
              <p className="pain-text">
                Your project is in Asana, time in Harvest, client info in HubSpot,
                invoices in QuickBooks. Nobody knows where anything is.
              </p>
            </div>

            <div className="pain-card">
              <div className="pain-icon">{icons.money}</div>
              <h3 className="pain-title">Subscription Bloat</h3>
              <p className="pain-text">
                You're spending $2,000+ monthly on tools that overlap. Each new hire
                adds 10 more licenses. It never stops.
              </p>
            </div>

            <div className="pain-card">
              <div className="pain-icon">{icons.clock}</div>
              <h3 className="pain-title">Context Switching Hell</h3>
              <p className="pain-text">
                Your team switches apps 100+ times daily. That's 4+ hours of lost
                productivity per person, per week. Every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <div className="section-header">
            <span className="section-tag">The Solution</span>
            <h2 className="section-title">
              Everything You Need. Nothing You Don't.
            </h2>
            <p className="section-subtitle">
              Omnixia replaces your entire tool stack with one unified platform
              designed specifically for agencies.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card large">
              <div>
                <div className="feature-icon">{icons.users}</div>
                <h3 className="feature-title">Client Management</h3>
                <p className="feature-text">
                  A CRM that actually understands agency relationships. Track clients,
                  contacts, deals, and history in one place. Auto-link to projects,
                  tasks, and invoices.
                </p>
                <ul className="feature-list">
                  <li>{icons.check} Client portals with real-time project status</li>
                  <li>{icons.check} Contact management & communication history</li>
                  <li>{icons.check} Deal pipeline with custom stages</li>
                  <li>{icons.check} Automated onboarding workflows</li>
                </ul>
              </div>
              <div style={{ background: "rgba(0,212,255,0.05)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(0,212,255,0.1)" }}>
                {/* Mini CRM preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {["Acme Corp", "TechStart Inc", "FinanceX"].map((client, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `linear-gradient(135deg, hsl(${180 + i * 40}, 70%, 50%), hsl(${200 + i * 40}, 70%, 40%))`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                        {client[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500", fontSize: "14px" }}>{client}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{3 - i} active projects</div>
                      </div>
                      <div style={{ padding: "4px 10px", borderRadius: "20px", background: i === 0 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)", color: i === 0 ? "#22c55e" : "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: "500" }}>
                        {i === 0 ? "Active" : "Lead"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">{icons.zap}</div>
              <h3 className="feature-title">Project & Task Management</h3>
              <p className="feature-text">
                Kanban boards, timelines, dependencies - all connected to time tracking
                and client billing automatically.
              </p>
              <ul className="feature-list">
                <li>{icons.check} Multiple project views</li>
                <li>{icons.check} Time estimates vs actuals</li>
                <li>{icons.check} Resource allocation</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">{icons.clock}</div>
              <h3 className="feature-title">Integrated Time Tracking</h3>
              <p className="feature-text">
                One-click timer linked to tasks. Automatic timesheet generation.
                Real-time billable hours across all projects.
              </p>
              <ul className="feature-list">
                <li>{icons.check} Desktop & mobile timer</li>
                <li>{icons.check} Auto-billing rules</li>
                <li>{icons.check} Overtime alerts</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">{icons.pieChart}</div>
              <h3 className="feature-title">Finance & Invoicing</h3>
              <p className="feature-text">
                Generate invoices from tracked time. Track payments. See profitability
                by client, project, or team member instantly.
              </p>
              <ul className="feature-list">
                <li>{icons.check} Auto-generated invoices</li>
                <li>{icons.check} Payment tracking</li>
                <li>{icons.check} Profitability analytics</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">{icons.calendar}</div>
              <h3 className="feature-title">Resource Planning</h3>
              <p className="feature-text">
                See who's overbooked, who has capacity. Plan projects weeks ahead
                with real data, not guesswork.
              </p>
              <ul className="feature-list">
                <li>{icons.check} Team capacity view</li>
                <li>{icons.check} Project scheduling</li>
                <li>{icons.check} Leave management</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">{icons.shield}</div>
              <h3 className="feature-title">Multi-Tenant Architecture</h3>
              <p className="feature-text">
                Each agency gets their own subdomain, branding, and isolated data.
                Perfect for agency networks or white-labeling.
              </p>
              <ul className="feature-list">
                <li>{icons.check} Custom subdomains</li>
                <li>{icons.check} White-label ready</li>
                <li>{icons.check} Enterprise security</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h2 className="cta-title">
              Ready to Simplify Your Agency?
            </h2>
            <p className="cta-text">
              Join forward-thinking agencies who've consolidated their tool stack
              and reclaimed their time. Early access spots are limited.
            </p>
            <div className="cta-buttons">
              <Link href="/contact" className="btn btn-primary btn-lg">
                Request Early Access
              </Link>
              <Link href="/features" className="btn btn-outline btn-lg">
                See All Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="marketing-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <OmnixiaLogo size={36} />
                <span className="nav-logo-text">omnixia</span>
              </div>
              <p className="footer-tagline">
                The all-in-one operating system for modern agencies.
                Stop juggling tools, start delivering results.
              </p>
            </div>

            <div>
              <h4 className="footer-col-title">Product</h4>
              <ul className="footer-links">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/changelog">Changelog</Link></li>
                <li><Link href="/roadmap">Roadmap</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Company</h4>
              <ul className="footer-links">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-col-title">Legal</h4>
              <ul className="footer-links">
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} Omnixia. All rights reserved.
            </p>
            <div className="footer-socials">
              <a href="https://twitter.com/omnixia" target="_blank" rel="noopener noreferrer" className="footer-social">
                {icons.twitter}
              </a>
              <a href="https://linkedin.com/company/omnixia" target="_blank" rel="noopener noreferrer" className="footer-social">
                {icons.linkedin}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
