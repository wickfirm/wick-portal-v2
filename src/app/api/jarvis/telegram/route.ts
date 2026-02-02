// src/app/api/jarvis/telegram/route.ts

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ============================================================================
// TELEGRAM HELPERS
// ============================================================================

async function sendMessage(chatId: number, text: string) {
  // Telegram has a 4096 char limit per message
  const MAX = 4000;
  if (text.length <= MAX) {
    await _send(chatId, text);
  } else {
    // Split into chunks at newlines
    const lines = text.split("\n");
    let chunk = "";
    for (const line of lines) {
      if ((chunk + "\n" + line).length > MAX && chunk.length > 0) {
        await _send(chatId, chunk);
        chunk = line;
      } else {
        chunk = chunk ? chunk + "\n" + line : line;
      }
    }
    if (chunk) await _send(chatId, chunk);
  }
}

async function _send(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

// ============================================================================
// REPORT FUNCTIONS
// ============================================================================

// --- 1. Daily Business Snapshot ---
async function reportDailySnapshot(agencyId: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    clientsByStatus,
    projectsByStatus,
    overdueTasksCount,
    dueTodayCount,
    dueThisWeekCount,
    activeTeamCount,
    todayTimeEntries,
    tasksCompletedToday,
  ] = await Promise.all([
    // Clients by status
    prisma.client.groupBy({
      by: ["status"],
      where: { agencies: { some: { agencyId } } },
      _count: true,
    }),
    // Projects by status
    prisma.project.groupBy({
      by: ["status"],
      where: { client: { agencies: { some: { agencyId } } } },
      _count: true,
    }),
    // Overdue tasks
    prisma.clientTask.count({
      where: {
        client: { agencies: { some: { agencyId } } },
        status: { not: "COMPLETED" },
        dueDate: { lt: today },
      },
    }),
    // Due today
    prisma.clientTask.count({
      where: {
        client: { agencies: { some: { agencyId } } },
        status: { not: "COMPLETED" },
        dueDate: {
          gte: today,
          lt: new Date(today.getTime() + 86400000),
        },
      },
    }),
    // Due this week
    prisma.clientTask.count({
      where: {
        client: { agencies: { some: { agencyId } } },
        status: { not: "COMPLETED" },
        dueDate: {
          gte: today,
          lt: new Date(today.getTime() + 7 * 86400000),
        },
      },
    }),
    // Active team members
    prisma.user.count({
      where: { agencyId, isActive: true },
    }),
    // Hours logged today
    prisma.timeEntry.aggregate({
      where: {
        user: { agencyId },
        date: today,
      },
      _sum: { duration: true },
    }),
    // Tasks completed today
    prisma.clientTask.count({
      where: {
        client: { agencies: { some: { agencyId } } },
        status: "COMPLETED",
        updatedAt: { gte: today },
      },
    }),
  ]);

  // Parse results
  const getCount = (arr: any[], status: string) =>
    arr.find((r: any) => r.status === status)?._count || 0;

  const totalClients = clientsByStatus.reduce((s: number, r: any) => s + r._count, 0);
  const activeClients = getCount(clientsByStatus, "ACTIVE");
  const onboardingClients = getCount(clientsByStatus, "ONBOARDING");
  const leads = getCount(clientsByStatus, "LEAD");

  const totalProjects = projectsByStatus.reduce((s: number, r: any) => s + r._count, 0);
  const inProgress = getCount(projectsByStatus, "IN_PROGRESS");
  const completedProjects = getCount(projectsByStatus, "COMPLETED");
  const onHold = getCount(projectsByStatus, "ON_HOLD");

  const totalSeconds = todayTimeEntries._sum.duration || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  let msg = `📊 *Daily Business Snapshot*\n_${dateStr}_\n\n`;

  msg += `*Clients (${totalClients}):*\n`;
  msg += `  ✅ Active: ${activeClients}\n`;
  msg += `  🔄 Onboarding: ${onboardingClients}\n`;
  msg += `  🎯 Leads: ${leads}\n\n`;

  msg += `*Projects (${totalProjects}):*\n`;
  msg += `  ▶️ In Progress: ${inProgress}\n`;
  msg += `  ⏸ On Hold: ${onHold}\n`;
  msg += `  ✅ Completed: ${completedProjects}\n\n`;

  msg += `*Tasks:*\n`;
  if (overdueTasksCount > 0) msg += `  🔴 Overdue: ${overdueTasksCount}\n`;
  msg += `  🟡 Due today: ${dueTodayCount}\n`;
  msg += `  📅 Due this week: ${dueThisWeekCount}\n`;
  msg += `  ✅ Completed today: ${tasksCompletedToday}\n\n`;

  msg += `*Team:*\n`;
  msg += `  👥 Active members: ${activeTeamCount}\n`;
  msg += `  ⏱ Hours logged today: ${hours}h ${mins}m`;

  return msg;
}

