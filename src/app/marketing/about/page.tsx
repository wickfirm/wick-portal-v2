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

export default function AboutPage() {
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
          <span className="section-tag">About Us</span>
          <h1 className="hero-title" style={{ fontSize: "56px", marginBottom: "24px" }}>
            Built by Agency People,<br />
            <span className="hero-title-gradient">For Agency People</span>
          </h1>
          <p className="hero-subtitle" style={{ maxWidth: "700px", margin: "0 auto" }}>
            We've lived the chaos of managing agencies with 15 different tools.
            We built Omnixia to solve our own problems - then realized every agency needs this.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section style={{ padding: "80px 32px", background: "var(--omni-navy-light)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "grid", gap: "64px" }}>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "32px", fontWeight: "600", marginBottom: "20px" }}>
                Our Story
              </h2>
              <p style={{ fontSize: "17px", lineHeight: "1.8", color: "var(--omni-text-muted)", marginBottom: "20px" }}>
                Omnixia started in 2024 when we realized something was fundamentally broken about
                how agencies operate. Every agency we talked to was using 10-15 different tools
                that didn't talk to each other.
              </p>
              <p style={{ fontSize: "17px", lineHeight: "1.8", color: "var(--omni-text-muted)", marginBottom: "20px" }}>
                Project managers were copying data between apps. Account managers couldn't see
                project status without asking three people. Finance teams were manually reconciling
                time logs with invoices. It was madness.
              </p>
              <p style={{ fontSize: "17px", lineHeight: "1.8", color: "var(--omni-text-muted)" }}>
                We knew there had to be a better way. So we built it.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "32px", fontWeight: "600", marginBottom: "20px" }}>
                Our Mission
              </h2>
              <p style={{ fontSize: "17px", lineHeight: "1.8", color: "var(--omni-text-muted)" }}>
                We're on a mission to give every agency the operational infrastructure of a Fortune 500
                company - without the complexity or cost. One platform that handles everything from
                the first client call to the final invoice, and everything in between.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "32px", fontWeight: "600", marginBottom: "32px" }}>
                Our Values
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                {[
                  { title: "Simplicity First", desc: "Power doesn't have to mean complexity. We obsess over making powerful features feel effortless." },
                  { title: "Built for Reality", desc: "We ship features based on real agency workflows, not theoretical use cases." },
                  { title: "Radical Transparency", desc: "Clear pricing, honest timelines, and no hidden surprises. Ever." },
                  { title: "Customer Obsessed", desc: "Your success is our success. We're partners in your agency's growth." },
                ].map((value, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--omni-border)", borderRadius: "16px", padding: "28px" }}>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>{value.title}</h3>
                    <p style={{ fontSize: "15px", lineHeight: "1.6", color: "var(--omni-text-muted)", margin: 0 }}>{value.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Join Us?</h2>
            <p className="cta-text">
              Whether you want to use Omnixia or help us build it, we'd love to hear from you.
            </p>
            <div className="cta-buttons">
              <Link href="/contact" className="btn btn-primary btn-lg">Get in Touch</Link>
              <Link href="/careers" className="btn btn-outline btn-lg">View Careers</Link>
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
