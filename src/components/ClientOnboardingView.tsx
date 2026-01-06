"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

interface OnboardingItem {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  itemType: string;
  order: number;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  inputValue: string | null;
  fileUrl: string | null;
  notes: string | null;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  items: any[];
}

interface Progress {
  total: number;
  completed: number;
  percentage: number;
  requiredTotal: number;
  requiredCompleted: number;
  requiredPercentage: number;
}

interface ClientOnboardingViewProps {
  client: {
    id: string;
    name: string;
    status: string;
  };
  groupedItems: Record<string, OnboardingItem[]>;
  progress: Progress;
  templates: Template[];
  hasItems: boolean;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General Setup",
  SEO: "SEO",
  AEO: "AEO (AI Engine Optimization)",
  PAID_MEDIA: "Paid Media",
  WEB_DEVELOPMENT: "Web Development",
  SOCIAL_MEDIA: "Social Media",
  CONTENT: "Content Marketing",
  BRANDING: "Branding",
  CONSULTING: "Consulting",
};

const SERVICE_TYPE_ICONS: Record<string, string> = {
  GENERAL: "⚙️",
  SEO: "🔍",
  AEO: "🤖",
  PAID_MEDIA: "📢",
  WEB_DEVELOPMENT: "💻",
  SOCIAL_MEDIA: "📱",
  CONTENT: "✍️",
  BRANDING: "🎨",
  CONSULTING: "💼",
};