// --- 2. Client Health Report ---
async function reportClientHealth(agencyId: string): Promise<string> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const clients = await prisma.client.findMany({
    where: {
      agencies: { some: { agencyId } },
      status: "ACTIVE",
    },
    include: {
      projects: {
        where: { status: "IN_PROGRESS" },
        select: { id: true, name: true },
      },
      tasks: {
        where: { status: { not: "COMPLETED" } },
        select: { id: true, dueDate: true, status: true },
      },
      timeEntries: {
        where: { date: { gte: weekAgo } },
        select: { duration: true },
      },
      onboardingItems: {
        select: { isCompleted: true },
      },
    },
    orderBy: { name: "asc" },
  });

  let msg = `🏥 *Client Health Report*\n_${clients.length} active clients_\n\n`;

  const atRisk: string[] = [];
  const healthy: string[] = [];
  const now = new Date();

  for (const c of clients) {
    const hoursThisWeek = c.timeEntries.reduce((s, e) => s + e.duration, 0) / 3600;
    const overdue = c.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;
    const openTasks = c.tasks.length;
    const activeProjects = c.projects.length;

    const issues: string[] = [];
    if (hoursThisWeek === 0) issues.push("0h logged this week");
    if (overdue > 0) issues.push(`${overdue} overdue tasks`);
    if (activeProjects === 0 && openTasks === 0) issues.push("no active work");

    if (issues.length > 0) {
      atRisk.push(`  🔴 *${c.name}*: ${issues.join(", ")}`);
    } else {
      const hrs = hoursThisWeek.toFixed(1);
      healthy.push(`  🟢 *${c.name}*: ${hrs}h this week, ${openTasks} tasks, ${activeProjects} projects`);
    }
  }

  if (atRisk.length > 0) {
    msg += `*⚠️ Needs Attention (${atRisk.length}):*\n`;
    msg += atRisk.join("\n") + "\n\n";
  }

  if (healthy.length > 0) {
    msg += `*✅ Healthy (${healthy.length}):*\n`;
    msg += healthy.join("\n");
  }

  if (clients.length === 0) {
    msg += "No active clients found.";
  }

  return msg;
}

// --- 3. Team Productivity Report ---
async function reportTeamProductivity(agencyId: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  const now = new Date();

  const members = await prisma.user.findMany({
    where: { agencyId, isActive: true, role: { not: "CLIENT" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      timeEntries: {
        where: { date: { gte: weekStart } },
        select: { duration: true },
      },
      assignedTasks: {
        where: { status: { not: "COMPLETED" } },
        select: { id: true, dueDate: true },
      },
      dailySummaries: {
        where: { date: { gte: weekStart } },
        select: { sodCompletedAt: true, eodCompletedAt: true, completionRate: true },
      },
    },
    orderBy: { name: "asc" },
  });

  let msg = `👥 *Team Productivity Report*\n_Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}_\n\n`;

  for (const m of members) {
    const name = m.name || m.email.split("@")[0];
    const hoursThisWeek = m.timeEntries.reduce((s, e) => s + e.duration, 0) / 3600;
    const openTasks = m.assignedTasks.length;
    const overdue = m.assignedTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now
    ).length;
    const sodCount = m.dailySummaries.filter((d) => d.sodCompletedAt).length;
    const eodCount = m.dailySummaries.filter((d) => d.eodCompletedAt).length;
    const avgCompletion = m.dailySummaries.length > 0
      ? m.dailySummaries.reduce((s, d) => s + Number(d.completionRate), 0) / m.dailySummaries.length
      : 0;

    msg += `*${name}*\n`;
    msg += `  ⏱ ${hoursThisWeek.toFixed(1)}h logged`;
    msg += ` · 📋 ${openTasks} tasks`;
    if (overdue > 0) msg += ` · 🔴 ${overdue} overdue`;
    msg += `\n`;
    msg += `  📝 SOD: ${sodCount}/5 · EOD: ${eodCount}/5`;
    if (avgCompletion > 0) msg += ` · Rate: ${avgCompletion.toFixed(0)}%`;
    msg += `\n\n`;
  }

  if (members.length === 0) {
    msg += "No active team members found.";
  }

  return msg;
}

