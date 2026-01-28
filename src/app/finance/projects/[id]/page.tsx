"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";

type ProjectProfitability = {
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
      nickname: string | null;
    };
  };
  hours: {
    total: number;
  };
  costs: {
    labor: number;
    expenses: number;
    total: number;
  };
  revenue: {
    labor: number;
    expenses: number;
    total: number;
  };
  profit: {
    amount: number;
    margin: number;
  };
};

type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor: string | null;
  isBillable: boolean;
  markupPercentage: number | null;
  invoiceNumber: string | null;
  notes: string | null;
};

const EXPENSE_CATEGORIES = [
  "OUTSOURCING",
  "SOFTWARE",
  "LICENSES",
  "HOSTING",
  "SUPPLIER",
  "MARKETING",
  "TRAVEL",
  "OTHER",
];

export default function ProjectFinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profitability, setProfitability] = useState<ProjectProfitability | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    category: "OUTSOURCING",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    isBillable: false,
    markupPercentage: "",
    invoiceNumber: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, projectId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load profitability
      const profitRes = await fetch(`/api/finance/project-profitability/${projectId}`);
      const profitData = await profitRes.json();
      setProfitability(profitData);

      // Load expenses
      const expensesRes = await fetch(`/api/projects/${projectId}/expenses`);
      const expensesData = await expensesRes.json();
      setExpenses(expensesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExpense() {
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
          markupPercentage: expenseForm.markupPercentage ? parseFloat(expenseForm.markupPercentage) : null,
        }),
      });

      if (res.ok) {
        setShowAddExpense(false);
        setExpenseForm({
          category: "OUTSOURCING",
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          vendor: "",
          isBillable: false,
          markupPercentage: "",
          invoiceNumber: "",
          notes: "",
        });
        loadData();
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  }

  async function handleUpdateExpense() {
    if (!editingExpense) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
          markupPercentage: expenseForm.markupPercentage ? parseFloat(expenseForm.markupPercentage) : null,
        }),
      });

      if (res.ok) {
        setEditingExpense(null);
        setExpenseForm({
          category: "OUTSOURCING",
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          vendor: "",
          isBillable: false,
          markupPercentage: "",
          invoiceNumber: "",
          notes: "",
        });
        loadData();
      }
    } catch (error) {
      console.error("Failed to update expense:", error);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date.split("T")[0],
      vendor: expense.vendor || "",
      isBillable: expense.isBillable,
      markupPercentage: expense.markupPercentage?.toString() || "",
      invoiceNumber: expense.invoiceNumber || "",
      notes: expense.notes || "",
    });
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
        <Header />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          {/* Back Button Skeleton */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: 180, height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
          </div>

          {/* Header Skeleton */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ width: 300, height: 32, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 200, height: 20, background: theme.colors.bgTertiary, borderRadius: 4 }} />
          </div>

          {/* Summary Cards Skeleton */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16, 
            marginBottom: 32 
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.borderRadius.lg,
                padding: 20,
                height: 100,
              }}>
                <div style={{ width: 80, height: 12, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 12 }} />
                <div style={{ width: 120, height: 28, background: theme.colors.bgTertiary, borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: 140, height: 10, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              </div>
            ))}
          </div>

          {/* Expenses Section Skeleton */}
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            overflow: "hidden",
          }}>
            <div style={{ 
              padding: 24, 
              borderBottom: `1px solid ${theme.colors.borderLight}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ width: 180, height: 20, background: theme.colors.bgTertiary, borderRadius: 4 }} />
              <div style={{ width: 100, height: 36, background: theme.colors.bgTertiary, borderRadius: 6 }} />
            </div>

            {/* Table Header Skeleton */}
            <div style={{ padding: "12px 16px", background: theme.colors.bgTertiary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 100px", gap: 16 }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ width: "80%", height: 12, background: theme.colors.bgPrimary, borderRadius: 4 }} />
                ))}
              </div>
            </div>

            {/* Table Rows Skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 100px", gap: 16, alignItems: "center" }}>
                  <div style={{ width: "70%", height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                  <div style={{ width: "60%", height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                  <div style={{ width: "80%", height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                  <div style={{ width: "50%", height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                  <div style={{ width: "60%", height: 14, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                  <div style={{ width: 60, height: 28, background: theme.colors.bgTertiary, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!session || !profitability) return null;

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: `1px solid ${theme.colors.borderMedium}`,
    borderRadius: 8,
    fontSize: 14,
    background: theme.colors.bgPrimary,
    color: theme.colors.textPrimary,
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Back Button */}
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/finance"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: theme.colors.textSecondary,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to Finance Dashboard
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            {profitability.project.name}
          </h1>
          <p style={{ color: theme.colors.textSecondary, fontSize: 15 }}>
            {profitability.project.client.nickname || profitability.project.client.name}
          </p>
        </div>

        {/* Financial Summary Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 16, 
          marginBottom: 32 
        }}>
          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Total Revenue
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.success }}>
              ${profitability.revenue.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              Labor: ${profitability.revenue.labor.toLocaleString()} | Expenses: ${profitability.revenue.expenses.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Total Costs
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.error }}>
              ${profitability.costs.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              Labor: ${profitability.costs.labor.toLocaleString()} | Expenses: ${profitability.costs.expenses.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Net Profit
            </div>
            <div style={{ 
              fontSize: 24, 
              fontWeight: 600, 
              color: profitability.profit.amount >= 0 ? theme.colors.success : theme.colors.error 
            }}>
              ${profitability.profit.amount.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              Margin: {profitability.profit.margin.toFixed(1)}%
            </div>
          </div>

          <div style={{
            background: theme.colors.bgSecondary,
            border: `1px solid ${theme.colors.borderLight}`,
            borderRadius: theme.borderRadius.lg,
            padding: 20,
          }}>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 6 }}>
              Hours Logged
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: theme.colors.textPrimary }}>
              {profitability.hours.total.toFixed(1)}h
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div style={{
          background: theme.colors.bgSecondary,
          border: `1px solid ${theme.colors.borderLight}`,
          borderRadius: theme.borderRadius.lg,
          overflow: "hidden",
          marginBottom: 32,
        }}>
          <div style={{ 
            padding: 24, 
            borderBottom: `1px solid ${theme.colors.borderLight}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
              Project Expenses ({expenses.length})
            </h2>
            <button
              onClick={() => setShowAddExpense(true)}
              style={{
                padding: "8px 16px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              + Add Expense
            </button>
          </div>

          {/* Add/Edit Expense Form */}
          {(showAddExpense || editingExpense) && (
            <div style={{ padding: 24, borderBottom: `1px solid ${theme.colors.borderLight}`, background: theme.colors.bgTertiary }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                {editingExpense ? "Edit Expense" : "Add New Expense"}
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    style={inputStyle}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Vendor/Supplier
                  </label>
                  <input
                    type="text"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    style={inputStyle}
                    placeholder="Company name"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Description *
                  </label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    style={inputStyle}
                    placeholder="Describe the expense"
                  />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={expenseForm.isBillable}
                      onChange={(e) => setExpenseForm({ ...expenseForm, isBillable: e.target.checked })}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Billable to Client</span>
                  </label>
                </div>

                {expenseForm.isBillable && (
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                      Markup (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.markupPercentage}
                      onChange={(e) => setExpenseForm({ ...expenseForm, markupPercentage: e.target.value })}
                      style={inputStyle}
                      placeholder="e.g., 20"
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={expenseForm.invoiceNumber}
                    onChange={(e) => setExpenseForm({ ...expenseForm, invoiceNumber: e.target.value })}
                    style={inputStyle}
                    placeholder="INV-001"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    Notes
                  </label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    rows={3}
                    style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                  disabled={!expenseForm.description || !expenseForm.amount || !expenseForm.date}
                  style={{
                    padding: "10px 20px",
                    background: theme.colors.primary,
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: expenseForm.description && expenseForm.amount && expenseForm.date ? "pointer" : "not-allowed",
                    opacity: expenseForm.description && expenseForm.amount && expenseForm.date ? 1 : 0.5,
                  }}
                >
                  {editingExpense ? "Update Expense" : "Add Expense"}
                </button>
                <button
                  onClick={() => {
                    setShowAddExpense(false);
                    setEditingExpense(null);
                    setExpenseForm({
                      category: "OUTSOURCING",
                      description: "",
                      amount: "",
                      date: new Date().toISOString().split("T")[0],
                      vendor: "",
                      isBillable: false,
                      markupPercentage: "",
                      invoiceNumber: "",
                      notes: "",
                    });
                  }}
                  style={{
                    padding: "10px 20px",
                    background: theme.colors.bgTertiary,
                    color: theme.colors.textSecondary,
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Expenses Table */}
          {expenses.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: theme.colors.textMuted }}>
              No expenses recorded yet
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.colors.bgTertiary, borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Date
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Category
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Description
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Vendor
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Amount
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Billable
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.colors.textSecondary }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} style={{ borderBottom: `1px solid ${theme.colors.borderLight}` }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: theme.colors.textSecondary }}>
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: theme.colors.textPrimary }}>
                        {expense.category.replace(/_/g, " ")}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: theme.colors.textPrimary }}>
                        {expense.description}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: theme.colors.textSecondary }}>
                        {expense.vendor || "-"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: theme.colors.error, textAlign: "right" }}>
                        ${expense.amount.toLocaleString()}
                        {expense.isBillable && expense.markupPercentage && (
                          <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
                            +{expense.markupPercentage}% markup
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {expense.isBillable ? (
                          <span style={{ 
                            padding: "4px 8px", 
                            background: theme.colors.successBg, 
                            color: theme.colors.success,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            YES
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: theme.colors.textMuted }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => openEditExpense(expense)}
                            style={{
                              padding: "4px 8px",
                              fontSize: 11,
                              background: theme.colors.primary,
                              color: "white",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: 11,
                              background: "transparent",
                              color: theme.colors.error,
                              border: `1px solid ${theme.colors.borderLight}`,
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
