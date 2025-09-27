import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/ui/TopBar';
import { useNavigation } from '@react-navigation/native';
import { fetchMaterialRequests, createMaterialRequest } from '../../store/slices/materialRequestSlice';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Toast from 'react-native-toast-message';
import { apiGet } from '../../utils/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const filterOptions = ['All', 'Pending', 'Approved', 'Rejected'];

const StatusBadge = ({ status }) => {
    const bgColor = {
        pending: '#FFF0E0',
        approved: '#E8F5E8',
        rejected: '#FFEBEE',
        delivered: '#E0F2F1',
    };

    const textColor = {
        pending: '#FF8C00',
        approved: '#4CAF50',
        rejected: '#F44336',
        delivered: '#009688',
    };

    return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor[status] || COLORS.border }]}>
            <Text style={[
                styles.statusText,
                { color: textColor[status] || COLORS.textPrimary },
            ]}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
            </Text>
        </View>
    );
};

const MaterialRequestCard = ({ navigation, request }) => {
    if (!request) {
        return null;
    }

    const formattedDate = (() => {
        try {
            if (request.createdAt) {
                return new Date(request.createdAt).toLocaleDateString();
            } else if (request.created_at) {
                return new Date(request.created_at).toLocaleDateString();
            }
            return 'N/A';
        } catch (error) {
            return 'Invalid Date';
        }
    })();

    return (
        <View style={styles.requestCard}>
            <View style={styles.requestTop}>
                <Text style={styles.requestTitle}>{request.material_name || 'Material Request'}</Text>
                <Text style={styles.requestDate}>{formattedDate}</Text>
            </View>
            <Text style={styles.requestId}>#{request.request_id || request.id}</Text>
            <Text style={styles.quantityText}>Quantity: {request.quantity || 0} {request.unit || 'units'}</Text>
            {request.notes && (
                <Text style={styles.notesText} numberOfLines={2} ellipsizeMode="tail">
                    Notes: {request.notes}
                </Text>
            )}
            <View style={styles.requestBottom}>
                <StatusBadge status={request.status} />
                <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => {
                        // Navigate to material request details
                        navigation.navigate('MaterialRequestDetail', {
                            requestId: request.request_id || request.id,
                            from: 'MaterialRequestList'
                        });
                    }}
                >
                    <Text style={styles.viewText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const CreateRequestModal = ({ visible, onClose, onSubmit }) => {
    const [materialId, setMaterialId] = useState('');
    const [materialName, setMaterialName] = useState('');
    const [materials, setMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchMaterials();
        }
    }, [visible]);

    const fetchMaterials = async () => {
        setLoadingMaterials(true);
        try {
            const response = await apiGet('/common/all/materials?is_material=true');
            if (response.ok && response.data && response.data.data) {
                setMaterials(response.data.data);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Materials',
                    text2: 'Unable to fetch materials list',
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Materials Error',
                text2: 'Network error, please try again',
            });
        } finally {
            setLoadingMaterials(false);
        }
    };

    const handleSubmit = async () => {
        if (!materialId || !quantity.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Material and quantity are required',
            });
            return;
        }

        setLoading(true);
        try {
            const result = await onSubmit({
                material_id: parseInt(materialId),
                material_name: materialName,
                quantity: parseFloat(quantity),
                unit: unit.trim() || 'gram',
                notes: notes.trim(),
            });
            
            // Only reset and close if successful
            if (result && result.meta && result.meta.requestStatus === 'fulfilled') {
                // Reset form
                setMaterialId('');
                setMaterialName('');
                setQuantity('');
                setUnit('');
                setNotes('');
                onClose();
            } else if (result && result.meta && result.meta.requestStatus === 'rejected') {
                // Don't close modal on error so user can retry
                console.error('Material request creation rejected:', result.error || result.payload);
            }
        } catch (error) {
            console.error('Error creating request:', error);
            // Don't close modal on error so user can retry
        } finally {
            setLoading(false);
        }
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
                        <Text style={styles.modalTitle}>New Material Request</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="x" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Material *</Text>
                            {loadingMaterials ? (
                                <View style={styles.pickerLoading}>
                                    <ActivityIndicator size="small" color={COLORS.accent} />
                                    <Text style={styles.pickerLoadingText}>Loading materials...</Text>
                                </View>
                            ) : (
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={materialId}
                                        onValueChange={(value) => {
                                            setMaterialId(value);
                                            const selected = materials.find(m => m.material_id === value);
                                            setMaterialName(selected?.material || '');
                                        }}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Select Material" value="" />
                                        {materials.map((material) => (
                                            <Picker.Item
                                                key={material.material_id}
                                                label={material.material}
                                                value={material.material_id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            )}
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
                            disabled={loading || !materialId || !quantity.trim()}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.textWhite} />
                            ) : (
                                <Text style={styles.submitText}>Create Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const MaterialRequestList = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const [currentFilter, setCurrentFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const {
        materialRequests,
        loading,
        error,
    } = useSelector((state) => state.materialRequests || {
        materialRequests: [],
        loading: false,
        error: null,
    });

    useEffect(() => {
        dispatch(fetchMaterialRequests());
    }, [dispatch]);

    const handleFilterChange = (filter) => {
        setCurrentFilter(filter);
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const handleRefresh = () => {
        dispatch(fetchMaterialRequests());
    };

    const handleCreateRequest = async (requestData) => {
        const result = await dispatch(createMaterialRequest(requestData));
        if (createMaterialRequest.fulfilled.match(result)) {
            handleRefresh();
        }
        return result;
    };

    const filteredRequests = materialRequests.filter(request => {
        // Apply status filter
        const statusMatch = currentFilter === 'All' || 
                          (request.status && request.status.toLowerCase() === currentFilter.toLowerCase());
        
        // Apply search filter
        const searchMatch = !searchQuery || 
                           (request.material_name && request.material_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (request.request_id && request.request_id.toString().includes(searchQuery)) ||
                           (request.id && request.id.toString().includes(searchQuery));
        
        return statusMatch && searchMatch;
    });

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="Material Requests" showBack={true} showNotification={true} />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
                }
            >
                {/* Header with Create Button */}
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>My Material Requests</Text>
                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Icon name="plus" size={16} color={COLORS.textWhite} />
                        <Text style={styles.createBtnText}>New Request</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Input with Icon */}
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={styles.searchBar}>
                        <Icon name="search" size={21} color={COLORS.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search material requests..."
                            style={styles.inputWithIcon}
                            placeholderTextColor={COLORS.placeholder}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                        />
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    {filterOptions.map(option => {
                        const isActive = currentFilter === option;

                        return (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.filterChip,
                                    isActive && styles.filterChipActive,
                                ]}
                                onPress={() => handleFilterChange(option)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        isActive && styles.filterTextActive,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loading State */}
                {loading && !materialRequests.length && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                        <Text style={styles.loadingText}>Loading material requests...</Text>
                    </View>
                )}

                {/* Empty State */}
                {!loading && filteredRequests.length === 0 && !error && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No material requests found</Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? 'Try adjusting your search' : 'Create your first material request'}
                        </Text>
                    </View>
                )}

                {/* Material Request Cards */}
                {!loading && filteredRequests.length > 0 && filteredRequests.map((request, index) => (
                    <MaterialRequestCard key={request.request_id || request.id || index} navigation={navigation} request={request} />
                ))}
            </ScrollView>

            <CreateRequestModal 
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateRequest}
            />
        </SafeAreaView>
    );
};

export default MaterialRequestList;

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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    createBtn: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    createBtnText: {
        color: COLORS.textWhite,
        fontSize: 14,
        fontWeight: '500',
    },
    searchBar: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        borderColor: COLORS.border,
        borderWidth: 1,
        height: 44,
    },
    searchIcon: {
        marginLeft: 10,
        marginRight: 8,
    },
    inputWithIcon: {
        flex: 1,
        fontSize: 14,
        fontWeight: '400',
        paddingRight: 14,
        color: COLORS.textPrimary,
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    filterChip: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.backgroundSecondary,
    },
    filterChipActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    filterText: {
        fontSize: 13,
        color: COLORS.textPrimary,
    },
    filterTextActive: {
        color: COLORS.textWhite,
        fontWeight: '600',
    },
    requestCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.md,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        ...SHADOWS.sm,
    },
    requestTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    requestTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        flex: 1,
    },
    requestDate: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    requestId: {
        fontSize: 12,
        fontWeight: '400',
        color: COLORS.accent,
        marginVertical: 4,
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    notesText: {
        fontSize: 14,
        fontWeight: '400',
        color: COLORS.textSecondary,
        marginBottom: 10,
        lineHeight: 20,
    },
    requestBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    viewBtn: {
        backgroundColor: COLORS.accent,
        height: 34,
        width: 130,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 7,
    },
    viewText: {
        color: COLORS.textWhite,
        fontSize: 13,
        fontWeight: '400',
    },
    errorContainer: {
        backgroundColor: COLORS.danger + '20',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: COLORS.danger,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryText: {
        color: COLORS.textWhite,
        fontSize: 14,
        fontWeight: '500',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
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
    pickerContainer: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: COLORS.textPrimary,
    },
    pickerLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.background,
    },
    pickerLoadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.textSecondary,
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