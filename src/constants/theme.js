export const COLORS = {
  // Primary Colors
  primary: '#009688', // Teal/Cyan - Logo text, main brand color
  secondary: '#4CAF50', // Green - Progress indicators, success states
  accent: '#3F8CFF', // Blue - Buttons, highlights, interactive elements
  
  // Text Colors
  textPrimary: '#333333', // Dark gray - Headings, important text
  textSecondary: '#666666', // Medium gray - Descriptions, subtext
  textLight: '#999999', // Light gray - Hints, placeholders
  textWhite: '#FFFFFF', // White text on dark backgrounds
  
  // Background Colors
  background: '#FFFFFF', // Main background - Clean white
  backgroundSecondary: '#F8FAFC', // Sidebar/Secondary areas - Very light gray/blue
  cardBackground: '#FFFFFF', // Card backgrounds
  inputBackground: '#F8FAFC', // Input fields background
  
  // Status Colors
  success: '#4CAF50', // Green - Success messages, available status
  danger: '#F44336', // Red - Errors, out of stock
  warning: '#FF9800', // Orange - Warnings, pending states
  info: '#3F8CFF', // Blue - Information messages
  
  // Neutral Colors
  border: '#E5E7EB', // Light gray - Borders, dividers
  borderLight: '#F0F0F0', // Very light borders
  shadow: 'rgba(0, 0, 0, 0.1)', // Shadow color
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  
  // Special States
  disabled: '#E0E0E0', // Disabled elements
  placeholder: '#999999', // Placeholder text
  highlight: '#FFF3E0', // Highlight background (light orange)
  
  // Additional UI Colors
  link: '#3F8CFF', // Links
  divider: '#E5E7EB', // Divider lines
  scrollbar: '#E0E0E0', // Scrollbar color
  hover: '#F5F5F5', // Hover state background
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