// --- 4. Financial / Profitability Report ---
async function reportFinancial(agencyId: string): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [timeEntries, expenses, clients] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        user: { agencyId },
        date: { gte: monthStart },
      },
      select: {
        duration: true,
        billable: true,
        hourlyRateAtTime: true,
        billRateAtTime: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.projectExpense.findMany({
      where: {
        client: { agencies: { some: { agencyId } } },
        date: { gte: monthStart },
      },
      select: {
        amount: true,
        category: true,
        isBillable: true,
      },
    }),
    prisma.client.findMany({
      where: {
        agencies: { some: { agencyId } },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        monthlyRevenue: true,
        monthlyRetainer: true,
      },
    }),
  ]);

  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  let msg = `💰 *Financial Report*\n_${monthName}_\n\n`;

  // Aggregate time
  let totalHours = 0;
  let billableHours = 0;
  let totalCost = 0;
  let totalRevenue = 0;
  const byClient: Record<string, { hours: number; cost: number; revenue: number; name: string }> = {};

  for (const te of timeEntries) {
    const h = te.duration / 3600;
    totalHours += h;
    if (te.billable) billableHours += h;

    const costRate = Number(te.hourlyRateAtTime || 0);
    const billRate = Number(te.billRateAtTime || 0);
    const cost = h * costRate;
    const rev = te.billable ? h * billRate : 0;
    totalCost += cost;
    totalRevenue += rev;

    const cid = te.client.id;
    if (!byClient[cid]) byClient[cid] = { hours: 0, cost: 0, revenue: 0, name: te.client.name };
    byClient[cid].hours += h;
    byClient[cid].cost += cost;
    byClient[cid].revenue += rev;
  }

  // Expenses
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const expByCategory: Record<string, number> = {};
  for (const e of expenses) {
    expByCategory[e.category] = (expByCategory[e.category] || 0) + Number(e.amount);
  }

  // Retainer / Monthly revenue
  const totalRetainer = clients.reduce((s, c) => s + Number(c.monthlyRetainer || 0), 0);

  const profit = totalRevenue - totalCost - totalExpenses;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0;
  const utilization = totalHours > 0 ? ((billableHours / totalHours) * 100) : 0;

  msg += `*Overview:*\n`;
  msg += `  💵 Revenue (billable time): $${totalRevenue.toFixed(0)}\n`;
  if (totalRetainer > 0) msg += `  📋 Monthly retainers: $${totalRetainer.toFixed(0)}\n`;
  msg += `  💸 Labor cost: $${totalCost.toFixed(0)}\n`;
  msg += `  📊 Expenses: $${totalExpenses.toFixed(0)}\n`;
  msg += `  ${profit >= 0 ? "✅" : "🔴"} Profit: $${profit.toFixed(0)} (${margin.toFixed(1)}% margin)\n\n`;

  msg += `*Time:*\n`;
  msg += `  ⏱ Total: ${totalHours.toFixed(1)}h\n`;
  msg += `  💼 Billable: ${billableHours.toFixed(1)}h (${utilization.toFixed(0)}% utilization)\n\n`;

  // Per-client breakdown
  const clientEntries = Object.values(byClient).sort((a, b) => b.hours - a.hours);
  if (clientEntries.length > 0) {
    msg += `*By Client:*\n`;
    for (const c of clientEntries.slice(0, 8)) {
      const cProfit = c.revenue - c.cost;
      msg += `  • *${c.name}*: ${c.hours.toFixed(1)}h · $${c.revenue.toFixed(0)} rev · ${cProfit >= 0 ? "+" : ""}$${cProfit.toFixed(0)}\n`;
    }
    if (clientEntries.length > 8) {
      msg += `  _...and ${clientEntries.length - 8} more_\n`;
    }
  }

  // Expense breakdown
  if (Object.keys(expByCategory).length > 0) {
    msg += `\n*Expenses by Category:*\n`;
    for (const [cat, amt] of Object.entries(expByCategory).sort((a, b) => b[1] - a[1])) {
      msg += `  • ${cat.replace(/_/g, " ")}: $${amt.toFixed(0)}\n`;
    }
  }

  return msg;
}

// --- 5. Time Tracking Report ---
async function reportTimeTracking(agencyId: string): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const entries = await prisma.timeEntry.findMany({
    where: {
      user: { agencyId },
      date: { gte: weekStart },
    },
    include: {
      user: { select: { name: true, email: true } },
      client: { select: { name: true } },
      project: { select: { name: true, serviceType: true } },
    },
  });

  let msg = `⏱ *Time Tracking Report*\n_Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}_\n\n`;

  const totalSeconds = entries.reduce((s, e) => s + e.duration, 0);
  const billableSeconds = entries.filter((e) => e.billable).reduce((s, e) => s + e.duration, 0);
  const manualCount = entries.filter((e) => e.source === "MANUAL").length;
  const timerCount = entries.filter((e) => e.source === "TIMER").length;

  const fmt = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  msg += `*Total: ${fmt(totalSeconds)}*\n`;
  msg += `  💼 Billable: ${fmt(billableSeconds)} (${totalSeconds > 0 ? ((billableSeconds / totalSeconds) * 100).toFixed(0) : 0}%)\n`;
  msg += `  ⏲ Timer: ${timerCount} entries · ✍️ Manual: ${manualCount} entries\n\n`;

  // By client
  const byClient: Record<string, number> = {};
  for (const e of entries) {
    byClient[e.client.name] = (byClient[e.client.name] || 0) + e.duration;
  }
  const sortedClients = Object.entries(byClient).sort((a, b) => b[1] - a[1]);

  if (sortedClients.length > 0) {
    msg += `*By Client:*\n`;
    for (const [name, sec] of sortedClients.slice(0, 8)) {
      const pct = ((sec / totalSeconds) * 100).toFixed(0);
      msg += `  • ${name}: ${fmt(sec)} (${pct}%)\n`;
    }
    msg += "\n";
  }

  // By service type
  const byService: Record<string, number> = {};
  for (const e of entries) {
    const st = e.project.serviceType.replace(/_/g, " ");
    byService[st] = (byService[st] || 0) + e.duration;
  }
  const sortedServices = Object.entries(byService).sort((a, b) => b[1] - a[1]);

  if (sortedServices.length > 0) {
    msg += `*By Service:*\n`;
    for (const [name, sec] of sortedServices) {
      msg += `  • ${name}: ${fmt(sec)}\n`;
    }
    msg += "\n";
  }

  // By team member
  const byMember: Record<string, number> = {};
  for (const e of entries) {
    const name = e.user.name || e.user.email.split("@")[0];
    byMember[name] = (byMember[name] || 0) + e.duration;
  }
  const sortedMembers = Object.entries(byMember).sort((a, b) => b[1] - a[1]);

  if (sortedMembers.length > 0) {
    msg += `*By Team Member:*\n`;
    for (const [name, sec] of sortedMembers) {
      msg += `  • ${name}: ${fmt(sec)}\n`;
    }
  }

  return msg;
}

