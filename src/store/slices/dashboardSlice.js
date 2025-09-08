import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../../utils/api';
import Toast from 'react-native-toast-message';

// Async thunk for fetching dashboard data
export const fetchDashboardData = createAsyncThunk(
    'dashboard/fetchDashboardData',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiGet('manufacture/mainPage/data');
            if (response.ok) {
                return response.data.data;
                console.log("response data dashboard", response.data.data);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Load Dashboard',
                    text2: response.data?.message || 'Unable to fetch dashboard data',
                });
                return rejectWithValue(response.data?.message || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Dashboard Error',
                text2: 'Network error, please try again',
            });
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    dashboardData: {
        todayTasks: [],
        todayRepairs: [],
        weekTasks: [],
        weekRepairs: [],
        materialAssigned: []
    },
    statistics: {
        totalTasks: 0,
        totalRepairs: 0,
    },
    loading: false,
    error: null,
    lastUpdated: null,
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        updateStatistics: (state, action) => {
            state.statistics = { ...state.statistics, ...action.payload };
        },
        addRecentTask: (state, action) => {
            state.recentTasks.unshift(action.payload);
            if (state.recentTasks.length > 10) {
                state.recentTasks = state.recentTasks.slice(0, 10);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
                state.loading = false;

                // Process the dashboard data
                if (action.payload) {
                    state.statistics = {
                        totalTasks: action.payload.total_tasks || 0,
                        totalRepairs: action.payload.total_repairs || 0,
                    };

                    // Set dashboardData with properly processed tasks and repairs
                    state.dashboardData = {
                        todayTasks: action.payload.today_tasks?.map(task => ({
                            orderId: task.order_id,
                            title: task.title,
                            description: task.description,
                            status: task.status,
                            // Store dates as serializable strings instead of Date objects
                            createdAt: task.created_at ? task.created_at.toString() : null,
                            deadline: task.deadline ? (task.deadline * 1000).toString() : null,
                        })) || [],
                        todayRepairs: action.payload.today_repairs?.map(repair => ({
                            repairId: repair.repair_id,
                            product: repair.product,
                            description: repair.description,
                            status: repair.status,
                            // Store dates as serializable strings instead of Date objects
                            createdAt: repair.created_at ? repair.created_at.toString() : null,
                            deadline: repair.deadline ? (repair.deadline * 1000).toString() : null,
                        })) || [],
                        weekTasks: action.payload.week_tasks?.map(task => ({
                            orderId: task.order_id,
                            title: task.title,
                            description: task.description,
                            status: task.status,
                            // Store dates as serializable strings instead of Date objects
                            createdAt: task.created_at ? task.created_at.toString() : null,
                        })) || [],
                        weekRepairs: action.payload.week_repairs?.map(repair => ({
                            repairId: repair.repair_id,
                            product: repair.product,
                            description: repair.description,
                            status: repair.status,
                            // Store dates as serializable strings instead of Date objects
                            createdAt: repair.created_at ? repair.created_at.toString() : null,
                        })) || [],
                        materialAssigned: action.payload.material_assigned?.map(material => ({
                            materialId: material.material_id,
                            materialName: material.material_name,
                            quantity: parseFloat(material.quantity),
                            unit: material.unit,
                            usedQuantity: parseFloat(material.used_quantity),
                            remainingQuantity: parseFloat(material.remaining_quantity),
                            usagePercentage: parseFloat(material.usage_percentage),
                        })) || [],
                    };
                }

                state.lastUpdated = new Date().toISOString();
                state.error = null;
            })
            .addCase(fetchDashboardData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearError, updateStatistics, addRecentTask } = dashboardSlice.actions;
export default dashboardSlice.reducer;
