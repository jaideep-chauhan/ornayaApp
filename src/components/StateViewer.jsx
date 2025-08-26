import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';

const StateViewer = () => {
    const tasks = useSelector(state => state.tasks);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Redux State Viewer</Text>

            <ScrollView style={styles.stateScrollView}>
                <View style={styles.stateSection}>
                    <Text style={styles.sectionTitle}>Tasks ({tasks.tasks.length})</Text>
                    {tasks.tasks.length > 0 ? (
                        tasks.tasks.map((task, index) => (
                            <View key={task.id || index} style={styles.taskItem}>
                                <Text style={styles.taskTitle}>{task.title || 'Untitled'}</Text>
                                <Text style={styles.taskDetails}>ID: {task.id || 'No ID'}</Text>
                                <Text style={styles.taskDetails}>Status: {task.status || 'Unknown'}</Text>
                                <Text style={styles.taskDetails}>
                                    Created: {task.createdAt ? new Date(parseInt(task.createdAt)).toLocaleDateString() : 'N/A'}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No tasks in state</Text>
                    )}
                </View>

                <View style={styles.stateSection}>
                    <Text style={styles.sectionTitle}>Filtered Tasks ({tasks.filteredTasks.length})</Text>
                    {tasks.filteredTasks.length > 0 ? (
                        tasks.filteredTasks.map((task, index) => (
                            <View key={task.id || index} style={styles.taskItem}>
                                <Text style={styles.taskTitle}>{task.title || 'Untitled'}</Text>
                                <Text style={styles.taskDetails}>ID: {task.id || 'No ID'}</Text>
                                <Text style={styles.taskDetails}>Status: {task.status || 'Unknown'}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No filtered tasks</Text>
                    )}
                </View>

                <View style={styles.stateSection}>
                    <Text style={styles.sectionTitle}>Current Filter</Text>
                    <Text style={styles.stateValue}>{tasks.currentFilter || 'None'}</Text>
                </View>

                <View style={styles.stateSection}>
                    <Text style={styles.sectionTitle}>Search Query</Text>
                    <Text style={styles.stateValue}>{tasks.searchQuery || 'None'}</Text>
                </View>

                <View style={styles.stateSection}>
                    <Text style={styles.sectionTitle}>Loading States</Text>
                    <Text style={styles.stateValue}>Main Loading: {tasks.loading ? 'Yes' : 'No'}</Text>
                    <Text style={styles.stateValue}>Details Loading: {tasks.taskDetailsLoading ? 'Yes' : 'No'}</Text>
                    <Text style={styles.stateValue}>Update Loading: {tasks.updateLoading ? 'Yes' : 'No'}</Text>
                </View>

                <View style={styles.stateSection}>
                    <Text style={styles.sectionTitle}>Errors</Text>
                    <Text style={styles.stateValue}>Main Error: {tasks.error || 'None'}</Text>
                    <Text style={styles.stateValue}>Details Error: {tasks.taskDetailsError || 'None'}</Text>
                    <Text style={styles.stateValue}>Update Error: {tasks.updateError || 'None'}</Text>
                </View>

                <View style={styles.stateSection}>
                    <Text style={styles.sectionTitle}>Last Updated</Text>
                    <Text style={styles.stateValue}>{tasks.lastUpdated || 'Never'}</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    stateScrollView: {
        maxHeight: 300,
    },
    stateSection: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#007BFF',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    stateValue: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#999',
    },
    taskItem: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    taskTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    taskDetails: {
        fontSize: 12,
        color: '#666',
    },
});

export default StateViewer;
