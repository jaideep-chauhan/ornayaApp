import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    Animated,
    ActivityIndicator,
    Alert,
    Platform,
    Image,
    Dimensions,
    Linking,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import TaskProgressBar from '../../components/ui/TaskProgressBar';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { fetchTaskDetails, updateTaskStatus, addTaskUpdate } from '../../store/slices/tasksSlice';
import TopBar from '../../components/ui/TopBar';
import EditTask from './EditTask';
import TaskComplete from './TaskComplete';
import OrderChat from '../../components/OrderChat';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Optional import for repairs functionality
let fetchRepairDetails;
try {
    fetchRepairDetails = require('../../store/slices/repairsSlice').fetchRepairDetails;
} catch (error) {
    fetchRepairDetails = null;
}

// Utility function to format timestamp (date only)
const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Not Available';

    // Handle different timestamp formats
    let date;
    if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else if (timestamp > 10000000000) {
        // Timestamp in milliseconds
        date = new Date(timestamp);
    } else {
        // Timestamp in seconds
        date = new Date(timestamp * 1000);
    }

    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const TaskDetail = () => {
    const dispatch = useDispatch();
    const route = useRoute();
    const { taskId, isRepair } = route.params || {};
    const flatListRef = useRef(null);

    const {
        currentTask,
        taskDetailsLoading,
        updateLoading,
        taskDetailsError
    } = useSelector((state) => state.tasks);

    const {
        currentRepair,
        repairDetailsLoading,
        repairDetailsError
    } = useSelector((state) => state.repairs || {});

    const [editVisible, setEditVisible] = useState(false);
    const [completeVisible, setCompleteVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
    const [imageLoadingErrors, setImageLoadingErrors] = useState({});

    // Determine if this is a repair based on route params or by checking which data exists
    const isRepairDetail = isRepair || (!currentTask && currentRepair) ||
        (route.params?.from === 'RepairList');

    // Get the current item (either task or repair)
    const currentItem = isRepairDetail ? currentRepair : currentTask;
    const isLoading = isRepairDetail ? repairDetailsLoading : taskDetailsLoading;
    const error = isRepairDetail ? repairDetailsError : taskDetailsError;

    useEffect(() => {
        if (taskId) {
            if (isRepairDetail) {
                if (fetchRepairDetails) {
                    dispatch(fetchRepairDetails(taskId));
                } else {
                    dispatch(fetchTaskDetails(taskId));
                }
            } else {
                dispatch(fetchTaskDetails(taskId));
            }
        }
    }, [dispatch, taskId, isRepairDetail, fetchRepairDetails]);

    // Auto-scroll effect - moved here to ensure it's always called
    useEffect(() => {
        if (currentItem && flatListRef.current) {
            // Parse process steps based on item type
            let processSteps;
            if (isRepairDetail) {
                // For repairs, use type field or default repair process steps
                if (currentItem.type) {
                    try {
                        processSteps = typeof currentItem.type === 'string' ? JSON.parse(currentItem.type) : currentItem.type;
                    } catch (e) {
                        processSteps = ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection'];
                    }
                } else {
                    processSteps = ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection'];
                }
            } else {
                // For tasks, use process_steps field
                processSteps = currentItem.process_steps
                    ? (typeof currentItem.process_steps === 'string'
                        ? JSON.parse(currentItem.process_steps)
                        : currentItem.process_steps)
                    : ['Design', 'Cutting', 'Polishing', 'Assembly', 'Quality Check'];
            }

            // Get completed processes from appropriate data source
            let completedProcesses = [];
            if (isRepairDetail) {
                // For repairs, get from the latest repair_update
                const latestUpdate = currentItem.repair_updates && currentItem.repair_updates.length > 0 
                    ? currentItem.repair_updates[currentItem.repair_updates.length - 1] 
                    : null;
                completedProcesses = latestUpdate?.process || [];
            } else {
                // For tasks, get from last_update
                completedProcesses = currentItem.last_update?.process || [];
            }
            
            // Calculate current step index based on completed processes
            const currentStepIndex = completedProcesses.length > 0
                ? Math.max(...completedProcesses.map(process => processSteps.indexOf(process)).filter(idx => idx !== -1)) + 1
                : 0;

            if (processSteps.length > 0 && currentStepIndex < processSteps.length) {
                // Add a small delay to ensure the FlatList is rendered
                setTimeout(() => {
                    try {
                        flatListRef.current?.scrollToIndex({
                            index: currentStepIndex,
                            animated: true,
                            viewPosition: 0.5, // Center the current step
                        });
                    } catch (error) {
                        console.log('ScrollToIndex error:', error);
                        // Fallback to scrollToOffset if scrollToIndex fails
                        flatListRef.current?.scrollToOffset({
                            offset: currentStepIndex * 120, // Approximate width per step
                            animated: true,
                        });
                    }
                }, 300);
            }
        }
    }, [currentItem]);

    const openEditPopup = () => {
        console.log('openEditPopup triggered'); // Debug log
        setEditVisible(true);
        console.log('editVisible state set to true'); // Debug log
        // Animate modal opening
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeEditPopup = () => {
        // Animate modal closing
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setEditVisible(false);
        });
    };

    const handleComplete = () => {
        setCompleteVisible(true);
    };

    const handleTaskUpdate = async (updateData) => {
        try {
            console.log('TaskDetail handleTaskUpdate called with:', updateData);

            // Close the edit popup
            closeEditPopup();

            // Refresh task details after update
            if (isRepairDetail && fetchRepairDetails) {
                dispatch(fetchRepairDetails(taskId));
            } else {
                dispatch(fetchTaskDetails(taskId));
            }
        } catch (error) {
            console.error('Error in handleTaskUpdate:', error);
        }
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
                    <ActivityIndicator size="large" color="#1E40AF" />
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
                    <Text style={styles.errorText}>
                        {error || `Failed to load ${isRepairDetail ? 'repair' : 'task'} details`}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            if (isRepairDetail && typeof fetchRepairDetails === 'function') {
                                dispatch(fetchRepairDetails(taskId));
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

    // Debug: Log the currentItem to see what fields are available
    console.log('=== TaskDetail Debug ===');
    console.log('currentItem:', JSON.stringify(currentItem, null, 2));
    console.log('created_at value:', currentItem?.created_at);
    console.log('createdAt value:', currentItem?.createdAt);
    
    const createdDate = currentItem?.created_at
        ? formatTimestamp(currentItem.created_at)
        : currentItem?.createdAt
            ? formatTimestamp(currentItem.createdAt)
            : 'Not Available';

    const dueDate = currentItem.deadline
        ? formatTimestamp(currentItem.deadline)
        : 'Not Available';

    const donePercent = currentItem.progress || 0;

    // Parse process steps from the API response
    let processSteps;
    if (isRepairDetail) {
        // For repairs, use type field or default repair process steps
        if (currentItem.type) {
            try {
                processSteps = typeof currentItem.type === 'string' ? JSON.parse(currentItem.type) : currentItem.type;
            } catch (e) {
                processSteps = ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection'];
            }
        } else {
            processSteps = ['Assessment', 'Repair', 'Quality Check', 'Polish', 'Final Inspection'];
        }
    } else {
        // For tasks, use process_steps field
        processSteps = currentItem.process_steps
            ? (typeof currentItem.process_steps === 'string'
                ? JSON.parse(currentItem.process_steps)
                : currentItem.process_steps)
            : ['Design', 'Cutting', 'Polishing', 'Assembly', 'Quality Check'];
    }

    // Get completed processes from appropriate data source
    let completedProcesses = [];
    if (isRepairDetail) {
        // For repairs, get from the latest repair_update
        const latestUpdate = currentItem.repair_updates && currentItem.repair_updates.length > 0 
            ? currentItem.repair_updates[currentItem.repair_updates.length - 1] 
            : null;
        completedProcesses = latestUpdate?.process || [];
    } else {
        // For tasks, get from last_update
        completedProcesses = currentItem.last_update?.process || [];
    }
    
    // Calculate current step index based on completed processes
    const currentStepIndex = completedProcesses.length > 0
        ? Math.max(...completedProcesses.map(process => processSteps.indexOf(process)).filter(idx => idx !== -1)) + 1
        : 0;

    // Get the appropriate ID and status for display based on actual API response
    const itemId = isRepairDetail
        ? (currentItem.repair_id || 'N/A')
        : (currentItem.order_id || 'N/A');

    const itemStatus = isRepairDetail
        ? (currentItem.status || 'pending')
        : (currentItem.order_status || 'pending');

    const itemTitle = isRepairDetail
        ? (currentItem.product || 'No Product Name')
        : (currentItem.title || 'No Title');

    const itemDescription = isRepairDetail
        ? (currentItem.description || `Repair work for ${currentItem.product || 'product'}`)
        : (currentItem.description || 'No description available.');

    // Get materials array
    const itemMaterials = currentItem.materials || [];

    // Get updates array (different field names for tasks vs repairs)
    const itemUpdates = isRepairDetail
        ? (currentItem.repair_updates || [])
        : (currentItem.order_updates || []);

    // Get attachments
    const itemAttachments = currentItem.attachments || [];

    // Get priority (only available for repairs)
    const itemPriority = isRepairDetail ? currentItem.priority : null;

    // Get company/member information
    const companyName = currentItem.company_name || 'N/A';
    const memberName = currentItem.member_name ||
        `${currentItem.member_first_name || ''} ${currentItem.member_last_name || ''}`.trim() || 'N/A';

    // Utility functions for attachment handling
    const getAttachmentUrl = (attachment) => {
        if (typeof attachment === 'string') {
            return attachment;
        }
        return attachment?.url || attachment?.path || attachment?.uri || null;
    };

    const getAttachmentName = (attachment, index) => {
        if (typeof attachment === 'string') {
            return `Attachment ${index + 1}`;
        }
        return attachment?.name || attachment?.fileName || attachment?.filename || `Attachment ${index + 1}`;
    };

    const getAttachmentType = (attachment) => {
        const url = getAttachmentUrl(attachment);
        if (!url) return 'unknown';

        const extension = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
            return 'image';
        } else if (['pdf'].includes(extension)) {
            return 'pdf';
        } else if (['doc', 'docx'].includes(extension)) {
            return 'document';
        } else if (['xls', 'xlsx'].includes(extension)) {
            return 'spreadsheet';
        } else if (['mp4', 'mov', 'avi'].includes(extension)) {
            return 'video';
        }
        return 'file';
    };

    const handleAttachmentPress = (attachment, index) => {
        const url = getAttachmentUrl(attachment);
        const type = getAttachmentType(attachment);

        if (type === 'image') {
            setSelectedAttachment({ ...attachment, url, index, type });
            setAttachmentModalVisible(true);
        } else {
            // For non-image files, try to open with system
            if (url) {
                Alert.alert(
                    'Open Attachment',
                    `Do you want to open ${getAttachmentName(attachment, index)}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open',
                            onPress: () => {
                                Linking.openURL(url).catch(() => {
                                    Alert.alert('Error', 'Unable to open this file');
                                });
                            }
                        }
                    ]
                );
            }
        }
    };

    const handleImageLoadError = (index) => {
        setImageLoadingErrors(prev => ({ ...prev, [index]: true }));
    };

    const renderAttachmentIcon = (type) => {
        switch (type) {
            case 'pdf':
                return <Icon name="file-text" size={24} color="#DC2626" />;
            case 'document':
                return <Icon name="file-text" size={24} color="#2563EB" />;
            case 'spreadsheet':
                return <Icon name="grid" size={24} color="#059669" />;
            case 'video':
                return <Icon name="play-circle" size={24} color="#7C3AED" />;
            case 'file':
                return <Icon name="file" size={24} color="#6B7280" />;
            default:
                return <Icon name="image" size={24} color="#6B7280" />;
        }
    };

    // Add a debug log to check the value of editVisible before rendering the Modal
    console.log('Rendering TaskDetail component, editVisible:', editVisible);

    return (
        <SafeAreaView style={styles.safeArea}>
            <TopBar
                title={isRepairDetail ? "Repair Details" : "Order Details"}
                showBack={true}
                showNotification={true}
            />
            <FlatList
                data={[{ key: 'content' }]}
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.container}
                renderItem={() => (
                    <>
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>
                            {isRepairDetail ? 'Repair ID:' : 'Order ID:'}
                        </Text>
                        <Text style={styles.link}>#{itemId}</Text>
                    </View>
                    <Text style={styles.title}>{itemTitle}</Text>
                    <Text style={styles.label}>Description:</Text>
                    <View style={styles.textbox}>
                        <Text style={styles.text}>{itemDescription}</Text>
                    </View>

                    {/* Show priority for repairs only */}
                    {isRepairDetail && itemPriority && (
                        <View style={styles.rowBetween}>
                            <Text style={styles.label}>Priority:</Text>
                            <View style={[
                                styles.priorityBadge,
                                itemPriority === 'high' && styles.highPriority,
                                itemPriority === 'medium' && styles.mediumPriority,
                                itemPriority === 'low' && styles.lowPriority
                            ]}>
                                <Text style={[
                                    styles.priorityText,
                                    itemPriority === 'high' && styles.highPriorityText,
                                    itemPriority === 'medium' && styles.mediumPriorityText,
                                    itemPriority === 'low' && styles.lowPriorityText
                                ]}>
                                    {itemPriority.charAt(0).toUpperCase() + itemPriority.slice(1)}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.rowBetween}>
                        <View style={styles.dateBadge}>
                            <View style={styles.dateRow}>
                                <Icon name="calendar" size={16} color="#18599E" style={{ marginRight: 4 }} />
                                <Text style={styles.dateText}>Assigned: {createdDate}</Text>
                            </View>

                        </View>
                        <View style={[styles.dateBadge, styles.dueDateBadge]}>
                            <View style={styles.dateRow}>
                                <Icon name="calendar" size={16} color="#B91C1C" style={{ marginRight: 4 }} />
                                <Text style={[styles.dateText, styles.dueDateText]}>
                                    Due: {dueDate}
                                </Text>
                            </View>

                        </View>
                    </View>
                    {itemAttachments.length > 0 ? (
                        <View style={styles.attachmentsSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { marginBottom: 0, }]}>Attachments</Text>
                                <Text style={styles.attachmentCount}>({itemAttachments.length})</Text>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.attachmentsScroll}
                                contentContainerStyle={styles.attachmentsContainer}
                            >
                                {itemAttachments.map((attachment, index) => {
                                    const url = getAttachmentUrl(attachment);
                                    const type = getAttachmentType(attachment);
                                    const name = getAttachmentName(attachment, index);
                                    const hasError = imageLoadingErrors[index];

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.attachmentWrap}
                                            onPress={() => handleAttachmentPress(attachment, index)}
                                            activeOpacity={0.8}
                                            onPressIn={() => {
                                                // Show overlay for images
                                                if (type === 'image') {
                                                    // Could add animation here
                                                }
                                            }}
                                        >
                                            <View style={styles.attachmentCard}>
                                                {type === 'image' && url && !hasError ? (
                                                    <View style={styles.imageContainer}>
                                                        <Image
                                                            source={{ uri: url }}
                                                            style={styles.attachmentImage}
                                                            resizeMode="cover"
                                                            onError={() => handleImageLoadError(index)}
                                                        />
                                                        <View style={styles.imageOverlay}>
                                                            <Icon name="eye" size={16} color="#fff" />
                                                        </View>
                                                    </View>
                                                ) : (
                                                    <View style={styles.fileIconContainer}>
                                                        {renderAttachmentIcon(type)}
                                                        <Text style={styles.fileTypeText}>
                                                            {type.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View style={styles.attachmentInfo}>
                                                    <Text style={styles.attachmentName} numberOfLines={2}>
                                                        {name}
                                                    </Text>
                                                    {type !== 'image' && (
                                                        <Text style={styles.attachmentAction}>
                                                            Tap to open
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ) : (
                        <View style={styles.noAttachmentsContainer}>
                            <Icon name="paperclip" size={20} color="#9CA3AF" />
                            <Text style={styles.noAttachmentsText}>No attachments available</Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {isRepairDetail ? 'Repair Progress' : 'Manufacturing Progress'}
                    </Text>
                    <TaskProgressBar donePercent={donePercent} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Material Details</Text>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Materials Allotted</Text>
                        <Text style={styles.label}>
                            Total: {itemMaterials.reduce((sum, m) => sum + (m.quantity || 0), 0)} {itemMaterials[0]?.unit || ''}
                        </Text>
                    </View>
                    <View style={styles.rowWrap}>
                        {itemMaterials.map((material, index) => (
                            <View key={index} style={styles.goldTag}>
                                <Text style={styles.tagText}>
                                    {material.material_name || material.name || 'Unknown'} – {material.quantity || 0} {material.unit || ''}
                                </Text>
                            </View>

                        ))}
                        {itemMaterials.length === 0 && (
                            <Text style={styles.text}>No materials listed</Text>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Process Flow</Text>
                    {processSteps.length > 0 ? (
                        <FlatList
                            ref={flatListRef}
                            data={processSteps}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.scrollContainer, { alignItems: 'center' }]}
                            onScrollToIndexFailed={(info) => {
                                // Fallback scroll behavior if index fails
                                setTimeout(() => {
                                    flatListRef.current?.scrollToOffset({
                                        offset: info.index * 120,
                                        animated: true,
                                    });
                                }, 100);
                            }}
                            renderItem={({ item, index }) => {
                                const isCompleted = completedProcesses.includes(item);
                                const isActive = !isCompleted && index === Math.min(completedProcesses.length, processSteps.length - 1);
                                const isPending = !isCompleted && !isActive;

                                return (
                                    <View style={styles.stepContainer}>
                                        <View style={[
                                            styles.stepBox,
                                            isCompleted && styles.stepCompleted,
                                            isActive && styles.stepActive,
                                            isPending && styles.stepPending
                                        ]}>
                                            <Text style={[
                                                styles.stepText,
                                                isCompleted && styles.textCompleted,
                                                isActive && styles.textActive,
                                                isPending && styles.textPending
                                            ]}>
                                                {item}
                                            </Text>
                                        </View>
                                        {index !== processSteps.length - 1 && (
                                            <Text style={[
                                                styles.arrow,
                                                isCompleted && styles.arrowCompleted,
                                                isActive && styles.arrowActive,
                                                isPending && styles.arrowPending
                                            ]}>→</Text>
                                        )}
                                    </View>
                                );
                            }}
                        />

                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No process steps defined</Text>
                        </View>
                    )}

                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Material Used</Text>
                        <Text style={styles.label}>
                            Total: {(() => {
                                let materials = [];
                                if (isRepairDetail) {
                                    const latestUpdate = currentItem.repair_updates && currentItem.repair_updates.length > 0 
                                        ? currentItem.repair_updates[currentItem.repair_updates.length - 1] 
                                        : null;
                                    materials = latestUpdate?.materials || [];
                                } else {
                                    materials = currentItem.last_update?.materials || [];
                                }
                                const total = materials.reduce((sum, m) => sum + (m.quantity || 0), 0);
                                const unit = materials[0]?.unit || '';
                                return `${total} ${unit}`;
                            })()}
                        </Text>
                    </View>
                    <View style={styles.rowWrap}>
                        {(() => {
                            let materials = [];
                            if (isRepairDetail) {
                                const latestUpdate = currentItem.repair_updates && currentItem.repair_updates.length > 0 
                                    ? currentItem.repair_updates[currentItem.repair_updates.length - 1] 
                                    : null;
                                materials = latestUpdate?.materials || [];
                            } else {
                                materials = currentItem.last_update?.materials || [];
                            }
                            
                            if (materials.length === 0) {
                                return <Text style={styles.text}>No materials used yet</Text>;
                            }
                            
                            return materials.map((material, index) => (
                                <View key={index} style={styles.gemTag}>
                                    <Text style={styles.tagText}>
                                        {material.quantity || 0} {material.unit || ''}
                                    </Text>
                                </View>
                            ));
                        })()}
                    </View>
                </View>

                    </>
                )}
                ListFooterComponent={() => (
                    <View style={[styles.card, { padding: 0, paddingTop: 16 }]}>
                        <Text style={[styles.sectionTitle, { marginLeft: 16, marginBottom: 16 }]}>Comments & Messages</Text>
                        <View style={{ height: 400 }}>
                            <OrderChat 
                                orderId={currentItem?.order_id || currentItem?.repair_id || currentItem?.id || taskId}
                                currentUserType="manufacture"
                            />
                        </View>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={openEditPopup}
                    accessibilityLabel={`Edit ${isRepairDetail ? 'repair' : 'task'}`}
                >
                    <Icon name="edit-2" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.btnPrimaryText}>
                        Edit {isRepairDetail ? 'Repair' : 'Task'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.btnSecondary,
                        itemStatus === 'completed' && styles.btnDisabled,
                    ]}
                    onPress={handleComplete}
                    disabled={itemStatus === 'completed'}
                    accessibilityLabel={itemStatus === 'completed' ? `${isRepairDetail ? 'Repair' : 'Task'} already completed` : `Mark ${isRepairDetail ? 'repair' : 'task'} as completed`}
                >
                    <Icon
                        name={itemStatus === 'completed' ? 'check-circle' : 'check-square'}
                        size={18}
                        color={itemStatus === 'completed' ? '#6B7280' : '#007BFF'}
                        style={styles.buttonIcon}
                    />
                    <Text style={styles.btnSecondaryText}>
                        {itemStatus === 'completed' ? 'Completed' : 'Mark as Complete'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Edit Task Modal */}
            <Modal
                visible={editVisible}
                transparent
                animationType="slide"
                onRequestClose={closeEditPopup}
            >
                <View style={[styles.fullScreenModal, { zIndex: 10000, elevation: 10000 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Edit {isRepairDetail ? 'Repair' : 'Manufacturing Order'}
                        </Text>
                        <TouchableOpacity onPress={closeEditPopup} style={styles.modalCloseButton}>
                            <Icon name="x" size={24} color="#1F2A44" />
                        </TouchableOpacity>
                    </View>
                    <EditTask
                        task={currentItem}
                        taskId={taskId}
                        onClose={closeEditPopup}
                        onUpdate={handleTaskUpdate}
                        isRepair={isRepairDetail}
                    />
                </View>
            </Modal>

            {/* Complete Task Modal */}
            {completeVisible && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#000000AA',
                    zIndex: 9999,
                }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={{
                            flex: 1,
                            backgroundColor: '#F8F9FA',
                            marginTop: 0,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: '#E5E7EB',
                                backgroundColor: '#FFFFFF',
                            }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: '#1F2A44',
                                }}>
                                    Complete {isRepairDetail ? 'Repair' : 'Order'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setCompleteVisible(false)}
                                    style={{
                                        padding: 8,
                                        borderRadius: 20,
                                        backgroundColor: '#F3F4F6',
                                    }}
                                >
                                    <Icon name="x" size={24} color="#1F2A44" />
                                </TouchableOpacity>
                            </View>
                            <TaskComplete
                                onClose={() => setCompleteVisible(false)}
                                taskId={taskId}
                                isRepair={isRepairDetail}
                                task={currentItem}
                                isModal={true}
                            />
                        </View>
                    </SafeAreaView>
                </View>
            )}

            {/* Attachment Viewer Modal */}
            <Modal
                visible={attachmentModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAttachmentModalVisible(false)}
            >
                <View style={styles.attachmentModalContainer}>
                    <TouchableOpacity
                        style={styles.attachmentModalBackdrop}
                        activeOpacity={1}
                        onPress={() => setAttachmentModalVisible(false)}
                    >
                        <View style={styles.attachmentModalContent}>
                            <View style={styles.attachmentModalHeader}>
                                <Text style={styles.attachmentModalTitle}>
                                    {selectedAttachment ? getAttachmentName(selectedAttachment, selectedAttachment.index) : 'Attachment'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setAttachmentModalVisible(false)}
                                    style={styles.attachmentModalClose}
                                >
                                    <Icon name="x" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            {selectedAttachment && (
                                <View style={styles.attachmentModalImageContainer}>
                                    <Image
                                        source={{ uri: selectedAttachment.url }}
                                        style={styles.attachmentModalImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                            <View style={styles.attachmentModalActions}>
                                <TouchableOpacity
                                    style={styles.attachmentActionButton}
                                    onPress={() => {
                                        if (selectedAttachment?.url) {
                                            Linking.openURL(selectedAttachment.url).catch(() => {
                                                Alert.alert('Error', 'Unable to open this file');
                                            });
                                        }
                                    }}
                                >
                                    <Icon name="external-link" size={18} color="#007BFF" />
                                    <Text style={styles.attachmentActionText}>Open in Browser</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default TaskDetail;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        padding: 16,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 6,
    },
    rowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginVertical: 10,
    },
    title: {
        fontSize: 16,
        paddingLeft: 3,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 10,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
        paddingLeft: 4,
        color: '#1A1A1A',
        fontWeight: '700',
    },
    textbox: {
        backgroundColor: '#FFFFFF',
        // height: 56,
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 6,
        marginBottom: 10,
        // borderWidth: 1,
        borderColor: '#E1E1E1',
    },
    text: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        fontWeight: '400',
    },
    link: {
        color: '#1E40AF',
        fontSize: 13,
        fontWeight: '600',
    },
    dateBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#E6F0FA',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    dueDateBadge: {
        backgroundColor: '#FFF1F0',
    },
    dateText: {
        fontSize: 12,
        color: '#18599E',
        fontWeight: '500',
    },
    dueDateText: {
        color: '#B91C1C',
    },
    progressBarContainer: {
        height: 8,
        width: '100%',
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressDoneBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2A44',
        marginBottom: 8,
    },
    smallText: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    goldTag: {
        backgroundColor: '#FFFAE8',
        color: '#DFB200',
        height: 25,
        borderRadius: 5,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: '500',
        borderRadius: 8,
    },
    gemTag: {
        backgroundColor: '#FFE4E6',
        color: '#BE123C',
        height: 25,
        borderRadius: 5,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: '500',
        borderRadius: 8,
    },
    tagText: {
        color: '#DFB200',
        fontSize: 14,
        fontWeight: '400',
    },
    processFlowGridContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
        paddingHorizontal: 8,
    },
    processFlowGridRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    processStepGridWrap: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 12,
        position: 'relative',
    },
    processStepLineGrid: {
        position: 'absolute',
        top: 54,
        left: '50%',
        transform: [{ translateX: -4 }],
        width: 8,
        height: 48,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
    },
    processStepCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6,
        backgroundColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 4,
    },
    processStepActive: {
        backgroundColor: '#2563EB',
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    processStepCompleted: {
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    processStepInactive: {
        backgroundColor: '#E5E7EB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    processStepLabel: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '600',
        color: '#374151',
    },
    processStepActiveText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    processStepCompletedText: {
        color: '#10B981',
        fontWeight: '700',
        fontSize: 12,
    },
    processStepInactiveText: {
        color: '#6B7280',
        fontWeight: '500',
        fontSize: 16,
    },
    processStepLineCompleted: {
        backgroundColor: '#10B981',
    },
    processStepLineInactive: {
        backgroundColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        // paddingHorizontal: 16,
        paddingTop: 16,
        marginBottom: 50,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    scrollContainer: {
        paddingHorizontal: 16,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepBox: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    stepCompleted: {
        borderColor: '#16A34A',
        backgroundColor: '#DCFCE7',
    },
    stepActive: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    stepPending: {
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
    },
    stepText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    textCompleted: {
        color: '#16A34A',
        fontWeight: '600',
    },
    textActive: {
        fontWeight: 'bold',
        color: '#2563EB',
    },
    textPending: {
        color: '#9CA3AF',
    },
    arrow: {
        marginHorizontal: 8,
        fontSize: 18,
        color: '#9CA3AF',
    },
    arrowCompleted: {
        color: '#16A34A',
    },
    arrowActive: {
        color: '#2563EB',
    },
    arrowPending: {
        color: '#D1D5DB',
    },
    divider: {
        borderWidth: 1,
        borderColor: '#E1E1E1',
        marginVertical: 12,
    },
    commentBox: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    reply: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    commentText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        fontWeight: '400',
    },
    replyText: {
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
        fontWeight: '400',
    },
    meta: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 6,
        fontWeight: '400',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        height: 46,
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        marginRight: 10,
        fontWeight: '400',
    },
    sendButton: {
        marginLeft: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    btnPrimary: {
        flex: 1,
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        borderRadius: 10,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    btnSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#1E40AF',
        height: 48,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    btnDisabled: {
        borderColor: '#6B7280',
        opacity: 0.5,
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        marginLeft: 6,
    },
    btnSecondaryText: {
        color: '#007BFF',
        fontWeight: '400',
        fontSize: 16,
        marginLeft: 6,
    },
    buttonIcon: {
        marginRight: 6,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        marginTop: Platform.OS === 'ios' ? 40 : 25,
    },
    modalBackdropTouchable: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '95%',
        maxHeight: '90%', // Increased from 85% to 90%
        maxWidth: 450,
        overflow: 'hidden', // Ensure content doesn't overflow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2A44',
        flex: 1,
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        marginLeft: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 15,
        color: '#B91C1C',
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '500',
    },
    retryButton: {
        backgroundColor: '#1E40AF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    attachmentsSection: {
        marginTop: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    attachmentCount: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
        fontWeight: '500',
    },
    attachmentsScroll: {
        marginTop: 8,
    },
    attachmentsContainer: {
        paddingRight: 16,
    },
    attachmentWrap: {
        marginRight: 12,
        width: 120,
    },
    attachmentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    imageContainer: {
        position: 'relative',
        height: 90,
    },
    attachmentImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileIconContainer: {
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    fileTypeText: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '600',
    },
    attachmentInfo: {
        padding: 8,
        minHeight: 50,
    },
    attachmentName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
        lineHeight: 16,
    },
    attachmentAction: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    noAttachmentsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginTop: 16,
    },
    noAttachmentsText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
        fontStyle: 'italic',
    },
    // Attachment Modal Styles
    attachmentModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    attachmentModalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentModalContent: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        justifyContent: 'center',
    },
    attachmentModalHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1,
    },
    attachmentModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        marginRight: 10,
    },
    attachmentModalClose: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentModalImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    attachmentModalImage: {
        width: '100%',
        height: '70%',
    },
    attachmentModalActions: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 50 : 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    attachmentActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    attachmentActionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007BFF',
        marginLeft: 8,
    },
    noDataContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginVertical: 10,
    },
    noDataText: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        fontWeight: '400',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F0F0F0',
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    highPriority: {
        backgroundColor: '#FFEBEE',
    },
    highPriorityText: {
        color: '#C62828',
    },
    mediumPriority: {
        backgroundColor: '#FFF8E1',
    },
    mediumPriorityText: {
        color: '#E65100',
    },
    lowPriority: {
        backgroundColor: '#E8F5E9',
    },
    lowPriorityText: {
        color: '#2E7D32',
    },

    // chat box styling

    chatMessageWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 14,
        paddingHorizontal: 10,
    },

    alignLeft: {
        justifyContent: 'flex-start',
    },

    alignRight: {
        justifyContent: 'flex-end',
    },

    chatBubble: {
        maxWidth: '70%',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },

    userBubble: {
        backgroundColor: '#1E40AF',
        borderTopLeftRadius: 16,
        borderBottomRightRadius: 4,
    },

    otherBubble: {
        backgroundColor: '#F3F4F6',
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 4,
    },

    chatTextUser: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },

    chatTextOther: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '500',
    },

    chatMeta: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'right',
    },

    avatar: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 6,
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        padding: 10,
        marginTop: 10,
    },

    input: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        color: '#111827',
    },

    iconButton: {
        marginLeft: 10,
    },


});
