"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { theme } from "@/lib/theme";

const PROJECT_TYPES = [
  { value: "WEB_DEV", label: "Website Development" },
  { value: "ECOMMERCE", label: "E-Commerce" },
  { value: "BRANDING", label: "Branding & Identity" },
  { value: "SEO", label: "SEO" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "MARKETING_RETAINER", label: "Marketing Retainer" },
  { value: "FULL_PACKAGE", label: "Full Digital Package" },
  { value: "MOBILE_APP", label: "Mobile App" },
  { value: "CUSTOM", label: "Custom" },
];

const BRIEF_SOURCES = [
  { value: "EMAIL", label: "Email", icon: "mail" },
  { value: "DOCUMENT", label: "Document", icon: "file" },
  { value: "CALL_NOTES", label: "Call Notes", icon: "phone" },
  { value: "MANUAL", label: "Write Manually", icon: "edit" },
];

const CURRENCIES = [
  { value: "AED", label: "AED - Dirham" },
  { value: "USD", label: "USD - Dollar" },
  { value: "EUR", label: "EUR - Euro" },
];

const icons: Record<string, JSX.Element> = {
  mail: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  file: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  edit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  sparkle: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  loader: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  ),
  arrowRight: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

type ExtractedData = {
  projectType: string;
  requirements: string[];
  budgetHints: string | null;
  timeline: string | null;
  painPoints: string[];
  missingInfo: string[];
  suggestedServices: Record<string, string[]>;
  scopeAssessment: string;
  recommendedTier: string;
  summary: string;
};

