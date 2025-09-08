import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { apiGet, apiPost, apiPut } from '../utils/api';
import TopBar from '../components/ui/TopBar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ApiTestScreen = () => {
    const [testResults, setTestResults] = useState([]);
    const [testing, setTesting] = useState(false);
    const [currentTest, setCurrentTest] = useState('');
    
    const { user } = useSelector((state) => state.auth);

    const apiTests = [
        {
            name: 'Dashboard API',
            endpoint: 'manufacture/mainPage/data',
            method: 'GET',
            description: 'Fetch dashboard data with tasks, repairs, and materials',
        },
        {
            name: 'All Tasks',
            endpoint: 'manufacture/allTask',
            method: 'GET',
            description: 'Get all tasks/orders',
        },
        {
            name: 'Pending Tasks',
            endpoint: 'manufacture/allTask?status=pending',
            method: 'GET',
            description: 'Get pending tasks',
        },
        {
            name: 'In Progress Tasks',
            endpoint: 'manufacture/allTask?status=in progress',
            method: 'GET',
            description: 'Get in-progress tasks',
        },
        {
            name: 'Completed Tasks',
            endpoint: 'manufacture/allTask?status=completed',
            method: 'GET',
            description: 'Get completed tasks',
        },
        {
            name: 'All Repairs',
            endpoint: 'manufacture/allRepair',
            method: 'GET',
            description: 'Get all repair orders',
        },
        {
            name: 'Pending Repairs',
            endpoint: 'manufacture/allRepair?status=pending',
            method: 'GET',
            description: 'Get pending repairs',
        },
        {
            name: 'In Progress Repairs',
            endpoint: 'manufacture/allRepair?status=in progress',
            method: 'GET',
            description: 'Get in-progress repairs',
        },
        {
            name: 'Completed Repairs',
            endpoint: 'manufacture/allRepair?status=completed',
            method: 'GET',
            description: 'Get completed repairs',
        },
        {
            name: 'Material Usage (Gold)',
            endpoint: 'manufacture/material-usage/1',
            method: 'GET',
            description: 'Get material usage details for Gold (ID: 1)',
        },
        {
            name: 'Single Task Detail',
            endpoint: 'manufacture/singleTask/9',
            method: 'GET',
            description: 'Get details of task ID 9',
        },
        {
            name: 'Single Repair Detail',
            endpoint: 'manufacture/singleRepair/1',
            method: 'GET',
            description: 'Get details of repair ID 1',
        },
        {
            name: 'Update Task Status',
            endpoint: 'manufacture/updateTaskStatus/9',
            method: 'PUT',
            body: { status: 'in progress' },
            description: 'Update task status to in progress',
        },
        {
            name: 'Update Repair Status',
            endpoint: 'manufacture/updateRepairStatus/1',
            method: 'PUT',
            body: { status: 'in progress' },
            description: 'Update repair status to in progress',
        },
    ];

    const runSingleTest = async (test) => {
        const startTime = Date.now();
        let result = {
            name: test.name,
            endpoint: test.endpoint,
            method: test.method,
            status: 'testing',
            responseTime: 0,
            data: null,
            error: null,
        };

        try {
            let response;
            
            if (test.method === 'GET') {
                response = await apiGet(test.endpoint);
            } else if (test.method === 'POST') {
                response = await apiPost(test.endpoint, test.body || {});
            } else if (test.method === 'PUT') {
                response = await apiPut(test.endpoint, test.body || {});
            }

            const endTime = Date.now();
            result.responseTime = endTime - startTime;

            if (response.ok) {
                result.status = 'success';
                result.data = response.data;
                
                // Log summary of response
                console.log(`✅ ${test.name} Success:`, {
                    endpoint: test.endpoint,
                    responseTime: `${result.responseTime}ms`,
                    dataKeys: response.data ? Object.keys(response.data) : [],
                    success: response.data?.success,
                    message: response.data?.message,
                });
            } else {
                result.status = 'failed';
                result.error = response.data?.message || 'Request failed';
                console.log(`❌ ${test.name} Failed:`, result.error);
            }
        } catch (error) {
            const endTime = Date.now();
            result.responseTime = endTime - startTime;
            result.status = 'error';
            result.error = error.message;
            console.error(`❌ ${test.name} Error:`, error);
        }

        return result;
    };

    const runAllTests = async () => {
        setTesting(true);
        setTestResults([]);
        
        const results = [];
        
        for (const test of apiTests) {
            setCurrentTest(test.name);
            const result = await runSingleTest(test);
            results.push(result);
            setTestResults([...results]);
            
            // Small delay between tests to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        setTesting(false);
        setCurrentTest('');
        
        // Show summary
        const successCount = results.filter(r => r.status === 'success').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        
        Alert.alert(
            'Test Complete',
            `Results:\n✅ Success: ${successCount}\n❌ Failed: ${failedCount}\n⚠️ Errors: ${errorCount}\n\nTotal: ${results.length} tests`,
            [{ text: 'OK' }]
        );
    };

    const runSpecificTest = async (test) => {
        setTesting(true);
        setCurrentTest(test.name);
        
        const result = await runSingleTest(test);
        
        // Update or add result
        setTestResults(prev => {
            const existing = prev.findIndex(r => r.name === test.name);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = result;
                return updated;
            }
            return [...prev, result];
        });
        
        setTesting(false);
        setCurrentTest('');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <Icon name="check-circle" size={20} color="#4CAF50" />;
            case 'failed':
                return <Icon name="close-circle" size={20} color="#f44336" />;
            case 'error':
                return <Icon name="alert-circle" size={20} color="#FF9800" />;
            case 'testing':
                return <ActivityIndicator size="small" color="#2196F3" />;
            default:
                return <Icon name="help-circle" size={20} color="#9E9E9E" />;
        }
    };

    const getResultForTest = (testName) => {
        return testResults.find(r => r.name === testName);
    };

    return (
        <SafeAreaView style={styles.container}>
            <TopBar title="API Test Suite" showBack={true} />
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>API Endpoint Testing</Text>
                    <Text style={styles.subtitle}>
                        Test all API endpoints to verify they're working correctly
                    </Text>
                    <Text style={styles.userInfo}>
                        Logged in as: {user?.username || user?.email || 'Unknown'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.runAllButton, testing && styles.buttonDisabled]}
                    onPress={runAllTests}
                    disabled={testing}
                >
                    {testing ? (
                        <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.runAllButtonText}>
                                Testing: {currentTest}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.runAllButtonText}>Run All Tests</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.testsContainer}>
                    {apiTests.map((test, index) => {
                        const result = getResultForTest(test.name);
                        const isCurrentTest = currentTest === test.name;
                        
                        return (
                            <View key={index} style={styles.testCard}>
                                <View style={styles.testHeader}>
                                    <View style={styles.testInfo}>
                                        <View style={styles.testTitleRow}>
                                            {result && getStatusIcon(result.status)}
                                            <Text style={styles.testName}>{test.name}</Text>
                                        </View>
                                        <Text style={styles.testEndpoint}>
                                            {test.method} /{test.endpoint}
                                        </Text>
                                        <Text style={styles.testDescription}>
                                            {test.description}
                                        </Text>
                                    </View>
                                    
                                    <TouchableOpacity
                                        style={[styles.testButton, (testing && !isCurrentTest) && styles.buttonDisabled]}
                                        onPress={() => runSpecificTest(test)}
                                        disabled={testing && !isCurrentTest}
                                    >
                                        {isCurrentTest ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.testButtonText}>Test</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                                
                                {result && (
                                    <View style={styles.testResult}>
                                        {result.status === 'success' && (
                                            <>
                                                <Text style={styles.successText}>
                                                    ✅ Success ({result.responseTime}ms)
                                                </Text>
                                                {result.data?.message && (
                                                    <Text style={styles.resultMessage}>
                                                        {result.data.message}
                                                    </Text>
                                                )}
                                                {result.data?.data && (
                                                    <Text style={styles.resultData}>
                                                        Data: {JSON.stringify(Object.keys(result.data.data)).slice(0, 100)}...
                                                    </Text>
                                                )}
                                            </>
                                        )}
                                        {result.status === 'failed' && (
                                            <Text style={styles.errorText}>
                                                ❌ Failed: {result.error} ({result.responseTime}ms)
                                            </Text>
                                        )}
                                        {result.status === 'error' && (
                                            <Text style={styles.errorText}>
                                                ⚠️ Error: {result.error} ({result.responseTime}ms)
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {testResults.length > 0 && (
                    <View style={styles.summary}>
                        <Text style={styles.summaryTitle}>Test Summary</Text>
                        <View style={styles.summaryStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {testResults.filter(r => r.status === 'success').length}
                                </Text>
                                <Text style={styles.statLabel}>Passed</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, styles.failedStat]}>
                                    {testResults.filter(r => r.status === 'failed').length}
                                </Text>
                                <Text style={styles.statLabel}>Failed</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, styles.errorStat]}>
                                    {testResults.filter(r => r.status === 'error').length}
                                </Text>
                                <Text style={styles.statLabel}>Errors</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {Math.round(testResults.reduce((acc, r) => acc + r.responseTime, 0) / testResults.length)}ms
                                </Text>
                                <Text style={styles.statLabel}>Avg Time</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    userInfo: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    runAllButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    runAllButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    testsContainer: {
        padding: 16,
        gap: 12,
    },
    testCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    testHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    testInfo: {
        flex: 1,
        marginRight: 12,
    },
    testTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    testName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    testEndpoint: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    testDescription: {
        fontSize: 12,
        color: '#999',
    },
    testButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 60,
        alignItems: 'center',
    },
    testButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    testResult: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    successText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        color: '#f44336',
        fontSize: 14,
        fontWeight: '500',
    },
    resultMessage: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    resultData: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        fontFamily: 'monospace',
    },
    summary: {
        margin: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    summaryStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    failedStat: {
        color: '#f44336',
    },
    errorStat: {
        color: '#FF9800',
    },
});

export default ApiTestScreen;