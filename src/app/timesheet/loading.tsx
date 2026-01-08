import Header from "@/components/Header";
import { theme } from "@/lib/theme";

export default function TimesheetLoading() {
  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            height: 32, 
            width: 200, 
            background: theme.colors.bgTertiary, 
            borderRadius: theme.borderRadius.md,
            marginBottom: 8,
          }} />
        </div>
        
        <div style={{
          background: theme.colors.bgSecondary,
          borderRadius: theme.borderRadius.lg,
          border: "1px solid " + theme.colors.borderLight,
          padding: 48,
          textAlign: "center",
        }}>
          <div style={{ color: theme.colors.textMuted, fontSize: 14 }}>
            Loading timesheet...
          </div>
        </div>
      </main>
    </div>
  );
}
