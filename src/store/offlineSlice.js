/**
 * Offline Slice
 * Manages offline state, queued actions, and sync status
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Network connectivity
  isOnline: true,
  lastOnlineAt: Date.now(),

  // Offline queue
  queuedActions: [],
  queuedPhotos: [],

  // Sync status
  isSyncing: false,
  lastSyncAt: null,
  syncErrors: [],

  // Cached data
  cachedOrders: {},
  cachedRepairs: {},
  cachedMaterials: {},

  // Sync statistics
  totalActionsSynced: 0,
  totalPhotosSynced: 0,
  failedActions: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    // Network status
    setOnlineStatus: (state, action) => {
      const wasOffline = !state.isOnline;
      state.isOnline = action.payload;

      if (action.payload) {
        state.lastOnlineAt = Date.now();
        // If we just came online, we should trigger sync
        if (wasOffline) {
          console.log('Network restored, ready to sync');
        }
      }
    },

    // Queue actions
    addActionToQueue: (state, action) => {
      const actionData = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action.payload,
        queuedAt: Date.now(),
        attempts: 0,
        status: 'pending',
      };

      state.queuedActions.push(actionData);
      console.log('Action queued for offline sync:', actionData.type);
    },

    // Queue photos
    addPhotoToQueue: (state, action) => {
      const photoData = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action.payload,
        queuedAt: Date.now(),
        attempts: 0,
        status: 'pending',
      };

      state.queuedPhotos.push(photoData);
      console.log('Photo queued for upload:', photoData.fileName);
    },

    // Remove action from queue
    removeActionFromQueue: (state, action) => {
      const actionId = action.payload;
      state.queuedActions = state.queuedActions.filter((a) => a.id !== actionId);
    },

    // Remove photo from queue
    removePhotoFromQueue: (state, action) => {
      const photoId = action.payload;
      state.queuedPhotos = state.queuedPhotos.filter((p) => p.id !== photoId);
    },

    // Update action status
    updateActionStatus: (state, action) => {
      const { id, status, error } = action.payload;
      const actionIndex = state.queuedActions.findIndex((a) => a.id === id);

      if (actionIndex !== -1) {
        state.queuedActions[actionIndex].status = status;
        state.queuedActions[actionIndex].attempts += 1;

        if (error) {
          state.queuedActions[actionIndex].error = error;
        }

        if (status === 'failed' && state.queuedActions[actionIndex].attempts >= 3) {
          // Move to failed actions after 3 attempts
          state.failedActions.push(state.queuedActions[actionIndex]);
          state.queuedActions.splice(actionIndex, 1);
        }
      }
    },

    // Update photo status
    updatePhotoStatus: (state, action) => {
      const { id, status, cloudinaryUrl, error } = action.payload;
      const photoIndex = state.queuedPhotos.findIndex((p) => p.id === id);

      if (photoIndex !== -1) {
        state.queuedPhotos[photoIndex].status = status;
        state.queuedPhotos[photoIndex].attempts += 1;

        if (cloudinaryUrl) {
          state.queuedPhotos[photoIndex].cloudinaryUrl = cloudinaryUrl;
        }

        if (error) {
          state.queuedPhotos[photoIndex].error = error;
        }

        if (status === 'failed' && state.queuedPhotos[photoIndex].attempts >= 3) {
          // Remove from queue after 3 attempts
          state.queuedPhotos.splice(photoIndex, 1);
        }
      }
    },

    // Sync operations
    startSync: (state) => {
      state.isSyncing = true;
      state.syncErrors = [];
      console.log('Starting sync process...');
    },

    completeSync: (state, action) => {
      state.isSyncing = false;
      state.lastSyncAt = Date.now();

      const { successCount, failedCount } = action.payload || {};

      if (successCount) {
        state.totalActionsSynced += successCount;
      }

      console.log(`Sync completed: ${successCount} success, ${failedCount} failed`);
    },

    addSyncError: (state, action) => {
      state.syncErrors.push({
        error: action.payload,
        timestamp: Date.now(),
      });
    },

    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },

    // Cache management
    cacheOrder: (state, action) => {
      const order = action.payload;
      state.cachedOrders[order.order_id] = {
        ...order,
        cachedAt: Date.now(),
      };
    },

    cacheRepair: (state, action) => {
      const repair = action.payload;
      state.cachedRepairs[repair.repair_id] = {
        ...repair,
        cachedAt: Date.now(),
      };
    },

    cacheMaterial: (state, action) => {
      const material = action.payload;
      state.cachedMaterials[material.material_id] = {
        ...material,
        cachedAt: Date.now(),
      };
    },

    updateCachedOrder: (state, action) => {
      const { orderId, updates } = action.payload;

      if (state.cachedOrders[orderId]) {
        state.cachedOrders[orderId] = {
          ...state.cachedOrders[orderId],
          ...updates,
          lastUpdated: Date.now(),
        };
      }
    },

    updateCachedRepair: (state, action) => {
      const { repairId, updates } = action.payload;

      if (state.cachedRepairs[repairId]) {
        state.cachedRepairs[repairId] = {
          ...state.cachedRepairs[repairId],
          ...updates,
          lastUpdated: Date.now(),
        };
      }
    },

    clearCache: (state) => {
      state.cachedOrders = {};
      state.cachedRepairs = {};
      state.cachedMaterials = {};
      console.log('Cache cleared');
    },

    clearOldCache: (state, action) => {
      const maxAge = action.payload || 24 * 60 * 60 * 1000; // 24 hours default
      const now = Date.now();

      // Clear old cached orders
      Object.keys(state.cachedOrders).forEach((orderId) => {
        if (now - state.cachedOrders[orderId].cachedAt > maxAge) {
          delete state.cachedOrders[orderId];
        }
      });

      // Clear old cached repairs
      Object.keys(state.cachedRepairs).forEach((repairId) => {
        if (now - state.cachedRepairs[repairId].cachedAt > maxAge) {
          delete state.cachedRepairs[repairId];
        }
      });

      // Clear old cached materials
      Object.keys(state.cachedMaterials).forEach((materialId) => {
        if (now - state.cachedMaterials[materialId].cachedAt > maxAge) {
          delete state.cachedMaterials[materialId];
        }
      });

      console.log('Old cache cleared');
    },

    // Retry failed actions
    retryFailedAction: (state, action) => {
      const actionId = action.payload;
      const failedIndex = state.failedActions.findIndex((a) => a.id === actionId);

      if (failedIndex !== -1) {
        const failedAction = state.failedActions[failedIndex];
        // Reset and move back to queue
        failedAction.attempts = 0;
        failedAction.status = 'pending';
        delete failedAction.error;

        state.queuedActions.push(failedAction);
        state.failedActions.splice(failedIndex, 1);
      }
    },

    clearFailedActions: (state) => {
      state.failedActions = [];
    },

    // Reset offline state
    resetOfflineState: (state) => {
      return {
        ...initialState,
        isOnline: state.isOnline,
      };
    },
  },
});

export const {
  setOnlineStatus,
  addActionToQueue,
  addPhotoToQueue,
  removeActionFromQueue,
  removePhotoFromQueue,
  updateActionStatus,
  updatePhotoStatus,
  startSync,
  completeSync,
  addSyncError,
  clearSyncErrors,
  cacheOrder,
  cacheRepair,
  cacheMaterial,
  updateCachedOrder,
  updateCachedRepair,
  clearCache,
  clearOldCache,
  retryFailedAction,
  clearFailedActions,
  resetOfflineState,
} = offlineSlice.actions;

// Selectors
export const selectIsOnline = (state) => state.offline.isOnline;
export const selectQueuedActions = (state) => state.offline.queuedActions;
export const selectQueuedPhotos = (state) => state.offline.queuedPhotos;
export const selectIsSyncing = (state) => state.offline.isSyncing;
export const selectSyncErrors = (state) => state.offline.syncErrors;
export const selectCachedOrder = (orderId) => (state) =>
  state.offline.cachedOrders[orderId];
export const selectCachedRepair = (repairId) => (state) =>
  state.offline.cachedRepairs[repairId];
export const selectFailedActions = (state) => state.offline.failedActions;
export const selectQueueSize = (state) =>
  state.offline.queuedActions.length + state.offline.queuedPhotos.length;
export const selectLastSyncAt = (state) => state.offline.lastSyncAt;

export default offlineSlice.reducer;
