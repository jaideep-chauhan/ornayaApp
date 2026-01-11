/**
 * Sync Service
 * Handles synchronization of offline actions when network is restored
 */

import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import {
  setOnlineStatus,
  startSync,
  completeSync,
  removeActionFromQueue,
  removePhotoFromQueue,
  updateActionStatus,
  updatePhotoStatus,
  addSyncError,
} from '../store/offlineSlice';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

// API base URL - replace with your actual API URL
const API_BASE_URL = 'YOUR_API_BASE_URL';

/**
 * Initialize network listener
 * Monitors network status and triggers sync when online
 */
export const initializeNetworkListener = () => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected && state.isInternetReachable;

    console.log('Network status:', isOnline ? 'Online' : 'Offline');

    // Update Redux state
    store.dispatch(setOnlineStatus(isOnline));

    // If we just came online, trigger sync
    if (isOnline) {
      const offlineState = store.getState().offline;
      const hasQueuedItems =
        offlineState.queuedActions.length > 0 || offlineState.queuedPhotos.length > 0;

      if (hasQueuedItems && !offlineState.isSyncing) {
        console.log('Network restored, starting sync...');
        setTimeout(() => {
          syncOfflineData();
        }, 1000); // Small delay to ensure connection is stable
      }
    }
  });

  return unsubscribe;
};

/**
 * Check if device is currently online
 */
export const checkNetworkStatus = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};

/**
 * Main sync function
 * Processes all queued actions and photos
 */
