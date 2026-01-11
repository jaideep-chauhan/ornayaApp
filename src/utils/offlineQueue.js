/**
 * Offline Queue Utility
 * Helper functions for queuing actions and managing offline operations
 */

import { store } from '../store';
import {
  addActionToQueue,
  addPhotoToQueue,
  selectIsOnline,
  cacheOrder,
  cacheRepair,
  updateCachedOrder,
  updateCachedRepair,
} from '../store/offlineSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_CACHE_KEY = '@offline_cache';

/**
 * Queue action types
 */
export const ACTION_TYPES = {
  STEP_COMPLETE: 'step_complete',
  REPAIR_STEP_COMPLETE: 'repair_step_complete',
  MATERIAL_USAGE: 'material_usage',
  REPAIR_MATERIAL_USAGE: 'repair_material_usage',
  MATERIAL_REQUEST: 'material_request',
  STATUS_UPDATE: 'status_update',
  REPAIR_STATUS_UPDATE: 'repair_status_update',
  SEND_MESSAGE: 'send_message',
  REPAIR_SEND_MESSAGE: 'repair_send_message',
};

/**
 * Queue an action for offline sync
 * If online, executes immediately; if offline, queues for later
 */
export const queueAction = async (actionType, data, orderId, repairId) => {
  const isOnline = selectIsOnline(store.getState());

  const actionPayload = {
    type: actionType,
    data,
    orderId,
    repairId,
  };

  if (!isOnline) {
    // Queue for later sync
    store.dispatch(addActionToQueue(actionPayload));
    console.log('Action queued for offline sync:', actionType);
    return { queued: true };
  } else {
    // Execute immediately
    // This will be handled by the calling function
    return { queued: false };
  }
};

/**
 * Queue a photo for offline upload
 */
export const queuePhoto = (photoUri, fileName, orderId, repairId, photoType) => {
  const photoPayload = {
    uri: photoUri,
    fileName,
    orderId,
    repairId,
    photoType,
  };

  store.dispatch(addPhotoToQueue(photoPayload));
  console.log('Photo queued for upload:', fileName);
};

/**
 * Queue step completion
 */
export const queueStepCompletion = async (
  orderId,
  stepNumber,
  stepData,
  isRepair = false
) => {
  const actionType = isRepair ? ACTION_TYPES.REPAIR_STEP_COMPLETE : ACTION_TYPES.STEP_COMPLETE;

  return await queueAction(
    actionType,
    { stepNumber, ...stepData },
    isRepair ? null : orderId,
    isRepair ? orderId : null
  );
};

/**
 * Queue material usage update
 */
export const queueMaterialUsage = async (orderId, materialUsage, isRepair = false) => {
  const actionType = isRepair
    ? ACTION_TYPES.REPAIR_MATERIAL_USAGE
    : ACTION_TYPES.MATERIAL_USAGE;

  return await queueAction(
    actionType,
    { materialUsage },
    isRepair ? null : orderId,
    isRepair ? orderId : null
  );
};

/**
 * Queue material request
 */
export const queueMaterialRequest = async (requestData) => {
  return await queueAction(ACTION_TYPES.MATERIAL_REQUEST, requestData, null, null);
};

/**
 * Queue status update
 */
export const queueStatusUpdate = async (orderId, newStatus, isRepair = false) => {
  const actionType = isRepair
    ? ACTION_TYPES.REPAIR_STATUS_UPDATE
    : ACTION_TYPES.STATUS_UPDATE;

  return await queueAction(
    actionType,
    { status: newStatus },
    isRepair ? null : orderId,
    isRepair ? orderId : null
  );
};

/**
 * Queue message send
 */
export const queueMessageSend = async (orderId, message, isRepair = false) => {
  const actionType = isRepair
    ? ACTION_TYPES.REPAIR_SEND_MESSAGE
    : ACTION_TYPES.SEND_MESSAGE;

  return await queueAction(
    actionType,
    { message },
    isRepair ? null : orderId,
    isRepair ? orderId : null
  );
};

/**
 * Cache order/repair data locally
 */
export const cacheOrderData = (orderData, isRepair = false) => {
  if (isRepair) {
    store.dispatch(cacheRepair(orderData));
  } else {
    store.dispatch(cacheOrder(orderData));
  }
};

/**
 * Update cached order/repair
 */
export const updateCachedData = (orderId, updates, isRepair = false) => {
  if (isRepair) {
    store.dispatch(updateCachedRepair({ repairId: orderId, updates }));
  } else {
    store.dispatch(updateCachedOrder({ orderId, updates }));
  }
};

/**
 * Persist offline queue to AsyncStorage
 * For data persistence across app restarts
 */
export const persistOfflineQueue = async () => {
  try {
    const offlineState = store.getState().offline;

    const dataToStore = {
      queuedActions: offlineState.queuedActions,
      queuedPhotos: offlineState.queuedPhotos,
      cachedOrders: offlineState.cachedOrders,
      cachedRepairs: offlineState.cachedRepairs,
      cachedMaterials: offlineState.cachedMaterials,
      lastSyncAt: offlineState.lastSyncAt,
    };

    await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(dataToStore));
    console.log('Offline queue persisted to storage');
  } catch (error) {
    console.error('Error persisting offline queue:', error);
  }
};

