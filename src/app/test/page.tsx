'use client';

import { useEffect } from 'react';

export default function WidgetTestPage() {
  useEffect(() => {
    // Configuration
    (window as any).WickLeadQualifier = {
      agencyId: 'agency-wick', // ⚠️ REPLACE THIS
      apiEndpoint: 'https://wick.omnixia.ai/api/lead-qualifier',
      position: 'bottom-right',
      primaryColor: '#667eea',
      greeting: 'Hi! 👋 Looking to grow your business online? Let\'s chat!',
      placeholder: 'Type your message...',
      autoOpen: false,
      delayMs: 5000
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = '/widget/lead-qualifier.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const container = document.getElementById('wick-lead-qualifier-container');
      if (container) container.remove();
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 120px 20px 80px;
          text-align: center;
        }
        
        .hero h1 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        
        .hero p {
          font-size: 20px;
          max-width: 600px;
          margin: 0 auto 30px;
          opacity: 0.95;
        }
        
        .hero .cta {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 15px 40px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        
        .hero .cta:hover {
          transform: translateY(-2px);
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
        }
        
        .services {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 40px;
          margin-top: 40px;
        }
        
        .service-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 12px rgba(0,0,0,0.1);
        }
        
        .service-card h3 {
          font-size: 24px;
          margin-bottom: 15px;
          color: #667eea;
        }
        
        .service-card p {
          color: #666;
          line-height: 1.8;
        }
        
        .section-title {
          text-align: center;
          font-size: 36px;
          margin-bottom: 20px;
          color: #333;
        }
        
        .section-subtitle {
          text-align: center;
          color: #666;
          font-size: 18px;
          max-width: 700px;
          margin: 0 auto;
        }
        
        .stats {
          background: #f9fafb;
          padding: 80px 20px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
          max-width: 1200px;
          margin: 40px auto 0;
        }
        
        .stat-card {
          text-align: center;
        }
        
        .stat-card .number {
          font-size: 48px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 10px;
        }
        
        .stat-card .label {
          font-size: 16px;
          color: #666;
        }
        
        footer {
          background: #1a1a1a;
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        
        footer p {
          opacity: 0.8;
        }
      `}</style>

      <section className="hero">
        <h1>Transform Your Digital Presence</h1>
        <p>We're The Wick Firm - a Dubai-based digital marketing agency specializing in SEO, AEO, and paid media for hospitality, real estate, and e-commerce brands.</p>
        <a href="#contact" className="cta">Get Started Today</a>
      </section>

      <section className="container">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">Comprehensive digital marketing solutions tailored to your business goals</p>
        
        <div className="services">
          <div className="service-card">
            <h3>🔍 SEO & AEO</h3>
            <p>Dominate search results and AI engines like ChatGPT, Perplexity, and Gemini. We optimize for both traditional search and the future of AI-powered discovery.</p>
          </div>
          
          <div className="service-card">
            <h3>💻 Web Development</h3>
            <p>Beautiful, fast, and conversion-optimized websites built with the latest technologies. From landing pages to complex web applications.</p>
          </div>
          
          <div className="service-card">
            <h3>📱 Paid Media</h3>
            <p>Data-driven META, Google, and LinkedIn campaigns that deliver measurable ROI. We specialize in hospitality and luxury brand advertising.</p>
          </div>
          
          <div className="service-card">
            <h3>📊 Analytics & Reporting</h3>
            <p>Track what matters with comprehensive dashboards and weekly performance reports. We turn data into actionable insights.</p>
          </div>
          
          <div className="service-card">
            <h3>🤖 AI Integration</h3>
            <p>Leverage AI-powered tools for lead qualification, content creation, and marketing automation. Stay ahead of the curve.</p>
          </div>
          
          <div className="service-card">
            <h3>🎯 Strategy & Consulting</h3>
            <p>Strategic digital marketing planning based on industry best practices and competitive intelligence. Your success is our mission.</p>
          </div>
        </div>
      </section>

      <section className="stats">
        <h2 className="section-title">Trusted by Leading Brands</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="number">50+</div>
            <div className="label">Active Clients</div>
          </div>
          
          <div className="stat-card">
            <div className="number">1.8M</div>
            <div className="label">AED in Annual Ad Spend</div>
          </div>
          
          <div className="stat-card">
            <div className="number">8</div>
            <div className="label">F&B Venues Managed</div>
          </div>
          
          <div className="stat-card">
            <div className="number">24/7</div>
            <div className="label">Support Available</div>
          </div>
        </div>
      </section>

      <section className="container" id="contact">
        <h2 className="section-title">Let's Work Together</h2>
        <p className="section-subtitle">Ready to grow your business? Chat with us now or schedule a consultation.</p>
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="mailto:hello@thewickfirm.com" className="cta" style={{ background: '#667eea', color: 'white', padding: '15px 40px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
            Get in Touch
          </a>
        </div>
      </section>

      <footer>
        <p>&copy; 2026 The Wick Firm. All rights reserved.</p>
        <p style={{ marginTop: '10px', fontSize: '14px' }}>Dubai, UAE | hello@thewickfirm.com | +971 50 123 4567</p>
      </footer>
    </>
  );
}
