// Omnixia Portal Theme Configuration
// Change colors here and update imports across pages

export const theme = {
  colors: {
    // Brand Colors
    primary: "#7B68EE",
    primaryDark: "#6A5ACD",
    accent: "#9D8DF7",
    
    // Backgrounds
    bgPrimary: "#f8f9fa",
    bgSecondary: "#ffffff",
    bgTertiary: "#f1f3f4",
    
    // Text
    textPrimary: "#1a1a1a",
    textSecondary: "#5f6368",
    textMuted: "#9aa0a6",
    
    // Borders
    borderLight: "#e8eaed",
    borderMedium: "#dadce0",
    
    // Status Colors
    success: "#34a853",
    successBg: "#e6f4ea",
    warning: "#f9ab00",
    warningBg: "#fef7e0",
    error: "#ea4335",
    errorBg: "#fce8e6",
    info: "#7B68EE",
    infoBg: "#EDE9FE",
    purple: "#7B68EE",
    purpleBg: "#EDE9FE",
    primaryBg: "#EDE9FE",
  },
  
  gradients: {
    primary: "linear-gradient(135deg, #7B68EE, #6A5ACD)",
    accent: "linear-gradient(135deg, #7B68EE, #9D8DF7)",
    progress: "linear-gradient(90deg, #7B68EE, #9D8DF7)",
    progressComplete: "linear-gradient(90deg, #34a853, #4caf50)",
  },
  
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.07)",
    lg: "0 10px 25px rgba(0, 0, 0, 0.1)",
    button: "0 2px 8px rgba(123, 104, 238, 0.3)",
  },
  
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
};

// Status badge styles - ready to use
export const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  // Client statuses
  ACTIVE: { bg: theme.colors.successBg, color: theme.colors.success },
  ONBOARDING: { bg: theme.colors.infoBg, color: theme.colors.info },
  LEAD: { bg: theme.colors.warningBg, color: theme.colors.warning },
  PAUSED: { bg: theme.colors.errorBg, color: theme.colors.error },
  CHURNED: { bg: theme.colors.bgTertiary, color: theme.colors.textSecondary },
  
  // Project statuses
  DRAFT: { bg: theme.colors.bgTertiary, color: theme.colors.textSecondary },
  PENDING_APPROVAL: { bg: theme.colors.warningBg, color: theme.colors.warning },
  IN_PROGRESS: { bg: theme.colors.infoBg, color: theme.colors.info },
  ON_HOLD: { bg: theme.colors.errorBg, color: theme.colors.error },
  COMPLETED: { bg: theme.colors.successBg, color: theme.colors.success },
  CANCELLED: { bg: theme.colors.bgTertiary, color: theme.colors.textSecondary },
  
  // Task statuses
  PENDING: { bg: theme.colors.warningBg, color: theme.colors.warning },
  ONGOING: { bg: theme.colors.successBg, color: theme.colors.success },
  FUTURE_PLAN: { bg: theme.colors.purpleBg, color: theme.colors.purple },
};

// Priority styles
export const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: theme.colors.errorBg, color: theme.colors.error },
  MEDIUM: { bg: theme.colors.warningBg, color: theme.colors.warning },
  LOW: { bg: theme.colors.successBg, color: theme.colors.success },
};

// Role styles
export const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  SUPER_ADMIN: { bg: "#FEE2E2", color: "#DC2626" },
  ADMIN: { bg: theme.colors.errorBg, color: theme.colors.error },
  MANAGER: { bg: theme.colors.warningBg, color: theme.colors.warning },
  MEMBER: { bg: theme.colors.infoBg, color: theme.colors.info },
  CLIENT: { bg: theme.colors.successBg, color: theme.colors.success },
};

export default theme;