/**
 * Load offline queue from AsyncStorage
 * Restores queue on app startup
 */
export const loadOfflineQueue = async () => {
  try {
    const storedData = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log('Offline queue loaded from storage');
      return parsedData;
    }

    return null;
  } catch (error) {
    console.error('Error loading offline queue:', error);
    return null;
  }
};

/**
 * Clear offline queue from AsyncStorage
 */
export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(OFFLINE_CACHE_KEY);
    console.log('Offline queue cleared from storage');
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
};

/**
 * Get queued items count
 */
export const getQueuedItemsCount = () => {
  const offlineState = store.getState().offline;
  return {
    actions: offlineState.queuedActions.length,
    photos: offlineState.queuedPhotos.length,
    total: offlineState.queuedActions.length + offlineState.queuedPhotos.length,
  };
};

/**
 * Check if action can be executed immediately
 */
export const canExecuteImmediately = () => {
  const isOnline = selectIsOnline(store.getState());
  return isOnline;
};

/**
 * Optimistic update helper
 * Updates UI immediately, queues for sync if offline
 */
export const optimisticUpdate = async (
  updateFunction,
  rollbackFunction,
  actionType,
  actionData,
  orderId,
  repairId
) => {
  try {
    // Apply update to UI immediately
    updateFunction();

    // Check if online
    const isOnline = selectIsOnline(store.getState());

    if (!isOnline) {
      // Queue for later sync
      await queueAction(actionType, actionData, orderId, repairId);
      return { success: true, queued: true };
    } else {
      // Attempt to sync immediately
      // (This should be handled by the calling function with API call)
      return { success: true, queued: false };
    }
  } catch (error) {
    console.error('Optimistic update error:', error);

    // Rollback UI change
    if (rollbackFunction) {
      rollbackFunction();
    }

    return { success: false, error: error.message };
  }
};

/**
 * Batch actions for efficiency
 * Groups multiple actions of same type
 */
export const batchActions = (actions) => {
  const batched = {};

  actions.forEach((action) => {
    const key = `${action.type}_${action.orderId || action.repairId}`;

    if (!batched[key]) {
      batched[key] = {
        type: action.type,
        orderId: action.orderId,
        repairId: action.repairId,
        data: [],
      };
    }

    batched[key].data.push(action.data);
  });

  return Object.values(batched);
};

/**
 * Validate action before queuing
 */
export const validateAction = (actionType, data) => {
  switch (actionType) {
    case ACTION_TYPES.STEP_COMPLETE:
    case ACTION_TYPES.REPAIR_STEP_COMPLETE:
      if (!data.stepNumber) {
        return { valid: false, error: 'Step number is required' };
      }
      break;

    case ACTION_TYPES.MATERIAL_USAGE:
    case ACTION_TYPES.REPAIR_MATERIAL_USAGE:
      if (!data.materialUsage || Object.keys(data.materialUsage).length === 0) {
        return { valid: false, error: 'Material usage data is required' };
      }
      break;

    case ACTION_TYPES.MATERIAL_REQUEST:
      if (!data.material_id || !data.quantity) {
        return { valid: false, error: 'Material ID and quantity are required' };
      }
      break;

    case ACTION_TYPES.STATUS_UPDATE:
    case ACTION_TYPES.REPAIR_STATUS_UPDATE:
      if (!data.status) {
        return { valid: false, error: 'Status is required' };
      }
      break;

    case ACTION_TYPES.SEND_MESSAGE:
    case ACTION_TYPES.REPAIR_SEND_MESSAGE:
      if (!data.message || data.message.trim() === '') {
        return { valid: false, error: 'Message cannot be empty' };
      }
      break;

    default:
      return { valid: false, error: 'Unknown action type' };
  }

  return { valid: true };
};

/**
 * Get offline status message for UI
 */
export const getOfflineStatusMessage = () => {
  const offlineState = store.getState().offline;
  const count = getQueuedItemsCount();

  if (offlineState.isOnline) {
    if (offlineState.isSyncing) {
      return {
        status: 'syncing',
        message: 'Syncing data...',
        color: '#2196F3',
      };
    } else if (count.total > 0) {
      return {
        status: 'pending',
        message: `${count.total} item(s) pending sync`,
        color: '#FF9800',
      };
    } else {
      return {
        status: 'synced',
        message: 'All changes synced',
        color: '#4CAF50',
      };
    }
  } else {
    return {
      status: 'offline',
      message: count.total > 0 ? `Offline - ${count.total} item(s) queued` : 'Offline mode',
      color: '#F44336',
    };
  }
};

export default {
  ACTION_TYPES,
  queueAction,
  queuePhoto,
  queueStepCompletion,
  queueMaterialUsage,
  queueMaterialRequest,
  queueStatusUpdate,
  queueMessageSend,
  cacheOrderData,
  updateCachedData,
  persistOfflineQueue,
  loadOfflineQueue,
  clearOfflineQueue,
  getQueuedItemsCount,
  canExecuteImmediately,
  optimisticUpdate,
  batchActions,
  validateAction,
  getOfflineStatusMessage,
};