// --- 6. Task Pipeline Report ---
async function reportTaskPipeline(agencyId: string): Promise<string> {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today.getTime() + 7 * 86400000);

  const tasks = await prisma.clientTask.findMany({
    where: {
      client: { agencies: { some: { agencyId } } },
      status: { not: "COMPLETED" },
    },
    include: {
      client: { select: { name: true } },
      assignee: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
  });

  let msg = `📋 *Task Pipeline Report*\n_${tasks.length} open tasks_\n\n`;

  // By priority
  const byPriority: Record<string, number> = {};
  for (const t of tasks) {
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  }
  msg += `*By Priority:*\n`;
  if (byPriority["HIGH"]) msg += `  🔴 High: ${byPriority["HIGH"]}\n`;
  if (byPriority["MEDIUM"]) msg += `  🟡 Medium: ${byPriority["MEDIUM"]}\n`;
  if (byPriority["LOW"]) msg += `  🟢 Low: ${byPriority["LOW"]}\n`;
  msg += "\n";

  // Overdue
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < today);
  if (overdue.length > 0) {
    msg += `*🔴 Overdue (${overdue.length}):*\n`;
    for (const t of overdue.slice(0, 5)) {
      const days = Math.floor((now.getTime() - new Date(t.dueDate!).getTime()) / 86400000);
      msg += `  • ${t.name} (${t.client.name}) - ${days}d overdue\n`;
    }
    if (overdue.length > 5) msg += `  _...and ${overdue.length - 5} more_\n`;
    msg += "\n";
  }

  // Due today
  const dueToday = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) < new Date(today.getTime() + 86400000)
  );
  if (dueToday.length > 0) {
    msg += `*🟡 Due Today (${dueToday.length}):*\n`;
    for (const t of dueToday.slice(0, 5)) {
      msg += `  • ${t.name} (${t.client.name})`;
      if (t.assignee?.name) msg += ` → ${t.assignee.name}`;
      msg += "\n";
    }
    msg += "\n";
  }

  // Unassigned
  const unassigned = tasks.filter((t) => !t.assigneeId);
  if (unassigned.length > 0) {
    msg += `*⚪ Unassigned (${unassigned.length}):*\n`;
    for (const t of unassigned.slice(0, 5)) {
      msg += `  • ${t.name} (${t.client.name})\n`;
    }
    if (unassigned.length > 5) msg += `  _...and ${unassigned.length - 5} more_\n`;
    msg += "\n";
  }

  // By client (top 5)
  const byClient: Record<string, number> = {};
  for (const t of tasks) {
    byClient[t.client.name] = (byClient[t.client.name] || 0) + 1;
  }
  const topClients = Object.entries(byClient).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topClients.length > 0) {
    msg += `*By Client (workload):*\n`;
    for (const [name, count] of topClients) {
      msg += `  • ${name}: ${count} tasks\n`;
    }
  }

  return msg;
}

