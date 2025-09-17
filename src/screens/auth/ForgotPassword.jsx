import React, { useState, useEffect } from 'react';
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
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { createCommonStyles } from '../../utils/commonStyles';
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { apiPost } from '../../utils/api';
import ProfessionalToast from '../../components/ui/ProfessionalToast';

export default function ForgotPasswordScreen() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const commonStyles = createCommonStyles(theme);
    
    const [step, setStep] = useState(1); // 1: request OTP, 2: verify & reset
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [toast, setToast] = useState(null);

    // Timer for OTP resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const requestOTP = async () => {
        if (!username.trim()) {
            showToast('Please enter email or phone number', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost('/auth/forgot-password/request', {
                username: username.trim(),
            });

            if (response.ok) {
                setStep(2);
                setResendTimer(60);
                showToast('OTP sent successfully to your registered email/phone');
            } else {
                showToast(response.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Something went wrong', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async () => {
        // Validation
        if (!otp.trim()) {
            showToast('Please enter OTP', 'error');
            return;
        }
        if (otp.length !== 6) {
            showToast('OTP must be 6 digits', 'error');
            return;
        }
        if (!newPassword.trim()) {
            showToast('Please enter new password', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await apiPost('/auth/forgot-password/verify', {
                username: username.trim(),
                otp: otp.trim(),
                new_password: newPassword,
            });

            if (response.ok) {
                Alert.alert(
                    'Success',
                    'Password reset successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Login'),
                        },
                    ],
                );
            } else {
                showToast(response.message || 'Failed to reset password', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Something went wrong', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        try {
            const response = await apiPost('/auth/forgot-password/request', {
                username: username.trim(),
            });

            if (response.ok) {
                setResendTimer(60);
                showToast('OTP resent successfully');
            } else {
                showToast(response.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to resend OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validatePassword = (password) => {
        const checks = {
            length: password.length >= 8 && password.length <= 16,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[@$!%*?&]/.test(password),
        };
        return checks;
    };

    const passwordChecks = validatePassword(newPassword);
    const styles = createStyles(theme);

    return (
        <SafeAreaView style={[commonStyles.safeContainer, styles.container]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={20} color={theme.colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Icon name="diamond" size={40} color={COLORS.primary} />
                        <Text style={[commonStyles.heading1, styles.title]}>
                            Forgot Password
                        </Text>
                        <Text style={[commonStyles.bodyText, styles.subtitle]}>
                            {step === 1
                                ? 'Enter your email or phone to receive OTP'
                                : 'Enter OTP and create new password'}
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        {step === 1 ? (
                            // Step 1: Request OTP
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email or Phone Number</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter email or phone"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={username}
                                        onChangeText={setUsername}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={requestOTP}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Send OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            // Step 2: Verify OTP & Reset Password
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Enter OTP</Text>
                                    <TextInput
                                        style={[styles.input, styles.otpInput]}
                                        placeholder="Enter 6-digit OTP"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        editable={!loading}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={[styles.input, styles.passwordInput]}
                                            placeholder="Enter new password"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showPassword}
                                            editable={!loading}
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeIcon}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <Icon
                                                name={showPassword ? 'eye' : 'eye-slash'}
                                                size={20}
                                                color={theme.colors.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Password Requirements */}
                                {newPassword.length > 0 && (
                                    <View style={styles.passwordChecks}>
                                        <Text style={styles.checkItem}>
                                            <Text style={passwordChecks.length ? styles.checkPass : styles.checkFail}>
                                                {passwordChecks.length ? '✓' : '✗'}
                                            </Text>{' '}
                                            8-16 characters
                                        </Text>
                                        <Text style={styles.checkItem}>
                                            <Text style={passwordChecks.uppercase ? styles.checkPass : styles.checkFail}>
                                                {passwordChecks.uppercase ? '✓' : '✗'}
                                            </Text>{' '}
                                            One uppercase letter
                                        </Text>
                                        <Text style={styles.checkItem}>
                                            <Text style={passwordChecks.lowercase ? styles.checkPass : styles.checkFail}>
                                                {passwordChecks.lowercase ? '✓' : '✗'}
                                            </Text>{' '}
                                            One lowercase letter
                                        </Text>
                                        <Text style={styles.checkItem}>
                                            <Text style={passwordChecks.number ? styles.checkPass : styles.checkFail}>
                                                {passwordChecks.number ? '✓' : '✗'}
                                            </Text>{' '}
                                            One number
                                        </Text>
                                        <Text style={styles.checkItem}>
                                            <Text style={passwordChecks.special ? styles.checkPass : styles.checkFail}>
                                                {passwordChecks.special ? '✓' : '✗'}
                                            </Text>{' '}
                                            One special character
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={[styles.input, styles.passwordInput]}
                                            placeholder="Confirm new password"
                                            placeholderTextColor={theme.colors.textSecondary}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showConfirmPassword}
                                            editable={!loading}
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeIcon}
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <Icon
                                                name={showConfirmPassword ? 'eye' : 'eye-slash'}
                                                size={20}
                                                color={theme.colors.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.resendButton, resendTimer > 0 && styles.resendDisabled]}
                                    onPress={resendOTP}
                                    disabled={resendTimer > 0 || loading}
                                >
                                    <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={resetPassword}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Reset Password</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backLink}
                                    onPress={() => setStep(1)}
                                >
                                    <Icon name="arrow-left" size={14} color={COLORS.primary} />
                                    <Text style={styles.backLinkText}>Back to Email/Phone</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {toast && (
                <ProfessionalToast
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast(null)}
                />
            )}
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.xl,
    },
    backButton: {
        marginBottom: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    title: {
        marginTop: SPACING.md,
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        marginTop: SPACING.sm,
        textAlign: 'center',
        color: theme.colors.textSecondary,
    },
    formContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: BORDER_RADIUS.medium,
        padding: SPACING.md,
        fontSize: 16,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    otpInput: {
        textAlign: 'center',
        fontSize: 20,
        letterSpacing: 5,
        fontWeight: 'bold',
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: SPACING.md,
        top: SPACING.md,
        padding: SPACING.sm,
    },
    passwordChecks: {
        backgroundColor: theme.colors.surface,
        borderRadius: BORDER_RADIUS.medium,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    checkItem: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: SPACING.xs,
    },
    checkPass: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    checkFail: {
        color: '#F44336',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.medium,
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.lg,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    resendDisabled: {
        opacity: 0.5,
    },
    resendText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    resendTextDisabled: {
        color: theme.colors.textSecondary,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    backLinkText: {
        color: COLORS.primary,
        fontSize: 14,
        marginLeft: SPACING.xs,
    },
});