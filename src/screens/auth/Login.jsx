import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { createCommonStyles } from '../../utils/commonStyles';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import Toast from 'react-native-toast-message';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { loading, error } = useSelector((state) => state.auth);
    const { theme } = useTheme();
    const commonStyles = createCommonStyles(theme);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        company_key: '',
    });
    const [rememberMe, setRememberMe] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (error) {
            dispatch(clearError());
        }
    };

    const handleLogin = async () => {
        // For admin users (email ending with @ornaaya.com), company_key is optional
        const isAdminEmail = formData.username.endsWith('@ornaaya.com');
        
        if (!formData.username || !formData.password) {
            Toast.show({
                type: 'error',
                text1: 'Missing Information',
                text2: 'Please enter email and password',
            });
            return;
        }
        
        if (!isAdminEmail && !formData.company_key) {
            Toast.show({
                type: 'error',
                text1: 'Company ID Required',
                text2: 'Please enter your company ID',
            });
            return;
        }

        dispatch(loginUser(formData));
    };

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={[commonStyles.safeContainer, styles.safe]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboard}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.centered}>
                        <Icon name="diamond" size={35} color={COLORS.primary} />
                        <Text style={[commonStyles.heading1, styles.logo]}>Ornaaya</Text>
                        <Text style={[commonStyles.bodyText, styles.subtitle]}>
                            Manage your work and growth seamlessly.
                        </Text>

                        <View style={styles.card}>
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={[commonStyles.errorText, styles.errorText]}>{error}</Text>
                                </View>
                            )}

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Company ID</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcon name="domain" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your company ID"
                                        placeholderTextColor={COLORS.textLight}
                                        value={formData.company_key}
                                        onChangeText={(value) => handleInputChange('company_key', value)}
                                        editable={!loading}
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcon name="email-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor={COLORS.textLight}
                                        value={formData.username}
                                        onChangeText={(value) => handleInputChange('username', value)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcon name="lock-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor={COLORS.textLight}
                                        secureTextEntry
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        editable={!loading}
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.forgotPasswordContainer}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    (loading || !formData.username || !formData.password) && styles.loginButtonDisabled
                                ]}
                                onPress={handleLogin}
                                disabled={loading || !formData.username || !formData.password}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.textWhite} size="small" />
                                ) : (
                                    <>
                                        <MaterialIcon name="login" size={20} color={COLORS.textWhite} style={styles.buttonIcon} />
                                        <Text style={styles.loginText}>Login</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.poweredBy}>Powered by Ornaya Technologies</Text>
                    </View>
                </ScrollView>

                <TouchableOpacity style={styles.footer}>
                    <Text style={styles.helpLink}>Help & Support</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: theme.colors.background,
        width: screenWidth,
        height: screenHeight,
    },
    keyboard: {
        flex: 1,
        width: '100%',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
        width: '100%',
    },
    centered: {
        alignItems: 'center',
        width: '100%',
    },
    logo: {
        fontSize: FONT_SIZES.header,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    subtitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.regular,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
        paddingHorizontal: SPACING.md,
        lineHeight: 20,
    },
    card: {
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.cardBackground,
        ...SHADOWS.lg,
    }
    ,
    errorContainer: {
        backgroundColor: theme.colors.errorLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    errorText: {
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.medium,
        marginBottom: SPACING.sm,
        color: COLORS.textPrimary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBackground,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.md,
        height: 48,
        ...SHADOWS.sm,
    },
    inputIcon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.regular,
        color: COLORS.textPrimary,
        backgroundColor: 'transparent',
        paddingVertical: 0,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    rememberText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
    link: {
        color: theme.colors.primary,
        fontWeight: '500',
        fontSize: 13,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    forgotPasswordText: {
        color: COLORS.accent,
        fontWeight: FONT_WEIGHTS.medium,
        fontSize: FONT_SIZES.md,
    },
    loginButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.accent,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.md,
    },
    loginButtonDisabled: {
        backgroundColor: COLORS.disabled,
        ...SHADOWS.sm,
    },
    buttonIcon: {
        marginRight: SPACING.sm,
    },
    loginText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.textWhite,
    },
    poweredBy: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textLight,
        marginTop: SPACING.xl,
        fontWeight: FONT_WEIGHTS.regular,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    helpLink: {
        color: COLORS.accent,
        fontWeight: FONT_WEIGHTS.medium,
        fontSize: FONT_SIZES.sm,
    },
});