export default function NewProposalPage() {
  const router = useRouter();
  const { status } = useSession();

  // Form state
  const [step, setStep] = useState(1); // 1=Client & Details, 2=Brief, 3=AI Analysis
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [language, setLanguage] = useState("en");
  const [briefSource, setBriefSource] = useState("");
  const [briefContent, setBriefContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ["clients-for-proposal"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
  });

  const clients = clientsData?.clients || [];

  // Auto-generate title when client and type are selected
  const selectedClient = clients.find((c: any) => c.id === clientId);

  const handleCreateAndAnalyze = useCallback(async () => {
    if (!clientId || !title) return;

    setIsCreating(true);
    try {
      // Step 1: Create the proposal
      const createRes = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title,
          projectType: projectType || "CUSTOM",
          briefSource: briefSource || "MANUAL",
          briefContent: briefContent || null,
          currency,
          language,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        alert(err.error || "Failed to create proposal");
        return;
      }

      const { proposal } = await createRes.json();
      setCreatedProposalId(proposal.id);

      // Step 2: If there's brief content, analyze it
      if (briefContent.trim()) {
        setIsAnalyzing(true);
        setStep(3);

        const analyzeRes = await fetch(`/api/proposals/${proposal.id}/analyze-brief`, {
          method: "POST",
        });

        if (analyzeRes.ok) {
          const { extractedData: data } = await analyzeRes.json();
          setExtractedData(data);

          // Update project type if AI suggested one
          if (data.projectType && !projectType) {
            setProjectType(data.projectType);
          }
        }
        setIsAnalyzing(false);
      } else {
        // No brief content, go directly to proposal builder
        router.push(`/proposals/${proposal.id}`);
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      alert("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  }, [clientId, title, projectType, briefSource, briefContent, currency, language, router]);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: `1px solid ${theme.colors.borderLight}`,
    fontSize: 14,
    color: theme.colors.textPrimary,
    background: theme.colors.bgSecondary,
    outline: "none",
    transition: "border-color 0.15s ease",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600 as const,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, marginBottom: 4 }}>
          Create New Proposal
        </h1>
        <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
          Start with the client brief, and AI will help you build a professional proposal
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        {[
          { num: 1, label: "Client & Details" },
          { num: 2, label: "Client Brief" },
          { num: 3, label: "AI Analysis" },
        ].map((s, i) => (
          <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              background: step >= s.num ? theme.colors.primary : theme.colors.bgTertiary,
              color: step >= s.num ? "#fff" : theme.colors.textMuted,
              transition: "all 0.25s ease",
            }}>
              {step > s.num ? icons.check : s.num}
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: step === s.num ? 600 : 400,
              color: step === s.num ? theme.colors.textPrimary : theme.colors.textSecondary,
            }}>
              {s.label}
            </span>
            {i < 2 && (
              <div style={{ width: 40, height: 1, background: step > s.num ? theme.colors.primary : theme.colors.borderLight, margin: "0 4px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Client & Details */}
      {step === 1 && (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 14,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: 28,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Client Select */}
            <div>
              <label style={labelStyle}>Client *</label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  const client = clients.find((c: any) => c.id === e.target.value);
                  if (client && !title) {
                    setTitle(`${client.name} - Proposal`);
                  }
                }}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Select a client...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Type */}
            <div>
              <label style={labelStyle}>Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">AI will suggest based on brief...</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Proposal Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Website Development Proposal for Habits UAE"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            {/* Currency */}
            <div>
              <label style={labelStyle}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label style={labelStyle}>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setStep(2)}
              disabled={!clientId || !title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                background: (!clientId || !title) ? theme.colors.bgTertiary : theme.gradients.primary,
                color: (!clientId || !title) ? theme.colors.textMuted : "#fff",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                border: "none",
                cursor: (!clientId || !title) ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Next: Add Brief {icons.arrowRight}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Client Brief */}
      {step === 2 && (
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: 14,
          border: `1px solid ${theme.colors.borderLight}`,
          padding: 28,
        }}>
          {/* Brief Source Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>How did the client send their brief?</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {BRIEF_SOURCES.map((src) => (
                <button
                  key={src.value}
                  onClick={() => setBriefSource(src.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "16px 12px",
                    borderRadius: 12,
                    border: `2px solid ${briefSource === src.value ? theme.colors.primary : theme.colors.borderLight}`,
                    background: briefSource === src.value ? theme.colors.primaryBg : "transparent",
                    color: briefSource === src.value ? theme.colors.primary : theme.colors.textSecondary,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {icons[src.icon]}
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{src.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brief Content */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>
              Paste the client&apos;s requirements below
              <span style={{ fontWeight: 400, color: theme.colors.textMuted, marginLeft: 6 }}>
                (email, brief document, call notes, etc.)
              </span>
            </label>
            <textarea
              value={briefContent}
              onChange={(e) => setBriefContent(e.target.value)}
              placeholder="Paste the client's email, brief, requirements document, or call notes here...&#10;&#10;The more detail you provide, the better the AI analysis will be."
              rows={12}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 200,
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
                {briefContent.length > 0 ? `${briefContent.split(/\s+/).filter(Boolean).length} words` : ""}
              </span>
              <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
                You can also skip this and build the proposal manually
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                color: theme.colors.textSecondary,
                borderRadius: 10,
                fontWeight: 500,
                fontSize: 14,
                border: `1px solid ${theme.colors.borderLight}`,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Back
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  // Skip brief, create proposal and go to builder
                  handleCreateAndAnalyze();
                }}
                disabled={isCreating}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  color: theme.colors.textSecondary,
                  borderRadius: 10,
                  fontWeight: 500,
                  fontSize: 14,
                  border: `1px solid ${theme.colors.borderLight}`,
                  cursor: isCreating ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Skip & Build Manually
              </button>
              <button
                onClick={handleCreateAndAnalyze}
                disabled={isCreating || !briefContent.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  background: (isCreating || !briefContent.trim()) ? theme.colors.bgTertiary : theme.gradients.primary,
                  color: (isCreating || !briefContent.trim()) ? theme.colors.textMuted : "#fff",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  cursor: (isCreating || !briefContent.trim()) ? "not-allowed" : "pointer",
                  boxShadow: (isCreating || !briefContent.trim()) ? "none" : theme.shadows.button,
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
              >
                {isCreating ? icons.loader : icons.sparkle}
                {isCreating ? "Creating..." : "Analyze with AI"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: AI Analysis Results */}
      {step === 3 && (
        <div>
          {isAnalyzing ? (
            <div style={{
              background: theme.colors.bgSecondary,
              borderRadius: 14,
              border: `1px solid ${theme.colors.borderLight}`,
              padding: "60px 28px",
              textAlign: "center",
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: theme.colors.primaryBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                color: theme.colors.primary,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1.5s linear infinite" }}>
                  <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
                </svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 8 }}>
                Analyzing Client Brief
              </div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                AI is extracting requirements, identifying project scope, and suggesting services...
              </div>
            </div>
          ) : extractedData ? (
            <div>
              {/* AI Summary Card */}
              <div style={{
                background: theme.colors.bgSecondary,
                borderRadius: 14,
                border: `1px solid ${theme.colors.borderLight}`,
                padding: 24,
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: theme.colors.primaryBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.colors.primary,
                  }}>
                    {icons.sparkle}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary }}>AI Analysis Complete</div>
                    <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{extractedData.summary}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                  <div style={{ padding: 14, borderRadius: 10, background: theme.colors.bgPrimary }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Project Type</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>{extractedData.projectType?.replace(/_/g, " ")}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: theme.colors.bgPrimary }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Scope</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>{extractedData.scopeAssessment}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: theme.colors.bgPrimary }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Recommended Tier</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.primary }}>{extractedData.recommendedTier?.replace(/_/g, " ")}</div>
                  </div>
                </div>
              </div>

              {/* Requirements + Pain Points */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: 14,
                  border: `1px solid ${theme.colors.borderLight}`,
                  padding: 20,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 12 }}>Requirements</div>
                  {extractedData.requirements?.map((req, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: theme.colors.textSecondary }}>
                      <span style={{ color: theme.colors.success, flexShrink: 0, marginTop: 1 }}>{icons.check}</span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: 14,
                  border: `1px solid ${theme.colors.borderLight}`,
                  padding: 20,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 12 }}>Missing Information</div>
                  {extractedData.missingInfo?.length > 0 ? extractedData.missingInfo.map((info, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: theme.colors.textSecondary }}>
                      <span style={{ color: theme.colors.warning, flexShrink: 0, marginTop: 1 }}>{icons.warning}</span>
                      <span>{info}</span>
                    </div>
                  )) : (
                    <div style={{ fontSize: 13, color: theme.colors.textMuted }}>No critical information missing</div>
                  )}
                </div>
              </div>

              {/* Suggested Services */}
              {extractedData.suggestedServices && (
                <div style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: 14,
                  border: `1px solid ${theme.colors.borderLight}`,
                  padding: 20,
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 14 }}>Suggested Service Categories</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {Object.entries(extractedData.suggestedServices).map(([category, services]) => (
                      (services as string[]).length > 0 && (
                        <div key={category} style={{ padding: 14, borderRadius: 10, background: theme.colors.bgPrimary }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: theme.colors.primary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {category.replace(/_/g, " & ").replace("AND", "&")}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {(services as string[]).map((svc, i) => (
                              <span key={i} style={{
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 500,
                                background: theme.colors.primaryBg,
                                color: theme.colors.primary,
                              }}>
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Budget & Timeline */}
              {(extractedData.budgetHints || extractedData.timeline) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {extractedData.budgetHints && (
                    <div style={{
                      background: theme.colors.bgSecondary,
                      borderRadius: 14,
                      border: `1px solid ${theme.colors.borderLight}`,
                      padding: 20,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 6 }}>Budget Hints</div>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{extractedData.budgetHints}</div>
                    </div>
                  )}
                  {extractedData.timeline && (
                    <div style={{
                      background: theme.colors.bgSecondary,
                      borderRadius: 14,
                      border: `1px solid ${theme.colors.borderLight}`,
                      padding: 20,
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 6 }}>Timeline</div>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{extractedData.timeline}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Continue Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={() => router.push(`/proposals/${createdProposalId}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 28px",
                    background: theme.gradients.primary,
                    color: "#fff",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: theme.shadows.button,
                    transition: "all 0.15s ease",
                    fontFamily: "inherit",
                  }}
                >
                  Continue to Proposal Builder {icons.arrowRight}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
