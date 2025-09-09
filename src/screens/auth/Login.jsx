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
import { loginUser, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { createCommonStyles } from '../../utils/commonStyles';
import Icon from 'react-native-vector-icons/FontAwesome';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
    const dispatch = useDispatch();
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
        if (!formData.username || !formData.password || !formData.company_key) {
            return;
        }

        const result = await dispatch(loginUser(formData));
        
        // Only clear password on failed login
        if (loginUser.rejected.match(result)) {
            setFormData(prev => ({ ...prev, password: '' }));
        }
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
                        <Icon name="diamond" size={35} color="#007BFF" />
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

                            {/* <View style={styles.row}>
                                
                                <Text style={styles.link}>Forgot Password?</Text>
                            </View> */}

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={loading || !formData.username || !formData.password || !formData.company_key}
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
        borderColor: '#E5E7EB',
        borderRadius: 12, // optional, makes it look nicer
        backgroundColor: '#fff', // required for shadows

        // iOS shadow
        shadowColor: '#494949',
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
        borderColor: '#E1E1E1',
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
    loginButton: {
        backgroundColor: '#007BFF',
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
        color: '#007AFF',
        fontWeight: 400,
        fontSize: 12,
    },
});
