// Omnixia Portal Theme Configuration
// Dark Mode

export const theme = {
  colors: {
    // Brand Colors
    primary: "#9D8DF7",
    primaryDark: "#7B68EE",
    accent: "#B8A9FF",
    
    // Backgrounds
    bgPrimary: "#0F0D2A",
    bgSecondary: "#1A1840",
    bgTertiary: "#252350",
    
    // Text
    textPrimary: "#F0F0F5",
    textSecondary: "#B8B8D0",
    textMuted: "#7878A0",
    
    // Borders
    borderLight: "#2D2B55",
    borderMedium: "#3D3B65",
    
    // Status Colors
    success: "#4ADE80",
    successBg: "#1A3D2E",
    warning: "#FCD34D",
    warningBg: "#3D3520",
    error: "#F87171",
    errorBg: "#3D1F1F",
    info: "#9D8DF7",
    infoBg: "#2D2860",
    purple: "#9D8DF7",
    purpleBg: "#2D2860",
    primaryBg: "#2D2860",
  },
  
  gradients: {
    primary: "linear-gradient(135deg, #9D8DF7, #7B68EE)",
    accent: "linear-gradient(135deg, #9D8DF7, #B8A9FF)",
    progress: "linear-gradient(90deg, #9D8DF7, #B8A9FF)",
    progressComplete: "linear-gradient(90deg, #4ADE80, #22C55E)",
  },
  
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.2)",
    md: "0 4px 6px rgba(0, 0, 0, 0.3)",
    lg: "0 10px 25px rgba(0, 0, 0, 0.4)",
    button: "0 2px 8px rgba(157, 141, 247, 0.4)",
  },
  
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
};

// Status badge styles
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
  SUPER_ADMIN: { bg: "#3D1F1F", color: "#F87171" },
  ADMIN: { bg: theme.colors.errorBg, color: theme.colors.error },
  MANAGER: { bg: theme.colors.warningBg, color: theme.colors.warning },
  MEMBER: { bg: theme.colors.infoBg, color: theme.colors.info },
  CLIENT: { bg: theme.colors.successBg, color: theme.colors.success },
};

export default theme;
