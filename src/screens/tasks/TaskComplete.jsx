import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../../components/ui/TopBar';
import { updateTaskStatus, fetchTaskDetails } from '../../store/slices/tasksSlice';
import Toast from 'react-native-toast-message';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TaskComplete = ({ onClose, taskId, isRepair = false, task, isModal = false }) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { currentTask, updateLoading, taskDetailsLoading } = useSelector(state => state.tasks);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Use the passed task or currentTask from store
    const activeTask = task || currentTask;

    // Fetch task details if taskId is provided and activeTask is not available
    useEffect(() => {
        if (taskId && !activeTask) {
            dispatch(fetchTaskDetails(taskId));
        }
    }, [dispatch, taskId, activeTask]);

    // Update completed state when task changes
    useEffect(() => {
        if (activeTask) {
            const taskCompleted = activeTask.status === 'completed' || activeTask.order_status === 'completed';
            setIsCompleted(taskCompleted);
            setShowSuccess(taskCompleted);
        }
    }, [activeTask]);

    const handleCompleteTask = async () => {
        if (!activeTask) {
            Toast.show({
                type: 'error',
                text1: '❌ Error',
                text2: 'No order data available. Please try again.',
                visibilityTime: 3000,
                position: 'top',
                topOffset: 60,
            });
            return;
        }

        try {
            const statusData = {
                order_id: activeTask.order_id || activeTask.repair_id || activeTask.id,
                status: 'completed'
            };

            console.log('Updating order status:', statusData);

            await dispatch(updateTaskStatus(statusData)).unwrap();

            setIsCompleted(true);
            setShowSuccess(true);

            Toast.show({
                type: 'success',
                text1: `🎉 ${isRepair ? 'Repair' : 'Order'} Completed!`,
                text2: `Great job! Your ${isRepair ? 'repair' : 'manufacturing order'} has been successfully completed.`,
                visibilityTime: 4000,
                position: 'top',
                topOffset: 60,
            });

            // Close modal after a brief delay to show success
            setTimeout(() => {
                if (onClose) {
                    onClose();
                }
            }, 2000);
        } catch (error) {
            console.error('Error completing task:', error);
            Toast.show({
                type: 'error',
                text1: '❌ Completion Failed',
                text2: `Unable to mark ${isRepair ? 'repair' : 'order'} as complete. Please try again.`,
                visibilityTime: 4000,
                position: 'top',
                topOffset: 60,
            });
        }
    };

    const handleViewCompletedTask = () => {
        onClose && onClose();
        // Navigate to completed orders filtered view
        navigation.navigate('Order List', { filter: 'Completed' });
    };

    const handleReturnToOrderList = () => {
        onClose && onClose();
        navigation.navigate('Order List');
    };

    if (taskDetailsLoading || updateLoading || !activeTask) {
        return (
            <View style={isModal ? styles.modalContainer : styles.safe}>
                {!isModal && (
                    <TopBar
                        title="Order Completion"
                        showBack={true}
                        onBackPress={onClose}
                        showNotification={true}
                    />
                )}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={{ marginTop: 10, color: '#555' }}>
                        {updateLoading ? 'Completing order...' : 'Loading order details...'}
                    </Text>
                </View>
            </View>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(parseInt(timestamp));
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: '2-digit'
            });
        } catch (error) {
            // If timestamp is already a string date or invalid
            return timestamp;
        }
    };

    return (
        <View style={isModal ? styles.modalContainer : styles.safe}>
            {!isModal && (
                <TopBar
                    title={activeTask?.title || activeTask?.product || 'Complete Order'}
                    showBack={true}
                    onBackPress={onClose}
                    showNotification={true}
                />
            )}

            <ScrollView contentContainerStyle={styles.container}>
                {/* Checkmark icon */}
                <View style={styles.iconWrap}>
                    <View style={[
                        styles.checkCircle,
                        isCompleted ? styles.completedCircle : styles.pendingCircle
                    ]}>
                        <Icon name={isCompleted ? "check" : "clock"} size={34} color="#fff" />
                    </View>
                </View>

                {/* Success Text */}
                <Text style={[
                    styles.successText,
                    { color: isCompleted ? '#0C992C' : '#FFA000' }
                ]}>
                    {isCompleted ? `${isRepair ? 'Repair' : 'Order'} Completed Successfully!` : `Ready to Complete ${isRepair ? 'Repair' : 'Order'}`}
                </Text>
                <Text style={styles.description}>
                    {isCompleted
                        ? `Great job! You can view your completed ${isRepair ? 'repairs' : 'orders'} or return to the ${isRepair ? 'repair' : 'order'} list.`
                        : `Click the button below to mark this ${isRepair ? 'repair' : 'order'} as completed.`}
                </Text>

                {/* Order Details */}
                <View style={styles.detailCard}>
                    <Text style={styles.detailTitle}>{isRepair ? 'Repair' : 'Order'} Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>{isRepair ? 'Repair' : 'Order'} Name:</Text>
                        <Text style={styles.value}>{activeTask?.title || activeTask?.product || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>{isRepair ? 'Repair' : 'Order'} ID:</Text>
                        <Text style={styles.link}>#{activeTask?.order_id || activeTask?.repair_id || activeTask?.id || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Assigned:</Text>
                        <Text style={styles.value}>
                            {activeTask?.created_at ? formatDate(activeTask.created_at) :
                                activeTask?.createdAt ? formatDate(activeTask.createdAt) : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Due Date:</Text>
                        <Text style={[
                            styles.value,
                            activeTask?.deadline && new Date(parseInt(activeTask.deadline)) < new Date()
                                ? { color: '#C62828' }
                                : {}
                        ]}>
                            {activeTask?.deadline ? formatDate(activeTask.deadline) : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Status:</Text>
                        <Text style={[
                            styles.value,
                            {
                                color: isCompleted
                                    ? '#4CAF50'
                                    : (activeTask?.status === 'in_progress' || activeTask?.order_status === 'in_progress')
                                        ? '#FFA000'
                                        : '#007BFF'
                            }
                        ]}>
                            {isCompleted
                                ? 'Completed'
                                : (activeTask?.status || activeTask?.order_status)
                                    ? (activeTask?.status || activeTask?.order_status).charAt(0).toUpperCase() +
                                    (activeTask?.status || activeTask?.order_status).slice(1).replace('_', ' ')
                                    : 'In Progress'
                            }
                        </Text>
                    </View>
                    {activeTask?.description && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.label}>Description:</Text>
                            <Text style={styles.descriptionText}>{activeTask.description}</Text>
                        </View>
                    )}
                    {activeTask?.materials && activeTask.materials.length > 0 && (
                        <View style={styles.materialsContainer}>
                            <Text style={styles.label}>Materials Used:</Text>
                            {activeTask.materials.map((material, index) => (
                                <View key={index} style={styles.materialItem}>
                                    <Text style={styles.materialText}>
                                        • {material.quantity} {material.unit} {material.material_name || `Material #${material.material_id}`}
                                    </Text>
                                    {material.purity && (
                                        <Text style={styles.materialMetaText}>
                                            Purity: {material.purity}{material.purity_unit === 'karat' ? 'K' : '%'}
                                        </Text>
                                    )}
                                    {material.piece_count && (
                                        <Text style={styles.materialMetaText}>
                                            Pieces: {material.piece_count}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Buttons */}
                <View style={styles.btnRow}>
                    {isCompleted ? (
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={handleViewCompletedTask}
                        >
                            <Text style={styles.primaryText}>View Completed {isRepair ? 'Repairs' : 'Orders'}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={handleCompleteTask}
                            disabled={updateLoading}
                        >
                            {updateLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.primaryText}>Mark as Complete</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={handleReturnToOrderList}
                    >
                        <Text style={styles.secondaryText}>Return to {isRepair ? 'Repairs' : 'Orders'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default TaskComplete;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 30,
        alignItems: 'center',
    },
    // animationWrap - removed due to missing GIF file
    // animation - removed due to missing GIF file  
    // successGif - removed due to missing GIF file
    iconWrap: {
        alignItems: 'center',
        marginBottom: 16,
    },
    checkCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedCircle: {
        backgroundColor: '#4CAF50',
    },
    pendingCircle: {
        backgroundColor: '#FFA000',
    },
    successText: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 12,
        color: '#4F5357',
        textAlign: 'center',
        fontWeight: '400',
        marginBottom: 30,
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    detailCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 5, // as per your spec
        width: 366,
        // height: 136,
        padding: 20,
        marginBottom: 30,

        // iOS Shadow
        shadowColor: '#494949',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1, // 10% of full color for #4949491A
        shadowRadius: 10, // equivalent to blur of 20px

        // Android Shadow
        elevation: 3, // mimics 20px blur roughly

        // Optional: position values (only if used in absolute positioning)
        // top: 376,
        // left: 17,
    },

    detailTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: '#878787',
        fontWeight: '500',
        // flex: 1,
    },
    value: {
        fontSize: 12,
        color: '#000',
        fontWeight: '500',
        flex: 1,
        paddingLeft: 10,
        // textAlign: 'right',
    },
    link: {
        fontSize: 14,
        color: '#007BFF',
        fontWeight: '600',
        flex: 1,
        paddingLeft: 10,

        // textAlign: 'right',
    },
    descriptionContainer: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginTop: 5,
    },
    materialsContainer: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    materialItem: {
        marginTop: 8,
        paddingLeft: 10,
    },
    materialText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
        marginBottom: 4,
    },
    materialMetaText: {
        fontSize: 11,
        color: '#6B7280',
        marginLeft: 20,
        marginTop: 2,
    },
    btnRow: {
        width: '100%',
        gap: 15,
    },
    primaryBtn: {
        backgroundColor: '#007BFF',
        // paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
    },
    primaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '400',
    },
    secondaryBtn: {
        backgroundColor: '#fff',
        height: 48,
        // paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent:'center',
        borderWidth: 1,
        borderColor: '#007BFF',
    },
    secondaryText: {
        color: '#007BFF',
        fontSize: 16,
        fontWeight: '400',
    },
});
