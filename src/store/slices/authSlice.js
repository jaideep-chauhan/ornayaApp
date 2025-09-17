import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '../../utils/api';
import { decodeJWT, isTokenExpired } from '../../utils/jwt';
import Toast from 'react-native-toast-message';

// Async thunk for login
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await apiPost('common/login', credentials);

            if (response.ok) {
                // Store token in AsyncStorage
                await AsyncStorage.setItem('token', JSON.stringify(response.data.tokens));

                // Use optimized user data from response if available
                let userInfo;
                if (response.data.user) {
                    // Use the optimized user data from backend
                    userInfo = {
                        ...response.data.user,
                        username: credentials.username,
                        company_key: credentials.company_key,
                        loginTime: new Date().toISOString(),
                    };
                } else {
                    // Fallback to extracting from JWT token
                    const decodedToken = decodeJWT(response.data.tokens.accessToken);
                    console.log("Decoded Token:", decodedToken);
                    
                    userInfo = {
                        user_id: decodedToken?.user_id,
                        member_id: decodedToken?.member_id,
                        company_id: decodedToken?.company_id,
                        role: decodedToken?.role,
                        username: credentials.username,
                        company_key: credentials.company_key,
                        loginTime: new Date().toISOString(),
                    };
                }

                await AsyncStorage.setItem('user', JSON.stringify(userInfo));

                Toast.show({
                    type: 'success',
                    text1: 'Login Successful',
                    text2: 'Welcome back!',
                });

                return {
                    tokens: response.data.tokens,
                    user: userInfo,
                    message: response.data.message,
                    optimized: !!response.data.user // Track if we got optimized data
                };
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Login Failed',
                    text2: response.data?.message || 'Invalid credentials',
                });
                return rejectWithValue(response.data?.message || 'Login failed');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Login Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');

            Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'See you again!',
            });

            return true;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for checking existing session
export const checkAuthState = createAsyncThunk(
    'auth/checkAuthState',
    async (_, { rejectWithValue }) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const user = await AsyncStorage.getItem('user');

            if (token && user) {
                const parsedTokens = JSON.parse(token);
                const parsedUser = JSON.parse(user);

                // Check if access token is expired
                if (isTokenExpired(parsedTokens.accessToken)) {
                    // Could implement refresh token logic here
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                    return null;
                }

                return {
                    tokens: parsedTokens,
                    user: parsedUser,
                };
            }

            return null;
        } catch (error) {
            console.error("Error checking auth state:", error);
            // Clear corrupted data
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.tokens = action.payload.tokens;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })

            // Logout
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.tokens = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Check auth state
            .addCase(checkAuthState.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuthState.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.user = action.payload.user;
                    state.tokens = action.payload.tokens;
                    state.isAuthenticated = true;
                }
            })
            .addCase(checkAuthState.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            });
    },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
