import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
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
import { updateUserProfile } from '../../store/slices/authSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EditProfile = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { user, loading } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        username: '',
        user_id: '',
        member_id: '',
        company_id: '',
        company_key: '',
    });
    const [profileImage, setProfileImage] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                user_id: user.user_id || '',
                member_id: user.member_id || '',
                company_id: user.company_id || '',
                company_key: user.company_key || '',
            });
            setProfileImage(user.profileImage || user.avatar);
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            Alert.alert('Validation Error', 'Username is required');
            return false;
        }
        if (formData.username.length < 3) {
            Alert.alert('Validation Error', 'Username must be at least 3 characters long');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setUpdating(true);
        try {
            const updateData = {
                ...formData,
                profileImage,
            };

            await dispatch(updateUserProfile(updateData)).unwrap();

            Alert.alert(
                'Success',
                'Profile updated successfully!',
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
                error || 'Failed to update profile. Please try again.'
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
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
    };

    const handleImagePicker = () => {
        Alert.alert(
            'Change Profile Picture',
            'Choose an option',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Camera', onPress: () => { } },
                { text: 'Gallery', onPress: () => { } }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="Edit Info" showBack={true} showNotification={false} />
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Profile Picture */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{
                                uri: profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username?.trim() || 'User')}&background=1E40AF&color=fff&size=150`
                            }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.cameraIcon} onPress={handleImagePicker}>
                            <Icon name="camera" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleImagePicker}>
                        <Text style={styles.editPhotoText}>Edit profile picture</Text>
                    </TouchableOpacity>
                </View>

                {/* Personal Information */}
                <View style={styles.sectionHeader}>
                    <Icon name="user" size={18} color="#1E40AF" />
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>

                <InputField
                    label="Username *"
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    placeholder="Enter your username"
                    icon="user"
                />
                <InputField
                    label="User ID"
                    value={formData.user_id.toString()}
                    editable={false}
                    placeholder="User ID"
                    icon="hash"
                />
                <InputField
                    label="Member ID"
                    value={formData.member_id.toString()}
                    editable={false}
                    placeholder="Member ID"
                    icon="users"
                />
                <InputField
                    label="Company ID"
                    value={formData.company_id.toString()}
                    editable={false}
                    placeholder="Company ID"
                    icon="briefcase"
                />
                <InputField
                    label="Company Key"
                    value={formData.company_key}
                    editable={false}
                    placeholder="Company Key"
                    icon="key"
                />

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
                        onPress={handleSave}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    editable = true,
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
    icon
}) => (
    <View style={styles.inputWrapper}>
        <View style={styles.labelRow}>
            {icon && <Icon name={icon} size={14} color="#6B7280" style={styles.labelIcon} />}
            <Text style={styles.label}>{label}</Text>
        </View>
        <TextInput
            style={[
                styles.input,
                !editable && styles.disabledInput,
                multiline && styles.multilineInput
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            editable={editable}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

export default EditProfile;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#1E40AF',
        backgroundColor: '#F3F4F6',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#1E40AF',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    editPhotoText: {
        color: '#1E40AF',
        marginTop: 12,
        fontWeight: '600',
        fontSize: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelIcon: {
        marginRight: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
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
    multilineInput: {
        minHeight: 80,
        paddingTop: 12,
    },
    disabledInput: {
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
        borderColor: '#D1D5DB',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 32,
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
        alignItems: 'center',
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
    },
});
