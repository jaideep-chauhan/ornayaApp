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
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/theme';
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

                            <Text style={styles.label}>Company ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your company ID"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={formData.company_key}
                                onChangeText={(value) => handleInputChange('company_key', value)}
                                editable={!loading}
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={formData.username}
                                onChangeText={(value) => handleInputChange('username', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                            />

                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={theme.colors.textSecondary}
                                secureTextEntry
                                value={formData.password}
                                onChangeText={(value) => handleInputChange('password', value)}
                                editable={!loading}
                            />

                            <TouchableOpacity 
                                style={styles.forgotPasswordContainer}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={loading || !formData.username || !formData.password}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.colors.textInverse} size="small" />
                                ) : (
                                    <Text style={[commonStyles.primaryButtonText, styles.loginText]}>Login</Text>
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
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
    },
    card: {
        padding: 20,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.cardBackground,

        // iOS shadow
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,

        // Android shadow
        elevation: 0.5,
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
    label: {
        fontSize: 14,
        fontWeight: '400',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 10,
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
        color: theme.colors.primary,
        fontWeight: '500',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: COLORS.accent,
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    loginText: {
        // Styles handled by commonStyles.primaryButtonText
    },
    poweredBy: {
        fontSize: 12,
        color: theme.colors.textLight,
        marginTop: theme.spacing.lg,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    helpLink: {
        color: COLORS.accent,
        fontWeight: 400,
        fontSize: 12,
    },
});
