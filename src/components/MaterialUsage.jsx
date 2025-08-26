import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import TopBar from './ui/TopBar';
import DonutChart from './DonutChart';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MaterialUsage = () => {
    const route = useRoute();
    const { material, issued, used, remaining, taskBreakdown } = route.params;

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="Material Usage" showBack={true} showNotification={true} />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Summary Cards */}
                <View style={styles.cardRow}>
                    <InfoCard label={`${material} Issued`} value={`${issued}g`} color="#E6F0FF" />
                    <InfoCard label={`${material} Used`} value={`${used}g`} color="#FFEDE0" />
                    <InfoCard label={`${material} Remaining`} value={`${remaining}g`} color="#E0F8FF" />
                </View>

                {/* Chart */}
                <Text style={styles.sectionTitle}>Usage Breakdown</Text>
                <View style={styles.chartContainer}>
                    <DonutChart used={parseFloat(used)} total={parseFloat(issued)} />
                    <View style={styles.legendRow}>
                        <LegendItem label={`${material} Used`} color="#FFD233" />
                        <LegendItem label={`${material} Remaining`} color="#E5E5E5" />
                    </View>
                </View>

                {/* Task Breakdown */}
                <Text style={styles.sectionTitle}>{material} Usage by Task</Text>
                {taskBreakdown && taskBreakdown.length > 0 ? (
                    taskBreakdown.map((task, index) => (
                        <TaskCard key={index} task={task} material={material} />
                    ))
                ) : (
                    <Text style={styles.noTaskText}>No task breakdown available.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoCard = ({ label, value, color }) => (
    <View style={[styles.infoCard, { backgroundColor: color }]}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
    </View>
);

const LegendItem = ({ label, color }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
        <View style={{ width: 10, height: 10, backgroundColor: color, borderRadius: 5, marginRight: 6 }} />
        <Text style={styles.legendLabel}>{label}</Text>
    </View>
);

const StatusBadge = ({ status }) => {
    const colors = {
        New: '#DCD4FF',
        'In progress': '#D0E3FF',
        Completed: '#C5F3DE',
        pending: '#FFF0E0', // Added color for pending status
    };

    // Determine display status text based on backend status
    const displayStatus = status === 'pending' ? 'New' : status;

    return (
        <View style={[styles.statusBadge, { backgroundColor: colors[status] || '#EEE' }]}>
            <Text style={[
                styles.statusText,
                status === 'pending' && { color: '#FF8C00' } // Add orange color for pending status
            ]}>
                {displayStatus}
            </Text>
        </View>
    );
};

const TaskCard = ({ task, material }) => (
    <View style={styles.taskCard}>
        <View style={styles.taskTop}>
            <View>
                <Text style={styles.taskId}>{task.id}</Text>
                <Text style={styles.taskDesc}>{task.description}</Text>
            </View>
            <Text style={styles.materialUsed}>{material} used: {task.amount}g</Text>
        </View>
        <View style={styles.taskBottom}>
            <StatusBadge status={task.status} />
            <TouchableOpacity style={styles.detailsBtn}>
                <Text style={styles.detailsText}>View Details</Text>
            </TouchableOpacity>
        </View>
    </View>
);

export default MaterialUsage;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        paddingBottom: 20,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 12,
    },
    infoCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    cardLabel: { fontSize: 13, color: '#555' },
    cardValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },

    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    chartContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    legendRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    legendLabel: {
        fontSize: 12,
        color: '#333',
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
    },
    taskTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    taskId: {
        fontWeight: '600',
        marginBottom: 2,
        color: '#007BFF',
        fontSize: 12,
    },
    taskDesc: {
        fontSize: 14,
        fontWeight: '500',
        color: '#222',
    },
    materialUsed: {
        color: '#F2B507',
        fontWeight: '600',
        fontSize: 13,
    },
    taskBottom: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    statusText: { fontSize: 12, fontWeight: '500' },
    detailsBtn: {
        backgroundColor: '#007BFF',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 14,
    },
    detailsText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    noTaskText: {
        textAlign: 'center',
        color: '#888',
        marginVertical: 20,
        fontSize: 14,
    },
});
