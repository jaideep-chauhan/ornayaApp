import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import authSlice from './slices/authSlice';
import dashboardSlice from './slices/dashboardSlice';
import tasksSlice from './slices/tasksSlice';
import repairsSlice from './slices/repairsSlice';
import materialRequestSlice from './slices/materialRequestSlice';
import offlineSlice from './offlineSlice';

// Redux Persist configuration
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth', 'offline'], // Only persist auth and offline slices
    blacklist: ['dashboard', 'tasks', 'repairs', 'materialRequests'], // Don't persist these
};

// Combine reducers
const rootReducer = combineReducers({
    auth: authSlice,
    dashboard: dashboardSlice,
    tasks: tasksSlice,
    repairs: repairsSlice,
    materialRequests: materialRequestSlice,
    offline: offlineSlice,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'persist/PERSIST',
                    'persist/REHYDRATE',
                    'persist/PAUSE',
                    'persist/PURGE',
                    'persist/REGISTER',
                ],
            },
        }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript (if needed later)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
