// Omnixia Portal Theme Configuration - Wick Firm Branding
// Light Mode

export const theme = {
  colors: {
    // Wick Firm Brand Colors
    primary: "#76527c",        // Purple
    primaryDark: "#5f4263",    // Darker purple
    accent: "#d8ee91",         // Lime green
    
    // Secondary brand colors
    wickBlue: "#d0e4e7",       // Light blue
    wickPeach: "#f6dab9",      // Peach
    
    // Omnixia Platform Colors (for platform admin only)
    omnixiaPurple: "#8B5CF6",
    omnixiaPurpleDark: "#7C3AED",
    omnixiaNavy: "#1e1b4b",
    omnixiaAccent: "#a78bfa",
    
    // Backgrounds
    bgPrimary: "#fafafa",      // Very light gray
    bgSecondary: "#ffffff",    // White
    bgTertiary: "#f5f5f5",     // Light gray
    
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
    info: "#76527c",           // Using Wick purple for info
    infoBg: "#f3eef4",         // Light purple bg
    purple: "#76527c",         // Wick purple
    purpleBg: "#f3eef4",       // Light purple bg
    primaryBg: "#f3eef4",      // Light purple bg
  },
  
  gradients: {
    primary: "linear-gradient(135deg, #76527c, #5f4263)",
    accent: "linear-gradient(135deg, #76527c, #d8ee91)",
    progress: "linear-gradient(90deg, #76527c, #d8ee91)",
    progressComplete: "linear-gradient(90deg, #34a853, #4caf50)",
    
    // Wick brand gradient
    wick: "linear-gradient(135deg, #76527c, #d0e4e7)",
    wickAccent: "linear-gradient(135deg, #d8ee91, #f6dab9)",
    
    // Omnixia Gradients (platform admin only)
    omnixia: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
    omnixiaAccent: "linear-gradient(135deg, #a78bfa, #8B5CF6)",
  },
  
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.07)",
    lg: "0 10px 25px rgba(0, 0, 0, 0.1)",
    button: "0 2px 8px rgba(118, 82, 124, 0.3)",  // Wick purple shadow
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
  URGENT: { bg: theme.colors.errorBg, color: theme.colors.error },
  HIGH: { bg: theme.colors.errorBg, color: theme.colors.error },
  MEDIUM: { bg: theme.colors.warningBg, color: theme.colors.warning },
  LOW: { bg: theme.colors.successBg, color: theme.colors.success },
};

// Role styles
export const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  PLATFORM_ADMIN: { bg: "#f3e8ff", color: theme.colors.omnixiaPurple },
  SUPER_ADMIN: { bg: "#FEE2E2", color: "#DC2626" },
  ADMIN: { bg: theme.colors.errorBg, color: theme.colors.error },
  MANAGER: { bg: theme.colors.warningBg, color: theme.colors.warning },
  MEMBER: { bg: theme.colors.infoBg, color: theme.colors.info },
  CLIENT: { bg: theme.colors.successBg, color: theme.colors.success },
};

export default theme;
