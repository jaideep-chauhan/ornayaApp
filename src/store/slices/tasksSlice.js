import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPut } from '../../utils/api';
import Toast from 'react-native-toast-message';

// Async thunk for fetching all tasks
export const fetchAllTasks = createAsyncThunk(
    'tasks/fetchAllTasks',
    async (status = 'all', { rejectWithValue }) => {
        try {
            const response = await apiGet(`manufacture/all/task?status=${status}`);

            if (response.ok) {
                // Check if response.data is an object with a data property (nested structure)
                if (typeof response.data === 'object' && response.data.data && Array.isArray(response.data.data)) {
                    // Return the nested data array
                    return response.data.data;
                } else if (Array.isArray(response.data)) {
                    // Handle direct array response
                    return response.data;
                } else {
                    // For any other structure, return empty array
                    return [];
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Orders',
                    text2: response.data?.message || 'Unable to fetch orders',
                });
                return rejectWithValue(response.data?.message || 'Failed to fetch orders');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Orders Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for fetching task details by ID
export const fetchTaskDetails = createAsyncThunk(
    'tasks/fetchTaskDetails',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await apiGet(`manufacture/order/details/${orderId}`);

            if (response.ok) {
                // Handle different response structures
                if (response.data && typeof response.data === 'object') {
                    // Check if it's a nested structure with data.data
                    if (response.data.data) {
                        return response.data.data;
                    }
                    // Check if it's a direct task object with expected fields
                    else if (response.data.order_id || response.data.id || response.data.title) {
                        return response.data;
                    }
                    // If it's an object but not a task, try to extract task data
                    else if (response.data.task || response.data.order) {
                        return response.data.task || response.data.order;
                    }
                }
                // Fallback: return the data as-is
                return response.data;
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Order Details',
                    text2: response.data?.message || 'Unable to fetch order details',
                });
                return rejectWithValue(response.data?.message || 'Failed to fetch order details');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Order Details Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk for updating task status
export const updateTaskStatus = createAsyncThunk(
    'tasks/updateTaskStatus',
    async (statusData, { rejectWithValue }) => {
        try {
            const response = await apiPut('manufacture/orders/update-status', statusData);

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Status Updated',
                    text2: 'Order status has been updated successfully',
                });
                return response.data.data;
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: response.data?.message || 'Failed to update order status',
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

// Async thunk for adding task details/updates
export const addTaskUpdate = createAsyncThunk(
    'tasks/addTaskUpdate',
    async (updateData, { rejectWithValue }) => {
        try {
            const response = await apiPost('manufacture/add/order/updates', updateData);

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Update Added',
                    text2: 'Task update has been added successfully',
                });
                return response.data.data;
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Update Failed',
                    text2: response.data?.message || 'Failed to add task update',
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
    tasks: [],
    currentTask: null,
    filteredTasks: [],
    currentFilter: 'All',  // Match the UI filter option case
    searchQuery: '',
    loading: false,
    taskDetailsLoading: false,
    updateLoading: false,
    error: null,
    taskDetailsError: null,
    updateError: null,
    lastUpdated: null,
};

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
            state.taskDetailsError = null;
            state.updateError = null;
        },
        setFilter: (state, action) => {
            state.currentFilter = action.payload;
            state.filteredTasks = filterTasks(state.tasks, action.payload, state.searchQuery);
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
            state.filteredTasks = filterTasks(state.tasks, state.currentFilter, action.payload);
        },
        updateTaskInList: (state, action) => {
            const { taskId, updates } = action.payload;
            const taskIndex = state.tasks.findIndex(task => task.id === taskId);
            if (taskIndex !== -1) {
                state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
                state.filteredTasks = filterTasks(state.tasks, state.currentFilter, state.searchQuery);
            }
        },
        clearCurrentTask: (state) => {
            state.currentTask = null;
            state.taskDetailsError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all tasks
            .addCase(fetchAllTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllTasks.fulfilled, (state, action) => {
                state.loading = false;

                // Map the API response to our task format
                if (action.payload && Array.isArray(action.payload) && action.payload.length > 0) {
                    state.tasks = action.payload.map(task => {
                        return {
                            id: task.order_id,
                            title: task.title,
                            status: task.status,
                            // Store dates as ISO strings (serializable) instead of Date objects
                            createdAt: task.created_at ? task.created_at.toString() : null,
                            deadline: task.deadline ? (task.deadline * 1000).toString() : null,
                        };
                    });
                } else {
                    // Only use dummy data if we don't have any data
                    if (!state.tasks.length) {
                        state.tasks = [
                            {
                                id: 'T98432',
                                title: 'Gold Pendant – 3 Stones',
                                status: 'pending',
                                createdAt: Date.now().toString(),
                                deadline: (Date.now() + 7 * 24 * 60 * 60 * 1000).toString()  // 7 days from now
                            },
                            {
                                id: 'T98433',
                                title: 'Silver Pendant – 5 Stones',
                                status: 'in progress',
                                createdAt: Date.now().toString(),
                                deadline: (Date.now() + 5 * 24 * 60 * 60 * 1000).toString()  // 5 days from now
                            },
                            {
                                id: 'T98434',
                                title: 'Platinum Ring – 2 Stones',
                                status: 'completed',
                                createdAt: Date.now().toString(),
                                deadline: (Date.now() + 3 * 24 * 60 * 60 * 1000).toString()  // 3 days from now
                            }
                        ];
                    }
                }

                // Apply filtering
                state.filteredTasks = filterTasks(state.tasks, state.currentFilter, state.searchQuery);
                state.lastUpdated = new Date().toISOString();
                state.error = null;
            })
            .addCase(fetchAllTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch task details
            .addCase(fetchTaskDetails.pending, (state) => {
                state.taskDetailsLoading = true;
                state.taskDetailsError = null;
            })
            .addCase(fetchTaskDetails.fulfilled, (state, action) => {
                state.taskDetailsLoading = false;

                // Store the complete response as currentTask for flexibility
                if (action.payload && typeof action.payload === 'object') {
                    state.currentTask = action.payload;
                } else {
                    state.currentTask = null;
                }

                state.taskDetailsError = null;
            })
            .addCase(fetchTaskDetails.rejected, (state, action) => {
                state.taskDetailsLoading = false;
                state.taskDetailsError = action.payload;
            })

            // Update task status
            .addCase(updateTaskStatus.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(updateTaskStatus.fulfilled, (state, action) => {
                state.updateLoading = false;
                // Update the task in the list if it exists
                if (action.payload && action.payload.id) {
                    const taskIndex = state.tasks.findIndex(task => task.id === action.payload.id);
                    if (taskIndex !== -1) {
                        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...action.payload };
                        state.filteredTasks = filterTasks(state.tasks, state.currentFilter, state.searchQuery);
                    }
                }
                state.updateError = null;
            })
            .addCase(updateTaskStatus.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload;
            })

            // Add task update
            .addCase(addTaskUpdate.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(addTaskUpdate.fulfilled, (state, action) => {
                state.updateLoading = false;
                // Update current task if it matches
                if (state.currentTask && action.payload && state.currentTask.id === action.payload.order_id) {
                    state.currentTask = { ...state.currentTask, ...action.payload };
                }
                state.updateError = null;
            })
            .addCase(addTaskUpdate.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload;
            });
    },
});

// Helper function to filter tasks
const filterTasks = (tasks, filter, searchQuery) => {
    let filtered = tasks;

    // Apply status filter
    if (filter && filter !== 'All' && filter !== 'all') {
        // Handle different status formats from API vs UI
        const statusMap = {
            'New': 'pending',
            'In progress': 'in progress',
            'Completed': 'completed'
        };

        // Use the mapped status value if it exists, otherwise use the original filter
        const statusToFilter = statusMap[filter] || filter.toLowerCase();

        filtered = filtered.filter(task => {
            // Normalize the task status for comparison
            const normalizedTaskStatus = task.status ? task.status.toLowerCase() : '';
            return normalizedTaskStatus === statusToFilter;
        });
    }

    // Apply search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(task => {
            const titleMatch = task.title?.toLowerCase().includes(query) || false;
            const idMatch = task.id?.toString().toLowerCase().includes(query) || false;
            const descMatch = task.description?.toLowerCase().includes(query) || false;
            return titleMatch || idMatch || descMatch;
        });
    }

    return filtered;
};

export const {
    clearError,
    setFilter,
    setSearchQuery,
    updateTaskInList,
    clearCurrentTask
} = tasksSlice.actions;

export default tasksSlice.reducer;
