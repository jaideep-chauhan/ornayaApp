import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { addTaskUpdate } from '../../store/slices/tasksSlice';
import { addRepairUpdate } from '../../store/slices/repairsSlice';
import { updateOrderDetails } from '../../utils/api';
import { useTheme } from '../../contexts/ThemeContext';
import { createCommonStyles } from '../../utils/commonStyles';
import Toast from 'react-native-toast-message';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const EditTask = ({ task, taskId, onClose, onUpdate, isRepair = false }) => {
    const dispatch = useDispatch();
    const { updateLoading } = useSelector((state) => state.tasks);
    const { theme } = useTheme();
    const commonStyles = createCommonStyles(theme);

    const [taskName, setTaskName] = useState('');
    const [usedMaterials, setUsedMaterials] = useState([]);
    const [originalMaterialQuantities, setOriginalMaterialQuantities] = useState({}); // Track minimum allowed quantities
    const [completedProcesses, setCompletedProcesses] = useState([]);
    const [availableProcesses, setAvailableProcesses] = useState([]);
    const [backendCompletedProcesses, setBackendCompletedProcesses] = useState([]); // Track original backend completed steps
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (task) {
            console.log('EditTask received task:', task);
            setTaskName(task.title || task.product || '');

            // Initialize used materials from backend data
            // Users can only update quantities of existing materials, not add/remove them
            let lastUpdateMaterials = [];
            let originalMaterials = task.materials || [];

            if (isRepair) {
                // For repairs, get materials from the latest repair_update or original materials
                const latestUpdate = task.repair_updates && task.repair_updates.length > 0 
                    ? task.repair_updates[task.repair_updates.length - 1] 
                    : null;
                lastUpdateMaterials = latestUpdate?.materials || [];
            } else {
                // For tasks, get materials from last_update
                lastUpdateMaterials = task.last_update?.materials || [];
            }

            // If there's a last update, show those materials, otherwise show original materials
            const materialsToShow = lastUpdateMaterials.length > 0 ? lastUpdateMaterials : originalMaterials;

            // Store original quantities to prevent reduction
            const originalQuantities = {};
            materialsToShow.forEach(material => {
                originalQuantities[material.material_id || material.id] = parseFloat(material.quantity) || 0;
            });
            setOriginalMaterialQuantities(originalQuantities);

            setUsedMaterials(materialsToShow.map(material => {
                console.log('Processing material:', material); // Debug log to see material structure

                // Try to find material name from assigned_materials if available
                let materialName = material.material_name || material.name || material.materialName;

                if (!materialName && task.assigned_materials) {
                    const assignedMaterial = task.assigned_materials.find(
                        am => am.material_id === (material.material_id || material.id)
                    );
                    materialName = assignedMaterial?.material_name;
                }

                return {
                    material_id: material.material_id || material.id || 1,
                    quantity: material.quantity?.toString() || '',
                    unit: material.unit || 'g',
                    name: materialName || `Material ID: ${material.material_id || material.id}`
                };
            }) || [{ material_id: 1, quantity: '', unit: 'g', name: 'Gold' }]);

            // Get available process steps
            let processSteps;
            if (isRepair) {
                // For repairs, use type field or default repair process steps
                if (task.type) {
                    try {
                        processSteps = typeof task.type === 'string' ? JSON.parse(task.type) : task.type;
                    } catch (e) {
                        processSteps = ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection'];
                    }
                } else {
                    processSteps = ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection'];
                }
            } else {
                // For tasks, use process_steps field
                processSteps = task.process_steps
                    ? (typeof task.process_steps === 'string'
                        ? JSON.parse(task.process_steps)
                        : task.process_steps)
                    : ['Design', 'Cutting', 'Polishing', 'Assembly', 'Quality Check'];
            }

            setAvailableProcesses(processSteps);

            // Initialize completed processes from last update
            // For repairs, check repair_updates, for tasks check last_update
            let lastUpdateProcesses = [];
            if (isRepair) {
                // Get the latest repair update
                const latestUpdate = task.repair_updates && task.repair_updates.length > 0 
                    ? task.repair_updates[task.repair_updates.length - 1] 
                    : null;
                lastUpdateProcesses = latestUpdate?.process || [];
            } else {
                lastUpdateProcesses = task.last_update?.process || [];
            }
            
            setCompletedProcesses(lastUpdateProcesses);
            setBackendCompletedProcesses(lastUpdateProcesses); // Store original backend completed steps
        } else {
            console.log('EditTask: No task received');
            // Set default values
            setTaskName('');
            setUsedMaterials([{ material_id: 1, quantity: '', unit: 'g', name: 'Gold' }]);
            
            // Set default process steps based on type
            const defaultProcesses = isRepair 
                ? ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection']
                : ['Design', 'Cutting', 'Polishing', 'Assembly', 'Quality Check'];
                
            setAvailableProcesses(defaultProcesses);
            setCompletedProcesses([]);
            setBackendCompletedProcesses([]); // Reset backend completed steps
        }
    }, [task]);

    // Material handlers
    const handleMaterialChange = (index, field, value) => {
        console.log(`Material change: index=${index}, field=${field}, value=${value}`);
        // Allow free editing of the quantity field (including backspace, partial edits, etc.)
        const updatedMaterials = [...usedMaterials];
        updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
        setUsedMaterials(updatedMaterials);
        console.log('Updated materials:', updatedMaterials);
    };

    // Process handlers - Auto-select forward, allow unselect only for user-added steps
    const toggleProcess = (processName) => {
        console.log(`=== Process toggle clicked: ${processName} ===`);
        console.log('Current completed processes:', completedProcesses);
        console.log('Backend completed processes:', backendCompletedProcesses);
        console.log('Available processes:', availableProcesses);
        
        const processIndex = availableProcesses.indexOf(processName);
        console.log('Process index:', processIndex);

        // Check if this step is already completed
        if (completedProcesses.includes(processName)) {
            // Check if this step came from backend (cannot unselect)
            if (backendCompletedProcesses.includes(processName)) {
                Toast.show({
                    type: 'info',
                    text1: '⚠️ Cannot Unselect',
                    text2: 'This step was already completed and cannot be undone.',
                    visibilityTime: 2000,
                    position: 'top',
                    topOffset: 60,
                });
                return;
            }

            // This step was added during current editing session, allow unselecting
            // Remove this step and all steps after it
            const newCompletedProcesses = completedProcesses.filter(process => {
                const idx = availableProcesses.indexOf(process);
                return idx < processIndex;
            });
            console.log('Unselecting step and all after it, new completed:', newCompletedProcesses);
            setCompletedProcesses(newCompletedProcesses);
            return;
        }

        // Find the highest completed step index from backend data
        const backendMaxIndex = backendCompletedProcesses.length > 0
            ? Math.max(...backendCompletedProcesses.map(process => availableProcesses.indexOf(process)))
            : -1;

        // Find the highest completed step index from current state
        const currentMaxIndex = completedProcesses.length > 0
            ? Math.max(...completedProcesses.map(process => availableProcesses.indexOf(process)))
            : -1;

        console.log('Backend max index:', backendMaxIndex);
        console.log('Current max index:', currentMaxIndex);

        // User can only select forward from the highest current position
        if (processIndex <= Math.max(backendMaxIndex, currentMaxIndex)) {
            // Only show this message if trying to go backward from user's current position
            if (processIndex <= currentMaxIndex) {
                Toast.show({
                    type: 'info',
                    text1: '⚠️ Cannot Go Backward',
                    text2: 'You can only move forward in the manufacturing process.',
                    visibilityTime: 2000,
                    position: 'top',
                    topOffset: 60,
                });
            }
            return;
        }

        // If user clicks on a forward step, auto-select all steps up to that point
        // But preserve backend completed steps and only add new ones
        const allStepsUpToClicked = availableProcesses.slice(0, processIndex + 1);
        console.log('Auto-selecting all steps up to:', processName);
        console.log('New completed processes:', allStepsUpToClicked);
        setCompletedProcesses(allStepsUpToClicked);
    };

    // Helper function to determine if a process should be visually highlighted as current
    const getCurrentProcessIndex = () => {
        if (completedProcesses.length === 0) return 0;

        // Find the highest index of completed processes
        const completedIndices = completedProcesses.map(process =>
            availableProcesses.indexOf(process)
        ).filter(index => index !== -1);

        if (completedIndices.length === 0) return 0;

        const maxCompletedIndex = Math.max(...completedIndices);

        // If all processes are completed, return the last index
        if (maxCompletedIndex === availableProcesses.length - 1) {
            return maxCompletedIndex;
        }

        // Otherwise, return the next process as current
        return maxCompletedIndex + 1;
    };

    const handleSave = async () => {
        // Show confirmation popup before proceeding
        Alert.alert(
            'Confirm Update',
            isRepair 
                ? 'Are you sure you want to update this repair with the current materials and process steps?'
                : 'Are you sure you want to update this task with the current materials and process steps?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Update',
                    style: 'default',
                    onPress: () => performSave(),
                },
            ],
            { cancelable: true }
        );
    };

    const performSave = async () => {

        // Validate materials: ensure no quantity is less than original, and all are positive numbers
        const validMaterials = usedMaterials.filter(material =>
            material.quantity && parseFloat(material.quantity) > 0
        );

        // Check for any material quantity less than original
        for (let i = 0; i < usedMaterials.length; i++) {
            const material = usedMaterials[i];
            const materialId = material.material_id;
            const originalQuantity = originalMaterialQuantities[materialId] || 0;
            const newQuantity = parseFloat(material.quantity);
            if (!isNaN(newQuantity) && newQuantity < originalQuantity) {
                Toast.show({
                    type: 'error',
                    text1: '❌ Cannot Reduce Quantity',
                    text2: `Material usage for ${material.name} can only increase. Minimum: ${originalQuantity} ${material.unit}`,
                    visibilityTime: 3000,
                    position: 'top',
                    topOffset: 60,
                });
                return;
            }
        }

        if (validMaterials.length === 0) {
            Alert.alert('Error', 'Please add at least one material with quantity');
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare API data according to the specified format
            let apiData, result;
            
            if (isRepair) {
                // Repair API format - only repair_id and materials
                apiData = {
                    repair_id: task?.repair_id || task?.id || taskId,
                    materials: validMaterials.map(material => ({
                        material_id: material.material_id,
                        quantity: parseFloat(material.quantity),
                        unit: material.unit
                    }))
                };

                console.log('Sending Repair API data:', JSON.stringify(apiData, null, 2));
                console.log('Using Redux action: addRepairUpdate');

                // Use repair Redux action
                result = await dispatch(addRepairUpdate(apiData)).unwrap();
                console.log('Repair Redux action result:', result);
            } else {
                // Task/Order API format
                apiData = {
                    order_id: task?.order_id || task?.id || taskId,
                    materials: validMaterials.map(material => ({
                        material_id: material.material_id,
                        quantity: parseFloat(material.quantity),
                        unit: material.unit
                    })),
                    process: completedProcesses // Array of completed process step names
                };

                console.log('Sending Task API data:', JSON.stringify(apiData, null, 2));
                console.log('Using Redux action: addTaskUpdate');

                // Use task Redux action
                result = await dispatch(addTaskUpdate(apiData)).unwrap();
                console.log('Task Redux action result:', result);
            }

            // Show success message
            Toast.show({
                type: 'success',
                text1: isRepair ? '✅ Repair Updated Successfully!' : '✅ Order Updated Successfully!',
                text2: isRepair 
                    ? 'Your repair has been updated with the latest information.'
                    : 'Your manufacturing order has been updated with the latest information.',
                visibilityTime: 4000,
                position: 'top',
                topOffset: 60,
            });

            // Call the onUpdate callback if provided
            if (onUpdate) {
                onUpdate({
                    ...task,
                    materials: validMaterials,
                    completedProcesses,
                    updatedAt: new Date().toISOString(),
                });
            } onClose();
        } catch (error) {
            console.error('Error updating task:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });

            let errorMessage = 'Unable to update order. Please try again.';

            if (error.message.includes('Network request failed')) {
                errorMessage = 'Network connection failed. Please check your internet connection and try again.';
            } else if (error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to server. Please check your connection.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Toast.show({
                type: 'error',
                text1: '❌ Update Failed',
                text2: errorMessage,
                visibilityTime: 4000,
                position: 'top',
                topOffset: 60,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Last Update Information */}
                {task?.last_update && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Last Update</Text>
                        <View style={styles.lastUpdateContainer}>
                            {task.last_update.materials && task.last_update.materials.length > 0 && (
                                <View style={styles.lastUpdateItem}>
                                    <Text style={styles.lastUpdateLabel}>Materials Used:</Text>
                                    {task.last_update.materials.map((material, index) => (
                                        <Text key={index} style={styles.lastUpdateText}>
                                            • {material.quantity} {material.unit} (Material ID: {material.material_id})
                                        </Text>
                                    ))}
                                </View>
                            )}
                            {task.last_update.process && task.last_update.process.length > 0 && (
                                <View style={styles.lastUpdateItem}>
                                    <Text style={styles.lastUpdateLabel}>Completed Processes:</Text>
                                    <Text style={styles.lastUpdateText}>
                                        {task.last_update.process.join(', ')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Task Name Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {isRepair ? 'Repair Name' : 'Task Name'}
                    </Text>
                    <View style={styles.taskNameDisplay}>
                        <Text style={styles.taskNameText}>{taskName}</Text>
                    </View>
                </View>

                {/* Materials Used Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Materials Used</Text>
                    <Text style={styles.sectionSubtitle}>Update quantities of materials consumed (quantities can only increase)</Text>
                    {usedMaterials.map((material, index) => {
                        const originalQuantity = originalMaterialQuantities[material.material_id] || 0;
                        return (
                            <View key={index} style={styles.materialRow}>
                                <View style={styles.materialNameContainer}>
                                    <Text style={styles.materialLabel}>{material.name || `Material ID: ${material.material_id}`}</Text>
                                    {originalQuantity > 0 && (
                                        <Text style={styles.materialMinQuantity}>
                                            Min: {originalQuantity} {material.unit}
                                        </Text>
                                    )}
                                </View>
                                <TextInput
                                    style={[styles.input, styles.quantityInput]}
                                    value={material.quantity?.toString() || ''}
                                    onChangeText={(value) => {
                                        console.log('TextInput onChangeText called with:', value);
                                        handleMaterialChange(index, 'quantity', value);
                                    }}
                                    placeholder="Qty"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    selectTextOnFocus={true}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    editable={true}
                                    multiline={false}
                                />
                                <TextInput
                                    style={[styles.input, styles.unitInput]}
                                    value={material.unit}
                                    onChangeText={(value) => handleMaterialChange(index, 'unit', value)}
                                    placeholder="Unit"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        );
                    })}
                </View>

                {/* Process Steps Section - Only show for tasks, not repairs */}
                {!isRepair && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Process Steps</Text>
                        <Text style={styles.sectionSubtitle}>Forward-only workflow - complete steps in sequence (cannot go backward)</Text>

                    {/* Progress Flow Display */}
                    <View style={styles.processFlow}>
                        {availableProcesses.map((processName, index) => {
                            const isCompleted = completedProcesses.includes(processName);
                            const currentIndex = getCurrentProcessIndex();
                            const isCurrent = index === currentIndex && !isCompleted;
                            const isPending = index > currentIndex;

                            return (
                                <React.Fragment key={index}>
                                    <TouchableOpacity
                                        style={[
                                            styles.processStep,
                                            isCompleted && styles.processStepCompleted,
                                            isCurrent && styles.processStepCurrent,
                                            isPending && styles.processStepPending
                                        ]}
                                        onPress={() => toggleProcess(processName)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.processStepCircle,
                                            isCompleted && styles.processStepCircleCompleted,
                                            isCurrent && styles.processStepCircleCurrent,
                                            isPending && styles.processStepCirclePending
                                        ]}>
                                            {isCompleted ? (
                                                <Icon name="check" size={14} color="#FFFFFF" />
                                            ) : (
                                                <Text style={[
                                                    styles.processStepNumber,
                                                    isCurrent && styles.processStepNumberCurrent,
                                                    isPending && styles.processStepNumberPending
                                                ]}>
                                                    {index + 1}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.processStepText,
                                            isCompleted && styles.processStepTextCompleted,
                                            isCurrent && styles.processStepTextCurrent,
                                            isPending && styles.processStepTextPending
                                        ]}>
                                            {processName}
                                        </Text>
                                        {isCurrent && (
                                            <View style={styles.currentIndicator}>
                                                <Text style={styles.currentIndicatorText}>CURRENT</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* Connection Line */}
                                    {index < availableProcesses.length - 1 && (
                                        <View style={[
                                            styles.processConnection,
                                            isCompleted && styles.processConnectionCompleted
                                        ]} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>

                    {/* Summary */}
                    {completedProcesses.length > 0 && (
                        <View style={styles.selectedProcesses}>
                            <Text style={styles.selectedProcessesTitle}>
                                Completed Steps ({completedProcesses.length}/{availableProcesses.length}):
                            </Text>
                            <Text style={styles.selectedProcessesList}>
                                {completedProcesses.sort((a, b) =>
                                    availableProcesses.indexOf(a) - availableProcesses.indexOf(b)
                                ).join(' → ')}
                            </Text>
                        </View>
                    )}
                </View>
                )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.saveBtn, isSubmitting && styles.saveDisabled]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Icon name="upload" size={16} color="#fff" />
                            <Text style={styles.saveText}>
                                {isRepair ? 'Update Repair' : 'Update Task'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Space for footer
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 6,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    lastUpdateContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    lastUpdateItem: {
        marginBottom: 8,
    },
    lastUpdateLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    lastUpdateText: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    taskNameDisplay: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    taskNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#878787',
        fontWeight: '400',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        height: 44,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        backgroundColor: '#FFFFFF',
        color: '#374151',
        marginBottom: 12,
    },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    materialNameContainer: {
        flex: 2,
        flexDirection: 'row',
        gap: 10,
        height: 44,
        backgroundColor: '#F9FAFB',
        // justifyContent: 'center',
        alignItems: 'center',
        // padding: 12,
        paddingLeft: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    materialLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    materialMinQuantity: {
        fontSize: 10,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 2,
    },
    materialId: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    quantityInput: {
        flex: 1,
        marginBottom: 0,
    },
    unitInput: {
        flex: 1,
        marginBottom: 0,
    },

    // New Process Flow Styles
    processFlow: {
        marginBottom: 16,
    },
    processStep: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    processStepCompleted: {
        backgroundColor: '#DCFCE7',
        borderColor: '#16A34A',
    },
    processStepCurrent: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    processStepPending: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
    },
    processStepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    processStepCircleCompleted: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },
    processStepCircleCurrent: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    processStepCirclePending: {
        backgroundColor: '#F9FAFB',
        borderColor: '#D1D5DB',
    },
    processStepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    processStepNumberCurrent: {
        color: '#FFFFFF',
    },
    processStepNumberPending: {
        color: '#9CA3AF',
    },
    processStepText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
        textAlign: 'center',
    },
    processStepTextCompleted: {
        color: '#16A34A',
        fontWeight: '600',
    },
    processStepTextCurrent: {
        color: '#2563EB',
        fontWeight: '600',
    },
    processStepTextPending: {
        color: '#9CA3AF',
    },
    currentIndicator: {
        position: 'absolute',
        top: -8,
        backgroundColor: '#2563EB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    currentIndicatorText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    processConnection: {
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
        marginBottom: 8,
    },
    processConnectionCompleted: {
        backgroundColor: '#16A34A',
    },

    // Keep old grid styles for backward compatibility
    processGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },

    processChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2, // for Android
    },

    processChipSelected: {
        backgroundColor: '#1E3A8A',
        borderColor: '#1E3A8A',
    },

    processChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563',
    },

    processChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    selectedProcesses: {
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginTop: 8,
    },
    selectedProcessesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 4,
    },
    selectedProcessesList: {
        fontSize: 13,
        color: '#3B82F6',
        lineHeight: 18,
    },
    removeBtn: {
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginTop: 8,
    },
    addBtnText: {
        color: '#1E40AF',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cancelBtn: {
        flex: 1,
        borderRadius: 10,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,

        // marginRight: 8,
        borderWidth: 1,
        borderColor: '#007BFF',
        backgroundColor: '#FFFFFF',
    },
    cancelText: {
        color: '#007BFF',
        fontWeight: '400',
        fontSize: 16,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#007BFF',
        height: 48,
        width: 160,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    saveDisabled: {
        backgroundColor: '#9CA3AF',
    },
    saveText: {
        color: '#FFFFFF',
        fontWeight: '400',
        fontSize: 16,
        // marginLeft: 6,
    },
});

export default EditTask;
