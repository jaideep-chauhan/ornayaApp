import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TopBar = ({ title, showBack = false, showNotification = true, onNotificationPress }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleNotificationPress = () => {
        if (onNotificationPress) {
            onNotificationPress();
        } else {
            // Default notification action - you can customize this
            console.log('Notification pressed');
        }
    };

    const styles = createStyles(theme, insets);

    return (
        <>
            <StatusBar 
                backgroundColor={theme.colors.background} 
                barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
                translucent={false}
            />
            <View style={styles.header}>
                <View style={styles.leftRow}>
                    {showBack && (
                        <TouchableOpacity onPress={handleGoBack} style={styles.backIcon}>
                            <Icon name="arrow-left" size={22} color={theme.colors.text} />
                        </TouchableOpacity>
                    )}
                    <Text style={[styles.title, theme.typography.h5, { color: theme.colors.text }]}>
                        {title}
                    </Text>
                </View>

                {showNotification ? (
                    <TouchableOpacity onPress={handleNotificationPress} style={styles.notificationIcon}>
                        <View style={styles.notificationBadge}>
                            <Icon name="bell" size={18} color={theme.colors.text} />
                            {/* You can add a notification count badge here */}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>
        </>
    );
};

export default TopBar;

const createStyles = (theme, insets) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? insets.top + theme.spacing.sm : theme.spacing.md,
        paddingBottom: 5,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...theme.colors.shadowLight,
        minHeight: theme.components.topBar.height,
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backIcon: {
        marginRight: theme.spacing.md,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        backgroundColor: 'transparent',
    },
    notificationIcon: {
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        backgroundColor: 'transparent',
    },
    notificationBadge: {
        position: 'relative',
    },
    title: {
        flex: 1,
        fontWeight: '700',
        fontSize: 16,
    },
});
