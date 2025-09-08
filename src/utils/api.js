// src/utils/api.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// For testing with local backend, use your computer's IP address
// const BASE_URL = 'https://api.ornaaya.com/api/';

// Determine the correct URL based on platform
import { Platform } from 'react-native';

const BASE_URL = Platform.select({
    ios: 'http://localhost:3000/api/',         // iOS simulator
    android: 'http://10.0.2.2:3000/api/',      // Android emulator
    default: 'http://localhost:3000/api/'
});

console.log('Using API BASE_URL:', BASE_URL);

// For physical devices, use your computer's IP address:
// const BASE_URL = 'http://192.168.1.XXX:3000/api/';

async function getAccessToken() {
    const raw = await AsyncStorage.getItem('token');
    if (!raw) return null;

    try {
        const { accessToken } = JSON.parse(raw);
        return accessToken;
    } catch {
        return null;
    }
}

async function getRefreshToken() {
    const raw = await AsyncStorage.getItem('token');
    if (!raw) return null;
    try {
        const { refreshToken } = JSON.parse(raw);
        return refreshToken;
    } catch {
        return null;
    }
}

const callApi = async ({ route, method = 'GET', body, baseUrl = BASE_URL }) => {
    try {
        const accessToken = await getAccessToken();

        const headers = {
            'Content-Type': 'application/json',
            'X-Client-Type': 'mobile',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        };

        const options = { method, headers };

        if (body && method !== 'GET') {
            options.body = body instanceof FormData ? body : JSON.stringify(body);
            if (body instanceof FormData) {
                // let fetch set the correct multipart content‐type
                delete headers['Content-Type'];
            }
        }
        
        console.log('Making request to:', `${baseUrl}${route}`);
        console.log('Request options:', JSON.stringify(options, null, 2));
        
        const response = await fetch(`${baseUrl}${route}`, options);

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const text = await response.text();
        console.log('Response text:', text);

        let data = text ? JSON.parse(text) : null;

    // If unauthorized, and not already a refresh-token call, try to refresh
    if (
        response.status === 401 &&
        !route.includes('refresh-token') &&
        !(data?.message?.includes('Invalid password'))
    ) {
        try {
            const refreshToken = await getRefreshToken();
            const refreshRes = await fetch(
                `${BASE_URL}/auth/refresh-token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Client-Type': 'mobile',
                    },
                    body: JSON.stringify({ refreshToken }),
                    credentials: 'include',
                }
            );

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                // store new tokens
                await AsyncStorage.setItem(
                    'token',
                    JSON.stringify(refreshData.tokens)
                );
                // retry original request
                return callApi({ route, method, body, baseUrl });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Session expired. Please log in again.',
                });
                return null;
            }
        } catch (refreshErr) {
            console.error('Refresh token error:', refreshErr);
            Toast.show({
                type: 'error',
                text1: 'Failed to refresh session. Please log in again.',
            });
            return null;
        }
    }

    return {
        data,
        status: response.status,
        ok: response.ok,
        message: response?.message,
    };
    } catch (error) {
        console.error('Network error in callApi:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error.message);
        
        // Re-throw the error so it can be handled by the calling function
        throw error;
    }
};

// Convenience wrappers
export const apiGet = (route, baseUrl) => callApi({ route, method: 'GET', baseUrl });
export const apiPost = (route, body, baseUrl) => callApi({ route, method: 'POST', body, baseUrl });
export const apiPut = (route, body, baseUrl) => callApi({ route, method: 'PUT', body, baseUrl });
export const apiDelete = (route, body, baseUrl) => callApi({ route, method: 'DELETE', body, baseUrl });
export const apiUpload = (route, formData, baseUrl) =>
    callApi({ route, method: 'POST', body: formData, baseUrl });

// Specific API functions
export const updateOrderDetails = async (updateData) => {
    try {
        console.log('Updating order with data:', updateData);
        console.log('Making POST request to: manufacture/add/order/updates');
        console.log('Base URL:', BASE_URL);
        
        const response = await apiPost('manufacture/add/order/updates', updateData);
        
        console.log('Raw response received:', response);
        
        if (response && response.ok) {
            console.log('Order update successful:', response.data);
            return response;
        } else {
            console.error('Order update failed:', response);
            const errorMessage = response?.data?.message || response?.data?.error || 'Failed to update order';
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error in updateOrderDetails:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a network error
        if (error.message === 'Network request failed') {
            throw new Error('Network connection failed. Please check your internet connection and try again.');
        }
        
        // Check if it's a fetch error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Unable to connect to server. Please check your connection.');
        }
        
        throw error;
    }
};

