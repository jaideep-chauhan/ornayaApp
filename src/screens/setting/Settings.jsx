import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Switch,
    SafeAreaView,
    ScrollView,
    Alert,
    Platform,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopBar from '../../components/ui/TopBar';
import { useNavigation } from '@react-navigation/native';
import { logoutUser, updateUserPreferences } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { createCommonStyles } from '../../utils/commonStyles';
import Toast from 'react-native-toast-message';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Settings = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { user, loading } = useSelector((state) => state.auth);
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const commonStyles = createCommonStyles(theme);

    const [preferences, setPreferences] = useState({
        notifications: true,
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
    });

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const preferences = await AsyncStorage.getItem('appPreferences');
            if (preferences) {
                const parsed = JSON.parse(preferences);
                setNotificationsEnabled(parsed.notifications ?? true);
                setDarkMode(parsed.darkMode ?? false);
            }
        } catch (error) {
            // Error loading preferences
        }
    };

    const savePreferences = async (newPreferences) => {
        try {
            await AsyncStorage.setItem('userPreferences', JSON.stringify(newPreferences));
            setPreferences(newPreferences);
        } catch (error) {
            // Error saving preferences
        }
    };

    const togglePreference = (key) => {
        const newPreferences = {
            ...preferences,
            [key]: !preferences[key]
        };
        savePreferences(newPreferences);
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out of your account?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => {
                        Toast.show({
                            type: 'success',
                            text1: '👋 Signed Out Successfully',
                            text2: 'You have been securely signed out of your account.',
                            visibilityTime: 3000,
                            position: 'top',
                            topOffset: 60,
                        });
                        dispatch(logoutUser());
                    },
                },
            ]
        );
    };

    const handleAbout = () => {
        Alert.alert(
            'About Manufacturing App',
            'Version 1.0.0\n\nA comprehensive manufacturing management solution for jewelry and accessories.\n\n© 2025 Manufacturing Solutions',
            [{ text: 'OK' }]
        );
    };

    const handleSupport = () => {
        Alert.alert(
            'Help & Support',
            'Need help? Contact our support team:\n\nEmail: support@manufacturing.com\nPhone: +1 (555) 123-4567\n\nOperating Hours:\nMon-Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM',
            [{ text: 'OK' }]
        );
    };

    const formatUserRole = (role) => {
        if (!role) return 'Manufacturing Professional';
        return role.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="Settings" showBack={true} showNotification={true} />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username?.trim() || 'User')}&background=1E40AF&color=fff&size=150`
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineIndicator} />
                    </View>
                    <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>
                                {user?.username?.trim() || 'Manufacturing User'}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                                <Feather name="edit-2" size={16} style={styles.editIcon} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.email}>
                            User ID: {user?.user_id || 'N/A'}
                        </Text>
                        <Text style={styles.role}>
                            Company Key: {user?.company_key || 'N/A'}
                        </Text>
                        <View style={styles.membershipBadge}>
                            <Text style={styles.membershipText}>
                                Member ID: {user?.member_id || 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Active Orders</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>45</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>98%</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Account Settings */}
                <SectionHeader title="Account Settings" icon="user-cog" />
                <SettingsItem
                    icon="user-edit"
                    label="Edit Profile"
                    subtitle="Update your personal information"
                    onPress={() => navigation.navigate('EditProfile')}
                />
                <SettingsItem
                    icon="shield-alt"
                    label="Privacy Settings"
                    subtitle="Manage your privacy preferences"
                    onPress={() => Alert.alert('Feature Coming Soon', 'Privacy settings will be available soon.')}
                />

                {/* Notification Settings */}                {/* Notifications */}
                <SectionHeader title="Notifications" icon="bell" />
                <SettingsItem
                    icon="bell"
                    label="Push Notifications"
                    subtitle="Receive notifications on your device"
                    rightContent={
                        <Switch
                            value={preferences.pushNotifications}
                            onValueChange={() => togglePreference('pushNotifications')}
                            trackColor={{ false: COLORS.border, true: COLORS.accent }}
                            thumbColor={COLORS.textWhite}
                        />
                    }
                />
                <SettingsItem
                    icon="envelope"
                    label="Email Notifications"
                    subtitle="Receive notifications via email"
                    rightContent={
                        <Switch
                            value={preferences.emailNotifications}
                            onValueChange={() => togglePreference('emailNotifications')}
                            trackColor={{ false: COLORS.border, true: COLORS.accent }}
                            thumbColor={COLORS.textWhite}
                        />
                    }
                />
                <SettingsItem
                    icon="volume-up"
                    label="Sound"
                    subtitle="Enable notification sounds"
                    rightContent={
                        <Switch
                            value={preferences.soundEnabled}
                            onValueChange={() => togglePreference('soundEnabled')}
                            trackColor={{ false: COLORS.border, true: COLORS.accent }}
                            thumbColor={COLORS.textWhite}
                        />
                    }
                />

                {/* Appearance Settings */}
                <SectionHeader title="Appearance" icon="palette" />
                <SettingsItem
                    icon="moon"
                    label="Dark Mode"
                    subtitle="Switch between light and dark theme"
                    rightContent={
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={theme.colors.surface}
                        />
                    }
                />

                {/* Developer Tools */}
                <SectionHeader title="Developer Tools" icon="code" />
                <SettingsItem
                    icon="vial"
                    label="API Test Suite"
                    subtitle="Test all API endpoints"
                    onPress={() => navigation.navigate('ApiTest')}
                />

                {/* Support & Info */}
                <SectionHeader title="Support & Information" icon="info-circle" />
                <SettingsItem
                    icon="question-circle"
                    label="Help & Support"
                    subtitle="Get help and contact support"
                    onPress={handleSupport}
                />
                <SettingsItem
                    icon="file-alt"
                    label="Terms of Service"
                    subtitle="Read our terms and conditions"
                    onPress={() => Alert.alert('Feature Coming Soon', 'Terms of Service will be available soon.')}
                />
                <SettingsItem
                    icon="user-shield"
                    label="Privacy Policy"
                    subtitle="Our privacy policy and data usage"
                    onPress={() => Alert.alert('Feature Coming Soon', 'Privacy Policy will be available soon.')}
                />
                <SettingsItem
                    icon="info-circle"
                    label="About"
                    subtitle="App version and information"
                    onPress={handleAbout}
                />

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loading}>
                    <View style={styles.logoutIconContainer}>
                        <Feather name="log-out" size={20} color={COLORS.textWhite} style={styles.logoutIcon} />
                    </View>
                    <Text style={styles.logoutText}>
                        {loading ? 'Signing Out...' : 'Sign Out'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
        <Icon name={icon} size={16} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const SettingsItem = ({ icon, label, subtitle, rightContent, onPress }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
        <View style={styles.settingLeft}>
            <View style={styles.settingIconContainer}>
                <Icon name={icon} size={16} color={COLORS.accent} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{label}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        {rightContent || <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />}
    </TouchableOpacity>
);

export default Settings;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    profileCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBackground,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 3,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: '#1E40AF',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.secondary,
        borderWidth: 2,
        borderColor: COLORS.textWhite,
    },
    profileInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        flex: 1,
    },
    editIcon: {
        color: COLORS.accent,
        padding: 4,
    },
    email: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    role: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    membershipBadge: {
        backgroundColor: COLORS.accent + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    membershipText: {
        fontSize: 12,
        color: COLORS.accent,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'space-around',
        ...Platform.select({
            ios: {
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 0.5 },
                shadowOpacity: 0.02,
                shadowRadius: 2,
            },
            android: {
                elevation: 0.5,
            },
        }),
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.accent,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 0.5 },
                shadowOpacity: 0.02,
                shadowRadius: 1,
            },
            android: {
                elevation: 0.5,
            },
        }),
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: COLORS.accent + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    logoutBtn: {
        backgroundColor: COLORS.danger,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 32,
        marginBottom: 100, // Space above tab navigator
        marginHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: COLORS.danger,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    logoutIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logoutIcon: {
        marginRight: 0,
    },
    logoutText: {
        color: COLORS.textWhite,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
