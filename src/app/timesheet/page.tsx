import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import TimesheetGrid from "./timesheet-grid";
import { theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

function getWeekDates(dateInWeek: Date) {
  const date = new Date(dateInWeek);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d);
  }
  
  return weekDates;
}

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: { week?: string; userId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const currentUser = session.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { email: currentUser.email },
  });

  if (!dbUser) redirect("/login");

  // Determine which week to show
  const weekParam = searchParams.week;
  const targetDate = weekParam ? new Date(weekParam) : new Date();
  const weekDates = getWeekDates(targetDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  // Determine which user's timesheet to show
  const canViewOthers = ["SUPER_ADMIN", "ADMIN"].includes(dbUser.role);
  const viewUserId = canViewOthers && searchParams.userId ? searchParams.userId : dbUser.id;

  // Get team members for selector (if admin)
  let teamMembers: any[] = [];
  if (canViewOthers) {
    teamMembers = await prisma.user.findMany({
      where: { isActive: true, role: { not: "CLIENT" } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  }

  // Get the user being viewed
  const viewUser = viewUserId === dbUser.id 
    ? dbUser 
    : await prisma.user.findUnique({
        where: { id: viewUserId },
        select: { id: true, name: true, email: true },
      });

  // Fetch time entries for the week
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: viewUserId,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      client: { select: { id: true, name: true, nickname: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  // Group entries by project+task combination
  const entriesByRow: Record<string, any> = {};
  
  timeEntries.forEach((entry) => {
    const rowKey = `${entry.projectId}-${entry.taskId}`;
    if (!entriesByRow[rowKey]) {
      entriesByRow[rowKey] = {
        client: entry.client,
        project: entry.project,
        task: entry.task,
        entries: {},
        total: 0,
      };
    }
    
    const dateKey = entry.date.toISOString().split("T")[0];
    if (!entriesByRow[rowKey].entries[dateKey]) {
      entriesByRow[rowKey].entries[dateKey] = [];
    }
    entriesByRow[rowKey].entries[dateKey].push(entry);
    entriesByRow[rowKey].total += entry.duration;
  });

  // Fetch clients for the add row functionality
  const clients = await prisma.client.findMany({
    where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
    select: { id: true, name: true, nickname: true },
    orderBy: { name: "asc" },
  });

  // Calculate week navigation dates
  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const formatWeekRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  };

  // Serialize data for client component
  const serializedEntries = Object.entries(entriesByRow).map(([key, data]) => ({
    key,
    client: data.client,
    project: data.project,
    task: data.task,
    entries: Object.fromEntries(
      Object.entries(data.entries).map(([date, entries]: [string, any]) => [
        date,
        entries.map((e: any) => ({
          id: e.id,
          duration: e.duration,
          description: e.description,
          billable: e.billable,
        })),
      ])
    ),
    total: data.total,
  }));

  const serializedWeekDates = weekDates.map((d) => d.toISOString());

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Page Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 24 
        }}>
          <div>
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 600, 
              color: theme.colors.textPrimary, 
              margin: 0,
              marginBottom: 4,
            }}>
              Weekly Timesheet
            </h1>
            {viewUser && viewUserId !== dbUser.id && (
              <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
                Viewing: {viewUser.name || viewUser.email}
              </p>
            )}
          </div>

          {/* User Selector (for admins) */}
          {canViewOthers && teamMembers.length > 0 && (
            <select
              defaultValue={viewUserId}
              onChange={(e) => {
                const params = new URLSearchParams();
                if (e.target.value !== dbUser.id) {
                  params.set("userId", e.target.value);
                }
                if (weekParam) {
                  params.set("week", weekParam);
                }
                window.location.href = `/timesheet${params.toString() ? "?" + params.toString() : ""}`;
              }}
              style={{
                padding: "10px 16px",
                borderRadius: theme.borderRadius.md,
                border: "1px solid " + theme.colors.borderLight,
                background: theme.colors.bgSecondary,
                fontSize: 14,
                minWidth: 200,
              }}
            >
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email} {member.id === dbUser.id ? "(me)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Week Navigation */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16, 
          marginBottom: 24,
          background: theme.colors.bgSecondary,
          padding: "12px 20px",
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
        }}>
          
            href={`/timesheet?week=${prevWeek.toISOString().split("T")[0]}${viewUserId !== dbUser.id ? "&userId=" + viewUserId : ""}`}
            style={{
              padding: "8px 12px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgPrimary,
              textDecoration: "none",
              color: theme.colors.textSecondary,
              fontSize: 14,
            }}
          >
            ← Previous
          </a>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            padding: "8px 16px",
            background: theme.colors.bgTertiary,
            borderRadius: theme.borderRadius.md,
          }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>📅</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: theme.colors.textPrimary }}>
              {formatWeekRange(weekStart, weekEnd)}
            </span>
          </div>
          
          
            href={`/timesheet?week=${nextWeek.toISOString().split("T")[0]}${viewUserId !== dbUser.id ? "&userId=" + viewUserId : ""}`}
            style={{
              padding: "8px 12px",
              borderRadius: theme.borderRadius.sm,
              border: "1px solid " + theme.colors.borderLight,
              background: theme.colors.bgPrimary,
              textDecoration: "none",
              color: theme.colors.textSecondary,
              fontSize: 14,
            }}
          >
            Next →
          </a>

          
            href={`/timesheet${viewUserId !== dbUser.id ? "?userId=" + viewUserId : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: theme.borderRadius.sm,
              background: theme.colors.infoBg,
              color: theme.colors.info,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Today
          </a>
        </div>

        {/* Timesheet Grid */}
        <TimesheetGrid
          weekDates={serializedWeekDates}
          entries={serializedEntries}
          clients={clients}
          userId={viewUserId}
          canEdit={viewUserId === dbUser.id || canViewOthers}
        />
      </main>
    </div>
  );
}
