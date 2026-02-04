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

export default function ContactPage() {
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission - in production, this would hit an API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%",
    padding: "16px 20px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--omni-border)",
    borderRadius: "12px",
    color: "var(--omni-text)",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500" as const,
    color: "var(--omni-text-muted)",
    marginBottom: "8px",
  };

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
      <section style={{ padding: "180px 32px 80px", position: "relative" }}>
        <div className="hero-bg">
          <div className="hero-gradient hero-gradient-1" />
          <div className="hero-grid" />
        </div>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <span className="section-tag">Contact</span>
          <h1 className="hero-title" style={{ fontSize: "48px", marginBottom: "24px" }}>
            Let's Build Something<br />
            <span className="hero-title-gradient">Amazing Together</span>
          </h1>
          <p className="hero-subtitle">
            Ready to simplify your agency operations? Get in touch and we'll help you
            get started.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section style={{ padding: "0 32px 120px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {submitted ? (
            <div style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: "24px",
              padding: "64px 40px",
              textAlign: "center",
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                background: "rgba(0,212,255,0.2)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "28px", fontWeight: "600", marginBottom: "16px" }}>
                Message Sent!
              </h2>
              <p style={{ fontSize: "16px", color: "var(--omni-text-muted)", marginBottom: "32px" }}>
                Thanks for reaching out. We'll get back to you within 24 hours.
              </p>
              <Link href="/" className="btn btn-primary">
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              background: "linear-gradient(145deg, rgba(20, 27, 61, 0.6), rgba(10, 15, 44, 0.8))",
              border: "1px solid var(--omni-border)",
              borderRadius: "24px",
              padding: "48px",
            }}>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0,212,255,0.5)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(0,212,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--omni-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Work Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@agency.com"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0,212,255,0.5)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(0,212,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--omni-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Company Name</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Awesome Agency Inc"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0,212,255,0.5)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(0,212,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--omni-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Team Size</label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0,212,255,0.5)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(0,212,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--omni-border)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="">Select team size...</option>
                  <option value="1-5">1-5 people</option>
                  <option value="6-15">6-15 people</option>
                  <option value="16-50">16-50 people</option>
                  <option value="51-100">51-100 people</option>
                  <option value="100+">100+ people</option>
                </select>
              </div>

              <div style={{ marginBottom: "32px" }}>
                <label style={labelStyle}>How can we help? *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your agency and what challenges you're facing..."
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(0,212,255,0.5)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(0,212,255,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--omni-border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? "Sending..." : "Request Early Access"}
              </button>

              <p style={{ fontSize: "13px", color: "var(--omni-text-muted)", textAlign: "center", marginTop: "20px" }}>
                We'll respond within 24 hours. No spam, ever.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Alternative Contact */}
      <section style={{ padding: "0 32px 120px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--omni-border)",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                background: "rgba(0,212,255,0.1)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--omni-cyan)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                Email Us
              </h3>
              <a href="mailto:hello@omnixia.ai" style={{ color: "var(--omni-cyan)", textDecoration: "none", fontSize: "15px" }}>
                hello@omnixia.ai
              </a>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--omni-border)",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                background: "rgba(0,212,255,0.1)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--omni-cyan)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                Chat With Us
              </h3>
              <p style={{ color: "var(--omni-text-muted)", fontSize: "15px", margin: 0 }}>
                Live chat coming soon
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--omni-border)",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                background: "rgba(0,212,255,0.1)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--omni-cyan)",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                Follow Us
              </h3>
              <a href="https://twitter.com/omnixia" target="_blank" rel="noopener noreferrer" style={{ color: "var(--omni-cyan)", textDecoration: "none", fontSize: "15px" }}>
                @omnixia
              </a>
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
