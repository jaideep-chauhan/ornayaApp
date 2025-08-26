import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

// Import clipboard with error handling
let Clipboard = null;
try {
    Clipboard = require('@react-native-clipboard/clipboard').default;
} catch (error) {
    console.log('📋 Clipboard module not available:', error.message);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser } from '../store/slices/authSlice';
import { fetchTaskDetails } from '../store/slices/tasksSlice';
import { fetchRepairDetails } from '../store/slices/repairsSlice';
import TopBar from './ui/TopBar';

const DebugAuth = () => {
    const auth = useSelector(state => state.auth);
    const tasks = useSelector(state => state.tasks);
    const repairs = useSelector(state => state.repairs || {});
    const dispatch = useDispatch();

    useEffect(() => {
        console.log('🐛 DebugAuth - Full Redux State:', {
            auth,
            tasks,
            repairs
        });
    }, [auth, tasks, repairs]);

    const copyToClipboard = (data, label) => {
        const jsonString = JSON.stringify(data, null, 2);

        if (Clipboard && Clipboard.setString) {
            try {
                Clipboard.setString(jsonString);
                Alert.alert('📋 Copied!', `${label} data copied to clipboard`);
            } catch (error) {
                console.log('📋 Copy failed:', error.message);
                Alert.alert('❌ Copy Failed', `Could not copy ${label} data to clipboard. Check console for JSON.`);
                console.log(`${label} Data:`, data);
            }
        } else {
            Alert.alert('❌ Clipboard Unavailable', `Clipboard module not available. Check console for ${label} data.`);
            console.log(`${label} Data:`, data);
        }
    };

    const checkAsyncStorage = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');
            const userPreferences = await AsyncStorage.getItem('userPreferences');

            const storageData = {
                token: storedToken,
                user: storedUser ? JSON.parse(storedUser) : null,
                userPreferences: userPreferences ? JSON.parse(userPreferences) : null
            };

            Alert.alert('AsyncStorage Contents',
                `Token exists: ${!!storedToken}\nUser exists: ${!!storedUser}\nPreferences exist: ${!!userPreferences}`,
                [
                    { text: 'OK' },
                    { text: 'Copy All', onPress: () => copyToClipboard(storageData, 'AsyncStorage') }
                ]
            );
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const clearStorage = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('userPreferences');
            Alert.alert('Success', 'Storage cleared');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const testTaskDetails = async () => {
        console.log('🧪 Testing Task Details API with ID: 1');
        dispatch(fetchTaskDetails(1));
        Alert.alert('Test Started', 'Check console for task details API response');
    };

    const testRepairDetails = async () => {
        console.log('🧪 Testing Repair Details API with ID: 1');
        dispatch(fetchRepairDetails(1));
        Alert.alert('Test Started', 'Check console for repair details API response');
    };

    const DataSection = ({ title, data, copyLabel }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(data, copyLabel)}
                >
                    <Text style={styles.copyButtonText}>📋 Copy</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.dataContainer} nestedScrollEnabled>
                <Text style={styles.dataText}>{JSON.stringify(data, null, 2)}</Text>
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <TopBar title="Debug Panel" showBack={false} showNotification={false} />

            <ScrollView style={styles.scrollContainer}>
                {/* Auth State */}
                <DataSection
                    title="🔐 Auth State"
                    data={auth}
                    copyLabel="Auth State"
                />

                {/* Tasks State */}
                <DataSection
                    title="📋 Tasks/Orders State"
                    data={tasks}
                    copyLabel="Tasks State"
                />

                {/* Repairs State */}
                <DataSection
                    title="🔧 Repairs State"
                    data={repairs}
                    copyLabel="Repairs State"
                />

                {/* Current Task Detail */}
                {tasks.currentTask && (
                    <DataSection
                        title="📄 Current Task Detail"
                        data={tasks.currentTask}
                        copyLabel="Current Task Detail"
                    />
                )}

                {/* Current Repair Detail */}
                {repairs.currentRepair && (
                    <DataSection
                        title="🔧 Current Repair Detail"
                        data={repairs.currentRepair}
                        copyLabel="Current Repair Detail"
                    />
                )}

                {/* Action Buttons */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#059669' }]} onPress={testTaskDetails}>
                        <Text style={styles.buttonText}>🧪 Test Task Details API (ID: 1)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, { backgroundColor: '#7C3AED' }]} onPress={testRepairDetails}>
                        <Text style={styles.buttonText}>🧪 Test Repair Details API (ID: 1)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={checkAsyncStorage}>
                        <Text style={styles.buttonText}>💾 Check AsyncStorage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={() => copyToClipboard({
                        auth,
                        tasks,
                        repairs,
                        timestamp: new Date().toISOString()
                    }, 'Complete Redux State')}>
                        <Text style={styles.buttonText}>📋 Copy All Redux State</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={clearStorage}>
                        <Text style={styles.buttonText}>🗑️ Clear Storage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={() => dispatch(logoutUser())}>
                        <Text style={styles.buttonText}>🚪 Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Debug Info */}
                <View style={styles.debugInfo}>
                    <Text style={styles.debugTitle}>🐛 Debug Information</Text>
                    <Text style={styles.debugText}>
                        • Copy any section data to clipboard{'\n'}
                        • Share data structure with developer{'\n'}
                        • Check AsyncStorage contents{'\n'}
                        • Monitor state changes in real-time{'\n'}
                        • Clear storage for fresh start
                    </Text>
                    <Text style={styles.versionText}>
                        Debug Version: 1.0{'\n'}
                        Last Updated: {new Date().toLocaleString()}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2A44',
    },
    copyButton: {
        backgroundColor: '#1E40AF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    copyButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    dataContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 12,
        maxHeight: 200,
    },
    dataText: {
        fontSize: 11,
        color: '#374151',
        fontFamily: 'monospace',
        lineHeight: 16,
    },
    buttonSection: {
        marginTop: 20,
    },
    button: {
        backgroundColor: '#1E40AF',
        padding: 14,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    logoutButton: {
        backgroundColor: '#DC2626',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    debugInfo: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        marginBottom: 20,
    },
    debugTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
        marginBottom: 12,
    },
    versionText: {
        fontSize: 12,
        color: '#78716C',
        fontStyle: 'italic',
    },
});

export default DebugAuth;
