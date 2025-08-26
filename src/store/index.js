import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import dashboardSlice from './slices/dashboardSlice';
import tasksSlice from './slices/tasksSlice';
import repairsSlice from './slices/repairsSlice';

export const store = configureStore({
    reducer: {
        auth: authSlice,
        dashboard: dashboardSlice,
        tasks: tasksSlice,
        repairs: repairsSlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

// Export types for TypeScript (if needed later)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
