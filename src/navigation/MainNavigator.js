import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthState } from '../store/slices/authSlice';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/Login';
import ForgotPasswordScreen from '../screens/auth/ForgotPassword';
import TabNavigator from './TabNavigator';
import TaskDetail from '../screens/tasks/TaskDetail';
import TaskDetailEnhanced from '../screens/tasks/TaskDetailEnhanced';
import MaterialUsageScreen from '../components/MaterialUsage';
import MaterialRequestDetail from '../screens/materials/MaterialRequestDetail';
import MaterialList from '../screens/materials/MaterialList';
import EditProfile from '../screens/setting/EditProfile';
import ApiTestScreen from '../screens/ApiTestScreen';
import QRScanner from '../screens/QRScanner';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
    const [showSplash, setShowSplash] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            await dispatch(checkAuthState());
        };
        checkAuth();

        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [dispatch]);

    // Debug: Log the user value
    console.log('MainNavigator user:', user);

    if (showSplash) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="TaskDetail" component={TaskDetail} />
                        <Stack.Screen name="TaskDetailEnhanced" component={TaskDetailEnhanced} />
                        <Stack.Screen name="QRScanner" component={QRScanner} />
                        <Stack.Screen name="MaterialUsage" component={MaterialUsageScreen} />
                        <Stack.Screen name="MaterialRequestDetail" component={MaterialRequestDetail} />
                        <Stack.Screen name="MaterialList" component={MaterialList} />
                        <Stack.Screen name="EditProfile" component={EditProfile} />
                        <Stack.Screen name="ApiTest" component={ApiTestScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default MainNavigator;