export const syncOfflineData = async () => {
  try {
    const offlineState = store.getState().offline;

    // Check if already syncing
    if (offlineState.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    // Check if online
    const isOnline = await checkNetworkStatus();
    if (!isOnline) {
      console.log('Device is offline, cannot sync');
      return;
    }

    // Start sync
    store.dispatch(startSync());

    let successCount = 0;
    let failedCount = 0;

    // Sync actions first (order matters)
    const actionsToSync = [...offlineState.queuedActions].sort(
      (a, b) => a.queuedAt - b.queuedAt
    );

    for (const action of actionsToSync) {
      try {
        const result = await syncAction(action);

        if (result.success) {
          successCount++;
          store.dispatch(removeActionFromQueue(action.id));
        } else {
          failedCount++;
          store.dispatch(
            updateActionStatus({
              id: action.id,
              status: 'failed',
              error: result.error || 'Unknown error',
            })
          );
        }
      } catch (error) {
        failedCount++;
        console.error('Error syncing action:', error);
        store.dispatch(
          updateActionStatus({
            id: action.id,
            status: 'failed',
            error: error.message,
          })
        );
      }
    }

    // Sync photos
    const photosToSync = [...offlineState.queuedPhotos].sort(
      (a, b) => a.queuedAt - b.queuedAt
    );

    for (const photo of photosToSync) {
      try {
        const result = await syncPhoto(photo);

        if (result.success) {
          successCount++;
          store.dispatch(removePhotoFromQueue(photo.id));
        } else {
          failedCount++;
          store.dispatch(
            updatePhotoStatus({
              id: photo.id,
              status: 'failed',
              error: result.error || 'Upload failed',
            })
          );
        }
      } catch (error) {
        failedCount++;
        console.error('Error syncing photo:', error);
        store.dispatch(
          updatePhotoStatus({
            id: photo.id,
            status: 'failed',
            error: error.message,
          })
        );
      }
    }

    // Complete sync
    store.dispatch(completeSync({ successCount, failedCount }));

    console.log(`Sync completed: ${successCount} success, ${failedCount} failed`);

    return {
      success: true,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Sync error:', error);
    store.dispatch(addSyncError(error.message));
    store.dispatch(completeSync({ successCount: 0, failedCount: 0 }));

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sync individual action
 */
const syncAction = async (action) => {
  try {
    const { type, data, orderId, repairId } = action;
    const authToken = store.getState().auth.token;

    if (!authToken) {
      return { success: false, error: 'No auth token' };
    }

    let endpoint = '';
    let method = 'POST';
    let body = data;

    // Determine endpoint based on action type
    switch (type) {
      case 'step_complete':
        endpoint = `/manufacture/order/${orderId}/step/${data.stepNumber}/complete`;
        break;

      case 'repair_step_complete':
        endpoint = `/manufacture/repair/${repairId}/step/${data.stepNumber}/complete`;
        break;

      case 'material_usage':
        endpoint = `/manufacture/order/${orderId}/material-usage`;
        break;

      case 'repair_material_usage':
        endpoint = `/manufacture/repair/${repairId}/material-usage`;
        break;

      case 'material_request':
        endpoint = `/manufacture/material-request`;
        break;

      case 'status_update':
        endpoint = `/manufacture/order/${orderId}/status`;
        method = 'PATCH';
        break;

      case 'repair_status_update':
        endpoint = `/manufacture/repair/${repairId}/status`;
        method = 'PATCH';
        break;

      case 'send_message':
        endpoint = `/manufacture/order/${orderId}/message`;
        break;

      case 'repair_send_message':
        endpoint = `/manufacture/repair/${repairId}/message`;
        break;

      default:
        console.warn('Unknown action type:', type);
        return { success: false, error: 'Unknown action type' };
    }

    // Make API request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, error: result.message || 'Request failed' };
    }
  } catch (error) {
    console.error('Error in syncAction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync individual photo
 */
const syncPhoto = async (photo) => {
  try {
    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(photo.uri);

    if (cloudinaryUrl) {
      // Update photo status with Cloudinary URL
      store.dispatch(
        updatePhotoStatus({
          id: photo.id,
          status: 'completed',
          cloudinaryUrl,
        })
      );

      // Optionally, send Cloudinary URL to backend
      // await updatePhotoInBackend(photo.orderId, cloudinaryUrl);

      return { success: true, cloudinaryUrl };
    } else {
      return { success: false, error: 'Cloudinary upload failed' };
    }
  } catch (error) {
    console.error('Error in syncPhoto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Force sync (manual trigger)
 */
export const forceSyncNow = async () => {
  const isOnline = await checkNetworkStatus();

  if (!isOnline) {
    return {
      success: false,
      error: 'Device is offline',
    };
  }

  return await syncOfflineData();
};

/**
 * Get sync status
 */
export const getSyncStatus = () => {
  const offlineState = store.getState().offline;

  return {
    isSyncing: offlineState.isSyncing,
    queuedActionsCount: offlineState.queuedActions.length,
    queuedPhotosCount: offlineState.queuedPhotos.length,
    lastSyncAt: offlineState.lastSyncAt,
    syncErrors: offlineState.syncErrors,
    failedActionsCount: offlineState.failedActions.length,
  };
};

/**
 * Background sync (called periodically)
 * Can be triggered by a timer or app state change
 */
export const backgroundSync = async () => {
  try {
    const offlineState = store.getState().offline;

    // Only sync if there are queued items and we're not already syncing
    if (
      (offlineState.queuedActions.length > 0 || offlineState.queuedPhotos.length > 0) &&
      !offlineState.isSyncing
    ) {
      const isOnline = await checkNetworkStatus();

      if (isOnline) {
        console.log('Background sync triggered');
        await syncOfflineData();
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
};

/**
 * Schedule periodic sync
 * Checks every 5 minutes if there's queued data to sync
 */
export const startPeriodicSync = () => {
  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const intervalId = setInterval(() => {
    backgroundSync();
  }, SYNC_INTERVAL);

  return () => clearInterval(intervalId);
};

export default {
  initializeNetworkListener,
  checkNetworkStatus,
  syncOfflineData,
  forceSyncNow,
  getSyncStatus,
  backgroundSync,
  startPeriodicSync,
};
