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

// Theme utilities for the Study Assist app

// CSS Variables for themes
const themes = {
  light: {
    '--primary-color': '#4f46e5', // Indigo 600
    '--primary-dark': '#4338ca', // Indigo 700
    '--primary-light': '#818cf8', // Indigo 400
    '--secondary-color': '#10b981', // Emerald 500
    '--neutral-100': '#f3f4f6',
    '--neutral-200': '#e5e7eb',
    '--neutral-300': '#d1d5db',
    '--neutral-600': '#4b5563',
    '--neutral-700': '#374151',
    '--neutral-800': '#1f2937',
    '--neutral-900': '#111827',
    '--bg-color': '#f3f4f6',
    '--card-bg': '#ffffff',
    '--text-color': '#1f2937',
    '--text-light': '#4b5563',
    '--border-color': '#e5e7eb',
  },
  dark: {
    '--primary-color': '#818cf8', // Indigo 400 (lighter for dark mode)
    '--primary-dark': '#6366f1', // Indigo 500
    '--primary-light': '#a5b4fc', // Indigo 300
    '--secondary-color': '#34d399', // Emerald 400 (lighter for dark mode)
    '--neutral-100': '#374151',
    '--neutral-200': '#1f2937',
    '--neutral-300': '#111827',
    '--neutral-600': '#9ca3af',
    '--neutral-700': '#d1d5db',
    '--neutral-800': '#e5e7eb',
    '--neutral-900': '#f3f4f6',
    '--bg-color': '#111827',
    '--card-bg': '#1f2937',
    '--text-color': '#f3f4f6',
    '--text-light': '#d1d5db',
    '--border-color': '#374151',
  }
};

// Apply theme by setting CSS variables
const applyTheme = (theme) => {
  const root = document.documentElement;
  const themeVars = themes[theme] || themes.light;
  
  // Apply each CSS variable to the root element
  Object.entries(themeVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Add theme class to the body
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${theme}`);
  
  // Store the user's preference
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    console.error('Failed to save theme preference to localStorage:', e);
  }
};

// Get user's preferred theme from localStorage or system preference
const getPreferredTheme = () => {
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check if user prefers dark mode via media query
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    console.error('Error accessing theme preferences:', e);
  }
  
  // Default to light theme
  return 'light';
};

export { applyTheme, getPreferredTheme };