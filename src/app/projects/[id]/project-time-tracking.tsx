"use client";

import { theme } from "@/lib/theme";

interface TimeEntry {
  id: string;
  duration: number;
  date: string;
  description: string | null;
  user: { id: string; name: string | null; email: string };
  task: { id: string; name: string };
}

interface Props {
  projectId: string;
  totalTime: number;
  entries: TimeEntry[];
}

export default function ProjectTimeTracking({ projectId, totalTime, entries }: Props) {
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group entries by user
  const byUser: Record<string, { user: TimeEntry["user"]; total: number; entries: TimeEntry[] }> = {};
  entries.forEach((entry) => {
    if (!byUser[entry.user.id]) {
      byUser[entry.user.id] = { user: entry.user, total: 0, entries: [] };
    }
    byUser[entry.user.id].total += entry.duration;
    byUser[entry.user.id].entries.push(entry);
  });

  const userList = Object.values(byUser).sort((a, b) => b.total - a.total);

  return (
    <div style={{
      background: theme.colors.bgSecondary,
      padding: 24,
      borderRadius: theme.borderRadius.lg,
      border: "1px solid " + theme.colors.borderLight,
      marginBottom: 24,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          margin: 0,
        }}>
          Time Tracked
        </h3>
        <div style={{
          background: theme.colors.successBg,
          color: theme.colors.success,
          padding: "6px 12px",
          borderRadius: theme.borderRadius.md,
          fontWeight: 600,
          fontSize: 14,
        }}>
          {formatDuration(totalTime)}
        </div>
      </div>

      {entries.length === 0 ? (
        <p style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: "center", padding: "16px 0", margin: 0 }}>
          No time tracked yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {userList.map(({ user, total, entries: userEntries }) => (
            <div key={user.id}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: theme.gradients.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 11,
                  }}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 14, color: theme.colors.textPrimary }}>
                    {user.name || user.email.split("@")[0]}
                  </span>
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: theme.colors.textPrimary }}>
                  {formatDuration(total)}
                </span>
              </div>

              {/* Recent entries for this user */}
              <div style={{ 
                marginLeft: 38, 
                display: "flex", 
                flexDirection: "column", 
                gap: 4,
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}>
                {userEntries.slice(0, 3).map((entry) => (
                  <div key={entry.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      {entry.task.name}
                      {entry.description && ` - ${entry.description}`}
                    </span>
                    <span style={{ color: theme.colors.textMuted }}>
                      {formatDate(entry.date)} • {formatDuration(entry.duration)}
                    </span>
                  </div>
                ))}
                {userEntries.length > 3 && (
                  <span style={{ color: theme.colors.textMuted }}>
                    +{userEntries.length - 3} more entries
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
