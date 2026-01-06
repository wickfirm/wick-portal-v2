"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  itemType: string;
  isRequired: boolean;
  order: number;
  autoCreateTask: boolean;
  taskName: string | null;
  taskPriority: string | null;
};

type OnboardingTemplate = {
  id: string;
  name: string;
  description: string | null;
  serviceType: string;
  order: number;
  isActive: boolean;
  items: TemplateItem[];
};

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

const ITEM_TYPE_LABELS: Record<string, string> = {
  CHECKBOX: "Checkbox",
  TEXT_INPUT: "Text Input",
  URL_INPUT: "URL Input",
  FILE_UPLOAD: "File Upload",
};

export default function OnboardingSettingsPage() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/onboarding-templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  async function toggleActive(template: OnboardingTemplate) {
    await fetch("/api/onboarding-templates/" + template.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    fetchTemplates();
  }

  const toggleExpand = (id: string) => {
    setExpandedTemplates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: theme.colors.textSecondary }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/settings" style={{ color: theme.colors.textSecondary, textDecoration: "none", fontSize: 14 }}>
            ← Back to Settings
          </Link>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 8 }}>Onboarding Templates</h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: 0 }}>
            These templates define the onboarding checklists for each service type. When a client is onboarded, 
            items from the selected service templates are automatically added to their checklist.
          </p>
        </div>

        {/* Info Card */}
        <div style={{ 
          background: theme.colors.infoBg, 
          padding: 20, 
          borderRadius: theme.borderRadius.lg, 
          marginBottom: 24,
          border: "1px solid " + theme.colors.info + "33",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <div style={{ fontWeight: 600, color: theme.colors.info, marginBottom: 4 }}>How it works</div>
              <div style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
                When you start onboarding a client at <code style={{ background: theme.colors.bgTertiary, padding: "2px 6px", borderRadius: 4 }}>/clients/[id]/onboarding</code>, 
                you select which services they're signing up for. The system then creates a personalized checklist 
                using the <strong>General Setup</strong> items plus items from each selected service template.
              </div>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {templates.map((template) => {
            const isExpanded = expandedTemplates[template.id] ?? false;
            const requiredCount = template.items.filter(i => i.isRequired).length;
            const taskCount = template.items.filter(i => i.autoCreateTask).length;

            return (
              <div 
                key={template.id} 
                style={{ 
                  background: theme.colors.bgSecondary, 
                  borderRadius: theme.borderRadius.lg, 
                  border: "1px solid " + theme.colors.borderLight,
                  overflow: "hidden",
                  opacity: template.isActive ? 1 : 0.6,
                }}
              >
                {/* Template Header */}
                <div 
                  onClick={() => toggleExpand(template.id)}
                  style={{ 
                    padding: "20px 24px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 28 }}>{SERVICE_TYPE_ICONS[template.serviceType] || "📋"}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{template.name}</span>
                        <span style={{ 
                          fontSize: 11, 
                          padding: "2px 8px", 
                          borderRadius: 4,
                          background: theme.colors.bgTertiary,
                          color: theme.colors.textSecondary,
                        }}>
                          {template.serviceType}
                        </span>
                        {!template.isActive && (
                          <span style={{ 
                            fontSize: 11, 
                            padding: "2px 8px", 
                            borderRadius: 4,
                            background: theme.colors.warningBg,
                            color: theme.colors.warning,
                          }}>
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                        {template.items.length} items · {requiredCount} required · {taskCount} auto-create tasks
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActive(template); }}
                      style={{
                        padding: "6px 12px",
                        background: template.isActive ? theme.colors.successBg : theme.colors.bgTertiary,
                        color: template.isActive ? theme.colors.success : theme.colors.textSecondary,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </button>
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

                {/* Template Items */}
                {isExpanded && template.items.length > 0 && (
                  <div style={{ borderTop: "1px solid " + theme.colors.borderLight }}>
                    <div style={{ 
                      padding: "12px 24px", 
                      background: theme.colors.bgPrimary, 
                      borderBottom: "1px solid " + theme.colors.bgTertiary,
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 100px 120px",
                      gap: 16,
                      fontSize: 11,
                      fontWeight: 600,
                      color: theme.colors.textSecondary,
                      textTransform: "uppercase",
                    }}>
                      <span>Item</span>
                      <span>Type</span>
                      <span>Required</span>
                      <span>Auto Task</span>
                    </div>
                    {template.items.map((item, idx) => (
                      <div 
                        key={item.id} 
                        style={{ 
                          padding: "14px 24px",
                          borderBottom: idx < template.items.length - 1 ? "1px solid " + theme.colors.bgTertiary : "none",
                          display: "grid",
                          gridTemplateColumns: "1fr 100px 100px 120px",
                          gap: 16,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                          {item.description && (
                            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: 11, 
                          color: theme.colors.textSecondary,
                          background: theme.colors.bgTertiary,
                          padding: "3px 8px",
                          borderRadius: 4,
                          width: "fit-content",
                        }}>
                          {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                        </span>
                        <span style={{ 
                          fontSize: 12,
                          color: item.isRequired ? theme.colors.error : theme.colors.textMuted,
                          fontWeight: item.isRequired ? 600 : 400,
                        }}>
                          {item.isRequired ? "Yes" : "No"}
                        </span>
                        <div>
                          {item.autoCreateTask ? (
                            <div>
                              <div style={{ fontSize: 12, color: theme.colors.success }}>✓ Yes</div>
                              {item.taskName && (
                                <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                                  "{item.taskName}"
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: theme.colors.textMuted }}>No</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && template.items.length === 0 && (
                  <div style={{ 
                    padding: 32, 
                    textAlign: "center", 
                    color: theme.colors.textMuted,
                    borderTop: "1px solid " + theme.colors.borderLight,
                  }}>
                    No items in this template
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div style={{ 
            background: theme.colors.bgSecondary, 
            padding: 64, 
            borderRadius: theme.borderRadius.lg, 
            textAlign: "center",
            border: "1px solid " + theme.colors.borderLight,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No Templates Found</div>
            <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
              Run the SQL seed script to add default onboarding templates.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
