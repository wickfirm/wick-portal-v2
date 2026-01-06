"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { theme } from "@/lib/theme";

type OnboardingItem = {
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
  resourceUrl: string | null;
  resourceLabel: string | null;
};

const SERVICE_LABELS: Record<string, string> = {
  GENERAL: "General",
  SEO: "SEO",
  AEO: "AEO",
  PAID_MEDIA: "Paid Media",
  WEB_DEVELOPMENT: "Web Dev",
  SOCIAL_MEDIA: "Social",
  CONTENT: "Content",
};

export default function OnboardingManager({
  clientId,
  clientStatus,
  initialItems,
}: {
  clientId: string;
  clientStatus: string;
  initialItems: OnboardingItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<OnboardingItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ GENERAL: true });

  const groupedItems = items.reduce((acc: Record<string, OnboardingItem[]>, item) => {
    if (!acc[item.serviceType]) {
      acc[item.serviceType] = [];
    }
    acc[item.serviceType].push(item);
    return acc;
  }, {});

  const serviceTypes = Object.keys(groupedItems);
  const completed = items.filter((i) => i.isCompleted).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const toggleSection = (serviceType: string) => {
    setExpandedSections((prev) => ({ ...prev, [serviceType]: !prev[serviceType] }));
  };

  const toggleItem = async (item: OnboardingItem) => {
    setLoading(true);
    const res = await fetch("/api/clients/" + clientId + "/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, isCompleted: !item.isCompleted }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isCompleted: !i.isCompleted, completedAt: !i.isCompleted ? new Date().toISOString() : null } : i
        )
      );
      router.refresh();
    }
    setLoading(false);
  };

  if (total === 0) {
    return (
      <div style={{ background: theme.colors.bgSecondary, padding: 24, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, marginBottom: 16 }}>
          Onboarding
        </h3>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ color: theme.colors.textMuted, marginBottom: 16 }}>No onboarding items yet</p>
          <Link
            href={"/clients/" + clientId + "/onboarding"}
            style={{ display: "inline-block", padding: "10px 20px", background: theme.colors.primary, color: "white", borderRadius: theme.borderRadius.md, textDecoration: "none", fontWeight: 500, fontSize: 14 }}
          >
            Start Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: theme.colors.bgSecondary, borderRadius: theme.borderRadius.lg, border: "1px solid " + theme.colors.borderLight }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid " + theme.colors.borderLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
          Onboarding Checklist
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>{completed}/{total} ({pct}%)</span>
          <Link href={"/clients/" + clientId + "/onboarding"} style={{ padding: "6px 12px", background: theme.colors.bgTertiary, color: theme.colors.textSecondary, borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 500 }}>
            View All
          </Link>
        </div>
      </div>

      <div style={{ padding: "12px 20px", borderBottom: "1px solid " + theme.colors.borderLight }}>
        <div style={{ height: 6, background: theme.colors.bgTertiary, borderRadius: 3 }}>
          <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? theme.colors.success : theme.colors.primary, borderRadius: 3, transition: "width 300ms ease" }} />
        </div>
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {serviceTypes.map((serviceType) => {
          const sectionItems = groupedItems[serviceType];
          const sectionCompleted = sectionItems.filter((i) => i.isCompleted).length;
          const sectionTotal = sectionItems.length;
          const isExpanded = expandedSections[serviceType] ?? false;

          return (
            <div key={serviceType}>
              <div
                onClick={() => toggleSection(serviceType)}
                style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: theme.colors.bgPrimary, borderBottom: "1px solid " + theme.colors.bgTertiary }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms", fontSize: 10 }}>▶</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{SERVICE_LABELS[serviceType] || serviceType}</span>
                </div>
                <span style={{ fontSize: 12, color: sectionCompleted === sectionTotal ? theme.colors.success : theme.colors.textMuted }}>{sectionCompleted}/{sectionTotal}</span>
              </div>

              {isExpanded && (
                <div>
                  {sectionItems.map((item, idx) => (
                    <ItemRow key={item.id} item={item} clientId={clientId} isLast={idx === sectionItems.length - 1} loading={loading} onToggle={() => toggleItem(item)} onUpdate={() => router.refresh()} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemRow({ item, clientId, isLast, loading, onToggle, onUpdate }: { item: OnboardingItem; clientId: string; isLast: boolean; loading: boolean; onToggle: () => void; onUpdate: () => void }) {
  const [inputValue, setInputValue] = useState(item.inputValue || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState(item.resourceUrl || "");
  const [linkLabel, setLinkLabel] = useState(item.resourceLabel || "");
  const [saving, setSaving] = useState(false);

  const saveField = async (updates: Record<string, string>) => {
    setSaving(true);
    await fetch("/api/clients/" + clientId + "/onboarding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, ...updates }),
    });
    setSaving(false);
    onUpdate();
  };

  const handleInputBlur = () => {
    if (inputValue !== (item.inputValue || "")) {
      saveField({ inputValue });
    }
  };

  const handleNotesBlur = () => {
    if (notes !== (item.notes || "")) {
      saveField({ notes });
    }
  };

  const handleSaveLink = () => {
    saveField({ resourceUrl: linkUrl, resourceLabel: linkLabel });
    setShowLinkForm(false);
  };

  const handleRemoveLink = () => {
    setLinkUrl("");
    setLinkLabel("");
    saveField({ resourceUrl: "", resourceLabel: "" });
  };

  return (
    <div style={{ padding: "14px 20px", borderBottom: isLast ? "none" : "1px solid " + theme.colors.bgTertiary, background: item.isCompleted ? "rgba(16, 185, 129, 0.02)" : "transparent" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          onClick={onToggle}
          style={{ width: 20, height: 20, borderRadius: 5, border: item.isCompleted ? "none" : "2px solid " + theme.colors.borderLight, background: item.isCompleted ? theme.colors.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "wait" : "pointer", flexShrink: 0, marginTop: 2 }}
        >
          {item.isCompleted && <span style={{ color: "white", fontSize: 11 }}>✓</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 500, fontSize: 14, textDecoration: item.isCompleted ? "line-through" : "none", color: item.isCompleted ? theme.colors.textSecondary : theme.colors.textPrimary }}>{item.name}</span>
            {item.isRequired && <span style={{ fontSize: 9, color: theme.colors.error, fontWeight: 600 }}>REQUIRED</span>}
            {item.itemType !== "CHECKBOX" && <span style={{ fontSize: 9, color: theme.colors.textMuted, background: theme.colors.bgTertiary, padding: "1px 5px", borderRadius: 3 }}>{item.itemType.replace("_", " ")}</span>}
          </div>

          {item.description && <p style={{ margin: "0 0 6px 0", fontSize: 12, color: theme.colors.textSecondary }}>{item.description}</p>}

          {(item.itemType === "TEXT_INPUT" || item.itemType === "URL_INPUT") && (
            <input
              type={item.itemType === "URL_INPUT" ? "url" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              placeholder={item.itemType === "URL_INPUT" ? "https://..." : "Enter details..."}
              style={{ width: "100%", padding: "6px 10px", border: "1px solid " + theme.colors.borderLight, borderRadius: 4, fontSize: 12, marginBottom: 6 }}
            />
          )}

          {item.resourceUrl && !showLinkForm && (
            <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <a href={item.resourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: theme.colors.primary }}>🔗 {item.resourceLabel || "Link"}</a>
              <button onClick={() => setShowLinkForm(true)} style={{ background: "none", border: "none", fontSize: 11, color: theme.colors.textMuted, cursor: "pointer" }}>Edit</button>
              <button onClick={handleRemoveLink} style={{ background: "none", border: "none", fontSize: 11, color: theme.colors.error, cursor: "pointer" }}>Remove</button>
            </div>
          )}

          {item.isCompleted && item.completedAt && (
            <div style={{ fontSize: 10, color: theme.colors.success, marginBottom: 4 }}>Completed {new Date(item.completedAt).toLocaleDateString()} by {item.completedBy}</div>
          )}

          {item.notes && !showNotes && <div style={{ fontSize: 11, color: theme.colors.textMuted, fontStyle: "italic", marginBottom: 4 }}>{item.notes}</div>}

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            {!item.resourceUrl && !showLinkForm && (
              <button onClick={() => setShowLinkForm(true)} style={{ background: "none", border: "none", padding: 0, fontSize: 11, color: theme.colors.textMuted, cursor: "pointer" }}>+ Add link</button>
            )}
            <button onClick={() => setShowNotes(!showNotes)} style={{ background: "none", border: "none", padding: 0, fontSize: 11, color: theme.colors.textMuted, cursor: "pointer" }}>
              {showNotes ? "Hide notes" : item.notes ? "Edit notes" : "+ Add notes"}
            </button>
          </div>

          {showLinkForm && (
            <div style={{ marginTop: 8, padding: 10, background: theme.colors.bgTertiary, borderRadius: 4 }}>
              <input type="text" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label (optional)" style={{ width: "100%", padding: "6px 10px", border: "1px solid " + theme.colors.borderLight, borderRadius: 4, fontSize: 12, marginBottom: 6 }} />
              <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: "6px 10px", border: "1px solid " + theme.colors.borderLight, borderRadius: 4, fontSize: 12, marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleSaveLink} disabled={saving} style={{ padding: "5px 10px", background: theme.colors.primary, color: "white", border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>{saving ? "..." : "Save"}</button>
                <button onClick={() => setShowLinkForm(false)} style={{ padding: "5px 10px", background: theme.colors.bgSecondary, color: theme.colors.textSecondary, border: "none", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {showNotes && (
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleNotesBlur} placeholder="Add notes..." style={{ width: "100%", marginTop: 8, padding: "6px 10px", border: "1px solid " + theme.colors.borderLight, borderRadius: 4, fontSize: 12, minHeight: 50, resize: "vertical" }} />
          )}
        </div>
      </div>
    </div>
  );
}
