import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPut } from '../../utils/api';
import Toast from 'react-native-toast-message';

// Async thunk for fetching all material requests
export const fetchMaterialRequests = createAsyncThunk(
    'materialRequests/fetchMaterialRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiGet('manufacture/material-request');

            if (response.ok) {
                // Handle different response structures
                if (typeof response.data === 'object' && response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                } else if (Array.isArray(response.data)) {
                    return response.data;
                } else {
                    return [];
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Requests',
                    text2: response.data?.message || 'Unable to fetch material requests',
                });
                return rejectWithValue(response.data?.message || 'Failed to fetch material requests');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Request Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for creating a new material request
export const createMaterialRequest = createAsyncThunk(
    'materialRequests/createMaterialRequest',
    async (requestData, { rejectWithValue }) => {
        try {
            console.log('Creating material request with data:', requestData);
            const response = await apiPost('manufacture/material-request', requestData);
            
            console.log('Create material request response:', response);

            if (response && response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Request Created',
                    text2: 'Material request has been submitted successfully',
                });
                // Return the created request data
                return response.data.data || response.data;
            } else {
                const errorMessage = response?.data?.message || response?.message || 'Failed to create material request';
                console.error('Material request creation failed:', errorMessage);
                
                Toast.show({
                    type: 'error',
                    text1: 'Creation Failed',
                    text2: errorMessage,
                });
                return rejectWithValue(errorMessage);
            }
        } catch (error) {
            console.error('Material request creation error:', error);
            
            Toast.show({
                type: 'error',
                text1: 'Creation Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for fetching material request details by ID
export const fetchMaterialRequestDetails = createAsyncThunk(
    'materialRequests/fetchMaterialRequestDetails',
    async (requestId, { rejectWithValue }) => {
        try {
            const response = await apiGet(`manufacture/material-request/${requestId}`);

            if (response.ok) {
                // Handle different response structures
                if (response.data && typeof response.data === 'object') {
                    if (response.data.data) {
                        return response.data.data;
                    } else if (response.data.request_id || response.data.id) {
                        return response.data;
                    }
                }
                return response.data;
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Request Details',
                    text2: response.data?.message || 'Unable to fetch request details',
                });
                return rejectWithValue(response.data?.message || 'Failed to fetch request details');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Request Details Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for updating material request
export const updateMaterialRequest = createAsyncThunk(
    'materialRequests/updateMaterialRequest',
    async ({ requestId, updateData }, { rejectWithValue }) => {
        try {
            const response = await apiPut(`manufacture/material-request/${requestId}`, updateData);

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Request Updated',
                    text2: 'Material request has been updated successfully',
                });
                return response.data.data || response.data;
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: response.data?.message || 'Failed to update material request',
                });
                return rejectWithValue(response.data?.message || 'Failed to update request');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Update Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    materialRequests: [],
    currentRequest: null,
    loading: false,
    createLoading: false,
    updateLoading: false,
    detailsLoading: false,
    error: null,
    createError: null,
    updateError: null,
    detailsError: null,
    lastUpdated: null,
};

const materialRequestSlice = createSlice({
    name: 'materialRequests',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
            state.createError = null;
            state.updateError = null;
            state.detailsError = null;
        },
        clearCurrentRequest: (state) => {
            state.currentRequest = null;
            state.detailsError = null;
        },
        updateRequestInList: (state, action) => {
            const { requestId, updates } = action.payload;
            const requestIndex = state.materialRequests.findIndex(
                request => (request.request_id || request.id) === requestId
            );
            if (requestIndex !== -1) {
                state.materialRequests[requestIndex] = { 
                    ...state.materialRequests[requestIndex], 
                    ...updates 
                };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all material requests
            .addCase(fetchMaterialRequests.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMaterialRequests.fulfilled, (state, action) => {
                state.loading = false;
                
                if (action.payload && Array.isArray(action.payload)) {
                    state.materialRequests = action.payload.map(request => ({
                        request_id: request.request_id || request.id,
                        id: request.id || request.request_id,
                        material_name: request.material_name,
                        quantity: request.quantity,
                        unit: request.unit,
                        notes: request.notes,
                        status: request.status,
                        createdAt: request.created_at || request.createdAt,
                        updatedAt: request.updated_at || request.updatedAt,
                        // Include other fields that might be present
                        company_id: request.company_id,
                        manufacturer_id: request.manufacturer_id,
                        approved_quantity: request.approved_quantity,
                        delivery_date: request.delivery_date,
                        response_notes: request.response_notes,
                    }));
                } else {
                    // Fallback to dummy data for development
                    if (state.materialRequests.length === 0) {
                        state.materialRequests = [
                            {
                                request_id: 'MR001',
                                id: 'MR001',
                                material_name: 'Gold 24K',
                                quantity: 50,
                                unit: 'g',
                                notes: 'Needed for urgent pendant orders',
                                status: 'pending',
                                createdAt: new Date().toISOString(),
                            },
                            {
                                request_id: 'MR002',
                                id: 'MR002',
                                material_name: 'Silver 925',
                                quantity: 100,
                                unit: 'g',
                                notes: 'For ring production',
                                status: 'approved',
                                createdAt: new Date(Date.now() - 86400000).toISOString(),
                                approved_quantity: 100,
                            },
                            {
                                request_id: 'MR003',
                                id: 'MR003',
                                material_name: 'Platinum',
                                quantity: 25,
                                unit: 'g',
                                notes: 'Premium collection requirements',
                                status: 'rejected',
                                createdAt: new Date(Date.now() - 172800000).toISOString(),
                                response_notes: 'Insufficient stock available',
                            },
                        ];
                    }
                }
                
                state.lastUpdated = new Date().toISOString();
                state.error = null;
            })
            .addCase(fetchMaterialRequests.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create material request
            .addCase(createMaterialRequest.pending, (state) => {
                state.createLoading = true;
                state.createError = null;
            })
            .addCase(createMaterialRequest.fulfilled, (state, action) => {
                state.createLoading = false;
                
                // Add the new request to the list
                if (action.payload) {
                    const newRequest = {
                        request_id: action.payload.request_id || action.payload.id,
                        id: action.payload.id || action.payload.request_id,
                        ...action.payload,
                        createdAt: action.payload.created_at || action.payload.createdAt || new Date().toISOString(),
                    };
                    state.materialRequests.unshift(newRequest);
                }
                
                state.createError = null;
            })
            .addCase(createMaterialRequest.rejected, (state, action) => {
                state.createLoading = false;
                state.createError = action.payload;
            })

            // Fetch material request details
            .addCase(fetchMaterialRequestDetails.pending, (state) => {
                state.detailsLoading = true;
                state.detailsError = null;
            })
            .addCase(fetchMaterialRequestDetails.fulfilled, (state, action) => {
                state.detailsLoading = false;
                state.currentRequest = action.payload;
                state.detailsError = null;
            })
            .addCase(fetchMaterialRequestDetails.rejected, (state, action) => {
                state.detailsLoading = false;
                state.detailsError = action.payload;
            })

            // Update material request
            .addCase(updateMaterialRequest.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(updateMaterialRequest.fulfilled, (state, action) => {
                state.updateLoading = false;
                
                // Update the request in the list if it exists
                if (action.payload) {
                    const requestId = action.payload.request_id || action.payload.id;
                    const requestIndex = state.materialRequests.findIndex(
                        request => (request.request_id || request.id) === requestId
                    );
                    if (requestIndex !== -1) {
                        state.materialRequests[requestIndex] = {
                            ...state.materialRequests[requestIndex],
                            ...action.payload,
                        };
                    }
                    
                    // Update current request if it's the same one
                    if (state.currentRequest && 
                        (state.currentRequest.request_id || state.currentRequest.id) === requestId) {
                        state.currentRequest = { ...state.currentRequest, ...action.payload };
                    }
                }
                
                state.updateError = null;
            })
            .addCase(updateMaterialRequest.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload;
            });
    },
});

export const {
    clearError,
    clearCurrentRequest,
    updateRequestInList,
} = materialRequestSlice.actions;

export default materialRequestSlice.reducer;