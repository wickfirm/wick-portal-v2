"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { theme } from "@/lib/theme";

// ─── Service categories ──────────────────────────────────────────
const SERVICE_CATEGORIES = [
  { value: "BUILD_AND_FILL", label: "Build & Fill", color: "#76527c" },
  { value: "PLAN_AND_PROMOTE", label: "Plan & Promote", color: "#3b82f6" },
  { value: "CAPTURE_AND_STORE", label: "Capture & Store", color: "#f59e0b" },
  { value: "TAILOR_AND_AUTOMATE", label: "Tailor & Automate", color: "#10b981" },
  { value: "CUSTOM", label: "Custom", color: "#6b7280" },
];

const ITEM_TYPES = [
  { value: "SERVICE", label: "Service" },
  { value: "DELIVERABLE", label: "Deliverable" },
  { value: "PACKAGE", label: "Package" },
  { value: "ADD_ON", label: "Add-On" },
  { value: "CUSTOM", label: "Custom" },
];

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: theme.colors.bgTertiary, color: theme.colors.textSecondary, label: "Draft" },
  SENT: { bg: theme.colors.infoBg, color: theme.colors.info, label: "Sent" },
  VIEWED: { bg: "#e0f2fe", color: "#0284c7", label: "Viewed" },
  NEGOTIATING: { bg: theme.colors.warningBg, color: theme.colors.warning, label: "Negotiating" },
  ACCEPTED: { bg: theme.colors.successBg, color: theme.colors.success, label: "Accepted" },
  DECLINED: { bg: theme.colors.errorBg, color: theme.colors.error, label: "Declined" },
  EXPIRED: { bg: theme.colors.bgTertiary, color: theme.colors.textMuted, label: "Expired" },
};

type ProposalItem = {
  id: string;
  type: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
  subcategory?: string;
  order: number;
  quantity: number;
  unitPrice: number;
  total: number;
  estimatedHours?: number;
  timeline?: string;
  isRecurring: boolean;
  frequency?: string;
  isOptional: boolean;
  isSelected: boolean;
};

