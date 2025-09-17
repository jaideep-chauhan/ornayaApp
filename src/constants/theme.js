// Light Theme Colors (Default)
export const LIGHT_COLORS = {
  // Primary Colors - Matching Portal Theme
  primary: '#009688', // Main theme color (Teal)
  primaryHover: '#00796B', // Darker shade for hover/pressed
  primaryLight: '#4DB6AC', // Lighter shade
  secondary: '#4CAF50', // Green - Progress indicators, success states
  accent: '#3F8CFF', // Accent Blue for highlights
  
  // Text Colors - Matching Portal
  textPrimary: '#333333', // Primary text color
  textSecondary: '#666666', // Secondary text color
  textLight: '#9CA3AF', // Light gray - Hints, placeholders
  textWhite: '#FFFFFF', // White text on dark backgrounds
  textMuted: '#666666', // Disabled/muted text
  
  // Background Colors - Matching Portal
  background: '#FFFFFF', // Main background color
  backgroundSecondary: '#F8FAFC', // Input/Sidebar background
  cardBackground: '#FFFFFF', // Card backgrounds
  inputBackground: '#F8FAFC', // Input fields background
  
  // Status Colors - Matching Portal
  success: '#4CAF50', // Success/Progress text color
  danger: '#F44336', // Error/Danger text color
  warning: '#FF9800', // Warning text color
  info: '#3F8CFF', // Information messages
  
  // Neutral Colors - Matching Portal
  border: '#E5E7EB', // Border color for inputs
  borderLight: '#F0F0F0', // Very light borders
  shadow: 'rgba(0, 0, 0, 0.1)', // Shadow color
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  
  // Special States - Matching Portal
  disabled: '#E5E7EB', // Disabled button background (muted-bg)
  disabledText: '#666666', // Disabled button text (muted-foreground)
  placeholder: '#9CA3AF', // Placeholder text
  highlight: '#FFF3E0', // Highlight background
  
  // Additional UI Colors
  link: '#3F8CFF', // Link color using accent blue
  divider: '#E5E7EB', // Divider lines
  scrollbar: '#E5E7EB', // Scrollbar color
  hover: '#F8FAFC', // Hover state background
  ring: '#009688', // Focus ring color
};

// Dark Theme Colors - Matching Portal Theme
export const DARK_COLORS = {
  // Primary Colors - Matching Portal Dark Theme
  primary: '#009688', // Main theme color (Teal)
  primaryHover: '#00796B', // Darker shade for hover/pressed
  primaryLight: '#4DB6AC', // Lighter shade
  secondary: '#4CAF50', // Green - Progress indicators, success states
  accent: '#3F8CFF', // Accent Blue for highlights
  
  // Text Colors - Dark Theme
  textPrimary: '#D1D5DB', // Light text for readability
  textSecondary: '#9CA3AF', // Secondary text color
  textLight: '#6B7280', // Light gray - Hints, placeholders
  textWhite: '#FFFFFF', // White text
  textMuted: '#9CA3AF', // Disabled/muted text
  
  // Background Colors - Dark Theme
  background: '#0F0F0F', // Dark background
  backgroundSecondary: '#1F2937', // Input background
  cardBackground: '#1A1A1A', // Card backgrounds
  inputBackground: '#1F2937', // Input fields background
  
  // Status Colors - Same in Dark Theme
  success: '#4CAF50', // Success/Progress text color
  danger: '#F44336', // Error/Danger text color
  warning: '#FF9800', // Warning text color
  info: '#3F8CFF', // Information messages
  
  // Neutral Colors - Dark Theme
  border: '#374151', // Border color for inputs
  borderLight: '#1F2937', // Very light borders
  shadow: 'rgba(0, 0, 0, 0.3)', // Shadow color
  overlay: 'rgba(0, 0, 0, 0.7)', // Modal overlay
  
  // Special States - Dark Theme
  disabled: '#374151', // Disabled button background
  disabledText: '#9CA3AF', // Disabled button text
  placeholder: '#6B7280', // Placeholder text
  highlight: '#2D3748', // Highlight background
  
  // Additional UI Colors - Dark Theme
  link: '#3F8CFF', // Link color (brighter for dark theme)
  divider: '#374151', // Divider lines
  scrollbar: '#374151', // Scrollbar color
  hover: '#1F2937', // Hover state background
  ring: '#009688', // Focus ring color
};

// Default to light theme (can be dynamically switched)
export let COLORS = LIGHT_COLORS;

// Function to switch theme colors
export const setThemeColors = (isDark) => {
  COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  header: 32,
};

export const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  xl: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 5.0,
    elevation: 8,
  },
};

export const theme = {
  colors: COLORS,
  spacing: SPACING,
  fontSizes: FONT_SIZES,
  fontWeights: FONT_WEIGHTS,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

export default theme;