"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Omnixia Logo Component
function OmnixiaLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/omnixia-logo.png"
      alt="Omnixia"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

// Placeholder blog posts
const posts = [
  {
    slug: "tool-consolidation-agencies",
    title: "The True Cost of Tool Sprawl: Why Agencies Are Consolidating",
    excerpt: "Most agencies are paying for 10-15 different software tools. We break down the hidden costs beyond subscription fees.",
    category: "Operations",
    date: "Feb 3, 2026",
    readTime: "6 min read",
  },
  {
    slug: "time-tracking-profitability",
    title: "How Accurate Time Tracking Increased Our Client Profitability by 40%",
    excerpt: "A case study on how one agency transformed their bottom line by simply tracking time more effectively.",
    category: "Case Study",
    date: "Jan 28, 2026",
    readTime: "8 min read",
  },
  {
    slug: "client-portal-benefits",
    title: "Why Client Portals Are the Secret Weapon of Top-Performing Agencies",
    excerpt: "Transparency builds trust. Here's how giving clients visibility into their projects leads to better relationships.",
    category: "Client Management",
    date: "Jan 21, 2026",
    readTime: "5 min read",
  },
  {
    slug: "resource-planning-guide",
    title: "The Complete Guide to Agency Resource Planning",
    excerpt: "Stop flying blind. Learn how to forecast workload, prevent burnout, and never miss a deadline again.",
    category: "Resource Planning",
    date: "Jan 14, 2026",
    readTime: "12 min read",
  },
];

export default function BlogPage() {
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

      {/* Hero */}
      <section style={{ padding: "180px 32px 80px", position: "relative" }}>
        <div className="hero-bg">
          <div className="hero-gradient hero-gradient-1" />
          <div className="hero-grid" />
        </div>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <span className="section-tag">Blog</span>
          <h1 className="hero-title" style={{ fontSize: "56px", marginBottom: "24px" }}>
            Insights for<br />
            <span className="hero-title-gradient">Modern Agencies</span>
          </h1>
          <p className="hero-subtitle" style={{ maxWidth: "600px", margin: "0 auto" }}>
            Practical advice, case studies, and thought leadership for agency leaders
            who want to build better operations.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section style={{ padding: "0 32px 120px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "32px" }}>
            {posts.map((post, i) => (
              <article
                key={i}
                style={{
                  background: "linear-gradient(145deg, rgba(20, 27, 61, 0.6), rgba(10, 15, 44, 0.8))",
                  border: "1px solid var(--omni-border)",
                  borderRadius: "20px",
                  overflow: "hidden",
                  transition: "transform 0.2s, border-color 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(0, 212, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--omni-border)";
                }}
              >
                {/* Placeholder image */}
                <div style={{
                  height: "180px",
                  background: `linear-gradient(135deg, hsl(${190 + i * 20}, 70%, 20%), hsl(${200 + i * 20}, 70%, 15%))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                </div>

                <div style={{ padding: "28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{
                      padding: "4px 12px",
                      background: "rgba(0, 212, 255, 0.1)",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "var(--omni-cyan)",
                    }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--omni-text-muted)" }}>
                      {post.readTime}
                    </span>
                  </div>

                  <h2 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "20px",
                    fontWeight: "600",
                    lineHeight: "1.3",
                    marginBottom: "12px",
                  }}>
                    {post.title}
                  </h2>

                  <p style={{
                    fontSize: "15px",
                    lineHeight: "1.6",
                    color: "var(--omni-text-muted)",
                    marginBottom: "20px",
                  }}>
                    {post.excerpt}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", color: "var(--omni-text-muted)" }}>
                      {post.date}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--omni-cyan)" }}>
                      Read more →
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Coming Soon Notice */}
          <div style={{
            marginTop: "64px",
            padding: "48px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--omni-border)",
            borderRadius: "20px",
            textAlign: "center",
          }}>
            <h3 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "12px",
            }}>
              More Content Coming Soon
            </h3>
            <p style={{ fontSize: "16px", color: "var(--omni-text-muted)", marginBottom: "24px" }}>
              We're just getting started. Subscribe to get notified when we publish new articles.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", maxWidth: "400px", margin: "0 auto" }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--omni-border)",
                  borderRadius: "10px",
                  color: "var(--omni-text)",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
              <button className="btn btn-primary">
                Subscribe
              </button>
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
