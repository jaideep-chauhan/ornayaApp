import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/ui/TopBar';
import { useNavigation } from '@react-navigation/native';
import { fetchAllRepairs, setFilter, setSearchQuery } from '../../store/slices/repairsSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const filterOptions = ['All', 'New', 'In progress', 'Completed', 'Cancelled'];

const filterBgColors = {
    All: '#E0E0E0',
    New: '#D6D6FD',
    'In progress': '#C5E0FF',
    Completed: '#B9E6E8',
    Cancelled: '#F4C6C6', // Soft red/pinkish tone
};

const filterTextColors = {
    All: '#333',
    New: '#6868AB',
    'In progress': '#4A4AFC',
    Completed: '#009CA6',
    Cancelled: '#C62828', // Deep red to indicate cancellation
};

const StatusBadge = ({ status }) => {
    // Map backend status values to display values and colors
    const statusMapping = {
        'pending': { display: 'New', color: '#DCD4FF' },
        'in_progress': { display: 'In progress', color: '#D0E3FF' },
        'completed': { display: 'Completed', color: '#C5F3DE' },
        'cancelled': { display: 'Cancelled', color: '#FFD6D6' },
        // Add fallbacks for any other status values
        'new': { display: 'New', color: '#DCD4FF' },
        'in progress': { display: 'In progress', color: '#D0E3FF' }
    };

    // Default values if status is not in our mapping
    const defaultStatus = { display: status, color: '#F0F0F0' };

    // Get the appropriate display value and color
    const { display, color } = statusMapping[status?.toLowerCase()] || defaultStatus;

    return (
        <View style={[styles.statusBadge, { backgroundColor: color }]}>
            <Text style={styles.statusText}>{display}</Text>
        </View>
    );
};

const PriorityBadge = ({ priority }) => {
    // Map priority values to colors
    const priorityMapping = {
        'high': { color: '#FFD6D6', textColor: '#C62828' },
        'medium': { color: '#FFF8E1', textColor: '#E65100' },
        'low': { color: '#E8F5E9', textColor: '#2E7D32' },
    };

    // Default values if priority is not in our mapping
    const defaultPriority = { color: '#F5F5F5', textColor: '#757575' };

    // Get the appropriate colors
    const { color, textColor } = priorityMapping[priority?.toLowerCase()] || defaultPriority;

    // Format display text
    const display = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Normal';

    return (
        <View style={[styles.priorityBadge, { backgroundColor: color }]}>
            <Text style={[styles.priorityText, { color: textColor }]}>
                {display} Priority
            </Text>
        </View>
    );
};

