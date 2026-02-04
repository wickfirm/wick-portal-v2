"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Omnixia Logo Component
function OmnixiaLogo({ height = 40 }: { height?: number }) {
  return (
    <img
      src="/omnixia-logo.png"
      alt="Omnixia"
      height={height}
      style={{ objectFit: "contain", height: `${height}px`, width: "auto" }}
    />
  );
}

const check = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const features = [
  {
    category: "Client Management",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    description: "A CRM built specifically for agency-client relationships, not generic sales pipelines.",
    items: [
      "Client profiles with complete history",
      "Contact management across organizations",
      "Deal pipeline with custom stages",
      "Client health scoring",
      "Automated onboarding workflows",
      "Client portals with project visibility",
      "Communication timeline",
      "Document management per client",
    ],
  },
  {
    category: "Project Management",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    description: "Plan, track, and deliver projects with tools designed for creative and strategic work.",
    items: [
      "Multiple views: Kanban, List, Timeline, Calendar",
      "Task dependencies and milestones",
      "Time estimates vs actuals tracking",
      "Subtasks and checklists",
      "File attachments and comments",
      "Project templates",
      "Status automations",
      "Deadline alerts and notifications",
    ],
  },
  {
    category: "Time Tracking",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    description: "Effortless time tracking that connects directly to projects, tasks, and billing.",
    items: [
      "One-click timer start/stop",
      "Manual time entry with bulk editing",
      "Timesheet views: daily, weekly, monthly",
      "Billable vs non-billable tracking",
      "Overtime detection and alerts",
      "Team timesheets for managers",
      "Calendar integration",
      "Mobile app support",
    ],
  },
  {
    category: "Resource Planning",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    description: "See your team's capacity at a glance. No more overbooking or missed opportunities.",
    items: [
      "Team capacity visualization",
      "Workload balancing",
      "Project scheduling with drag-and-drop",
      "Utilization reports",
      "Leave and PTO management",
      "Skill-based assignment",
      "Conflict detection",
      "Forecasting tools",
    ],
  },
  {
    category: "Finance & Invoicing",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    description: "From tracked time to paid invoice in minutes, not hours.",
    items: [
      "Generate invoices from time entries",
      "Customizable invoice templates",
      "Payment tracking and reminders",
      "Multiple currencies support",
      "Expense tracking",
      "Profitability by client/project",
      "Revenue forecasting",
      "QuickBooks/Xero integration",
    ],
  },
  {
    category: "Reporting & Analytics",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
    description: "Make data-driven decisions with real-time insights across your agency.",
    items: [
      "Real-time dashboards",
      "Custom report builder",
      "Team productivity metrics",
      "Client profitability analysis",
      "Project health indicators",
      "Utilization trends",
      "Revenue breakdowns",
      "Exportable reports",
    ],
  },
];

export default function FeaturesPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Navigation */}
      <nav className={`marketing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <OmnixiaLogo height={47} />
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

      {/* Hero */}
      <section style={{ padding: "180px 32px 100px", position: "relative" }}>
        <div className="hero-bg">
          <div className="hero-gradient hero-gradient-1" />
          <div className="hero-grid" />
        </div>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <span className="section-tag">Features</span>
          <h1 className="hero-title" style={{ fontSize: "56px", marginBottom: "24px" }}>
            Everything Your Agency Needs.<br />
            <span className="hero-title-gradient">Nothing It Doesn't.</span>
          </h1>
          <p className="hero-subtitle" style={{ maxWidth: "700px", margin: "0 auto" }}>
            Stop paying for 10 different tools that don't talk to each other.
            Omnixia gives you a unified platform where everything just works together.
          </p>
        </div>
      </section>

      {/* Feature Categories */}
      <section style={{ padding: "40px 32px 120px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "80px" }}>
            {features.map((feature, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: i % 2 === 0 ? "1fr 1.2fr" : "1.2fr 1fr",
                gap: "64px",
                alignItems: "center",
              }}>
                <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                  <div style={{
                    width: "64px",
                    height: "64px",
                    background: "rgba(0, 212, 255, 0.1)",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--omni-cyan)",
                    marginBottom: "24px",
                  }}>
                    {feature.icon}
                  </div>
                  <h2 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "36px",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}>
                    {feature.category}
                  </h2>
                  <p style={{
                    fontSize: "17px",
                    lineHeight: "1.6",
                    color: "var(--omni-text-muted)",
                    marginBottom: "32px",
                  }}>
                    {feature.description}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}>
                    {feature.items.map((item, j) => (
                      <li key={j} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "15px",
                        color: "var(--omni-text-muted)",
                      }}>
                        {check}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{
                  order: i % 2 === 0 ? 1 : 0,
                  background: "linear-gradient(145deg, rgba(20, 27, 61, 0.6), rgba(10, 15, 44, 0.8))",
                  border: "1px solid var(--omni-border)",
                  borderRadius: "24px",
                  padding: "40px",
                  minHeight: "350px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {/* Placeholder for feature illustration */}
                  <div style={{
                    width: "100%",
                    height: "280px",
                    background: "rgba(0, 212, 255, 0.05)",
                    borderRadius: "16px",
                    border: "1px solid rgba(0, 212, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--omni-text-muted)",
                    fontSize: "14px",
                  }}>
                    Feature Preview Coming Soon
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to See It in Action?</h2>
            <p className="cta-text">
              Request early access and we'll give you a personalized demo of how Omnixia
              can transform your agency operations.
            </p>
            <div className="cta-buttons">
              <Link href="/contact" className="btn btn-primary btn-lg">Request Early Access</Link>
              <Link href="/about" className="btn btn-outline btn-lg">Learn More About Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="marketing-footer">
        <div className="footer-container">
          <div className="footer-bottom" style={{ borderTop: "none", paddingTop: 0 }}>
            <p className="footer-copyright">&copy; {new Date().getFullYear()} Omnixia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
