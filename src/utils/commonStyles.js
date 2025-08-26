import { StyleSheet, Platform } from 'react-native';

// Common reusable styles that work with theme
export const createCommonStyles = (theme) => StyleSheet.create({
    // Container styles
    safeContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
    },
    
    containerWithTopBar: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'android' ? 0 : theme.spacing.md,
    },
    
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
    },
    
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
    },
    
    // Card styles
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.colors.shadow,
    },
    
    cardSmall: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        ...theme.colors.shadowLight,
    },
    
    cardLarge: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        ...theme.colors.shadowHeavy,
    },
    
    // Button styles
    primaryButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: theme.components.button.height,
        ...theme.colors.shadow,
    },
    
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        minHeight: theme.components.button.height,
    },
    
    dangerButton: {
        backgroundColor: theme.colors.error,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: theme.components.button.height,
        ...theme.colors.shadow,
    },
    
    buttonDisabled: {
        backgroundColor: theme.colors.textLight,
        opacity: 0.6,
    },
    
    // Text styles
    primaryButtonText: {
        ...theme.typography.button,
        color: theme.colors.textInverse,
    },
    
    secondaryButtonText: {
        ...theme.typography.button,
        color: theme.colors.primary,
    },
    
    dangerButtonText: {
        ...theme.typography.button,
        color: theme.colors.textInverse,
    },
    
    // Input styles
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        minHeight: theme.components.input.height,
        ...theme.typography.body1,
        color: theme.colors.text,
    },
    
    inputFocused: {
        borderColor: theme.colors.primary,
        ...theme.colors.shadowLight,
    },
    
    inputError: {
        borderColor: theme.colors.error,
    },
    
    // Text styles
    heading1: {
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    
    heading2: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    
    heading3: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    
    bodyText: {
        ...theme.typography.body1,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    
    captionText: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    
    // Status styles
    successText: {
        ...theme.typography.body2,
        color: theme.colors.success,
    },
    
    errorText: {
        ...theme.typography.body2,
        color: theme.colors.error,
    },
    
    warningText: {
        ...theme.typography.body2,
        color: theme.colors.warning,
    },
    
    // Layout helpers
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    
    rowSpaceBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    
    column: {
        flexDirection: 'column',
    },
    
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    // Spacing helpers
    marginXS: { margin: theme.spacing.xs },
    marginSM: { margin: theme.spacing.sm },
    marginMD: { margin: theme.spacing.md },
    marginLG: { margin: theme.spacing.lg },
    marginXL: { margin: theme.spacing.xl },
    
    paddingXS: { padding: theme.spacing.xs },
    paddingSM: { padding: theme.spacing.sm },
    paddingMD: { padding: theme.spacing.md },
    paddingLG: { padding: theme.spacing.lg },
    paddingXL: { padding: theme.spacing.xl },
    
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    
    modalContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        width: '100%',
        maxWidth: 400,
        ...theme.colors.shadowHeavy,
    },
    
    modalHeader: {
        ...theme.typography.h4,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    
    modalContent: {
        marginBottom: theme.spacing.lg,
    },
    
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    
    // Status badge styles
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.round,
        alignSelf: 'flex-start',
    },
    
    statusBadgeNew: {
        backgroundColor: theme.colors.infoLight,
    },
    
    statusBadgeInProgress: {
        backgroundColor: theme.colors.warningLight,
    },
    
    statusBadgeCompleted: {
        backgroundColor: theme.colors.successLight,
    },
    
    statusBadgeText: {
        ...theme.typography.caption,
        fontWeight: '600',
    },
    
    // Loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    
    loadingText: {
        ...theme.typography.body1,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    
    // Divider
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.md,
    },
});

// Status badge color helper
export const getStatusBadgeStyle = (status, theme) => {
    const baseStyle = {
        height:25,
        // width:61,
        paddingHorizontal:12,
        justifyContent:'center',
        alignItems:'center',
        borderRadius: 6,
    };
    
    switch (status?.toLowerCase()) {
        case 'new':
            return {
                ...baseStyle,
                backgroundColor: '#D6D6FD',
            };
        case 'pending':
            return {
                ...baseStyle,
                backgroundColor: theme.colors.infoLight,
            };
        case 'in progress':
        case 'progress':
            return {
                ...baseStyle,
                backgroundColor: '#C5E0FF',
            };
        case 'completed':
        case 'done':
            return {
                ...baseStyle,
                backgroundColor: '#B9E6E8',
            };
        case 'cancelled':
        case 'failed':
            return {
                ...baseStyle,
                backgroundColor: theme.colors.errorLight,
            };
        default:
            return {
                ...baseStyle,
                backgroundColor: theme.colors.borderLight,
            };
    }
};

export default createCommonStyles;
