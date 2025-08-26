// Re-export all async thunks for easier importing
export {
    loginUser,
    logoutUser,
    checkAuthState,
    clearError as clearAuthError,
} from '../slices/authSlice';

export {
    fetchDashboardData,
    clearError as clearDashboardError,
    updateStatistics,
    addRecentTask,
} from '../slices/dashboardSlice';

export {
    fetchAllTasks,
    fetchTaskDetails,
    updateTaskStatus,
    addTaskUpdate,
    setFilter as setTaskFilter,
    setSearchQuery as setTaskSearchQuery,
    updateTaskInList,
    clearCurrentTask,
    clearError as clearTaskError,
} from '../slices/tasksSlice';

export {
    fetchAllRepairs,
    fetchRepairDetails,
    updateRepairStatus,
    addRepairUpdate,
    setFilter as setRepairFilter,
    setSearchQuery as setRepairSearchQuery,
    updateRepairInList,
    clearCurrentRepair,
    clearError as clearRepairError,
} from '../slices/repairsSlice';
