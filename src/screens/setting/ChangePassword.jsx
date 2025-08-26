import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import TopBar from '../../components/ui/TopBar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChangePassword = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { loading } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [updating, setUpdating] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial,
            errors: [
                ...(password.length < minLength ? ['At least 8 characters'] : []),
                ...(!hasUpperCase ? ['One uppercase letter'] : []),
                ...(!hasLowerCase ? ['One lowercase letter'] : []),
                ...(!hasNumber ? ['One number'] : []),
                ...(!hasSpecial ? ['One special character'] : []),
            ]
        };
    };

    const validateForm = () => {
        if (!formData.currentPassword.trim()) {
            Alert.alert('Validation Error', 'Current password is required');
            return false;
        }

        if (!formData.newPassword.trim()) {
            Alert.alert('Validation Error', 'New password is required');
            return false;
        }

        const passwordValidation = validatePassword(formData.newPassword);
        if (!passwordValidation.isValid) {
            Alert.alert(
                'Password Requirements',
                `Password must contain:\n• ${passwordValidation.errors.join('\n• ')}`
            );
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match');
            return false;
        }

        if (formData.currentPassword === formData.newPassword) {
            Alert.alert('Validation Error', 'New password must be different from current password');
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        setUpdating(true);
        try {
            // Simulate API call - replace with actual API endpoint
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                'Success',
                'Password changed successfully! Please login again with your new password.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert(
                'Error',
                'Failed to change password. Please try again.'
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
            Alert.alert(
                'Discard Changes',
                'Are you sure you want to discard your changes?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '#E5E7EB' };

        const validation = validatePassword(password);
        const score = 5 - validation.errors.length;

        if (score <= 1) return { strength: 20, label: 'Weak', color: '#EF4444' };
        if (score <= 3) return { strength: 60, label: 'Medium', color: '#F59E0B' };
        return { strength: 100, label: 'Strong', color: '#10B981' };
    };

    const passwordStrength = getPasswordStrength(formData.newPassword);

    return (
        <SafeAreaView style={styles.safeArea}>
            <TopBar title="Change Password" showBack={true} showNotification={false} />
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                    <Icon name="shield" size={24} color="#1E40AF" />
                    <View style={styles.noticeContent}>
                        <Text style={styles.noticeTitle}>Security Guidelines</Text>
                        <Text style={styles.noticeText}>
                            Choose a strong password that you haven't used elsewhere and avoid common words or phrases.
                        </Text>
                    </View>
                </View>

                {/* Current Password */}
                <PasswordField
                    label="Current Password *"
                    value={formData.currentPassword}
                    onChangeText={(value) => handleInputChange('currentPassword', value)}
                    placeholder="Enter your current password"
                    showPassword={showPasswords.current}
                    onToggleVisibility={() => togglePasswordVisibility('current')}
                />

                {/* New Password */}
                <PasswordField
                    label="New Password *"
                    value={formData.newPassword}
                    onChangeText={(value) => handleInputChange('newPassword', value)}
                    placeholder="Enter your new password"
                    showPassword={showPasswords.new}
                    onToggleVisibility={() => togglePasswordVisibility('new')}
                />

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                    <View style={styles.strengthContainer}>
                        <View style={styles.strengthBar}>
                            <View
                                style={[
                                    styles.strengthFill,
                                    {
                                        width: `${passwordStrength.strength}%`,
                                        backgroundColor: passwordStrength.color
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                            {passwordStrength.label}
                        </Text>
                    </View>
                )}

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    {[
                        'At least 8 characters',
                        'One uppercase letter (A-Z)',
                        'One lowercase letter (a-z)',
                        'One number (0-9)',
                        'One special character (!@#$%^&*)'
                    ].map((requirement, index) => {
                        const validation = validatePassword(formData.newPassword);
                        const isValid = formData.newPassword && !validation.errors.includes(requirement.split(' ').slice(0, -1).join(' '));

                        return (
                            <View key={index} style={styles.requirementItem}>
                                <Icon
                                    name={isValid ? "check-circle" : "circle"}
                                    size={16}
                                    color={isValid ? "#10B981" : "#9CA3AF"}
                                />
                                <Text style={[
                                    styles.requirementText,
                                    { color: isValid ? "#10B981" : "#6B7280" }
                                ]}>
                                    {requirement}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Confirm Password */}
                <PasswordField
                    label="Confirm New Password *"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Confirm your new password"
                    showPassword={showPasswords.confirm}
                    onToggleVisibility={() => togglePasswordVisibility('confirm')}
                />

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                    <View style={styles.matchIndicator}>
                        <Icon
                            name={formData.newPassword === formData.confirmPassword ? "check-circle" : "x-circle"}
                            size={16}
                            color={formData.newPassword === formData.confirmPassword ? "#10B981" : "#EF4444"}
                        />
                        <Text style={[
                            styles.matchText,
                            { color: formData.newPassword === formData.confirmPassword ? "#10B981" : "#EF4444" }
                        ]}>
                            {formData.newPassword === formData.confirmPassword ? "Passwords match" : "Passwords don't match"}
                        </Text>
                    </View>
                )}

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancel}
                        disabled={updating}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, updating && styles.saveBtnDisabled]}
                        onPress={handleChangePassword}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="shield" size={18} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.saveText}>Change Password</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const PasswordField = ({ label, value, onChangeText, placeholder, showPassword, onToggleVisibility }) => (
    <View style={styles.inputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.passwordContainer}>
            <TextInput
                style={styles.passwordInput}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TouchableOpacity
                style={styles.eyeIcon}
                onPress={onToggleVisibility}
            >
                <Icon
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#6B7280"
                />
            </TouchableOpacity>
        </View>
    </View>
);

export default ChangePassword;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    securityNotice: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#1E40AF',
    },
    noticeContent: {
        flex: 1,
        marginLeft: 12,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 4,
    },
    noticeText: {
        fontSize: 12,
        color: '#1E40AF',
        lineHeight: 16,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
    },
    eyeIcon: {
        padding: 12,
    },
    strengthContainer: {
        marginBottom: 16,
    },
    strengthBar: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    requirementsContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 13,
        marginLeft: 8,
        fontWeight: '400',
    },
    matchIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -12,
        marginBottom: 20,
    },
    matchText: {
        fontSize: 13,
        marginLeft: 8,
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#1E40AF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    cancelText: {
        color: '#1E40AF',
        fontWeight: '600',
        fontSize: 16,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#1E40AF',
        paddingVertical: 14,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#1E40AF',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    saveBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    saveText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 6,
    },
    buttonIcon: {
        marginRight: 6,
    },
});
