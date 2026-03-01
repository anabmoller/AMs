// ============================================================
// YPOTI COMPRAS — TEMA / ESTILOS (Dark Mode)
// Dark theme with emerald accents
// ============================================================

export const colors = {
  // Core brand
  primary: "#10b981",        // Emerald-500
  primaryDark: "#059669",    // Emerald-600
  primaryLight: "rgba(16,185,129,0.1)",
  primaryMid: "#34d399",     // Emerald-400

  secondary: "#7B3014",
  secondaryLight: "rgba(123,48,20,0.1)",

  // Accent
  accent: "#10b981",
  accentLight: "#34d399",

  // Dark mode neutrals
  bg: "#0a0b0f",
  surface: "rgba(255,255,255,0.05)",
  card: "rgba(255,255,255,0.03)",
  text: "#ffffff",
  textSecondary: "#cbd5e1",  // Slate-300
  textLight: "#94a3b8",      // Slate-400
  textMuted: "#64748b",      // Slate-500
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.06)",

  // Semantic
  success: "#10b981",
  successLight: "rgba(16,185,129,0.1)",
  warning: "#f59e0b",
  warningLight: "rgba(245,158,11,0.1)",
  danger: "#ef4444",
  dangerLight: "rgba(239,68,68,0.1)",
  info: "#3b82f6",
  infoLight: "rgba(59,130,246,0.1)",

  // Priority colors
  priorityLow: "#64748b",
  priorityMedium: "#f59e0b",
  priorityHigh: "#f97316",
  priorityEmergency: "#ef4444",
};

// Typography
export const font = "'Inter', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
export const fontDisplay = "'Inter', sans-serif";
export const fontMono = "'JetBrains Mono', 'SF Mono', 'Consolas', monospace";

// Shared styles
export const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: colors.textLight,
  marginBottom: 6,
  letterSpacing: "0.02em",
  fontFamily: font,
};

export const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.05)",
  fontFamily: font,
  fontSize: 14,
  color: colors.text,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

// Shadows (dark mode appropriate)
export const shadows = {
  xs: "0 1px 2px rgba(0,0,0,0.3)",
  sm: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
  md: "0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
  lg: "0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2)",
  xl: "0 20px 25px rgba(0,0,0,0.4), 0 8px 10px rgba(0,0,0,0.3)",
  card: "0 1px 3px rgba(0,0,0,0.2)",
  dropdown: "0 4px 16px rgba(0,0,0,0.5)",
  modal: "0 20px 60px rgba(0,0,0,0.6)",
};

// Border radius
export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
