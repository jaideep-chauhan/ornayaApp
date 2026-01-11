/**
 * Enhanced TaskDetail Screen with Guided Execution
 * Integrates ProcessStepCard, MaterialUsageInput, PhotoCapture for step-by-step workflow
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchTaskDetails, updateTaskStatus } from '../../store/slices/tasksSlice';
import TopBar from '../../components/ui/TopBar';
import ProcessStepCard from '../../components/ProcessStepCard';
import MaterialUsageInput from '../../components/MaterialUsageInput';
import PhotoCapture from '../../components/PhotoCapture';
import { validateStep, calculateCompletionScore } from '../../utils/StepValidation';
import { queueStepCompletion, getOfflineStatusMessage } from '../../utils/offlineQueue';
import OrderChat from '../../components/OrderChat';
import TaskComplete from './TaskComplete';

const TaskDetailEnhanced = () => {
    const dispatch = useDispatch();
    const route = useRoute();
    const navigation = useNavigation();
    const { taskId, isRepair, scrollToMessages } = route.params || {};
    const scrollViewRef = useRef(null);

    // Redux selectors
    const {
        currentTask,
        taskDetailsLoading,
        taskDetailsError
    } = useSelector((state) => state.tasks);

    const {
        currentRepair,
        repairDetailsLoading,
        repairDetailsError
    } = useSelector((state) => state.repairs || {});

    const offlineStatus = useSelector((state) => getOfflineStatusMessage());

    // Local state
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [stepData, setStepData] = useState({});
    const [completeVisible, setCompleteVisible] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState(new Set([0])); // First step expanded by default

    // Determine if this is a repair
    const isRepairDetail = isRepair || (!currentTask && currentRepair);
    const currentItem = isRepairDetail ? currentRepair : currentTask;
    const isLoading = isRepairDetail ? repairDetailsLoading : taskDetailsLoading;
    const error = isRepairDetail ? repairDetailsError : taskDetailsError;

    // Fetch data on mount
    useEffect(() => {
        if (taskId) {
            if (isRepairDetail) {
                // Fetch repair details if available
                const fetchRepairDetails = require('../../store/slices/repairsSlice').fetchRepairDetails;
                if (fetchRepairDetails) {
                    dispatch(fetchRepairDetails(taskId));
                }
            } else {
                dispatch(fetchTaskDetails(taskId));
            }
        }
    }, [dispatch, taskId, isRepairDetail]);

    // Auto-scroll to messages if requested
    useEffect(() => {
        if (scrollToMessages && scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current.scrollToEnd({ animated: true });
            }, 500);
        }
    }, [scrollToMessages]);

    // Initialize step data
    useEffect(() => {
        if (currentItem) {
            // Parse process steps
            let processSteps;
            if (isRepairDetail) {
                processSteps = currentItem.type
                    ? (typeof currentItem.type === 'string' ? JSON.parse(currentItem.type) : currentItem.type)
                    : ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection'];
            } else {
                processSteps = currentItem.process_steps
                    ? (typeof currentItem.process_steps === 'string'
                        ? JSON.parse(currentItem.process_steps)
                        : currentItem.process_steps)
                    : ['Design', 'Cutting', 'Polishing', 'Assembly', 'Quality Check'];
            }

            // Get completed processes
            let completedProcesses = [];
            if (isRepairDetail) {
                const latestUpdate = currentItem.repair_updates && currentItem.repair_updates.length > 0
                    ? currentItem.repair_updates[currentItem.repair_updates.length - 1]
                    : null;
                completedProcesses = latestUpdate?.process || [];
            } else {
                completedProcesses = currentItem.last_update?.process || [];
            }

            // Initialize step data for each step
            const initialStepData = {};
            processSteps.forEach((stepName, index) => {
                const isCompleted = completedProcesses.includes(stepName);
                initialStepData[index] = {
                    stepName,
                    stepNumber: index + 1,
                    isCompleted,
                    checklist: getDefaultChecklist(stepName),
                    materialUsage: {},
                    photos: [],
                    notes: '',
                };
            });

            setStepData(initialStepData);

            // Set active step to first incomplete step
            const firstIncompleteIndex = processSteps.findIndex(
                (step) => !completedProcesses.includes(step)
            );
            setActiveStepIndex(firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0);
        }
    }, [currentItem, isRepairDetail]);

    // Get default checklist for a step
    const getDefaultChecklist = (stepName) => {
        const checklists = {
            'Design': [
                { text: 'Review design specifications', completed: false },
                { text: 'Verify measurements', completed: false },
                { text: 'Prepare design template', completed: false },
            ],
            'Assessment': [
                { text: 'Inspect item condition', completed: false },
                { text: 'Document damages', completed: false },
                { text: 'Estimate repair requirements', completed: false },
            ],
            'Cutting': [
                { text: 'Prepare cutting tools', completed: false },
                { text: 'Cut according to template', completed: false },
                { text: 'Verify dimensions', completed: false },
            ],
            'Polishing': [
                { text: 'Clean surface', completed: false },
                { text: 'Apply polishing compound', completed: false },
                { text: 'Inspect finish quality', completed: false },
            ],
            'Assembly': [
                { text: 'Arrange components', completed: false },
                { text: 'Join pieces securely', completed: false },
                { text: 'Check structural integrity', completed: false },
            ],
            'Quality Check': [
                { text: 'Visual inspection', completed: false },
                { text: 'Measure dimensions', completed: false },
                { text: 'Test functionality', completed: false },
            ],
            'Repair': [
                { text: 'Execute repair work', completed: false },
                { text: 'Test repaired area', completed: false },
                { text: 'Verify quality', completed: false },
            ],
        };

        return checklists[stepName] || [
            { text: 'Complete step requirements', completed: false },
        ];
    };

    // Handle checklist change
    const handleChecklistChange = (stepIndex, updatedChecklist) => {
        setStepData((prev) => ({
            ...prev,
            [stepIndex]: {
                ...prev[stepIndex],
                checklist: updatedChecklist,
            },
        }));
    };

    // Handle material usage change
    const handleMaterialUsageChange = (stepIndex, updatedUsage) => {
        setStepData((prev) => ({
            ...prev,
            [stepIndex]: {
                ...prev[stepIndex],
                materialUsage: updatedUsage,
            },
        }));
    };

    // Handle photos change
    const handlePhotosChange = (stepIndex, updatedPhotos) => {
        setStepData((prev) => ({
            ...prev,
            [stepIndex]: {
                ...prev[stepIndex],
                photos: updatedPhotos,
            },
        }));
    };

    // Handle notes change
    const handleNotesChange = (stepIndex, notes) => {
        setStepData((prev) => ({
            ...prev,
            [stepIndex]: {
                ...prev[stepIndex],
                notes,
            },
        }));
    };

    // Handle step completion
    const handleStepComplete = async (stepIndex) => {
        const step = stepData[stepIndex];

        // Validate step
        const validation = validateStep(
            {
                checklist: step.checklist,
                assignedMaterials: currentItem.materials || [],
                materialUsage: step.materialUsage,
                photos: step.photos,
                notes: step.notes,
            },
            {
                checklistRequired: true,
                photosRequired: false,
                minPhotos: 1,
                notesRequired: false,
            }
        );

        if (!validation.valid) {
            Alert.alert(
                'Step Incomplete',
                validation.summary + '\n\n' + validation.errors.map(e => '• ' + e.message).join('\n'),
                [{ text: 'OK' }]
            );
            return;
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
            Alert.alert(
                'Warnings',
                validation.warnings.map(w => '• ' + w.message).join('\n'),
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Continue Anyway',
                        onPress: () => completeStep(stepIndex, step),
                    },
                ]
            );
        } else {
            completeStep(stepIndex, step);
        }
    };

    // Complete step (after validation)
    const completeStep = async (stepIndex, step) => {
        try {
            // Queue step completion (handles offline mode)
            const result = await queueStepCompletion(
                currentItem.order_id || currentItem.repair_id,
                stepIndex + 1,
                {
                    checklist_items: step.checklist,
                    materials_used: Object.keys(step.materialUsage).map((materialId) => ({
                        material_id: parseInt(materialId),
                        quantity: step.materialUsage[materialId].used,
                        wastage: step.materialUsage[materialId].wastage,
                    })),
                    photos: step.photos.map(p => p.cloudinaryUrl || p.uri),
                    notes: step.notes,
                },
                isRepairDetail
            );

            if (result.queued) {
                Alert.alert(
                    'Step Queued',
                    'You are offline. Step completion will be synced when connection is restored.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Step Completed',
                    `${step.stepName} has been completed successfully!`,
                    [{ text: 'OK' }]
                );
            }

            // Mark step as completed
            setStepData((prev) => ({
                ...prev,
                [stepIndex]: {
                    ...prev[stepIndex],
                    isCompleted: true,
                },
            }));

            // Move to next step
            if (stepIndex < Object.keys(stepData).length - 1) {
                setActiveStepIndex(stepIndex + 1);
                setExpandedSteps(new Set([stepIndex + 1]));
            }

            // Refresh task details
            if (isRepairDetail) {
                const fetchRepairDetails = require('../../store/slices/repairsSlice').fetchRepairDetails;
                if (fetchRepairDetails) {
                    dispatch(fetchRepairDetails(taskId));
                }
            } else {
                dispatch(fetchTaskDetails(taskId));
            }
        } catch (error) {
            console.error('Error completing step:', error);
            Alert.alert('Error', 'Failed to complete step. Please try again.');
        }
    };

    // Toggle step expansion
    const toggleStepExpansion = (stepIndex) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepIndex)) {
            newExpanded.delete(stepIndex);
        } else {
            newExpanded.add(stepIndex);
        }
        setExpandedSteps(newExpanded);
    };

    // Handle complete all
    const handleCompleteAll = () => {
        // Check if all steps are completed
        const allCompleted = Object.values(stepData).every(step => step.isCompleted);

        if (!allCompleted) {
            Alert.alert(
                'Incomplete Steps',
                'Please complete all steps before marking the entire order as complete.',
                [{ text: 'OK' }]
            );
            return;
        }

        setCompleteVisible(true);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <TopBar
                    title={isRepairDetail ? "Repair Details" : "Order Details"}
                    showBack={true}
                    showNotification={true}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#009688" />
                    <Text style={styles.loadingText}>
                        Loading {isRepairDetail ? 'repair' : 'order'} details...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !currentItem) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <TopBar
                    title={isRepairDetail ? "Repair Details" : "Order Details"}
                    showBack={true}
                    showNotification={true}
                />
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={48} color="#F44336" />
                    <Text style={styles.errorText}>
                        {error || `Failed to load ${isRepairDetail ? 'repair' : 'task'} details`}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            if (isRepairDetail) {
                                const fetchRepairDetails = require('../../store/slices/repairsSlice').fetchRepairDetails;
                                if (fetchRepairDetails) {
                                    dispatch(fetchRepairDetails(taskId));
                                }
                            } else {
                                dispatch(fetchTaskDetails(taskId));
                            }
                        }}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const itemId = isRepairDetail ? currentItem.repair_id : currentItem.order_id;
    const itemTitle = isRepairDetail ? currentItem.product : currentItem.title;
    const itemStatus = isRepairDetail ? currentItem.status : currentItem.order_status;
    const completionScore = calculateCompletionScore({
        checklist: Object.values(stepData).flatMap(s => s.checklist),
        assignedMaterials: currentItem.materials || [],
        materialUsage: Object.values(stepData).reduce((acc, s) => ({ ...acc, ...s.materialUsage }), {}),
        photos: Object.values(stepData).flatMap(s => s.photos),
        notes: Object.values(stepData).map(s => s.notes).join(' '),
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <TopBar
                title={isRepairDetail ? "Repair Details" : "Order Details"}
                showBack={true}
                showNotification={true}
            />

            {/* Offline Status Banner */}
            {!offlineStatus.isOnline && (
                <View style={[styles.statusBanner, { backgroundColor: offlineStatus.color }]}>
                    <Icon name="wifi-off" size={16} color="#FFF" />
                    <Text style={styles.statusBannerText}>{offlineStatus.message}</Text>
                </View>
            )}

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.container}
            >
                {/* Order Header */}
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.orderId}>#{itemId}</Text>
                            <Text style={styles.orderTitle}>{itemTitle}</Text>
                        </View>
                        <View style={styles.completionBadge}>
                            <Text style={styles.completionScore}>{completionScore}%</Text>
                            <Text style={styles.completionLabel}>Complete</Text>
                        </View>
                    </View>
                </View>

                {/* Process Steps with Guided Execution */}
                <View style={styles.stepsSection}>
                    <Text style={styles.sectionTitle}>Manufacturing Process</Text>

                    {Object.values(stepData).map((step, index) => (
                        <ProcessStepCard
                            key={index}
                            stepNumber={step.stepNumber}
                            stepName={step.stepName}
                            stepDescription={`Complete ${step.stepName.toLowerCase()} step with checklist`}
                            isActive={index === activeStepIndex}
                            isCompleted={step.isCompleted}
                            isExpanded={expandedSteps.has(index)}
                            onToggleExpand={() => toggleStepExpansion(index)}
                            checklist={step.checklist}
                            onChecklistChange={(checklist) => handleChecklistChange(index, checklist)}
                            assignedMaterials={currentItem.materials || []}
                            onMaterialUsageChange={(usage) => handleMaterialUsageChange(index, usage)}
                            materialUsage={step.materialUsage}
                            onPhotosChange={(photos) => handlePhotosChange(index, photos)}
                            photos={step.photos}
                            onCompleteStep={() => handleStepComplete(index)}
                            onEditNotes={(notes) => handleNotesChange(index, notes)}
                            notes={step.notes}
                        />
                    ))}
                </View>

                {/* Chat Section */}
                <View style={styles.chatCard}>
                    <View style={styles.chatHeader}>
                        <View style={styles.chatTitleContainer}>
                            <Icon name="message-square" size={20} color="#009688" />
                            <Text style={styles.chatTitle}>Messages</Text>
                        </View>
                        <View style={styles.liveBadge}>
                            <Text style={styles.liveBadgeText}>Live</Text>
                        </View>
                    </View>
                    <View style={styles.chatContainer}>
                        <OrderChat
                            orderId={currentItem.order_id || currentItem.repair_id || taskId}
                            currentUserType="manufacture"
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={18} color="#009688" />
                    <Text style={styles.btnSecondaryText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.btnPrimary,
                        itemStatus === 'completed' && styles.btnDisabled,
                    ]}
                    onPress={handleCompleteAll}
                    disabled={itemStatus === 'completed'}
                >
                    <Icon
                        name={itemStatus === 'completed' ? 'check-circle' : 'check-square'}
                        size={18}
                        color="#FFF"
                    />
                    <Text style={styles.btnPrimaryText}>
                        {itemStatus === 'completed' ? 'Completed' : 'Mark Complete'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Complete Modal */}
            {completeVisible && (
                <Modal
                    visible={completeVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setCompleteVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <SafeAreaView style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    Complete {isRepairDetail ? 'Repair' : 'Order'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setCompleteVisible(false)}
                                    style={styles.modalCloseButton}
                                >
                                    <Icon name="x" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <TaskComplete
                                onClose={() => setCompleteVisible(false)}
                                taskId={taskId}
                                isRepair={isRepairDetail}
                                task={currentItem}
                                isModal={true}
                            />
                        </SafeAreaView>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    container: {
        padding: 16,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
        marginVertical: 16,
    },
    retryButton: {
        backgroundColor: '#009688',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
    },
    statusBannerText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderId: {
        fontSize: 14,
        color: '#009688',
        fontWeight: '600',
        marginBottom: 4,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    completionBadge: {
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    completionScore: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4CAF50',
    },
    completionLabel: {
        fontSize: 11,
        color: '#4CAF50',
        fontWeight: '600',
    },
    stepsSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    chatCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    chatTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    chatTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    liveBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFF',
        textTransform: 'uppercase',
    },
    chatContainer: {
        height: 400,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    btnPrimary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#009688',
        paddingVertical: 14,
        borderRadius: 10,
        marginLeft: 8,
        gap: 8,
    },
    btnSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#009688',
        paddingVertical: 14,
        borderRadius: 10,
        marginRight: 8,
        gap: 8,
    },
    btnDisabled: {
        opacity: 0.5,
    },
    btnPrimaryText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    btnSecondaryText: {
        color: '#009688',
        fontSize: 15,
        fontWeight: '600',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: Platform.OS === 'ios' ? 60 : 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    modalCloseButton: {
        padding: 8,
    },
});

export default TaskDetailEnhanced;
