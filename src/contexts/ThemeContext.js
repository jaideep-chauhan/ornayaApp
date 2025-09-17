import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/theme';

// Create Theme Context
const ThemeContext = createContext();

// Theme configurations - Matching Portal Theme
const lightTheme = {
    mode: 'light',
    colors: {
        // Primary colors - Portal Theme
        primary: LIGHT_COLORS.primary, // #009688 - Teal
        primaryDark: LIGHT_COLORS.primaryHover, // #00796B
        primaryLight: LIGHT_COLORS.primaryLight, // #4DB6AC
        
        // Secondary colors
        secondary: LIGHT_COLORS.secondary, // #4CAF50 - Green
        secondaryLight: '#81C784',
        accent: LIGHT_COLORS.accent, // #3F8CFF - Blue
        
        // Background colors
        background: LIGHT_COLORS.background, // #FFFFFF
        surface: LIGHT_COLORS.cardBackground, // #FFFFFF
        card: LIGHT_COLORS.cardBackground, // #FFFFFF
        inputBg: LIGHT_COLORS.inputBackground, // #F8FAFC
        overlay: LIGHT_COLORS.overlay,
        
        // Text colors
        text: LIGHT_COLORS.textPrimary, // #333333
        textSecondary: LIGHT_COLORS.textSecondary, // #666666
        textLight: LIGHT_COLORS.textLight, // #9CA3AF
        textInverse: LIGHT_COLORS.textWhite, // #FFFFFF
        textMuted: LIGHT_COLORS.textMuted, // #666666
        
        // Border colors
        border: LIGHT_COLORS.border, // #E5E7EB
        borderLight: LIGHT_COLORS.borderLight, // #F0F0F0
        
        // Status colors - Portal Theme
        success: LIGHT_COLORS.success, // #4CAF50
        warning: LIGHT_COLORS.warning, // #FF9800
        error: LIGHT_COLORS.danger, // #F44336
        info: LIGHT_COLORS.info, // #3F8CFF
        
        // Status light variants
        successLight: '#E8F5E8',
        warningLight: '#FFF0E0',
        errorLight: '#FFEBEE',
        infoLight: '#E3F2FD',
        
        // Special colors
        disabled: LIGHT_COLORS.disabled, // #E5E7EB
        disabledText: LIGHT_COLORS.disabledText, // #666666
        placeholder: LIGHT_COLORS.placeholder, // #9CA3AF
        link: LIGHT_COLORS.link, // #3F8CFF
        ring: LIGHT_COLORS.ring, // #009688
        
        // Custom material colors
        gold: '#FFD700',
        platinum: '#E5E4E2',
        silver: '#C0C0C0',
        
        // Shadows - Matching Portal (lighter)
        shadow: {
            shadowColor: LIGHT_COLORS.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
        },
        shadowLight: {
            shadowColor: LIGHT_COLORS.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        shadowHeavy: {
            shadowColor: LIGHT_COLORS.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 5,
        },
    },
    
    // Spacing system
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    
    // Typography
    typography: {
        h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
        h2: { fontSize: 28, fontWeight: '600', lineHeight: 36 },
        h3: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
        h4: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
        h5: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
        h6: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
        body1: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
        body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
        caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
        button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
        overline: { fontSize: 10, fontWeight: '600', lineHeight: 16, textTransform: 'uppercase' },
    },
    
    // Border radius
    borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        xxl: 24,
        round: 50,
    },
    
    // Component specific styles
    components: {
        topBar: {
            height: 56,
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        button: {
            height: 48,
            paddingHorizontal: 16,
            borderRadius: 8,
        },
        input: {
            height: 48,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
        },
        card: {
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
        },
        modal: {
            borderRadius: 16,
            padding: 24,
            margin: 16,
        },
    },
};

const darkTheme = {
    ...lightTheme,
    mode: 'dark',
    colors: {
        // Primary colors - Portal Dark Theme
        primary: DARK_COLORS.primary, // #009688 - Teal (same)
        primaryDark: DARK_COLORS.primaryHover, // #00796B
        primaryLight: DARK_COLORS.primaryLight, // #4DB6AC
        
        // Secondary colors
        secondary: DARK_COLORS.secondary, // #4CAF50 - Green
        secondaryLight: '#81C784',
        accent: DARK_COLORS.accent, // #3F8CFF - Blue
        
        // Background colors - Dark Theme
        background: DARK_COLORS.background, // #0F0F0F
        surface: DARK_COLORS.cardBackground, // #1A1A1A
        card: DARK_COLORS.cardBackground, // #1A1A1A
        inputBg: DARK_COLORS.inputBackground, // #1F2937
        overlay: DARK_COLORS.overlay, // rgba(0, 0, 0, 0.7)
        
        // Text colors - Dark Theme
        text: DARK_COLORS.textPrimary, // #D1D5DB
        textSecondary: DARK_COLORS.textSecondary, // #9CA3AF
        textLight: DARK_COLORS.textLight, // #6B7280
        textInverse: '#0F0F0F', // Dark for light backgrounds
        textMuted: DARK_COLORS.textMuted, // #9CA3AF
        
        // Border colors - Dark Theme
        border: DARK_COLORS.border, // #374151
        borderLight: DARK_COLORS.borderLight, // #1F2937
        
        // Status colors - Same in Dark Theme
        success: DARK_COLORS.success, // #4CAF50
        warning: DARK_COLORS.warning, // #FF9800
        error: DARK_COLORS.danger, // #F44336
        info: DARK_COLORS.info, // #3F8CFF
        
        // Status light variants - Dark Theme
        successLight: '#1B3A20',
        warningLight: '#3D2814',
        errorLight: '#3C1A1A',
        infoLight: '#1A2B3D',
        
        // Special colors - Dark Theme
        disabled: DARK_COLORS.disabled, // #374151
        disabledText: DARK_COLORS.disabledText, // #9CA3AF
        placeholder: DARK_COLORS.placeholder, // #6B7280
        link: DARK_COLORS.link, // #3F8CFF
        ring: DARK_COLORS.ring, // #009688
        
        // Custom material colors
        gold: '#FFD700',
        platinum: '#E5E4E2',
        silver: '#C0C0C0',
        
        // Shadows - Dark Theme
        shadow: {
            shadowColor: DARK_COLORS.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 2,
        },
        shadowLight: {
            shadowColor: DARK_COLORS.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 1,
        },
        shadowHeavy: {
            shadowColor: DARK_COLORS.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 5,
        },
    },
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [theme, setTheme] = useState(lightTheme);

    useEffect(() => {
        // Load saved theme preference
        loadThemePreference();
        
        // Listen to system theme changes
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (colorScheme === 'dark') {
                setTheme(darkTheme);
                setIsDarkMode(true);
            } else {
                setTheme(lightTheme);
                setIsDarkMode(false);
            }
        });

        return () => subscription?.remove();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('themePreference');
            if (savedTheme) {
                const isDark = savedTheme === 'dark';
                setIsDarkMode(isDark);
                setTheme(isDark ? darkTheme : lightTheme);
            }
        } catch (error) {
            console.log('Error loading theme preference:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newIsDarkMode = !isDarkMode;
            setIsDarkMode(newIsDarkMode);
            setTheme(newIsDarkMode ? darkTheme : lightTheme);
            await AsyncStorage.setItem('themePreference', newIsDarkMode ? 'dark' : 'light');
            
            // Update status bar
            StatusBar.setBarStyle(newIsDarkMode ? 'light-content' : 'dark-content', true);
        } catch (error) {
            console.log('Error saving theme preference:', error);
        }
    };

    const value = {
        theme,
        isDarkMode,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to use theme
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
