"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  notes: string | null;
}

interface Progress {
  total: number;
  completed: number;
  percentage: number;
  requiredTotal: number;
  requiredCompleted: number;
  requiredPercentage: number;
}

interface PortalOnboardingViewProps {
  client: {
    id: string;
    name: string;
    status: string;
  };
  groupedItems: Record<string, OnboardingItem[]>;
  progress: Progress;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "Getting Started",
  SEO: "SEO Setup",
  AEO: "AI Engine Optimization",
  PAID_MEDIA: "Paid Advertising",
  WEB_DEVELOPMENT: "Website Development",
  SOCIAL_MEDIA: "Social Media",
  CONTENT: "Content Marketing",
  BRANDING: "Branding",
  CONSULTING: "Consulting",
};

const SERVICE_TYPE_ICONS: Record<string, string> = {
  GENERAL: "🚀",
  SEO: "🔍",
  AEO: "🤖",
  PAID_MEDIA: "📢",
  WEB_DEVELOPMENT: "💻",
  SOCIAL_MEDIA: "📱",
  CONTENT: "✍️",
  BRANDING: "🎨",
  CONSULTING: "💼",
};

export default function PortalOnboardingView({
  client,
  groupedItems,
  progress,
}: PortalOnboardingViewProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ GENERAL: true });
  const [savingItem, setSavingItem] = useState<string | null>(null);

  const serviceTypes = Object.keys(groupedItems);

  const toggleSection = (serviceType: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [serviceType]: !prev[serviceType],
    }));
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

  if (progress.total === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No Onboarding Items Yet</h2>
        <p style={{ color: theme.colors.textSecondary }}>
          Your onboarding checklist will appear here once your account manager sets it up.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Welcome to The Wick Firm!</h1>
        <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
          Complete these items to help us get started on your projects.
        </p>
      </div>

      {/* Progress Card */}
      <div style={{
        background: progress.percentage === 100 ? theme.colors.successBg : theme.colors.primaryBg,
        borderRadius: theme.borderRadius.lg,
        padding: 24,
        marginBottom: 24,
        border: "1px solid " + (progress.percentage === 100 ? theme.colors.success : theme.colors.primary) + "33",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 }}>
              Onboarding Progress
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: progress.percentage === 100 ? theme.colors.success : theme.colors.primary }}>
              {progress.percentage}%
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>
              {progress.completed} of {progress.total} items complete
            </div>
            {progress.requiredTotal > 0 && (
              <div style={{ 
                fontSize: 13, 
                color: progress.requiredPercentage === 100 ? theme.colors.success : theme.colors.warning,
                marginTop: 4,
              }}>
                {progress.requiredCompleted} of {progress.requiredTotal} required items
              </div>
            )}
          </div>
        </div>
        
        <div style={{ height: 10, background: "rgba(255,255,255,0.5)", borderRadius: 5 }}>
          <div
            style={{
              height: "100%",
              width: progress.percentage + "%",
              background: progress.percentage === 100 ? theme.colors.success : theme.colors.primary,
              borderRadius: 5,
              transition: "width 500ms ease",
            }}
          />
        </div>

        {progress.percentage === 100 && (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: theme.colors.success }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <span style={{ fontWeight: 500 }}>All done! Thank you for completing your onboarding.</span>
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {serviceTypes.map((serviceType) => {
          const items = groupedItems[serviceType];
          const sectionCompleted = items.filter((i) => i.isCompleted).length;
          const sectionTotal = items.length;
          const isExpanded = expandedSections[serviceType] ?? false;
          const isComplete = sectionCompleted === sectionTotal;

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
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  background: isComplete ? "rgba(16, 185, 129, 0.05)" : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: isComplete ? theme.colors.successBg : theme.colors.primaryBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}>
                    {isComplete ? "✓" : SERVICE_TYPE_ICONS[serviceType] || "📋"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
                      {SERVICE_TYPE_LABELS[serviceType] || serviceType}
                    </div>
                    <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                      {sectionCompleted} of {sectionTotal} completed
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Mini progress bar */}
                  <div style={{ width: 100, height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
                    <div style={{
                      height: "100%",
                      width: (sectionCompleted / sectionTotal * 100) + "%",
                      background: isComplete ? theme.colors.success : theme.colors.primary,
                      borderRadius: 3,
                    }} />
                  </div>
                  <span style={{
                    color: theme.colors.textMuted,
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 200ms",
                    fontSize: 12,
                  }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Section Items */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid " + theme.colors.borderLight }}>
                  {items.map((item, idx) => (
                    <PortalOnboardingItemRow
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

      {/* Help Text */}
      <div style={{ marginTop: 32, padding: 24, background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 0, marginBottom: 8 }}>Need Help?</h3>
        <p style={{ margin: 0, fontSize: 14, color: theme.colors.textSecondary }}>
          If you have questions about any of these items or need assistance, please reach out to your account manager. 
          We're here to help make this process as smooth as possible!
        </p>
      </div>
    </div>
  );
}

interface PortalOnboardingItemRowProps {
  item: OnboardingItem;
  isLast: boolean;
  saving: boolean;
  onUpdate: (updates: { isCompleted?: boolean; inputValue?: string; notes?: string }) => void;
}

function PortalOnboardingItemRow({ item, isLast, saving, onUpdate }: PortalOnboardingItemRowProps) {
  const [inputValue, setInputValue] = useState(item.inputValue || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [showNotes, setShowNotes] = useState(false);

  const handleCheckboxChange = () => {
    // For items that need input, don't allow completion without value
    if (!item.isCompleted && (item.itemType === "TEXT_INPUT" || item.itemType === "URL_INPUT") && !inputValue.trim()) {
      alert("Please fill in the required information first");
      return;
    }
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

  return (
    <div
      style={{
        padding: "20px 24px",
        borderBottom: isLast ? "none" : "1px solid " + theme.colors.bgTertiary,
        background: item.isCompleted ? "rgba(16, 185, 129, 0.02)" : "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Checkbox */}
        <div
          onClick={handleCheckboxChange}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: item.isCompleted ? "none" : "2px solid " + theme.colors.borderLight,
            background: item.isCompleted ? theme.colors.success : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            marginTop: 2,
            transition: "all 150ms ease",
          }}
        >
          {item.isCompleted && <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>✓</span>}
          {saving && <span style={{ fontSize: 10 }}>...</span>}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                fontWeight: 500,
                fontSize: 15,
                textDecoration: item.isCompleted ? "line-through" : "none",
                color: item.isCompleted ? theme.colors.textSecondary : theme.colors.textPrimary,
              }}
            >
              {item.name}
            </span>
            {item.isRequired && (
              <span style={{
                fontSize: 10,
                color: "white",
                background: theme.colors.error,
                padding: "2px 6px",
                borderRadius: 4,
                fontWeight: 600,
              }}>
                REQUIRED
              </span>
            )}
          </div>

          {item.description && (
            <p style={{ margin: "0 0 12px 0", fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
              {item.description}
            </p>
          )}

          {/* Input field for TEXT_INPUT or URL_INPUT */}
          {(item.itemType === "TEXT_INPUT" || item.itemType === "URL_INPUT") && !item.isCompleted && (
            <input
              type={item.itemType === "URL_INPUT" ? "url" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              placeholder={item.itemType === "URL_INPUT" ? "https://..." : "Enter your response..."}
              style={{
                width: "100%",
                maxWidth: 500,
                padding: "12px 16px",
                border: "1px solid " + theme.colors.borderLight,
                borderRadius: theme.borderRadius.md,
                fontSize: 14,
                marginBottom: 8,
              }}
            />
          )}

          {/* Show input value when completed */}
          {(item.itemType === "TEXT_INPUT" || item.itemType === "URL_INPUT") && item.isCompleted && item.inputValue && (
            <div style={{
              padding: "12px 16px",
              background: theme.colors.bgTertiary,
              borderRadius: theme.borderRadius.md,
              fontSize: 14,
              color: theme.colors.textSecondary,
              marginBottom: 8,
            }}>
              {item.inputValue}
            </div>
          )}

          {/* File upload info */}
          {item.itemType === "FILE_UPLOAD" && (
            <div style={{
              padding: "12px 16px",
              background: theme.colors.infoBg,
              borderRadius: theme.borderRadius.md,
              fontSize: 13,
              color: theme.colors.info,
              marginBottom: 8,
            }}>
              📎 Please send files to your account manager or upload via the Resources page
            </div>
          )}

          {/* Completed info */}
          {item.isCompleted && item.completedAt && (
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 8 }}>
              ✓ Completed on {new Date(item.completedAt).toLocaleDateString()}
            </div>
          )}

          {/* Notes toggle */}
          {!item.isCompleted && (
            <>
              <button
                onClick={() => setShowNotes(!showNotes)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 13,
                  color: theme.colors.primary,
                  cursor: "pointer",
                  marginTop: 8,
                }}
              >
                {showNotes ? "Hide notes" : "+ Add a note"}
              </button>

              {showNotes && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add any notes or questions for your account manager..."
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "12px 16px",
                    border: "1px solid " + theme.colors.borderLight,
                    borderRadius: theme.borderRadius.md,
                    fontSize: 14,
                    minHeight: 80,
                    resize: "vertical",
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