const TaskCard = ({ navigation, task }) => {
    // Format the date
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
            // If date is already formatted or not a timestamp
            return timestamp;
        }
    };

    // Check if task is overdue
    const isOverdue = () => {
        if (!task.deadline) return false;
        try {
            const deadline = new Date(parseInt(task.deadline));
            return deadline < new Date();
        } catch (error) {
            return false;
        }
    };

    return (
        <View style={styles.taskCard}>
            <View style={styles.taskTop}>
                <Text style={styles.taskTitle}>{task.title || 'Untitled Repair'}</Text>
                <Text style={styles.taskDate}>{formatDate(task.createdAt || task.date)}</Text>
            </View>
            <Text style={styles.taskId}>#{task.id || task.repair_id || 'N/A'}</Text>

            {task.deadline && (
                <Text style={[
                    styles.dueText,
                    isOverdue() && styles.overdueDueText
                ]}>
                    📅 Due: {formatDate(task.deadline || task.due)}
                    {isOverdue() && ' (Overdue)'}
                </Text>
            )}

            {task.priority && <PriorityBadge priority={task.priority} />}

            <View style={styles.taskBottom}>
                <StatusBadge status={task.status || 'pending'} />
                <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => {
                        navigation.navigate('TaskDetail', {
                            taskId: task.repair_id || task.id,
                            isRepair: true,
                            from: 'RepairList'
                        });
                    }}
                >
                    <Text style={styles.viewText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const RepairList = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const {
        repairs,
        filteredRepairs,
        currentFilter,
        searchQuery,
        loading,
        error
    } = useSelector((state) => state.repairs);

    // Fetch repairs on component mount
    useEffect(() => {
        dispatch(fetchAllRepairs(currentFilter));
    }, [dispatch]);

    // Filter handling
    const handleFilterChange = (filter) => {
        // Update filter in state
        dispatch(setFilter(filter));

        // Re-fetch with the filter if needed
        if (!repairs || repairs.length === 0) {
            dispatch(fetchAllRepairs(filter));
        }
    };

    // Search handling
    const handleSearchChange = (query) => {
        dispatch(setSearchQuery(query));
    };

    // Refresh handling
    const handleRefresh = () => {
        dispatch(fetchAllRepairs(currentFilter));
    };

    // Calculate current date for comparison
    const currentDate = new Date();

    // Today in numeric format for comparison
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();

    // Calculate stats
    const stats = useMemo(() => {
        if (!repairs || !Array.isArray(repairs) || repairs.length === 0) {
            return { total: 0, completed: 0, inProgress: 0, overdue: 0 };
        }

        return repairs.reduce((acc, repair) => {
            // Increment total
            acc.total++;

            // Check status
            if (repair.status?.toLowerCase() === 'completed') {
                acc.completed++;
            } else if (repair.status?.toLowerCase() === 'in_progress' || repair.status?.toLowerCase() === 'in progress') {
                acc.inProgress++;
            }

            // Check if overdue
            if (repair.deadline) {
                try {
                    const deadline = new Date(parseInt(repair.deadline)).getTime();
                    if (deadline < today && repair.status?.toLowerCase() !== 'completed') {
                        acc.overdue++;
                    }
                } catch (error) {
                    // Skip if deadline is invalid
                }
            }

            return acc;
        }, { total: 0, completed: 0, inProgress: 0, overdue: 0 });
    }, [repairs, today]);

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="My Repairs" showBack={true} showNotification={true} />

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
                        <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search repair name or ID..."
                            style={styles.inputWithIcon}
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                        />
                    </View>
                </View>

                {/* Stats Cards */}
                {!loading && repairs && Array.isArray(repairs) && repairs.length > 0 && (
                    <View style={styles.statsContainer}>
                        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={[styles.statNumber, { color: '#0D47A1' }]}>{stats.total}</Text>
                            <Text style={[styles.statLabel, { color: '#0D47A1' }]}>Total</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                            <Text style={[styles.statNumber, { color: '#1B5E20' }]}>{stats.completed}</Text>
                            <Text style={[styles.statLabel, { color: '#1B5E20' }]}>Completed</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#FFF8E1' }]}>
                            <Text style={[styles.statNumber, { color: '#FF8C00' }]}>{stats.inProgress}</Text>
                            <Text style={[styles.statLabel, { color: '#FF8C00' }]}>In Progress</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
                            <Text style={[styles.statNumber, { color: '#C62828' }]}>{stats.overdue}</Text>
                            <Text style={[styles.statLabel, { color: '#C62828' }]}>Overdue</Text>
                        </View>
                    </View>
                )}

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
                                            ? filterBgColors[option] || '#F8F8F8'
                                            : '#F8F8F8',
                                        borderColor: isActive
                                            ? filterBgColors[option] || '#ddd'
                                            : '#ddd',
                                    },
                                ]}
                                onPress={() => handleFilterChange(option)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        {
                                            color: isActive
                                                ? filterTextColors[option] || '#333'
                                                : '#333',
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
                {loading && (!filteredRepairs || filteredRepairs.length === 0) && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007BFF" />
                        <Text style={styles.loadingText}>Loading repairs...</Text>
                    </View>
                )}

                {/* Empty State */}
                {!loading && filteredRepairs && filteredRepairs.length === 0 && !error && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No repairs found</Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery
                                ? 'Try adjusting your search'
                                : `No repairs available for ${currentFilter === 'All' ? 'any status' : currentFilter}`}
                        </Text>
                    </View>
                )}

                {/* Group upcoming/overdue repairs */}
                {!loading && filteredRepairs && filteredRepairs.length > 0 && (
                    <View style={styles.listContainer}>
                        {/* Display count of repairs */}
                        <Text style={styles.repairsCount}>
                            {filteredRepairs.length} {filteredRepairs.length === 1 ? 'repair' : 'repairs'} found
                        </Text>

                        {/* Upcoming Repairs */}
                        {filteredRepairs && filteredRepairs.some(repair => {
                            const deadline = repair.deadline ? new Date(parseInt(repair.deadline)).getTime() : null;
                            return deadline && deadline >= today;
                        }) && (
                                <View style={styles.repairSection}>
                                    <Text style={styles.sectionTitle}>Upcoming Repairs</Text>
                                    {filteredRepairs
                                        .filter(repair => {
                                            const deadline = repair.deadline ? new Date(parseInt(repair.deadline)).getTime() : null;
                                            return deadline && deadline >= today;
                                        })
                                        .sort((a, b) => {
                                            // Sort by due date (ascending)
                                            const deadlineA = a.deadline ? new Date(parseInt(a.deadline)).getTime() : Infinity;
                                            const deadlineB = b.deadline ? new Date(parseInt(b.deadline)).getTime() : Infinity;
                                            return deadlineA - deadlineB;
                                        })
                                        .map(repair => (
                                            <TaskCard
                                                key={repair.id || repair.repair_id || Math.random().toString()}
                                                navigation={navigation}
                                                task={repair}
                                            />
                                        ))
                                    }
                                </View>
                            )}

                        {/* Overdue Repairs */}
                        {filteredRepairs && filteredRepairs.some(repair => {
                            const deadline = repair.deadline ? new Date(parseInt(repair.deadline)).getTime() : null;
                            return deadline && deadline < today;
                        }) && (
                                <View style={styles.repairSection}>
                                    <Text style={[styles.sectionTitle, { color: '#C62828' }]}>Overdue Repairs</Text>
                                    {filteredRepairs
                                        .filter(repair => {
                                            const deadline = repair.deadline ? new Date(parseInt(repair.deadline)).getTime() : null;
                                            return deadline && deadline < today;
                                        })
                                        .sort((a, b) => {
                                            // Sort by due date (ascending)
                                            const deadlineA = a.deadline ? new Date(parseInt(a.deadline)).getTime() : 0;
                                            const deadlineB = b.deadline ? new Date(parseInt(b.deadline)).getTime() : 0;
                                            return deadlineA - deadlineB;
                                        })
                                        .map(repair => (
                                            <TaskCard
                                                key={repair.id || repair.repair_id || Math.random().toString()}
                                                navigation={navigation}
                                                task={repair}
                                            />
                                        ))
                                    }
                                </View>
                            )}

                        {/* Repairs without deadlines */}
                        {filteredRepairs && filteredRepairs.some(repair => !repair.deadline) && (
                            <View style={styles.repairSection}>
                                <Text style={styles.sectionTitle}>No Due Date</Text>
                                {filteredRepairs
                                    .filter(repair => !repair.deadline)
                                    .map(repair => (
                                        <TaskCard
                                            key={repair.id || repair.repair_id || Math.random().toString()}
                                            navigation={navigation}
                                            task={repair}
                                        />
                                    ))
                                }
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default RepairList;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        paddingBottom: 24,
    },
    searchBar: {
        marginTop: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderColor: '#ddd',
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
        color: '#111',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    statCard: {
        // width: '23%',
        flex: 1,
        height: 75,
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    filterContainer: {
        flexDirection: 'row',
        // flexWrap: 'wrap',
        paddingHorizontal: 12,
        marginBottom: 16,
        justifyContent: 'space-around',
    },
    filterChip: {
        height: 32,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#F8F8F8',
    },
    filterActive: {
        backgroundColor: '#007BFF',
        borderColor: '#007BFF',
    },
    filterText: {
        fontSize: 13,
        color: '#333',
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    repairsCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    repairSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 8,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        // marginHorizontal: 16,
        // iOS shadow
        shadowColor: '#494949',
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
        color: '#1A1A1A',
        flex: 1,
        marginRight: 8,
    },
    taskDate: {
        fontSize: 14,
        fontWeight: '400',
        color: '#878787',
    },
    taskId: {
        fontSize: 12,
        fontWeight: '400',
        color: '#0067C8',
        marginVertical: 4,
    },
    dueText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
    },
    overdueDueText: {
        color: '#C62828',
        fontWeight: '500',
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 10,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '500',
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
        color: '#111',
    },
    viewBtn: {
        backgroundColor: '#007BFF',
        height: 34,
        width: 130,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 7,
    },
    viewText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '400',
    },
    noTasksText: {
        textAlign: 'center',
        fontSize: 14,
        marginTop: 20,
        color: '#999',
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    errorText: {
        color: '#C62828',
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#C62828',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryText: {
        color: '#fff',
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
        color: '#666',
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
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});