// --- 7. Marketing Metrics Report (per client) ---
async function reportClientMetrics(data: any, agencyId: string): Promise<string> {
  const clientName = data.clientName;

  const client = await prisma.client.findFirst({
    where: {
      name: { contains: clientName, mode: "insensitive" },
      agencies: { some: { agencyId } },
    },
    select: { id: true, name: true },
  });

  if (!client) {
    return `❌ Client "${clientName}" not found.`;
  }

  const metrics = await prisma.clientMetrics.findMany({
    where: { clientId: client.id },
    orderBy: { month: "desc" },
    take: 2, // Latest + previous for comparison
  });

  if (metrics.length === 0) {
    return `📊 No marketing metrics recorded for *${client.name}* yet.`;
  }

  const latest = metrics[0];
  const prev = metrics.length > 1 ? metrics[1] : null;
  const monthStr = new Date(latest.month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  let msg = `📊 *Marketing Metrics: ${client.name}*\n_${monthStr}_\n\n`;

  const delta = (curr: number | null, old: number | null): string => {
    if (curr === null || curr === undefined) return "";
    if (!prev || old === null || old === undefined) return ` (${curr})`;
    const diff = curr - old;
    const pct = old > 0 ? ((diff / old) * 100).toFixed(0) : "N/A";
    return diff >= 0 ? ` (${curr} ↑${pct}%)` : ` (${curr} ↓${Math.abs(Number(pct))}%)`;
  };

  // Google Analytics
  if (latest.gaSessions || latest.gaUsers) {
    msg += `*Google Analytics:*\n`;
    if (latest.gaSessions !== null) msg += `  Sessions${delta(latest.gaSessions, prev?.gaSessions ?? null)}\n`;
    if (latest.gaUsers !== null) msg += `  Users${delta(latest.gaUsers, prev?.gaUsers ?? null)}\n`;
    if (latest.gaPageviews !== null) msg += `  Pageviews${delta(latest.gaPageviews, prev?.gaPageviews ?? null)}\n`;
    if (latest.gaBounceRate !== null) msg += `  Bounce Rate: ${latest.gaBounceRate}%\n`;
    msg += "\n";
  }

  // Search Console
  if (latest.gscClicks || latest.gscImpressions) {
    msg += `*Search Console:*\n`;
    if (latest.gscClicks !== null) msg += `  Clicks${delta(latest.gscClicks, prev?.gscClicks ?? null)}\n`;
    if (latest.gscImpressions !== null) msg += `  Impressions${delta(latest.gscImpressions, prev?.gscImpressions ?? null)}\n`;
    if (latest.gscCtr !== null) msg += `  CTR: ${latest.gscCtr}%\n`;
    if (latest.gscAvgPosition !== null) msg += `  Avg Position: ${latest.gscAvgPosition}\n`;
    msg += "\n";
  }

  // SEO
  if (latest.seoKeywordsTop10 || latest.seoBacklinks) {
    msg += `*SEO:*\n`;
    if (latest.seoKeywordsTop3 !== null) msg += `  Top 3 Keywords${delta(latest.seoKeywordsTop3, prev?.seoKeywordsTop3 ?? null)}\n`;
    if (latest.seoKeywordsTop10 !== null) msg += `  Top 10 Keywords${delta(latest.seoKeywordsTop10, prev?.seoKeywordsTop10 ?? null)}\n`;
    if (latest.seoBacklinks !== null) msg += `  Backlinks${delta(latest.seoBacklinks, prev?.seoBacklinks ?? null)}\n`;
    if (latest.seoDomainRating !== null) msg += `  Domain Rating: ${latest.seoDomainRating}\n`;
    msg += "\n";
  }

  // Paid Media (Meta)
  if (latest.metaSpend) {
    msg += `*Meta Ads:*\n`;
    msg += `  Spend: $${Number(latest.metaSpend).toFixed(0)}`;
    if (latest.metaConversions) msg += ` · Conv: ${latest.metaConversions}`;
    if (latest.metaRoas) msg += ` · ROAS: ${latest.metaRoas}x`;
    msg += "\n\n";
  }

  // Google Ads
  if (latest.googleAdsSpend) {
    msg += `*Google Ads:*\n`;
    msg += `  Spend: $${Number(latest.googleAdsSpend).toFixed(0)}`;
    if (latest.googleAdsConversions) msg += ` · Conv: ${latest.googleAdsConversions}`;
    if (latest.googleAdsRoas) msg += ` · ROAS: ${latest.googleAdsRoas}x`;
    msg += "\n\n";
  }

  // Social
  const socials: string[] = [];
  if (latest.igFollowers) socials.push(`IG: ${latest.igFollowers} followers`);
  if (latest.fbFollowers) socials.push(`FB: ${latest.fbFollowers} followers`);
  if (latest.liFollowers) socials.push(`LI: ${latest.liFollowers} followers`);
  if (latest.ttFollowers) socials.push(`TT: ${latest.ttFollowers} followers`);

  if (socials.length > 0) {
    msg += `*Social:*\n`;
    for (const s of socials) msg += `  • ${s}\n`;
  }

  return msg;
}

// --- 8. HR / Leave Report ---
async function reportHR(agencyId: string): Promise<string> {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86400000);

  const [pendingLeaves, upcomingLeaves, upcomingHolidays] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { agencyId, status: "PENDING" },
      include: { employee: { include: { user: { select: { name: true } } } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        agencyId,
        status: "APPROVED",
        startDate: { gte: now, lte: weekEnd },
      },
      include: { employee: { include: { user: { select: { name: true } } } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.publicHoliday.findMany({
      where: {
        agencyId,
        date: { gte: now, lte: new Date(now.getTime() + 30 * 86400000) },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  let msg = `🏖 *HR & Leave Report*\n\n`;

  if (pendingLeaves.length > 0) {
    msg += `*⏳ Pending Approval (${pendingLeaves.length}):*\n`;
    for (const lr of pendingLeaves) {
      const name = lr.employee.user.name || "Unknown";
      const start = new Date(lr.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const end = new Date(lr.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      msg += `  • *${name}*: ${lr.leaveType} ${start} - ${end} (${lr.totalDays}d)\n`;
    }
    msg += "\n";
  } else {
    msg += `✅ No pending leave requests\n\n`;
  }

  if (upcomingLeaves.length > 0) {
    msg += `*📅 On Leave This Week (${upcomingLeaves.length}):*\n`;
    for (const lr of upcomingLeaves) {
      const name = lr.employee.user.name || "Unknown";
      const start = new Date(lr.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const end = new Date(lr.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      msg += `  • *${name}*: ${start} - ${end}\n`;
    }
    msg += "\n";
  } else {
    msg += `👍 No team members on leave this week\n\n`;
  }

  if (upcomingHolidays.length > 0) {
    msg += `*🗓 Upcoming Holidays:*\n`;
    for (const h of upcomingHolidays) {
      const date = new Date(h.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      msg += `  • ${h.name} — ${date}`;
      if (h.numberOfDays > 1) msg += ` (${h.numberOfDays} days)`;
      msg += "\n";
    }
  }

  return msg;
}

// --- 9. Lead Qualifier Report ---
async function reportLeads(agencyId: string): Promise<string> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalConversations, activeConvos, qualifiedLeads, bookedCalls, recentLeads] = await Promise.all([
    prisma.conversation.count({ where: { agencyId } }),
    prisma.conversation.count({ where: { agencyId, status: "ACTIVE" } }),
    prisma.lead.count({ where: { agencyId, qualifiedAt: { not: null } } }),
    prisma.booking.count({
      where: { agencyId, status: { in: ["SCHEDULED", "CONFIRMED"] } },
    }),
    prisma.lead.findMany({
      where: { agencyId, createdAt: { gte: weekAgo } },
      include: { conversation: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const convertedCount = await prisma.lead.count({
    where: { agencyId, clientId: { not: null } },
  });

  let msg = `🎯 *Lead Qualifier Report*\n\n`;

  msg += `*Pipeline:*\n`;
  msg += `  💬 Total conversations: ${totalConversations}\n`;
  msg += `  🟢 Active: ${activeConvos}\n`;
  msg += `  ✅ Qualified leads: ${qualifiedLeads}\n`;
  msg += `  📞 Booked calls: ${bookedCalls}\n`;
  msg += `  🤝 Converted to clients: ${convertedCount}\n`;

  if (totalConversations > 0) {
    const convRate = ((convertedCount / totalConversations) * 100).toFixed(1);
    msg += `  📊 Conversion rate: ${convRate}%\n`;
  }
  msg += "\n";

  if (recentLeads.length > 0) {
    msg += `*Recent Leads (7 days):*\n`;
    for (const l of recentLeads) {
      msg += `  • *${l.name}*`;
      if (l.company) msg += ` (${l.company})`;
      msg += ` — ${l.conversation.status}\n`;
    }
  }

  return msg;
}

// --- 10. Weekly / Monthly Digest ---
async function reportWeeklyDigest(agencyId: string): Promise<string> {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    newClients,
    newProjects,
    completedProjects,
    tasksCreated,
    tasksCompleted,
    timeEntries,
    stagesCompleted,
  ] = await Promise.all([
    prisma.client.count({
      where: { agencies: { some: { agencyId } }, createdAt: { gte: weekAgo } },
    }),
    prisma.project.count({
      where: { client: { agencies: { some: { agencyId } } }, createdAt: { gte: weekAgo } },
    }),
    prisma.project.count({
      where: {
        client: { agencies: { some: { agencyId } } },
        status: "COMPLETED",
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.clientTask.count({
      where: { client: { agencies: { some: { agencyId } } }, createdAt: { gte: weekAgo } },
    }),
    prisma.clientTask.count({
      where: {
        client: { agencies: { some: { agencyId } } },
        status: "COMPLETED",
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.timeEntry.aggregate({
      where: { user: { agencyId }, date: { gte: weekAgo } },
      _sum: { duration: true },
    }),
    prisma.projectStage.count({
      where: {
        project: { client: { agencies: { some: { agencyId } } } },
        isCompleted: true,
        completedAt: { gte: weekAgo },
      },
    }),
  ]);

  const totalSeconds = timeEntries._sum.duration || 0;
  const totalHours = totalSeconds / 3600;
  const velocity = tasksCompleted - tasksCreated;

  const startDate = weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let msg = `📰 *Weekly Digest*\n_${startDate} — ${endDate}_\n\n`;

  msg += `*Activity:*\n`;
  msg += `  🆕 New clients: ${newClients}\n`;
  msg += `  📂 Projects started: ${newProjects}\n`;
  msg += `  ✅ Projects completed: ${completedProjects}\n`;
  msg += `  🏁 Milestones hit: ${stagesCompleted}\n\n`;

  msg += `*Tasks:*\n`;
  msg += `  📝 Created: ${tasksCreated}\n`;
  msg += `  ✅ Completed: ${tasksCompleted}\n`;
  msg += `  ${velocity >= 0 ? "📈" : "📉"} Velocity: ${velocity >= 0 ? "+" : ""}${velocity} (${velocity >= 0 ? "clearing backlog" : "backlog growing"})\n\n`;

  msg += `*Time:*\n`;
  msg += `  ⏱ Total hours: ${totalHours.toFixed(1)}h\n`;

  return msg;
}

// ============================================================================
// EXISTING CRUD FUNCTIONS
// ============================================================================

async function createNote(data: any, userId: string, agencyId: string | null | undefined) {
  await prisma.note.create({
    data: {
      title: data.title || null,
      content: data.content,
      color: data.color || "yellow",
      isPinned: data.isPinned || false,
      tags: data.tags || [],
      createdBy: userId,
      agencyId: agencyId || null,
    },
  });
}

async function createClient(data: any, userId: string, agencyId: string | null | undefined) {
  const baseSlug = (data.name || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let clientId = `client-${baseSlug}`;
  let counter = 1;
  while (await prisma.client.findUnique({ where: { id: clientId } })) {
    clientId = `client-${baseSlug}-${counter}`;
    counter++;
  }

  const client = await prisma.client.create({
    data: {
      id: clientId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      agencies: {
        create: {
          agencyId: agencyId || "",
        },
      },
    },
  });

  await prisma.clientTeamMember.create({
    data: {
      clientId: client.id,
      userId: userId,
    },
  });

  try {
    const projId = `proj-${clientId}-default`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO projects (id, name, description, "clientId", "serviceType", status, is_default, "createdAt", "updatedAt")
       VALUES ($1, 'Admin/Operations', 'General administrative tasks and operations', $2, 'CONSULTING'::service_type, 'IN_PROGRESS'::project_status, true, NOW(), NOW())`,
      projId,
      client.id
    );
  } catch (projError) {
    console.error("Warning: Jarvis failed to create default project:", projError);
  }
}

async function updateClient(data: any, agencyId: string | null | undefined) {
  const client = await prisma.client.findFirst({
    where: {
      name: { contains: data.clientName, mode: "insensitive" },
      agencies: { some: { agencyId: agencyId || "" } },
    },
  });

  if (!client) {
    throw new Error(`Client "${data.clientName}" not found`);
  }

  await prisma.client.update({
    where: { id: client.id },
    data: data.updates,
  });
}

const clientSearchCache: { [chatId: number]: any[] } = {};

async function getClient(data: any, agencyId: string | null | undefined, chatId: number): Promise<string> {
  const clients = await prisma.client.findMany({
    where: {
      name: { contains: data.clientName, mode: "insensitive" },
      agencies: { some: { agencyId: agencyId || "" } },
    },
    include: {
      projects: { select: { id: true, name: true, status: true } },
      tasks: {
        where: { status: { not: "COMPLETED" } },
        select: { id: true, name: true, status: true, priority: true },
        take: 5,
      },
    },
    take: 10,
  });

  if (clients.length === 0) {
    return `❌ No clients found matching "${data.clientName}".`;
  }

  if (clients.length > 1) {
    clientSearchCache[chatId] = clients;
    let response = `❓ *Found ${clients.length} clients:*\n\n`;
    clients.forEach((client, index) => {
      response += `${index + 1}. ${client.name}`;
      if (client.company && client.company !== client.name) {
        response += ` (${client.company})`;
      }
      response += `\n`;
    });
    response += `\nReply with the number to see details.`;
    return response;
  }

  return formatClientDetails(clients[0]);
}

async function selectClient(data: any, agencyId: string | null | undefined, chatId: number): Promise<string> {
  const clientNumber = parseInt(data.clientNumber);

  if (!clientSearchCache[chatId] || clientSearchCache[chatId].length === 0) {
    return `❌ No recent client search. Try searching for a client first.`;
  }

  if (clientNumber < 1 || clientNumber > clientSearchCache[chatId].length) {
    return `❌ Invalid number. Please choose between 1 and ${clientSearchCache[chatId].length}.`;
  }

  const client = clientSearchCache[chatId][clientNumber - 1];
  delete clientSearchCache[chatId];
  return formatClientDetails(client);
}

function formatClientDetails(client: any): string {
  let response = `📋 *${client.name}*\n\n`;

  if (client.email) response += `📧 Email: ${client.email}\n`;
  if (client.phone) response += `📞 Phone: ${client.phone}\n`;
  if (client.website) response += `🌐 Website: ${client.website}\n`;
  if (client.company) response += `🏢 Company: ${client.company}\n`;
  if (client.industry) response += `🏭 Industry: ${client.industry}\n`;
  if (client.status) response += `📊 Status: ${client.status}\n`;

  if (client.projects && client.projects.length > 0) {
    response += `\n*Projects (${client.projects.length}):*\n`;
    client.projects.slice(0, 3).forEach((p: any) => {
      response += `• ${p.name} (${p.status})\n`;
    });
    if (client.projects.length > 3) {
      response += `• ...and ${client.projects.length - 3} more\n`;
    }
  }

  if (client.tasks && client.tasks.length > 0) {
    response += `\n*Active Tasks (${client.tasks.length}):*\n`;
    client.tasks.forEach((t: any) => {
      response += `• ${t.name} - ${t.priority} (${t.status})\n`;
    });
  }

  response += `\n🔗 [View in Omnixia](https://wick.omnixia.ai/clients)`;
  return response;
}

// ============================================================================
// MAIN MESSAGE PROCESSOR
// ============================================================================

async function processMessage(chatId: number, text: string, telegramUserId: number) {
  try {
    // HARDCODED FOR TESTING - Your user ID
    const user = {
      id: "cmjr6w9gx0001h2g0tta6h37g",
      agencyId: "agency-wick",
      name: "MBzle",
    };

    await sendMessage(chatId, "🤔 *Jarvis is thinking...*");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: `You are Jarvis, an AI assistant for Omnixia (a project management platform for digital agencies).

Parse user requests and extract structured data.

SUPPORTED ACTIONS:

--- CRUD ---
1. create_note - Add sticky notes
2. create_client - Add new clients
3. update_client - Update existing client details
4. get_client - Get client details
5. select_client - Select client by number from list
6. create_task - Add tasks (coming soon)

--- REPORTS ---
7. report_daily - Daily business snapshot ("morning report", "how's the business", "daily snapshot", "what's going on")
8. report_client_health - Client health report ("client health", "at-risk clients", "how are my clients")
9. report_team - Team productivity report ("team report", "how's the team", "team productivity")
10. report_financial - Financial / profitability report ("financials", "profitability", "revenue", "how's our P&L")
11. report_time - Time tracking report ("time report", "hours logged", "where are we spending time")
12. report_tasks - Task pipeline report ("task report", "what's the task situation", "overdue tasks")
13. report_client_metrics - Client marketing metrics ("how's [client] SEO doing", "[client] metrics", "[client] performance")
14. report_hr - HR & leave report ("who's on leave", "HR report", "leave requests")
15. report_leads - Lead qualifier report ("lead report", "how are our leads", "pipeline")
16. report_weekly - Weekly digest ("weekly summary", "what happened this week", "weekly report")

--- OTHER ---
17. help - Show what you can do
18. unknown - Unrecognized request

RESPONSE FORMAT (JSON only):
{
  "action": "<action_name>",
  "data": {
    // For create_note: "title", "content" (REQUIRED), "tags", "color", "isPinned"
    // For create_client: "name" (REQUIRED), "email", "phone", "website"
    // For update_client: "clientName" (REQUIRED), "updates": { "email", "phone", "website" }
    // For get_client: "clientName" (REQUIRED)
    // For select_client: "clientNumber" (REQUIRED)
    // For report_client_metrics: "clientName" (REQUIRED - the client they're asking about)
    // For all other reports: {} (empty, no data needed)
  },
  "message": "Friendly confirmation or context"
}

IMPORTANT:
- If user sends just a number (1, 2, 3), use select_client action
- For report_client_metrics, ALWAYS extract the client name from the message
- When in doubt about which report, prefer report_daily
- "morning report" or "good morning" → report_daily
- "how's X doing" where X is a client name → report_client_metrics with clientName
- "how's the team" → report_team
- "how's the business" → report_daily`,
      messages: [{ role: "user", content: text }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    let aiText = textBlock.text;
    aiText = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const result = JSON.parse(aiText);

    switch (result.action) {
      case "create_note":
        await createNote(result.data, user.id, user.agencyId);
        await sendMessage(chatId, `✅ *Note Created!*\n\n${result.message}`);
        break;

      case "create_client":
        await createClient(result.data, user.id, user.agencyId);
        await sendMessage(chatId, `👥 *Client Created!*\n\n${result.message}`);
        break;

      case "update_client":
        await updateClient(result.data, user.agencyId);
        await sendMessage(chatId, `✏️ *Client Updated!*\n\n${result.message}`);
        break;

      case "get_client":
        const clientInfo = await getClient(result.data, user.agencyId, chatId);
        await sendMessage(chatId, clientInfo);
        break;

      case "select_client":
        const selectedClientInfo = await selectClient(result.data, user.agencyId, chatId);
        await sendMessage(chatId, selectedClientInfo);
        break;

      case "create_task":
        await sendMessage(chatId, `🚧 *Task Creation Coming Soon!*\n\nThis feature is under development.`);
        break;

      // --- REPORTS ---
      case "report_daily":
        const daily = await reportDailySnapshot(user.agencyId);
        await sendMessage(chatId, daily);
        break;

      case "report_client_health":
        const health = await reportClientHealth(user.agencyId);
        await sendMessage(chatId, health);
        break;

      case "report_team":
        const team = await reportTeamProductivity(user.agencyId);
        await sendMessage(chatId, team);
        break;

      case "report_financial":
        const financial = await reportFinancial(user.agencyId);
        await sendMessage(chatId, financial);
        break;

      case "report_time":
        const time = await reportTimeTracking(user.agencyId);
        await sendMessage(chatId, time);
        break;

      case "report_tasks":
        const tasks = await reportTaskPipeline(user.agencyId);
        await sendMessage(chatId, tasks);
        break;

      case "report_client_metrics":
        const metrics = await reportClientMetrics(result.data, user.agencyId);
        await sendMessage(chatId, metrics);
        break;

      case "report_hr":
        const hr = await reportHR(user.agencyId);
        await sendMessage(chatId, hr);
        break;

      case "report_leads":
        const leads = await reportLeads(user.agencyId);
        await sendMessage(chatId, leads);
        break;

      case "report_weekly":
        const weekly = await reportWeeklyDigest(user.agencyId);
        await sendMessage(chatId, weekly);
        break;

      case "help":
        await sendMessage(
          chatId,
          `🤖 *Jarvis - Your Omnixia Assistant*\n\n` +
            `*📊 Reports:*\n` +
            `• "morning report" — daily business snapshot\n` +
            `• "client health" — at-risk vs healthy clients\n` +
            `• "team report" — productivity & hours per member\n` +
            `• "financials" — revenue, costs, profitability\n` +
            `• "time report" — hours by client, service, member\n` +
            `• "task report" — pipeline, overdue, unassigned\n` +
            `• "how's [client] doing" — marketing metrics\n` +
            `• "HR report" — leave requests & holidays\n` +
            `• "lead report" — qualifier pipeline\n` +
            `• "weekly summary" — week-in-review digest\n\n` +
            `*✏️ Actions:*\n` +
            `• "add a note: [text]" — create sticky note\n` +
            `• "create client [name]" — add new client\n` +
            `• "update [client]: [changes]" — edit client\n` +
            `• "show me [client]" — view client details\n\n` +
            `_Try: "morning report" or "how are my clients"_`
        );
        break;

      default:
        await sendMessage(chatId, `❓ ${result.message || "I didn't understand. Try 'help' to see what I can do."}`);
    }
  } catch (error) {
    console.error("Jarvis error:", error);
    await sendMessage(chatId, "❌ Sorry, I encountered an error. Please try again.");
  }
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Telegram webhook:", JSON.stringify(body, null, 2));

    if (body.message) {
      const chatId = body.message.chat.id;
      const telegramUserId = body.message.from.id;
      const text = body.message.text;

      if (text) {
        if (text === "/start") {
          await sendMessage(
            chatId,
            `👋 *Welcome to Jarvis!*\n\nI'm your Omnixia business assistant.\n\n` +
              `Try:\n• "morning report"\n• "how are my clients"\n• "help" for all commands`
          );
          return NextResponse.json({ ok: true });
        }

        await processMessage(chatId, text, telegramUserId);
      }

      if (body.message.voice) {
        await sendMessage(chatId, "🎤 *Transcribing your voice message...*");

        try {
          const fileId = body.message.voice.file_id;
          const fileRes = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
          );
          const fileData = await fileRes.json();

          if (!fileData.ok) {
            throw new Error("Failed to get file from Telegram");
          }

          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
          const audioRes = await fetch(fileUrl);
          const audioBuffer = await audioRes.arrayBuffer();

          const transcript = await transcribeAudio(audioBuffer);

          await sendMessage(chatId, `📝 *Transcribed:*\n"${transcript}"\n\n_Processing..._`);

          await processMessage(chatId, transcript, telegramUserId);
        } catch (error) {
          console.error("Voice transcription error:", error);
          await sendMessage(chatId, "❌ Failed to transcribe voice message. Please try again or send text.");
        }

        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const blob = new Blob([audioBuffer], { type: "audio/ogg" });

  const formData = new FormData();
  formData.append("file", blob, "voice.ogg");
  formData.append("model", "whisper-1");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Whisper API error:", error);
    throw new Error("Failed to transcribe audio");
  }

  const data = await response.json();
  return data.text;
}

export async function GET() {
  return NextResponse.json({ status: "Jarvis online ✓" });
}
