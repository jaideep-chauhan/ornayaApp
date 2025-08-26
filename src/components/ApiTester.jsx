import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { testApiResponse, fetchAllTasks } from '../store/slices/tasksSlice';

const ApiTester = () => {
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.tasks);

    const runApiTest = () => {
        console.log('Running API Test...');
        dispatch(testApiResponse());
    };

    const fetchAllData = () => {
        console.log('Fetching all task data...');
        dispatch(fetchAllTasks('all'));
    };

    const fetchPendingData = () => {
        console.log('Fetching pending task data...');
        dispatch(fetchAllTasks('pending'));
    };

    const fetchInProgressData = () => {
        console.log('Fetching in-progress task data...');
        dispatch(fetchAllTasks('inProgress'));
    };

    const fetchCompletedData = () => {
        console.log('Fetching completed task data...');
        dispatch(fetchAllTasks('completed'));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>API Tester</Text>
            <Text style={styles.subtitle}>Use these buttons to test API responses</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={runApiTest}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Test API Structure</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={fetchAllData}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Fetch All Tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={fetchPendingData}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Fetch Pending Tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={fetchInProgressData}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Fetch In-Progress Tasks</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={fetchCompletedData}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Fetch Completed Tasks</Text>
                </TouchableOpacity>
            </View>

            {loading && (
                <Text style={styles.loadingText}>Loading...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        margin: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    buttonContainer: {
        gap: 8,
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
        textAlign: 'center',
    },
    loadingText: {
        marginTop: 16,
        textAlign: 'center',
        color: '#666',
    }
});

export default ApiTester;
