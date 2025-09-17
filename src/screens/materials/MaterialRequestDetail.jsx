import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Modal,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/ui/TopBar';
import { 
    fetchMaterialRequestDetails, 
    updateMaterialRequest,
    clearCurrentRequest 
} from '../../store/slices/materialRequestSlice';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { bg: '#FFF0E0', text: '#FF8C00', label: 'Pending' },
        approved: { bg: '#E8F5E8', text: '#4CAF50', label: 'Approved' },
        rejected: { bg: '#FFEBEE', text: '#F44336', label: 'Rejected' },
        delivered: { bg: '#E0F2F1', text: '#009688', label: 'Delivered' },
    };

    const config = statusConfig[status] || { bg: COLORS.border, text: COLORS.textPrimary, label: 'Unknown' };

    return (
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.text }]}>
                {config.label}
            </Text>
        </View>
    );
};

const InfoCard = ({ label, value, icon }) => (
    <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
            <Icon name={icon || 'info'} size={20} color={COLORS.accent} />
            <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
);

const EditRequestModal = ({ visible, onClose, onSubmit, initialData, loading }) => {
    const [materialName, setMaterialName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (initialData) {
            setMaterialName(initialData.material_name || '');
            setQuantity(initialData.quantity?.toString() || '');
            setUnit(initialData.unit || '');
            setNotes(initialData.notes || '');
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!materialName.trim() || !quantity.trim()) {
            return;
        }

        onSubmit({
            material_name: materialName.trim(),
            quantity: parseFloat(quantity),
            unit: unit.trim() || 'units',
            notes: notes.trim(),
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Request</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="x" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Material Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={materialName}
                                onChangeText={setMaterialName}
                                placeholder="e.g., Gold, Silver, Platinum"
                                placeholderTextColor={COLORS.placeholder}
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                                <Text style={styles.inputLabel}>Quantity *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    placeholderTextColor={COLORS.placeholder}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Unit</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={unit}
                                    onChangeText={setUnit}
                                    placeholder="g, kg, oz"
                                    placeholderTextColor={COLORS.placeholder}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Notes (Optional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Additional notes or specifications"
                                multiline
                                numberOfLines={4}
                                placeholderTextColor={COLORS.placeholder}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                            onPress={handleSubmit}
                            disabled={loading || !materialName.trim() || !quantity.trim()}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.textWhite} />
                            ) : (
                                <Text style={styles.submitText}>Update Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const MaterialRequestDetail = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { requestId } = route.params || {};
    
    const [showEditModal, setShowEditModal] = useState(false);

    const {
        currentRequest,
        detailsLoading,
        updateLoading,
        detailsError,
        updateError,
    } = useSelector((state) => state.materialRequests || {
        currentRequest: null,
        detailsLoading: false,
        updateLoading: false,
        detailsError: null,
        updateError: null,
    });

    useEffect(() => {
        if (requestId) {
            dispatch(fetchMaterialRequestDetails(requestId));
        }
        
        return () => {
            dispatch(clearCurrentRequest());
        };
    }, [dispatch, requestId]);

    const handleRefresh = () => {
        if (requestId) {
            dispatch(fetchMaterialRequestDetails(requestId));
        }
    };

    const handleEdit = async (updateData) => {
        try {
            await dispatch(updateMaterialRequest({ requestId, updateData }));
            setShowEditModal(false);
            handleRefresh();
        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    if (detailsLoading) {
        return (
            <SafeAreaView style={styles.safe}>
                <TopBar title="Request Details" showBack={true} showNotification={true} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                    <Text style={styles.loadingText}>Loading request details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (detailsError || !currentRequest) {
        return (
            <SafeAreaView style={styles.safe}>
                <TopBar title="Request Details" showBack={true} showNotification={true} />
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={48} color={COLORS.danger} />
                    <Text style={styles.errorTitle}>Failed to Load Request</Text>
                    <Text style={styles.errorText}>{detailsError || 'Request not found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const canEdit = currentRequest.status === 'pending';

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="Request Details" showBack={true} showNotification={true} />

            <ScrollView 
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={detailsLoading} onRefresh={handleRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.requestTitle}>{currentRequest.material_name}</Text>
                        <Text style={styles.requestId}>#{currentRequest.request_id || currentRequest.id}</Text>
                    </View>
                    <StatusBadge status={currentRequest.status} />
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Request Information</Text>
                    <View style={styles.infoRow}>
                        <InfoCard 
                            label="Quantity" 
                            value={`${currentRequest.quantity || 0} ${currentRequest.unit || 'units'}`}
                            icon="package"
                        />
                        <InfoCard 
                            label="Created" 
                            value={formatDate(currentRequest.createdAt || currentRequest.created_at)}
                            icon="calendar"
                        />
                    </View>
                </View>

                {/* Notes */}
                {currentRequest.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.notesText}>{currentRequest.notes}</Text>
                    </View>
                )}

                {/* Response Details (if approved/rejected) */}
                {(currentRequest.status === 'approved' || currentRequest.status === 'rejected') && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {currentRequest.status === 'approved' ? 'Approval Details' : 'Rejection Details'}
                        </Text>
                        
                        {currentRequest.status === 'approved' && currentRequest.approved_quantity && (
                            <InfoCard 
                                label="Approved Quantity" 
                                value={`${currentRequest.approved_quantity} ${currentRequest.unit || 'units'}`}
                                icon="check-circle"
                            />
                        )}
                        
                        {currentRequest.delivery_date && (
                            <InfoCard 
                                label="Expected Delivery" 
                                value={formatDate(currentRequest.delivery_date)}
                                icon="truck"
                            />
                        )}
                        
                        {currentRequest.response_notes && (
                            <View style={styles.responseNotes}>
                                <Text style={styles.responseLabel}>Company Response:</Text>
                                <Text style={styles.responseText}>{currentRequest.response_notes}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Actions */}
                {canEdit && (
                    <View style={styles.actions}>
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => setShowEditModal(true)}
                        >
                            <Icon name="edit-2" size={20} color={COLORS.textWhite} />
                            <Text style={styles.editButtonText}>Edit Request</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <EditRequestModal 
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSubmit={handleEdit}
                initialData={currentRequest}
                loading={updateLoading}
            />
        </SafeAreaView>
    );
};

export default MaterialRequestDetail;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: COLORS.textWhite,
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: COLORS.cardBackground,
        marginBottom: 8,
        ...SHADOWS.sm,
    },
    headerContent: {
        flex: 1,
        marginRight: 16,
    },
    requestTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    requestId: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        backgroundColor: COLORS.cardBackground,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: BORDER_RADIUS.md,
        padding: 16,
        ...SHADOWS.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    infoCard: {
        flex: 1,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginLeft: 6,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    notesText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        lineHeight: 24,
    },
    responseNotes: {
        marginTop: 12,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    responseLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    responseText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    actions: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    editButton: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.md,
        gap: 8,
        ...SHADOWS.sm,
    },
    editButtonText: {
        color: COLORS.textWhite,
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.lg,
        width: screenWidth - 32,
        maxHeight: screenHeight - 100,
        ...SHADOWS.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    modalBody: {
        padding: 20,
        maxHeight: 400,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.sm,
        padding: 12,
        fontSize: 14,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.background,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    submitBtn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.accent,
    },
    submitBtnDisabled: {
        backgroundColor: COLORS.textSecondary,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textWhite,
    },
});