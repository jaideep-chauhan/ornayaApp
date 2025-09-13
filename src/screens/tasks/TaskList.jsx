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
    Button,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/ui/TopBar';
import { useNavigation } from '@react-navigation/native';
import { fetchAllTasks, setFilter, setSearchQuery } from '../../store/slices/tasksSlice';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const dummyTasks = [
    { id: '#T98432', title: 'Gold Pendant – 3 Stones', due: '25 May', date: '06 May,25', status: 'New' },
    { id: '#T98433', title: 'Silver Pendant – 5 Stones', due: '25 May', date: '06 May,25', status: 'In progress' },
    { id: '#T98434', title: 'Platinum Ring – 2 Stones', due: '25 May', date: '06 May,25', status: 'Completed' },
    { id: '#T98435', title: 'Platinum Ring – 4 Stones', due: '25 May', date: '06 May,25', status: 'Completed' },
];

const filterOptions = ['All', 'New', 'In progress', 'Completed'];
const filterBgColors = {
    All: '#E0E0E0',
    New: '#D6D6FD',
    'In progress': '#C5E0FF',
    Completed: '#B9E6E8',
};

const filterTextColors = {
    All: '#333',
    New: '#6868AB',
    'In progress': '#4A4AFC',
    Completed: '#009CA6',
};


const StatusBadge = ({ status }) => {
    const bgColor = {
        New: '#D6D6FD',
        'In progress': '#D6D6FD',
        completed: '#B9E6E8',
        pending: '#FFF0E0', // Added for API response status
    };

    // Text colors for different statuses
    const textColor = {
        New: '#4A4AFC',
        'In progress': '#4A4AFC',
        Completed: '#009CA6',
        Pending: '#FF8C00',
    };

    // Determine display status text based on backend status
    const displayStatus = status === 'pending' ? 'New' : status;

    return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor[displayStatus] || COLORS.border }]}>
            <Text style={[
                styles.statusText,
                { color: textColor[displayStatus] || COLORS.textPrimary }, // Default to primary text color if unknown
            ]}>
                {displayStatus}
            </Text>
        </View>
    );
};

const TaskCard = ({ navigation, task }) => {
    // Safely handle task data
    if (!task) {
        return null;
    }

    // Format dates for display
    const formattedDate = (() => {
        try {
            if (task.createdAt) {
                if (typeof task.createdAt === 'string') {
                    // Try to parse the string as a timestamp
                    return new Date(parseInt(task.createdAt)).toLocaleDateString();
                } else if (task.createdAt instanceof Date) {
                    return task.createdAt.toLocaleDateString();
                }
            }
            return 'N/A';
        } catch (error) {
            return 'Invalid Date';
        }
    })();

    const formattedDue = (() => {
        try {
            if (task.deadline) {
                if (typeof task.deadline === 'string') {
                    // Try to parse the string as a timestamp
                    return new Date(parseInt(task.deadline)).toLocaleDateString();
                } else if (task.deadline instanceof Date) {
                    return task.deadline.toLocaleDateString();
                }
            }
            return 'N/A';
        } catch (error) {
            return 'Invalid Date';
        }
    })();

    // Map status display
    const displayStatus = (() => {
        const status = task.status || 'pending';
        return status;
    })();

    return (
        <View style={styles.taskCard}>
            <View style={styles.taskTop}>
                <Text style={styles.taskTitle}>{task.title || 'Untitled Order'}</Text>
                <Text style={styles.taskDate}>{formattedDate}</Text>
            </View>
            <Text style={styles.taskId}>#{task.id || task.order_id || 'No ID'}</Text>
            <Text style={styles.dueText}>📅 Due: {formattedDue}</Text>
            <View style={styles.taskBottom}>
                <StatusBadge status={displayStatus} />
                <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => {
                        navigation.navigate('TaskDetail', {
                            taskId: task.id || task.order_id,
                            isRepair: false,
                            from: 'TaskList'
                        });
                    }}
                >
                    <Text style={styles.viewText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const TaskList = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const {
        filteredTasks,
        currentFilter,
        searchQuery,
        loading,
        error,
        tasks
    } = useSelector((state) => state.tasks);

    useEffect(() => {
        dispatch(fetchAllTasks());
    }, [dispatch]);

    const handleFilterChange = (filter) => {
        dispatch(setFilter(filter));
    };

    const handleSearchChange = (query) => {
        dispatch(setSearchQuery(query));
    };

    const handleRefresh = () => {
        // Map UI filter labels to API expected values
        const statusMap = {
            'All': 'all',
            'New': 'pending',
            'In progress': 'inProgress',
            'Completed': 'completed'
        };

        // Get the correct API status value based on current filter
        const apiStatus = statusMap[currentFilter] || 'all';
        dispatch(fetchAllTasks(apiStatus));
    };

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="My Orders" showBack={true} showNotification={true} />

            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
                }
            >
                {/* Search Input with Icon */}
                <View style={{ paddingHorizontal: 16 }}>
                    <View style={styles.searchBar}>
                        <Icon name="search" size={21} color={COLORS.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search task name or ID..."
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
                                    {
                                        backgroundColor: isActive
                                            ? filterBgColors[option] || COLORS.backgroundSecondary
                                            : COLORS.backgroundSecondary,
                                        borderColor: isActive
                                            ? filterBgColors[option] || COLORS.border
                                            : COLORS.border,
                                    },
                                ]}
                                onPress={() => handleFilterChange(option)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        {
                                            color: isActive
                                                ? filterTextColors[option] || COLORS.textPrimary
                                                : COLORS.textPrimary,
                                            fontWeight: isActive ? '600' : '400',
                                        },
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
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007BFF" />
                        <Text style={styles.loadingText}>Loading orders...</Text>
                    </View>
                )}

                {/* Empty State */}
                {!loading && filteredTasks && filteredTasks.length === 0 && !error && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No orders found</Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? 'Try adjusting your search' : 'No orders available for the selected filter'}
                        </Text>
                    </View>
                )}

                {/* Task Cards */}
                {!loading && filteredTasks && filteredTasks.length > 0 && filteredTasks.map(task => (
                    <TaskCard key={task.id} navigation={navigation} task={task} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export default TaskList;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
        width: screenWidth,
        height: screenHeight,
        paddingBottom: 150,
    },
    container: {
        paddingBottom: 24,
    },
    searchBar: {
        marginTop: 12,
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
        fontSize: 12,
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
    filterActive: {
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
    listContainer: {
        paddingHorizontal: 16,
    },
    taskCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.md,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        // iOS shadow
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1, // Adjusted to reflect 10% opacity (1A in hex is ~10%)
        shadowRadius: 20,

        // Android shadow
        elevation: 3, // Higher elevation to simulate softer, spread shadow
    },

    taskTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    taskDate: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    taskId: {
        fontSize: 12,
        fontWeight: '400',
        color: COLORS.accent,
        marginVertical: 4,
    },
    dueText: {
        fontSize: 14,
        fontWeight: '400',
        color: COLORS.danger,
        marginBottom: 10,
    },
    taskBottom: {
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
        color: COLORS.textPrimary,
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
    noTasksText: {
        textAlign: 'center',
        fontSize: 14,
        marginTop: 20,
        color: COLORS.textSecondary,
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
});