export default function ClientOnboardingView({
  client,
  groupedItems,
  progress,
  templates,
  hasItems,
}: ClientOnboardingViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ GENERAL: true });
  const [savingItem, setSavingItem] = useState<string | null>(null);

  const serviceTypes = Object.keys(groupedItems);

  const toggleSection = (serviceType: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [serviceType]: !prev[serviceType],
    }));
  };

  const toggleService = (serviceType: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceType)
        ? prev.filter((s) => s !== serviceType)
        : [...prev, serviceType]
    );
  };

  const initializeOnboarding = async () => {
    if (selectedServices.length === 0) {
      alert("Please select at least one service");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceTypes: selectedServices }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to initialize onboarding");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (
    itemId: string,
    updates: { isCompleted?: boolean; inputValue?: string; notes?: string }
  ) => {
    setSavingItem(itemId);
    try {
      const res = await fetch(`/api/clients/${client.id}/onboarding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, ...updates }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingItem(null);
    }
  };

  // If no items yet, show service selection
  if (!hasItems) {
    const availableServices = templates
      .filter((t) => t.serviceType !== "GENERAL" && t.items.length > 0)
      .map((t) => t.serviceType);

    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <Link
            href={`/clients/${client.id}`}
            style={{ color: theme.colors.textSecondary, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}
          >
            ← Back to {client.name}
          </Link>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Start Onboarding</h1>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
              Select the services you'll be providing to {client.name}
            </p>
          </div>

          <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, padding: 32, border: "1px solid " + theme.colors.borderLight }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 0, marginBottom: 24 }}>
              Select Services
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
              {availableServices.map((serviceType) => {
                const template = templates.find((t) => t.serviceType === serviceType);
                const isSelected = selectedServices.includes(serviceType);
                return (
                  <div
                    key={serviceType}
                    onClick={() => toggleService(serviceType)}
                    style={{
                      padding: 20,
                      borderRadius: theme.borderRadius.md,
                      border: isSelected ? "2px solid " + theme.colors.primary : "1px solid " + theme.colors.borderLight,
                      background: isSelected ? theme.colors.primaryBg : theme.colors.bgPrimary,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{SERVICE_TYPE_ICONS[serviceType] || "📋"}</span>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{SERVICE_TYPE_LABELS[serviceType] || serviceType}</span>
                      {isSelected && (
                        <span style={{ marginLeft: "auto", color: theme.colors.primary, fontWeight: 600 }}>✓</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary }}>
                      {template?.description || `${template?.items.length || 0} checklist items`}
                    </p>
                    <div style={{ marginTop: 8, fontSize: 12, color: theme.colors.textMuted }}>
                      {template?.items.length || 0} items · {template?.items.filter((i: any) => i.isRequired).length || 0} required
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid " + theme.colors.borderLight }}>
              <div style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
              </div>
              <button
                onClick={initializeOnboarding}
                disabled={loading || selectedServices.length === 0}
                style={{
                  padding: "12px 24px",
                  background: selectedServices.length === 0 ? theme.colors.bgTertiary : theme.colors.primary,
                  color: selectedServices.length === 0 ? theme.colors.textMuted : "white",
                  border: "none",
                  borderRadius: theme.borderRadius.md,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: selectedServices.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Setting up..." : "Start Onboarding"}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show onboarding checklist
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <Link
          href={`/clients/${client.id}`}
          style={{ color: theme.colors.textSecondary, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}
        >
          ← Back to {client.name}
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Onboarding Checklist</h1>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
              Complete these items to fully onboard {client.name}
            </p>
          </div>
          <div style={{ 
            padding: "8px 16px", 
            borderRadius: theme.borderRadius.md, 
            background: client.status === "ACTIVE" ? theme.colors.successBg : theme.colors.warningBg,
            color: client.status === "ACTIVE" ? theme.colors.success : theme.colors.warning,
            fontWeight: 500,
            fontSize: 13,
          }}>
            {client.status}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, padding: 24, marginBottom: 24, border: "1px solid " + theme.colors.borderLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary }}>{progress.percentage}%</span>
              <span style={{ color: theme.colors.textSecondary, marginLeft: 8 }}>Complete</span>
            </div>
            <div style={{ textAlign: "right", fontSize: 14, color: theme.colors.textSecondary }}>
              <div>{progress.completed} of {progress.total} items done</div>
              <div style={{ color: progress.requiredPercentage === 100 ? theme.colors.success : theme.colors.warning }}>
                {progress.requiredCompleted} of {progress.requiredTotal} required items
              </div>
            </div>
          </div>
          <div style={{ height: 8, background: theme.colors.bgTertiary, borderRadius: 4 }}>
            <div
              style={{
                height: "100%",
                width: progress.percentage + "%",
                background: progress.percentage === 100 ? theme.colors.success : theme.colors.primary,
                borderRadius: 4,
                transition: "width 300ms ease",
              }}
            />
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {serviceTypes.map((serviceType) => {
            const items = groupedItems[serviceType];
            const sectionCompleted = items.filter((i) => i.isCompleted).length;
            const sectionTotal = items.length;
            const isExpanded = expandedSections[serviceType] ?? false;

            return (
              <div
                key={serviceType}
                style={{
                  background: theme.colors.bgSecondary,
                  borderRadius: theme.borderRadius.lg,
                  border: "1px solid " + theme.colors.borderLight,
                  overflow: "hidden",
                }}
              >
                {/* Section Header */}
                <div
                  onClick={() => toggleSection(serviceType)}
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    background: sectionCompleted === sectionTotal ? theme.colors.successBg : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{SERVICE_TYPE_ICONS[serviceType] || "📋"}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {SERVICE_TYPE_LABELS[serviceType] || serviceType}
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                        {sectionCompleted} of {sectionTotal} completed
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {sectionCompleted === sectionTotal && (
                      <span style={{ color: theme.colors.success, fontWeight: 600, fontSize: 13 }}>✓ Complete</span>
                    )}
                    <span style={{ color: theme.colors.textMuted, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Section Items */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid " + theme.colors.borderLight }}>
                    {items.map((item, idx) => (
                      <OnboardingItemRow
                        key={item.id}
                        item={item}
                        isLast={idx === items.length - 1}
                        saving={savingItem === item.id}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

interface OnboardingItemRowProps {
  item: OnboardingItem;
  isLast: boolean;
  saving: boolean;
  onUpdate: (updates: { isCompleted?: boolean; inputValue?: string; notes?: string; resourceUrl?: string; resourceLabel?: string }) => void;
}

function OnboardingItemRow({ item, isLast, saving, onUpdate }: OnboardingItemRowProps) {
  const [inputValue, setInputValue] = useState(item.inputValue || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState(item.resourceUrl || "");
  const [linkLabel, setLinkLabel] = useState(item.resourceLabel || "");

  const handleCheckboxChange = () => {
    onUpdate({ isCompleted: !item.isCompleted });
  };

  const handleInputBlur = () => {
    if (inputValue !== (item.inputValue || "")) {
      onUpdate({ inputValue });
    }
  };

  const handleNotesBlur = () => {
    if (notes !== (item.notes || "")) {
      onUpdate({ notes });
    }
  };

  const handleSaveLink = () => {
    onUpdate({ resourceUrl: linkUrl, resourceLabel: linkLabel });
    setShowLinkForm(false);
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid " + theme.colors.bgTertiary,
        background: item.isCompleted ? "rgba(16, 185, 129, 0.03)" : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Checkbox */}
        <div
          onClick={handleCheckboxChange}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: item.isCompleted ? "none" : "2px solid " + theme.colors.borderLight,
            background: item.isCompleted ? theme.colors.success : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {item.isCompleted && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
          {saving && <span style={{ fontSize: 10 }}>...</span>}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontWeight: 500,
                textDecoration: item.isCompleted ? "line-through" : "none",
                color: item.isCompleted ? theme.colors.textSecondary : theme.colors.textPrimary,
              }}
            >
              {item.name}
            </span>
            {item.isRequired && (
              <span style={{ fontSize: 10, color: theme.colors.error, fontWeight: 600 }}>REQUIRED</span>
            )}
            {item.itemType !== "CHECKBOX" && (
              <span style={{ fontSize: 10, color: theme.colors.textMuted, background: theme.colors.bgTertiary, padding: "2px 6px", borderRadius: 4 }}>
                {item.itemType.replace("_", " ")}
              </span>
            )}
          </div>

          {item.description && (
            <p style={{ margin: "0 0 8px 0", fontSize: 13, color: theme.colors.textSecondary }}>
              {item.description}
            </p>
          )}

          {/* Input field for TEXT_INPUT or URL_INPUT */}
          {(item.itemType === "TEXT_INPUT" || item.itemType === "URL_INPUT") && (
            <input
              type={item.itemType === "URL_INPUT" ? "url" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              placeholder={item.itemType === "URL_INPUT" ? "https://..." : "Enter details..."}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "8px 12px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                fontSize: 13,
                marginBottom: 8,
              }}
            />
          )}

          {/* File upload placeholder */}
          {item.itemType === "FILE_UPLOAD" && (
            <div style={{ marginBottom: 8 }}>
              {item.fileUrl ? (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: theme.colors.primary }}>
                  View uploaded file →
                </a>
              ) : (
                <div style={{ fontSize: 13, color: theme.colors.textMuted, fontStyle: "italic" }}>
                  File upload via Resources page
                </div>
              )}
            </div>
          )}

          {/* Resource Link Display */}
          {item.resourceUrl && (
            <div style={{ marginBottom: 8 }}>
              <a 
                href={item.resourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ 
                  fontSize: 13, 
                  color: theme.colors.primary,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🔗 {item.resourceLabel || item.resourceUrl}
              </a>
            </div>
          )}

          {/* Completed info */}
          {item.isCompleted && item.completedAt && (
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
              Completed {new Date(item.completedAt).toLocaleDateString()} by {item.completedBy}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {/* Add Link */}
            {!showLinkForm && (
              <button
                onClick={() => setShowLinkForm(true)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  color: theme.colors.textMuted,
                  cursor: "pointer",
                }}
              >
                + Add link
              </button>
            )}

            {/* Notes toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 12,
                color: theme.colors.textMuted,
                cursor: "pointer",
              }}
            >
              {showNotes ? "Hide notes" : (item.notes ? "View notes" : "+ Add notes")}
            </button>
          </div>

          {/* Link Form */}
          {showLinkForm && (
            <div style={{ marginTop: 8, padding: 12, background: theme.colors.bgTertiary, borderRadius: theme.borderRadius.md }}>
              <div style={{ marginBottom: 8 }}>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Link label (optional)"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid " + theme.colors.borderLight,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid " + theme.colors.borderLight,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 13,
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleSaveLink}
                  style={{
                    padding: "6px 12px",
                    background: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Save Link
                </button>
                <button
                  onClick={() => setShowLinkForm(false)}
                  style={{
                    padding: "6px 12px",
                    background: theme.colors.bgSecondary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              style={{
                width: "100%",
                marginTop: 8,
                padding: "8px 12px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                fontSize: 13,
                minHeight: 60,
                resize: "vertical",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