type Proposal = {
  id: string;
  title: string;
  projectType: string;
  status: string;
  currency: string;
  language: string;
  version: number;
  briefContent?: string;
  extractedData?: any;
  sections?: any[];
  subtotal: number;
  total: number;
  taxRate?: number;
  taxAmount?: number;
  discountType?: string;
  discountValue?: number;
  startupPrice?: number;
  startupMonths?: number;
  ongoingPrice?: number;
  paymentTerms?: any;
  paymentSchedule?: string;
  publicToken?: string;
  password?: string;
  viewCount: number;
  sentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: ProposalItem[];
  comments: any[];
  activities: any[];
  client: {
    id: string;
    name: string;
    nickname?: string;
    email?: string;
    phone?: string;
    company?: string;
    industry?: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
};

export default function ProposalBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { status } = useSession();
  const queryClient = useQueryClient();

  // UI state
  const [activeTab, setActiveTab] = useState<"items" | "sections" | "settings" | "activity">("items");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<ProposalItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendPassword, setSendPassword] = useState("");
  const [sendExpiry, setSendExpiry] = useState("30");
  const [isSending, setIsSending] = useState(false);
  const [sentUrl, setSentUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  const [isGeneratingScope, setIsGeneratingScope] = useState(false);
  const [deliverablesInitialized, setDeliverablesInitialized] = useState(false);

  // New item form state
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "BUILD_AND_FILL",
    subcategory: "",
    type: "SERVICE",
    quantity: 1,
    unitPrice: 0,
    isRecurring: false,
    frequency: "MONTHLY",
    isOptional: false,
    timeline: "",
    estimatedHours: 0,
  });

  // Pricing settings state
  const [discountType, setDiscountType] = useState<string>("");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [startupPrice, setStartupPrice] = useState<number>(0);
  const [startupMonths, setStartupMonths] = useState<number>(3);
  const [ongoingPrice, setOngoingPrice] = useState<number>(0);

  // Fetch proposal
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${id}`);
      if (!res.ok) throw new Error("Failed to fetch proposal");
      return res.json();
    },
    enabled: status === "authenticated" && !!id,
    staleTime: 2 * 60 * 1000,
  });

  const proposal: Proposal | null = data?.proposal || null;

  // Initialize pricing state from proposal
  useEffect(() => {
    if (proposal) {
      setDiscountType(proposal.discountType || "");
      setDiscountValue(proposal.discountValue || 0);
      setTaxRate(proposal.taxRate || 0);
      setStartupPrice(proposal.startupPrice || 0);
      setStartupMonths(proposal.startupMonths || 3);
      setOngoingPrice(proposal.ongoingPrice || 0);
    }
  }, [proposal]);

  // Initialize deliverables selection — none selected by default so user picks
  useEffect(() => {
    if (proposal?.extractedData?.deliverables && !deliverablesInitialized) {
      // Don't pre-select any — let user choose their scope
      setDeliverablesInitialized(true);
    }
  }, [proposal, deliverablesInitialized]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleAddItem = useCallback(async () => {
    if (!newItem.name.trim() || newItem.unitPrice <= 0) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/proposals/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            name: newItem.name,
            description: newItem.description || null,
            category: newItem.category,
            subcategory: newItem.subcategory || null,
            type: newItem.type,
            quantity: newItem.quantity,
            unitPrice: newItem.unitPrice,
            isRecurring: newItem.isRecurring,
            frequency: newItem.isRecurring ? newItem.frequency : null,
            isOptional: newItem.isOptional,
            timeline: newItem.timeline || null,
            estimatedHours: newItem.estimatedHours || null,
          }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add item");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      setShowAddItem(false);
      setNewItem({
        name: "", description: "", category: "BUILD_AND_FILL",
        subcategory: "", type: "SERVICE", quantity: 1, unitPrice: 0,
        isRecurring: false, frequency: "MONTHLY", isOptional: false,
        timeline: "", estimatedHours: 0,
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }, [id, newItem, queryClient]);

  const handleToggleItem = useCallback(async (item: ProposalItem) => {
    try {
      await fetch(`/api/proposals/${id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ ...item, isSelected: !item.isSelected }],
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
    } catch (err) {
      console.error(err);
    }
  }, [id, queryClient]);

  const handleSaveItem = useCallback(async (updatedItem: ProposalItem) => {
    setIsSaving(true);
    try {
      await fetch(`/api/proposals/${id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            id: updatedItem.id,
            name: updatedItem.name,
            description: updatedItem.description,
            category: updatedItem.category,
            subcategory: updatedItem.subcategory,
            type: updatedItem.type,
            quantity: updatedItem.quantity,
            unitPrice: updatedItem.unitPrice,
            isRecurring: updatedItem.isRecurring,
            frequency: updatedItem.frequency,
            isOptional: updatedItem.isOptional,
            isSelected: updatedItem.isSelected,
            timeline: updatedItem.timeline,
            estimatedHours: updatedItem.estimatedHours,
            order: updatedItem.order,
          }],
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      setEditingItemId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save item");
    } finally {
      setIsSaving(false);
    }
  }, [id, queryClient]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!confirm("Remove this item from the proposal?")) return;
    try {
      const res = await fetch(`/api/proposals/${id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        // Fallback: if delete endpoint doesn't exist yet, just deselect
        console.warn("Delete endpoint not available");
      }
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
    } catch (err) {
      console.error(err);
    }
  }, [id, queryClient]);

  const handleAnalyzeBrief = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/proposals/${id}/analyze-brief`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to analyze brief");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      setActiveTab("sections");
    } catch (err) {
      console.error(err);
      alert("Something went wrong analyzing the brief");
    } finally {
      setIsAnalyzing(false);
    }
  }, [id, queryClient]);

  const handleGenerateScope = useCallback(async () => {
    if (selectedDeliverables.length === 0) {
      alert("Please select at least one deliverable to include in your scope");
      return;
    }
    setIsGeneratingScope(true);
    try {
      const deliverables = proposal?.extractedData?.deliverables || [];
      const selected = deliverables.filter((d: any) => selectedDeliverables.includes(d.id));

      // Create line items from selected deliverables
      const items = selected.map((d: any) => ({
        name: d.name,
        description: d.description,
        category: d.category || "CUSTOM",
        type: "SERVICE",
        quantity: 1,
        unitPrice: 0, // User will fill in pricing
        isRecurring: false,
        isOptional: false,
        isSelected: true,
      }));

      const res = await fetch(`/api/proposals/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create items");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      setActiveTab("items"); // Switch to items tab to price them
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsGeneratingScope(false);
    }
  }, [id, selectedDeliverables, proposal, queryClient]);

  const handleUpdatePricing = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/proposals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountType: discountType || null,
          discountValue: discountValue || null,
          taxRate: taxRate || null,
          startupPrice: startupPrice || null,
          startupMonths: startupMonths || null,
          ongoingPrice: ongoingPrice || null,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [id, discountType, discountValue, taxRate, startupPrice, startupMonths, ongoingPrice, queryClient]);

  const handleSend = useCallback(async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/proposals/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: sendPassword || null,
          expiresInDays: parseInt(sendExpiry) || 30,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to send proposal");
        return;
      }

      const { publicUrl } = await res.json();
      setSentUrl(publicUrl);
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSending(false);
    }
  }, [id, sendPassword, sendExpiry, queryClient]);

  // ─── Derived data ──────────────────────────────────────────────
  const selectedItems = proposal?.items.filter((i) => i.isSelected) || [];
  const optionalItems = proposal?.items.filter((i) => i.isOptional) || [];
  const clientSubtotal = selectedItems.reduce((sum, i) => sum + i.total, 0);

  // Group items by category
  const itemsByCategory: Record<string, ProposalItem[]> = {};
  (proposal?.items || []).forEach((item) => {
    const cat = item.category || "CUSTOM";
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  });

  const formatCurrency = (amount: number) => {
    const c = proposal?.currency || "AED";
    return `${c} ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // ─── Styles ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${theme.colors.borderLight}`,
    fontSize: 13,
    color: theme.colors.textPrimary,
    background: theme.colors.bgSecondary,
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  };

  const cardStyle: React.CSSProperties = {
    background: theme.colors.bgSecondary,
    borderRadius: 14,
    border: `1px solid ${theme.colors.borderLight}`,
    padding: 20,
  };

  // ─── Loading / Error ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `3px solid ${theme.colors.borderLight}`,
            borderTopColor: theme.colors.primary,
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 14, color: theme.colors.textSecondary }}>Loading proposal...</div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 8 }}>
            Proposal not found
          </div>
          <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20 }}>
            This proposal may have been deleted or you don't have access.
          </div>
          <button
            onClick={() => router.push("/proposals")}
            style={{
              padding: "10px 24px", borderRadius: 10,
              background: theme.gradients.primary, color: "#fff",
              border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[proposal.status] || STATUS_MAP.DRAFT;
  const isDraft = proposal.status === "DRAFT";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ─── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13, color: theme.colors.textMuted }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/proposals")}>Proposals</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ color: theme.colors.textPrimary, fontWeight: 500 }}>{proposal.title}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                {proposal.title}
              </h1>
              <span style={{
                padding: "3px 12px", borderRadius: 20,
                fontSize: 12, fontWeight: 600,
                background: statusInfo.bg, color: statusInfo.color,
              }}>
                {statusInfo.label}
              </span>
              <span style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                background: theme.colors.bgTertiary, color: theme.colors.textMuted,
              }}>
                v{proposal.version}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: theme.colors.textSecondary }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: theme.colors.primaryBg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: theme.colors.primary,
                }}>
                  {proposal.client.name.charAt(0).toUpperCase()}
                </div>
                {proposal.client.nickname || proposal.client.name}
              </div>
              <span>·</span>
              <span>{proposal.projectType?.replace(/_/g, " ")}</span>
              <span>·</span>
              <span>{proposal.currency}</span>
              {proposal.viewCount > 0 && (
                <>
                  <span>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    {proposal.viewCount} views
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {isDraft && (
              <button
                onClick={() => setShowSendModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 20px", borderRadius: 10,
                  background: theme.gradients.primary, color: "#fff",
                  border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  boxShadow: theme.shadows.button, fontFamily: "inherit",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send Proposal
              </button>
            )}
            {proposal.publicToken && proposal.status !== "DRAFT" && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/p/${proposal.publicToken}`;
                  navigator.clipboard.writeText(url);
                  alert("Public link copied to clipboard!");
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 10,
                  background: "transparent", color: theme.colors.primary,
                  border: `1px solid ${theme.colors.primary}`,
                  fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Copy Link
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Layout: Content + Sidebar ──────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* ─── Left: Main Content ──────────────────────────── */}
        <div>
          {/* Tab Navigation */}
          <div style={{
            display: "flex", gap: 0, marginBottom: 20,
            borderBottom: `1px solid ${theme.colors.borderLight}`,
          }}>
            {([
              { key: "items", label: "Line Items", icon: "list" },
              { key: "sections", label: "Sections", icon: "layout" },
              { key: "settings", label: "Settings", icon: "settings" },
              { key: "activity", label: "Activity", icon: "clock" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 20px",
                  fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? theme.colors.primary : theme.colors.textSecondary,
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: `2px solid ${activeTab === tab.key ? theme.colors.primary : "transparent"}`,
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── Tab: Line Items ─────────────────────────── */}
          {activeTab === "items" && (
            <div>
              {/* Add Item Button */}
              {isDraft && (
                <div style={{ marginBottom: 16 }}>
                  {!showAddItem ? (
                    <button
                      onClick={() => setShowAddItem(true)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "10px 20px", borderRadius: 10,
                        border: `1px dashed ${theme.colors.borderMedium}`,
                        background: "transparent", color: theme.colors.primary,
                        fontWeight: 600, fontSize: 13, cursor: "pointer",
                        width: "100%", justifyContent: "center",
                        transition: "all 0.15s ease", fontFamily: "inherit",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Line Item
                    </button>
                  ) : (
                    /* Add Item Form */
                    <div style={{ ...cardStyle, marginBottom: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 14 }}>
                        Add Line Item
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={labelStyle}>Name *</label>
                          <input
                            type="text" value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="e.g., Website Design & Development"
                            style={inputStyle} autoFocus
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Category</label>
                          <select
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            {SERVICE_CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>Description</label>
                        <textarea
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          placeholder="What's included in this service..."
                          rows={2}
                          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={labelStyle}>Type</label>
                          <select
                            value={newItem.type}
                            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            {ITEM_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Qty</label>
                          <input
                            type="number" min="1" value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Unit Price ({proposal.currency})</label>
                          <input
                            type="number" min="0" step="50" value={newItem.unitPrice || ""}
                            onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                            placeholder="0"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Total</label>
                          <div style={{
                            padding: "8px 12px", borderRadius: 8,
                            background: theme.colors.bgTertiary, fontSize: 13,
                            fontWeight: 700, color: theme.colors.textPrimary,
                          }}>
                            {formatCurrency(newItem.quantity * newItem.unitPrice)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.colors.textSecondary, cursor: "pointer" }}>
                          <input
                            type="checkbox" checked={newItem.isRecurring}
                            onChange={(e) => setNewItem({ ...newItem, isRecurring: e.target.checked })}
                          />
                          Recurring
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.colors.textSecondary, cursor: "pointer" }}>
                          <input
                            type="checkbox" checked={newItem.isOptional}
                            onChange={(e) => setNewItem({ ...newItem, isOptional: e.target.checked })}
                          />
                          Optional (client can toggle)
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setShowAddItem(false)}
                          style={{
                            padding: "8px 16px", borderRadius: 8,
                            border: `1px solid ${theme.colors.borderLight}`,
                            background: "transparent", color: theme.colors.textSecondary,
                            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddItem}
                          disabled={!newItem.name.trim() || newItem.unitPrice <= 0 || isSaving}
                          style={{
                            padding: "8px 20px", borderRadius: 8,
                            border: "none",
                            background: (!newItem.name.trim() || newItem.unitPrice <= 0 || isSaving)
                              ? theme.colors.bgTertiary : theme.colors.primary,
                            color: (!newItem.name.trim() || newItem.unitPrice <= 0 || isSaving)
                              ? theme.colors.textMuted : "#fff",
                            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          {isSaving ? "Adding..." : "Add Item"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items List by Category */}
              {proposal.items.length === 0 ? (
                <div style={{ ...cardStyle, padding: 48, textAlign: "center" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
                    No line items yet
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
                    Add services, deliverables, and packages to build your proposal
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {SERVICE_CATEGORIES.map((cat) => {
                    const items = itemsByCategory[cat.value];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={cat.value}>
                        {/* Category Header */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8,
                          marginBottom: 8, padding: "0 4px",
                        }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: 3,
                            background: cat.color,
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: theme.colors.textPrimary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {cat.label}
                          </span>
                          <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
                            ({items.length} item{items.length > 1 ? "s" : ""})
                          </span>
                        </div>

                        {/* Items in this category */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {items.map((item) => {
                            const isEditing = editingItemId === item.id;
                            const ed = isEditing ? editingItemData : null;

                            return isEditing && ed ? (
                              /* ─── Edit Mode ─── */
                              <div
                                key={item.id}
                                style={{
                                  ...cardStyle,
                                  padding: "16px 18px",
                                  borderLeft: `3px solid ${cat.color}`,
                                  borderColor: theme.colors.primary,
                                }}
                              >
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                  <div>
                                    <label style={labelStyle}>Name</label>
                                    <input
                                      type="text" value={ed.name}
                                      onChange={(e) => setEditingItemData({ ...ed, name: e.target.value })}
                                      style={inputStyle} autoFocus
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Category</label>
                                    <select
                                      value={ed.category || "CUSTOM"}
                                      onChange={(e) => setEditingItemData({ ...ed, category: e.target.value })}
                                      style={{ ...inputStyle, cursor: "pointer" }}
                                    >
                                      {SERVICE_CATEGORIES.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                  <label style={labelStyle}>Description</label>
                                  <textarea
                                    value={ed.description || ""}
                                    onChange={(e) => setEditingItemData({ ...ed, description: e.target.value })}
                                    rows={2}
                                    style={{ ...inputStyle, resize: "vertical", minHeight: 50 }}
                                  />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                                  <div>
                                    <label style={labelStyle}>Qty</label>
                                    <input
                                      type="number" min="1" value={ed.quantity}
                                      onChange={(e) => setEditingItemData({ ...ed, quantity: Number(e.target.value) })}
                                      style={inputStyle}
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Unit Price ({proposal.currency})</label>
                                    <input
                                      type="number" min="0" step="50" value={ed.unitPrice || ""}
                                      onChange={(e) => setEditingItemData({ ...ed, unitPrice: Number(e.target.value) })}
                                      style={inputStyle}
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Timeline</label>
                                    <input
                                      type="text" value={ed.timeline || ""}
                                      onChange={(e) => setEditingItemData({ ...ed, timeline: e.target.value })}
                                      placeholder="e.g., 4 weeks"
                                      style={inputStyle}
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Total</label>
                                    <div style={{
                                      padding: "8px 12px", borderRadius: 8,
                                      background: theme.colors.bgTertiary, fontSize: 13,
                                      fontWeight: 700, color: theme.colors.textPrimary,
                                    }}>
                                      {formatCurrency(ed.quantity * ed.unitPrice)}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.colors.textSecondary, cursor: "pointer" }}>
                                    <input
                                      type="checkbox" checked={ed.isRecurring}
                                      onChange={(e) => setEditingItemData({ ...ed, isRecurring: e.target.checked })}
                                    />
                                    Recurring
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: theme.colors.textSecondary, cursor: "pointer" }}>
                                    <input
                                      type="checkbox" checked={ed.isOptional}
                                      onChange={(e) => setEditingItemData({ ...ed, isOptional: e.target.checked })}
                                    />
                                    Optional
                                  </label>
                                </div>
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => { setEditingItemId(null); setEditingItemData(null); }}
                                    style={{
                                      padding: "7px 16px", borderRadius: 8,
                                      border: `1px solid ${theme.colors.borderLight}`,
                                      background: "transparent", color: theme.colors.textSecondary,
                                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveItem(ed)}
                                    disabled={isSaving}
                                    style={{
                                      padding: "7px 18px", borderRadius: 8,
                                      border: "none",
                                      background: isSaving ? theme.colors.bgTertiary : theme.colors.primary,
                                      color: isSaving ? theme.colors.textMuted : "#fff",
                                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                    }}
                                  >
                                    {isSaving ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ─── View Mode ─── */
                              <div
                                key={item.id}
                                style={{
                                  ...cardStyle,
                                  padding: "14px 18px",
                                  opacity: item.isSelected ? 1 : 0.5,
                                  borderLeft: `3px solid ${cat.color}`,
                                  transition: "all 0.15s ease",
                                  cursor: isDraft ? "pointer" : "default",
                                }}
                                onClick={() => {
                                  if (isDraft && editingItemId !== item.id) {
                                    setEditingItemId(item.id);
                                    setEditingItemData({ ...item });
                                  }
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                      {/* Toggle checkbox */}
                                      {item.isOptional && isDraft && (
                                        <input
                                          type="checkbox"
                                          checked={item.isSelected}
                                          onChange={(e) => { e.stopPropagation(); handleToggleItem(item); }}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ cursor: "pointer" }}
                                        />
                                      )}
                                      <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
                                        {item.name}
                                      </span>
                                      {item.isRecurring && (
                                        <span style={{
                                          padding: "1px 8px", borderRadius: 10,
                                          fontSize: 10, fontWeight: 600,
                                          background: theme.colors.infoBg, color: theme.colors.info,
                                        }}>
                                          {item.frequency || "RECURRING"}
                                        </span>
                                      )}
                                      {item.isOptional && (
                                        <span style={{
                                          padding: "1px 8px", borderRadius: 10,
                                          fontSize: 10, fontWeight: 600,
                                          background: theme.colors.warningBg, color: theme.colors.warning,
                                        }}>
                                          OPTIONAL
                                        </span>
                                      )}
                                      <span style={{
                                        padding: "1px 8px", borderRadius: 10,
                                        fontSize: 10, fontWeight: 500,
                                        background: theme.colors.bgTertiary, color: theme.colors.textMuted,
                                      }}>
                                        {item.type}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4, lineHeight: 1.5 }}>
                                        {item.description}
                                      </div>
                                    )}
                                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: theme.colors.textMuted }}>
                                      <span>Qty: {item.quantity}</span>
                                      <span>@ {formatCurrency(item.unitPrice)}</span>
                                      {item.timeline && <span>Timeline: {item.timeline}</span>}
                                      {item.estimatedHours && <span>{item.estimatedHours}h estimated</span>}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    {item.unitPrice === 0 && isDraft && (
                                      <span style={{
                                        padding: "2px 8px", borderRadius: 6,
                                        fontSize: 10, fontWeight: 600,
                                        background: theme.colors.warningBg, color: theme.colors.warning,
                                      }}>
                                        NEEDS PRICING
                                      </span>
                                    )}
                                    <span style={{
                                      fontSize: 15, fontWeight: 700,
                                      color: item.unitPrice === 0 ? theme.colors.textMuted : item.isSelected ? theme.colors.textPrimary : theme.colors.textMuted,
                                    }}>
                                      {formatCurrency(item.total)}
                                    </span>
                                    {isDraft && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingItemId(item.id);
                                            setEditingItemData({ ...item });
                                          }}
                                          style={{
                                            background: "transparent", border: "none",
                                            color: theme.colors.textMuted, cursor: "pointer",
                                            padding: 4, display: "flex", alignItems: "center",
                                            borderRadius: 4,
                                          }}
                                          title="Edit item"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                          style={{
                                            background: "transparent", border: "none",
                                            color: theme.colors.textMuted, cursor: "pointer",
                                            padding: 4, display: "flex", alignItems: "center",
                                            borderRadius: 4,
                                          }}
                                          title="Remove item"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                          </svg>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Tab: Sections ───────────────────────────── */}
          {activeTab === "sections" && (
            <div>
              {/* Analyze / Re-analyze button */}
              {proposal.briefContent && (
                <div style={{
                  ...cardStyle, marginBottom: 16,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: isAnalyzing ? theme.colors.primaryBg : proposal.extractedData ? theme.colors.bgSecondary : theme.colors.primaryBg,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isAnalyzing ? (
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        border: `3px solid ${theme.colors.borderLight}`,
                        borderTopColor: theme.colors.primary,
                        animation: "spin 0.8s linear infinite",
                      }} />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: proposal.extractedData ? theme.colors.bgTertiary : theme.colors.primary,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: proposal.extractedData ? theme.colors.primary : "#fff",
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
                        {isAnalyzing ? "Analyzing brief with AI..." : proposal.extractedData ? "AI Analysis Available" : "Brief ready for AI analysis"}
                      </div>
                      <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                        {isAnalyzing
                          ? "Extracting requirements, scope, and service recommendations..."
                          : proposal.extractedData
                            ? "Requirements, scope, and services have been extracted from the brief"
                            : `${proposal.briefContent.split(/\s+/).filter(Boolean).length} words of brief content ready to analyze`}
                      </div>
                    </div>
                  </div>
                  {!isAnalyzing && (
                    <button
                      onClick={handleAnalyzeBrief}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 18px", borderRadius: 8,
                        background: proposal.extractedData ? "transparent" : theme.gradients.primary,
                        color: proposal.extractedData ? theme.colors.primary : "#fff",
                        border: proposal.extractedData ? `1px solid ${theme.colors.primary}` : "none",
                        fontWeight: 600, fontSize: 13, cursor: "pointer",
                        fontFamily: "inherit", flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {proposal.extractedData ? "Re-analyze" : "Analyze with AI"}
                    </button>
                  )}
                </div>
              )}

              {/* AI Brief Summary */}
              {proposal.extractedData && (
                <div style={{ ...cardStyle, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary }}>AI Brief Analysis</span>
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
                    {proposal.extractedData.summary}
                  </div>
                  {proposal.extractedData.requirements && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.textMuted, marginBottom: 6 }}>KEY REQUIREMENTS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {proposal.extractedData.requirements.map((req: string, i: number) => (
                          <span key={i} style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 12,
                            background: theme.colors.bgTertiary, color: theme.colors.textSecondary,
                          }}>
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Brief Content */}
              {proposal.briefContent && (
                <div style={{ ...cardStyle, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary }}>Client Brief</span>
                    <span style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      {proposal.briefContent.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.7,
                    maxHeight: 400, overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    padding: 14, borderRadius: 8,
                    background: theme.colors.bgPrimary,
                  }}>
                    {proposal.briefContent}
                  </div>
                </div>
              )}

              {/* Scope Selector — pick which deliverables you're responsible for */}
              {proposal.extractedData?.deliverables && proposal.extractedData.deliverables.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
                        Select Your Scope
                      </div>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                        The brief requests {proposal.extractedData.deliverables.length} deliverables — select the ones you&apos;re responsible for
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          const allIds = proposal.extractedData.deliverables.map((d: any) => d.id);
                          setSelectedDeliverables(selectedDeliverables.length === allIds.length ? [] : allIds);
                        }}
                        style={{
                          padding: "6px 14px", borderRadius: 6,
                          border: `1px solid ${theme.colors.borderLight}`,
                          background: "transparent", color: theme.colors.textSecondary,
                          fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        {selectedDeliverables.length === proposal.extractedData.deliverables.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                  </div>

                  {/* Group deliverables by category */}
                  {(() => {
                    const grouped: Record<string, any[]> = {};
                    proposal.extractedData.deliverables.forEach((d: any) => {
                      const cat = d.category || "CUSTOM";
                      if (!grouped[cat]) grouped[cat] = [];
                      grouped[cat].push(d);
                    });

                    return SERVICE_CATEGORIES.map((cat) => {
                      const items = grouped[cat.value];
                      if (!items || items.length === 0) return null;
                      return (
                        <div key={cat.value} style={{ marginBottom: 14 }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            marginBottom: 8,
                          }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.color }} />
                            <span style={{
                              fontSize: 11, fontWeight: 700, color: theme.colors.textMuted,
                              textTransform: "uppercase", letterSpacing: "0.5px",
                            }}>
                              {cat.label}
                            </span>
                            <button
                              onClick={() => {
                                const catIds = items.map((d: any) => d.id);
                                const allSelected = catIds.every((cid: string) => selectedDeliverables.includes(cid));
                                if (allSelected) {
                                  setSelectedDeliverables(selectedDeliverables.filter((sid) => !catIds.includes(sid)));
                                } else {
                                  setSelectedDeliverables([...new Set([...selectedDeliverables, ...catIds])]);
                                }
                              }}
                              style={{
                                padding: "2px 8px", borderRadius: 4,
                                border: `1px solid ${theme.colors.borderLight}`,
                                background: "transparent", color: theme.colors.textMuted,
                                fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                              }}
                            >
                              {items.every((d: any) => selectedDeliverables.includes(d.id)) ? "deselect" : "select all"}
                            </button>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {items.map((d: any) => {
                              const isSelected = selectedDeliverables.includes(d.id);
                              return (
                                <div
                                  key={d.id}
                                  onClick={() => {
                                    setSelectedDeliverables(
                                      isSelected
                                        ? selectedDeliverables.filter((sid) => sid !== d.id)
                                        : [...selectedDeliverables, d.id]
                                    );
                                  }}
                                  style={{
                                    display: "flex", alignItems: "flex-start", gap: 10,
                                    padding: "10px 14px", borderRadius: 10,
                                    border: `1.5px solid ${isSelected ? cat.color : theme.colors.borderLight}`,
                                    background: isSelected ? `${cat.color}08` : "transparent",
                                    cursor: "pointer", transition: "all 0.15s ease",
                                  }}
                                >
                                  {/* Checkbox */}
                                  <div style={{
                                    width: 20, height: 20, borderRadius: 5,
                                    border: `2px solid ${isSelected ? cat.color : theme.colors.borderMedium}`,
                                    background: isSelected ? cat.color : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, marginTop: 1,
                                    transition: "all 0.15s ease",
                                  }}>
                                    {isSelected && (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: 13, fontWeight: 600,
                                      color: isSelected ? theme.colors.textPrimary : theme.colors.textSecondary,
                                    }}>
                                      {d.name}
                                    </div>
                                    {d.description && (
                                      <div style={{
                                        fontSize: 12, color: theme.colors.textMuted,
                                        lineHeight: 1.4, marginTop: 2,
                                      }}>
                                        {d.description}
                                      </div>
                                    )}
                                  </div>
                                  {d.estimatedScope && (
                                    <span style={{
                                      padding: "2px 8px", borderRadius: 10,
                                      fontSize: 10, fontWeight: 600, flexShrink: 0,
                                      background: d.estimatedScope === "LARGE" ? theme.colors.errorBg
                                        : d.estimatedScope === "MEDIUM" ? theme.colors.warningBg
                                        : theme.colors.successBg,
                                      color: d.estimatedScope === "LARGE" ? theme.colors.error
                                        : d.estimatedScope === "MEDIUM" ? theme.colors.warning
                                        : theme.colors.success,
                                    }}>
                                      {d.estimatedScope}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Generate scope button */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginTop: 16, paddingTop: 16,
                    borderTop: `1px solid ${theme.colors.borderLight}`,
                  }}>
                    <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                      {selectedDeliverables.length} of {proposal.extractedData.deliverables.length} deliverables selected
                    </div>
                    <button
                      onClick={handleGenerateScope}
                      disabled={selectedDeliverables.length === 0 || isGeneratingScope}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "10px 22px", borderRadius: 10,
                        background: (selectedDeliverables.length === 0 || isGeneratingScope)
                          ? theme.colors.bgTertiary : theme.gradients.primary,
                        color: (selectedDeliverables.length === 0 || isGeneratingScope)
                          ? theme.colors.textMuted : "#fff",
                        border: "none", fontWeight: 600, fontSize: 13,
                        cursor: (selectedDeliverables.length === 0 || isGeneratingScope)
                          ? "not-allowed" : "pointer",
                        boxShadow: (selectedDeliverables.length === 0 || isGeneratingScope)
                          ? "none" : theme.shadows.button,
                        fontFamily: "inherit",
                      }}
                    >
                      {isGeneratingScope ? (
                        <>
                          <div style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: `2px solid rgba(255,255,255,0.3)`,
                            borderTopColor: "#fff",
                            animation: "spin 0.8s linear infinite",
                          }} />
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Add {selectedDeliverables.length} Items to Proposal
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* No deliverables — show placeholder */}
              {(!proposal.extractedData?.deliverables || proposal.extractedData.deliverables.length === 0) && (
                <div style={{ ...cardStyle }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary }}>Scope of Work</span>
                  </div>
                  <div style={{
                    padding: 40, textAlign: "center",
                    border: `1px dashed ${theme.colors.borderLight}`,
                    borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>
                      {proposal.briefContent
                        ? "Run AI analysis above to extract deliverables from the brief"
                        : "Add a brief first, then analyze it to extract deliverables"}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                      AI will identify all requested solutions so you can select what&apos;s in your scope
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab: Settings ───────────────────────────── */}
          {activeTab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Discount & Tax */}
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 14 }}>
                  Discount & Tax
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">None</option>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Discount Value</label>
                    <input
                      type="number" min="0"
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      placeholder={discountType === "PERCENTAGE" ? "e.g., 10" : "e.g., 500"}
                      style={inputStyle}
                      disabled={!discountType}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Rate (%)</label>
                    <input
                      type="number" min="0" max="100" step="0.5"
                      value={taxRate || ""}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      placeholder="e.g., 5"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Startup / Ongoing Pricing */}
              <div style={cardStyle}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 6 }}>
                  Tiered Pricing (Retainers)
                </div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 14 }}>
                  Set a startup price for the first X months, then switch to ongoing monthly rate
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Startup Price ({proposal.currency}/mo)</label>
                    <input
                      type="number" min="0" step="50"
                      value={startupPrice || ""}
                      onChange={(e) => setStartupPrice(Number(e.target.value))}
                      placeholder="e.g., 15750"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Startup Duration (months)</label>
                    <input
                      type="number" min="1" max="24"
                      value={startupMonths}
                      onChange={(e) => setStartupMonths(Number(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Ongoing Price ({proposal.currency}/mo)</label>
                    <input
                      type="number" min="0" step="50"
                      value={ongoingPrice || ""}
                      onChange={(e) => setOngoingPrice(Number(e.target.value))}
                      placeholder="e.g., 18750"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleUpdatePricing}
                  disabled={isSaving}
                  style={{
                    padding: "10px 24px", borderRadius: 10,
                    background: isSaving ? theme.colors.bgTertiary : theme.colors.primary,
                    color: isSaving ? theme.colors.textMuted : "#fff",
                    border: "none", fontWeight: 600, fontSize: 13,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {isSaving ? "Saving..." : "Save Pricing Settings"}
                </button>
              </div>
            </div>
          )}

          {/* ─── Tab: Activity ───────────────────────────── */}
          {activeTab === "activity" && (
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 16 }}>
                Activity Log
              </div>
              {proposal.activities.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: theme.colors.textMuted }}>
                  No activity recorded yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {proposal.activities.map((activity: any, idx: number) => (
                    <div
                      key={activity.id}
                      style={{
                        display: "flex", gap: 12, padding: "12px 0",
                        borderBottom: idx < proposal.activities.length - 1 ? `1px solid ${theme.colors.bgTertiary}` : "none",
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: activity.action === "SENT" ? theme.colors.infoBg
                          : activity.action === "VIEWED" ? "#e0f2fe"
                          : activity.action === "ACCEPTED" || activity.action === "SIGNED" ? theme.colors.successBg
                          : activity.action === "DECLINED" ? theme.colors.errorBg
                          : theme.colors.bgTertiary,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: activity.action === "SENT" ? theme.colors.info
                          : activity.action === "VIEWED" ? "#0284c7"
                          : activity.action === "ACCEPTED" || activity.action === "SIGNED" ? theme.colors.success
                          : activity.action === "DECLINED" ? theme.colors.error
                          : theme.colors.textMuted,
                      }}>
                        {activity.action === "SENT" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        )}
                        {activity.action === "VIEWED" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                        {(activity.action === "ACCEPTED" || activity.action === "SIGNED") && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                        {activity.action === "DECLINED" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        )}
                        {!["SENT", "VIEWED", "ACCEPTED", "SIGNED", "DECLINED"].includes(activity.action) && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: theme.colors.textPrimary }}>
                          {activity.action.replace(/_/g, " ")}
                        </div>
                        <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
                          {timeAgo(activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right: Pricing Sidebar ────────────────────── */}
        <div style={{ position: "sticky", top: 20 }}>
          {/* Pricing Summary */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 16 }}>
              Pricing Summary
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: theme.colors.textSecondary }}>Subtotal ({selectedItems.length} items)</span>
                <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{formatCurrency(proposal.subtotal)}</span>
              </div>

              {proposal.discountType && proposal.discountValue && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: theme.colors.success }}>
                    Discount ({proposal.discountType === "PERCENTAGE" ? `${proposal.discountValue}%` : formatCurrency(proposal.discountValue)})
                  </span>
                  <span style={{ fontWeight: 500, color: theme.colors.success }}>
                    -{proposal.discountType === "PERCENTAGE"
                      ? formatCurrency(proposal.subtotal * proposal.discountValue / 100)
                      : formatCurrency(proposal.discountValue)}
                  </span>
                </div>
              )}

              {proposal.taxRate && proposal.taxAmount ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: theme.colors.textSecondary }}>Tax ({proposal.taxRate}%)</span>
                  <span style={{ fontWeight: 500, color: theme.colors.textPrimary }}>+{formatCurrency(proposal.taxAmount)}</span>
                </div>
              ) : null}

              <div style={{
                display: "flex", justifyContent: "space-between",
                padding: "12px 0 0", marginTop: 4,
                borderTop: `1px solid ${theme.colors.borderLight}`,
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: theme.colors.textPrimary }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: theme.colors.primary }}>{formatCurrency(proposal.total)}</span>
              </div>
            </div>

            {/* Tiered pricing display */}
            {(proposal.startupPrice || proposal.ongoingPrice) && (
              <div style={{
                padding: 12, borderRadius: 10,
                background: theme.colors.primaryBg,
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.primary, marginBottom: 6, textTransform: "uppercase" }}>
                  Monthly Breakdown
                </div>
                {proposal.startupPrice && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: theme.colors.textSecondary }}>First {proposal.startupMonths || 3} months</span>
                    <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{formatCurrency(proposal.startupPrice)}/mo</span>
                  </div>
                )}
                {proposal.ongoingPrice && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: theme.colors.textSecondary }}>After</span>
                    <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{formatCurrency(proposal.ongoingPrice)}/mo</span>
                  </div>
                )}
              </div>
            )}

            {optionalItems.length > 0 && (
              <div style={{ fontSize: 12, color: theme.colors.textMuted, textAlign: "center" }}>
                {optionalItems.filter(i => !i.isSelected).length} optional item{optionalItems.filter(i => !i.isSelected).length !== 1 ? "s" : ""} not included
              </div>
            )}
          </div>

          {/* Client Info */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 12 }}>
              Client
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: theme.colors.primaryBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, color: theme.colors.primary,
              }}>
                {proposal.client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>
                  {proposal.client.nickname || proposal.client.name}
                </div>
                {proposal.client.company && (
                  <div style={{ fontSize: 12, color: theme.colors.textMuted }}>{proposal.client.company}</div>
                )}
              </div>
            </div>
            {proposal.client.email && (
              <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
                📧 {proposal.client.email}
              </div>
            )}
            {proposal.client.phone && (
              <div style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
                📱 {proposal.client.phone}
              </div>
            )}
            {proposal.client.industry && (
              <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                🏢 {proposal.client.industry}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ ...cardStyle }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 12 }}>
              Quick Info
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: theme.colors.textMuted }}>Created</span>
                <span style={{ color: theme.colors.textSecondary }}>{new Date(proposal.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: theme.colors.textMuted }}>Last updated</span>
                <span style={{ color: theme.colors.textSecondary }}>{timeAgo(proposal.updatedAt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: theme.colors.textMuted }}>Created by</span>
                <span style={{ color: theme.colors.textSecondary }}>{proposal.createdByUser?.name || "Unknown"}</span>
              </div>
              {proposal.sentAt && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: theme.colors.textMuted }}>Sent</span>
                  <span style={{ color: theme.colors.textSecondary }}>{new Date(proposal.sentAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Send Modal ──────────────────────────────────── */}
      {showSendModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
          onClick={() => { if (!isSending) { setShowSendModal(false); setSentUrl(""); } }}
        >
          <div
            style={{
              background: theme.colors.bgSecondary,
              borderRadius: 16, padding: 28, width: 440,
              boxShadow: theme.shadows.lg,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {sentUrl ? (
              /* Success state */
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: theme.colors.successBg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", color: theme.colors.success,
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 6 }}>
                  Proposal Sent!
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 }}>
                  Share this link with your client
                </div>
                <div style={{
                  padding: 12, borderRadius: 8,
                  background: theme.colors.bgPrimary,
                  fontSize: 13, color: theme.colors.primary,
                  wordBreak: "break-all", marginBottom: 16,
                  fontFamily: "monospace",
                }}>
                  {sentUrl}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sentUrl);
                      alert("Link copied!");
                    }}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      background: theme.colors.primary, color: "#fff",
                      border: "none", fontWeight: 600, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => { setShowSendModal(false); setSentUrl(""); }}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      background: "transparent", color: theme.colors.textSecondary,
                      border: `1px solid ${theme.colors.borderLight}`,
                      fontWeight: 500, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Send form */
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
                  Send Proposal
                </div>
                <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 20 }}>
                  Generate a public link to share with {proposal.client.nickname || proposal.client.name}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Password Protection (optional)</label>
                  <input
                    type="text"
                    value={sendPassword}
                    onChange={(e) => setSendPassword(e.target.value)}
                    placeholder="Leave empty for no password"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Link Expires In</label>
                  <select
                    value={sendExpiry}
                    onChange={(e) => setSendExpiry(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowSendModal(false)}
                    disabled={isSending}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      background: "transparent", color: theme.colors.textSecondary,
                      border: `1px solid ${theme.colors.borderLight}`,
                      fontWeight: 500, fontSize: 13,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      background: isSending ? theme.colors.bgTertiary : theme.gradients.primary,
                      color: isSending ? theme.colors.textMuted : "#fff",
                      border: "none", fontWeight: 600, fontSize: 13,
                      cursor: isSending ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {isSending ? "Sending..." : "Send Proposal"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
