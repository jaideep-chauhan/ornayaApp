import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Theme Context
const ThemeContext = createContext();

// Theme configurations
const lightTheme = {
    mode: 'light',
    colors: {
        // Primary colors
        primary: '#007BFF',
        primaryDark: '#0056B3',
        primaryLight: '#66B3FF',
        
        // Secondary colors
        secondary: '#6C757D',
        secondaryLight: '#ADB5BD',
        
        // Background colors
        background: '#F8F9FA',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        overlay: 'rgba(0, 0, 0, 0.5)',
        
        // Text colors
        text: '#212529',
        textSecondary: '#6C757D',
        textLight: '#ADB5BD',
        textInverse: '#FFFFFF',
        
        // Border colors
        border: '#DEE2E6',
        borderLight: '#E9ECEF',
        
        // Status colors
        success: '#28A745',
        warning: '#FFC107',
        error: '#DC3545',
        info: '#17A2B8',
        
        // Status light variants
        successLight: '#D4EDDA',
        warningLight: '#FFF3CD',
        errorLight: '#F8D7DA',
        infoLight: '#D1ECF1',
        
        // Custom colors
        gold: '#FFD700',
        platinum: '#E5E4E2',
        silver: '#C0C0C0',
        
        // Shadows (reduced for lighter appearance)
        shadow: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 2,
            elevation: 1,
        },
        shadowLight: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 0.5 },
            shadowOpacity: 0.02,
            shadowRadius: 1,
            elevation: 0.5,
        },
        shadowHeavy: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
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
        ...lightTheme.colors,
        // Override dark theme colors
        background: '#121212',
        surface: '#1E1E1E',
        card: '#2C2C2C',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        textLight: '#808080',
        border: '#404040',
        borderLight: '#303030',
        overlay: 'rgba(255, 255, 255, 0.1)',
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
