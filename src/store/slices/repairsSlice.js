import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPut } from '../../utils/api';
import Toast from 'react-native-toast-message';
import { extractDataArray } from '../../utils/apiValidator';

// Async thunk for fetching all repairs
export const fetchAllRepairs = createAsyncThunk(
    'repairs/fetchAllRepairs',
    async (status = 'all', { rejectWithValue }) => {
        try {
            // Convert 'All' to 'all' for API
            const apiStatus = status === 'All' ? 'all' : status;

            const response = await apiGet(`manufacture/all/repairs?status=${apiStatus}`);

            if (response.ok) {
                // Extract the repairs array using our validator utility
                const repairsArray = extractDataArray(response);

                if (repairsArray) {
                    return repairsArray;
                } else {
                    Toast.show({
                        type: 'warning',
                        text1: 'Data Format Issue',
                        text2: 'Could not extract repairs from response',
                    });
                    return [];
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Repairs',
                    text2: response.data?.message || 'Unable to fetch repairs',
                });
                return rejectWithValue(response.data?.message || 'Failed to fetch repairs');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Repairs Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for fetching repair details by ID
export const fetchRepairDetails = createAsyncThunk(
    'repairs/fetchRepairDetails',
    async (repairId, { rejectWithValue }) => {
        try {
            const response = await apiGet(`manufacture/repair/details/${repairId}`);

            if (response.ok) {
                // Handle nested data structure - the actual repair data is in response.data.data
                if (response.data && response.data.data) {
                    return response.data.data;
                } else if (response.data) {
                    return response.data;
                } else {
                    return {};
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Repair Details',
                    text2: response.data?.message || 'Unable to fetch repair details',
                });
                return rejectWithValue(response.data?.message || 'Failed to fetch repair details');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Repair Details Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for updating repair status
export const updateRepairStatus = createAsyncThunk(
    'repairs/updateRepairStatus',
    async (statusData, { rejectWithValue }) => {
        try {
            const response = await apiPut('manufacture/repairs/update-status', statusData);

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: '🔧 Repair Status Updated!',
                    text2: 'The repair status has been successfully updated in the system.',
                    visibilityTime: 4000,
                    position: 'top',
                    topOffset: 60,
                });
                return response.data;
            } else {
                Toast.show({
                    type: 'error',
                    text1: '❌ Update Failed',
                    text2: response.data?.message || 'Unable to update repair status. Please try again.',
                    visibilityTime: 4000,
                    position: 'top',
                    topOffset: 60,
                });
                return rejectWithValue(response.data?.message || 'Failed to update status');
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

// Async thunk for adding repair details/updates
export const addRepairUpdate = createAsyncThunk(
    'repairs/addRepairUpdate',
    async (updateData, { rejectWithValue }) => {
        try {
            const response = await apiPost('manufacture/add/repair/updates', updateData);

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Update Added',
                    text2: 'Repair update has been added successfully',
                });
                return response.data;
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: response.data?.message || 'Failed to add repair update',
                });
                return rejectWithValue(response.data?.message || 'Failed to add update');
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
    repairs: [],
    currentRepair: null,
    filteredRepairs: [],
    currentFilter: 'All',
    searchQuery: '',
    loading: false,
    repairDetailsLoading: false,
    updateLoading: false,
    error: null,
    repairDetailsError: null,
    updateError: null,
    lastUpdated: null,
};

const repairsSlice = createSlice({
    name: 'repairs',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
            state.repairDetailsError = null;
            state.updateError = null;
        },
        setFilter: (state, action) => {
            state.currentFilter = action.payload;

            if (Array.isArray(state.repairs)) {
                state.filteredRepairs = filterRepairs(state.repairs, action.payload, state.searchQuery);
            } else {
                state.filteredRepairs = [];
            }
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;

            if (Array.isArray(state.repairs)) {
                state.filteredRepairs = filterRepairs(state.repairs, state.currentFilter, action.payload);
            } else {
                state.filteredRepairs = [];
            }
        },
        updateRepairInList: (state, action) => {
            const { repairId, updates } = action.payload;
            const repairIndex = state.repairs.findIndex(repair => repair.id === repairId);
            if (repairIndex !== -1) {
                state.repairs[repairIndex] = { ...state.repairs[repairIndex], ...updates };
                state.filteredRepairs = filterRepairs(state.repairs, state.currentFilter, state.searchQuery);
            }
        },
        clearCurrentRepair: (state) => {
            state.currentRepair = null;
            state.repairDetailsError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all repairs
            .addCase(fetchAllRepairs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllRepairs.fulfilled, (state, action) => {
                // Check if payload is an array
                if (Array.isArray(action.payload)) {
                    // Set repairs array
                    state.loading = false;
                    state.repairs = action.payload;

                    // Apply filtering (only if we have repairs)
                    if (state.repairs.length > 0) {
                        state.filteredRepairs = filterRepairs(state.repairs, state.currentFilter, state.searchQuery);
                    } else {
                        state.filteredRepairs = [];
                    }

                    // Update last updated timestamp
                    state.lastUpdated = new Date().toISOString();
                    state.error = null;
                } else {
                    // Set empty arrays to prevent UI crashes
                    state.loading = false;
                    state.repairs = [];
                    state.filteredRepairs = [];
                    state.error = 'Invalid response format';

                    // Display error toast
                    Toast.show({
                        type: 'error',
                        text1: 'Data Format Error',
                        text2: 'The server returned invalid data format',
                    });
                }
            })
            .addCase(fetchAllRepairs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch repair details
            .addCase(fetchRepairDetails.pending, (state) => {
                state.repairDetailsLoading = true;
                state.repairDetailsError = null;
            })
            .addCase(fetchRepairDetails.fulfilled, (state, action) => {
                state.repairDetailsLoading = false;
                state.currentRepair = action.payload;
                state.repairDetailsError = null;
            })
            .addCase(fetchRepairDetails.rejected, (state, action) => {
                state.repairDetailsLoading = false;
                state.repairDetailsError = action.payload;
            })

            // Update repair status
            .addCase(updateRepairStatus.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(updateRepairStatus.fulfilled, (state, action) => {
                state.updateLoading = false;
                // Update the repair in the list if it exists
                if (action.payload && action.payload.id) {
                    const repairIndex = state.repairs.findIndex(repair => repair.id === action.payload.id);
                    if (repairIndex !== -1) {
                        state.repairs[repairIndex] = { ...state.repairs[repairIndex], ...action.payload };
                        state.filteredRepairs = filterRepairs(state.repairs, state.currentFilter, state.searchQuery);
                    }
                }
                state.updateError = null;
            })
            .addCase(updateRepairStatus.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload;
            })

            // Add repair update
            .addCase(addRepairUpdate.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(addRepairUpdate.fulfilled, (state, action) => {
                state.updateLoading = false;
                // Update current repair if it matches
                if (state.currentRepair && action.payload && state.currentRepair.id === action.payload.repair_id) {
                    state.currentRepair = { ...state.currentRepair, ...action.payload };
                }
                state.updateError = null;
            })
            .addCase(addRepairUpdate.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload;
            });
    },
});

// Helper function to filter repairs
const filterRepairs = (repairs, filter, searchQuery) => {
    // Ensure repairs is an array
    if (!Array.isArray(repairs)) {
        return [];
    }

    let filtered = [...repairs];

    // Status mapping for standardization
    const statusMapping = {
        'new': ['new', 'pending'],
        'in progress': ['in_progress', 'in progress'],
        'completed': ['completed'],
        'cancelled': ['cancelled']
    };

    // Apply status filter if not "All" or "all"
    if (filter && filter.toLowerCase() !== 'all') {
        const filterLower = filter.toLowerCase();
        filtered = filtered.filter(repair => {
            if (!repair || !repair.status) {
                return false;
            }

            const repairStatus = repair.status.toLowerCase();

            // Check if the repair status matches any of the mapped statuses for this filter
            const match = statusMapping[filterLower] ?
                statusMapping[filterLower].includes(repairStatus) :
                repairStatus === filterLower;

            return match;
        });
    }

    // Apply search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(repair => {
            if (!repair) return false;

            const titleMatch = repair.title?.toLowerCase()?.includes(query) || false;
            const idMatch = repair.id?.toString()?.toLowerCase()?.includes(query) || false;
            const repair_idMatch = repair.repair_id?.toString()?.toLowerCase()?.includes(query) || false;
            const descMatch = repair.description?.toLowerCase()?.includes(query) || false;

            return titleMatch || idMatch || repair_idMatch || descMatch;
        });
    }

    return filtered;
};

export const {
    clearError,
    setFilter,
    setSearchQuery,
    updateRepairInList,
    clearCurrentRepair
} = repairsSlice.actions;

export default repairsSlice.reducer;
