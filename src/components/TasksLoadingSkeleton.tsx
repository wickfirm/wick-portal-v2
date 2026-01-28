/**
 * TasksLoadingSkeleton Component
 * Reusable skeleton loader for tasks table
 */

import { theme } from "@/lib/theme";

export default function TasksLoadingSkeleton() {
  return (
    <div style={{ 
      background: theme.colors.bgSecondary, 
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.borderLight}`,
      overflow: "hidden"
    }}>
      {/* Header Skeleton */}
      <div style={{
        padding: "16px 20px",
        background: theme.colors.bgPrimary,
        borderBottom: `1px solid ${theme.colors.borderLight}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{
          height: 20,
          width: 150,
          background: theme.colors.bgTertiary,
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite"
        }} />
        <div style={{
          height: 32,
          width: 100,
          background: theme.colors.bgTertiary,
          borderRadius: theme.borderRadius.md,
          animation: "pulse 1.5s ease-in-out infinite"
        }} />
      </div>

      {/* Table Rows Skeleton */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          style={{
            padding: "16px 20px",
            borderBottom: i < 8 ? `1px solid ${theme.colors.bgTertiary}` : "none",
            display: "grid",
            gridTemplateColumns: "1fr 120px 120px 100px 150px",
            gap: 16,
            alignItems: "center"
          }}
        >
          {/* Task Name */}
          <div style={{
            height: 16,
            width: `${60 + Math.random() * 40}%`,
            background: theme.colors.bgTertiary,
            borderRadius: 4,
            animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
          }} />
          
          {/* Priority */}
          <div style={{
            height: 24,
            width: 70,
            background: theme.colors.bgTertiary,
            borderRadius: 12,
            animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
          }} />
          
          {/* Status */}
          <div style={{
            height: 24,
            width: 90,
            background: theme.colors.bgTertiary,
            borderRadius: 12,
            animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
          }} />
          
          {/* Due Date */}
          <div style={{
            height: 16,
            width: 80,
            background: theme.colors.bgTertiary,
            borderRadius: 4,
            animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
          }} />
          
          {/* Assignee */}
          <div style={{
            height: 16,
            width: 120,
            background: theme.colors.bgTertiary,
            borderRadius: 4,
            animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
          }} />
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
