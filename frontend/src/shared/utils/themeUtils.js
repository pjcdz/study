/**
 * Theme colors for consistent styling across the study tool application
 */
export const THEME_COLORS = {
  // Core colors
  background: "#0D1117",
  backgroundDarker: "#0C0C0C",
  primary: "#82AAFF",
  secondary: "#C792EA",
  accent: "#FFCB6B",
  text: "#D0D6E3",
  textDimmed: "#A6ACCD",
  error: "#FF5370",
  success: "#C3E88D",
  border: "#1E2430",
  glow: "rgba(130, 170, 255, 0.15)",
  
  // UI element colors
  card: {
    background: "#1A2233",
    border: "#2A3343"
  },
  button: {
    primary: "#4D78CC",
    secondary: "#9D65D0",
    danger: "#E5535B"
  }
};

/**
 * Custom scrollbar styles for application components
 */
export const SCROLLBAR_STYLE = `
  /* Chrome, Edge, and Safari */
  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    background: ${THEME_COLORS.background};
  }

  ::-webkit-scrollbar-thumb {
    background: ${THEME_COLORS.border};
    border-radius: 4px;
    border: 2px solid ${THEME_COLORS.background};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${THEME_COLORS.primary}40;
  }

  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${THEME_COLORS.border} ${THEME_COLORS.background};
  }
`;