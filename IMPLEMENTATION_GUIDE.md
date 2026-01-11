# Manufacturer App - Guided Task Execution Implementation Guide

## Overview

This guide documents the complete implementation of the guided task execution system for the Ornaaya manufacturer mobile app. The system provides step-by-step workflows, offline capabilities, push notifications, and real-time material tracking.

---

## 🎯 Features Implemented

### 1. **Guided Task Execution** ✅
- Step-by-step process with interactive checklists
- Expandable/collapsible step cards
- Real-time progress tracking
- Completion scoring (0-100%)

### 2. **Material Tracking** ✅
- Material usage input per step
- Wastage tracking with validation
- Real-time calculations against allocated quantities
- Color-coded progress indicators

### 3. **Photo Capture** ✅
- Direct camera access for each step
- Gallery selection with multi-select
- Photo compression (quality: 0.8, max: 1920x1080)
- Upload to Cloudinary (integration ready)

### 4. **Step Validation** ✅
- Multi-level validation (checklist, materials, photos, notes)
- Automatic completion score calculation
- Warning system for high wastage
- Error prevention before step completion

### 5. **Offline Mode** ✅
- Complete offline functionality
- Action queuing system
- Automatic sync when online
- Data persistence using Redux Persist
- Network status detection

### 6. **Push Notifications** ✅
- Firebase Cloud Messaging (FCM) integration
- Notification types:
  - New order assigned
  - Material request approved/rejected
  - Deadline reminders (24h, 6h, 1h)
  - Message received
  - Order/repair updates
- Background and foreground handling
- Navigation to relevant screens

### 7. **QR Code Scanning** ✅
- Quick access to orders/repairs
- Expected format: `ORDER:123` or `REPAIR:456`
- Flash/torch support
- Custom marker overlay

---

## 📁 Files Created

### Components
```
app/src/components/
├── ProcessStepCard.js           (700+ lines) - Main step execution component
├── MaterialUsageInput.js        (800+ lines) - Material tracking with validation
└── PhotoCapture.js              (500+ lines) - Camera integration
```

### Screens
```
app/src/screens/
├── QRScanner.js                 (400+ lines) - QR code scanner screen
└── tasks/TaskDetailEnhanced.jsx (650+ lines) - Enhanced task detail with guided execution
```

### Utilities
```
app/src/utils/
├── StepValidation.js            (400+ lines) - Validation logic
├── offlineQueue.js              (500+ lines) - Queue management
└── cloudinaryUpload.js          (250+ lines) - Photo upload utility
```

### Services
```
app/src/services/
├── pushNotifications.js         (400+ lines) - FCM integration
└── syncService.js               (350+ lines) - Offline sync service
```

### Redux
```
app/src/store/
└── offlineSlice.js              (300+ lines) - Offline state management
```

---

## 🚀 How to Use

### For Manufacturers

#### 1. **Open an Order/Repair**

**Option A: From Dashboard/List**
- Navigate to Orders or Repairs tab
- Tap on an order to open TaskDetail or TaskDetailEnhanced

**Option B: QR Code Scanning**
- Tap QR scan button on dashboard
- Scan order/repair QR code
- Automatically opens the order

#### 2. **Complete Steps**

1. **Expand Step Card**: Tap on step to expand
2. **Complete Checklist**: Check off each item
3. **Track Materials**:
   - Tap material card
   - Enter used quantity and wastage
   - System validates against allocation
4. **Capture Photos**:
   - Tap "Add Photo" button
   - Choose camera or gallery
   - Capture at least 1 photo per step (recommended)
5. **Add Notes** (optional): Tap notes section to add observations
6. **Complete Step**: Tap "Complete This Step" button
   - System validates all requirements
   - Shows warnings if wastage is high
   - Moves to next step automatically

#### 3. **Offline Mode**

When offline:
- All actions are queued locally
- Orange banner shows "Offline - X items queued"
- Continue working normally
- When online, sync happens automatically

#### 4. **View Progress**

- Overall completion score shown at top (0-100%)
- Based on:
  - Checklist completion (40%)
  - Material usage (30%)
  - Photos captured (20%)
  - Notes provided (10%)

---

## 🔧 Configuration Required

### 1. **Firebase Setup** (for Push Notifications)

#### Android
1. Download `google-services.json` from Firebase Console
2. Place at: `app/android/app/google-services.json`

#### iOS
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to Xcode project

### 2. **Cloudinary Setup** (for Photo Upload)

Edit `/app/src/utils/cloudinaryUpload.js`:

```javascript
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset';
```

### 3. **API Configuration**

Edit service files to set API URLs:

```javascript
// pushNotifications.js
const API_URL = 'https://your-api.com';

// syncService.js
const API_BASE_URL = 'https://your-api.com';
```

---

## 📡 Backend API Requirements

### Endpoints Needed

#### 1. **Step Completion**
```
POST /manufacture/order/:order_id/step/:step_number/complete
POST /manufacture/repair/:repair_id/step/:step_number/complete

Body:
{
  "checklist_items": [
    { "item": "Review design", "completed": true }
  ],
  "materials_used": [
    {
      "material_id": 1,
      "quantity": 5.5,
      "unit": "gram",
      "wastage": 0.2,
      "wastage_reason": "Cutting precision loss"
    }
  ],
  "photos": ["cloudinary_url_1", "cloudinary_url_2"],
  "notes": "Completed cutting as per design",
  "time_spent": 120
}
```

#### 2. **FCM Token Registration**
```
POST /auth/register-fcm-token

Body:
{
  "fcm_token": "device_fcm_token",
  "user_id": 123,
  "platform": "android",
  "device_info": {
    "os_version": "13",
    "model": "Pixel 6"
  }
}
```

#### 3. **Offline Sync**
```
POST /manufacture/sync/actions

Body:
{
  "actions": [
    {
      "type": "step_complete",
      "order_id": 123,
      "step_number": 2,
      "data": { ... },
      "timestamp": 1234567890
    }
  ]
}

Response:
{
  "success": true,
  "processed": 2,
  "failed": 0,
  "conflicts": []
}
```

---

## 🔔 Push Notification Payload Format

### From Backend to Device

```json
{
  "notification": {
    "title": "New Order Assigned",
    "body": "Order #1234 - Gold Ring has been assigned to you"
  },
  "data": {
    "type": "order_assigned",
    "order_id": "1234",
    "priority": "high",
    "timestamp": "1234567890",
    "additional_data": "{...}"
  }
}
```

### Notification Types
- `order_assigned`
- `repair_assigned`
- `material_request_approved`
- `material_request_rejected`
- `deadline_reminder`
- `message_received`
- `order_cancelled`
- `payment_received`

---

## 🧪 Testing Checklist

### Core Functionality
- [ ] Create order and open TaskDetailEnhanced
- [ ] Expand/collapse step cards
- [ ] Complete checklist items
- [ ] Enter material usage (within limits)
- [ ] Enter wastage (trigger warnings at 3%, errors at allowance)
- [ ] Capture photos (camera + gallery)
- [ ] Add notes
- [ ] Complete step (validation passes)
- [ ] Move to next step automatically

### Offline Mode
- [ ] Turn off internet
- [ ] Complete a step
- [ ] Verify "Offline" banner appears
- [ ] Verify action queued
- [ ] Turn on internet
- [ ] Verify automatic sync
- [ ] Verify data synced successfully

### Push Notifications
- [ ] Send test notification from Firebase Console
- [ ] Verify foreground notification (alert)
- [ ] Verify background notification (tray)
- [ ] Tap notification
- [ ] Verify navigation to correct screen

### QR Scanner
- [ ] Open QR scanner
- [ ] Scan order QR (`ORDER:123`)
- [ ] Verify navigation to order detail
- [ ] Scan repair QR (`REPAIR:456`)
- [ ] Verify navigation to repair detail
- [ ] Test flash toggle

### Material Tracking
- [ ] Enter usage within allocation - passes
- [ ] Enter usage + wastage > allocation - error
- [ ] Enter wastage > 3% - warning
- [ ] Enter wastage > allowance - error
- [ ] Verify color coding (green/red)

---

## 🐛 Known Limitations

1. **Cloudinary Integration**: Placeholder implementation - needs actual credentials
2. **Backend API**: All API endpoints need to be implemented
3. **Photo Upload**: Currently stores local URIs - needs Cloudinary upload in production
4. **Conflict Resolution**: Offline sync uses last-write-wins - may need more sophisticated logic
5. **Step Re-ordering**: Cannot change order of steps dynamically

---

## 🔮 Future Enhancements

### Phase 2 (Planned)
- [ ] Voice notes for each step
- [ ] Video capture for complex procedures
- [ ] AI-powered quality check (image recognition)
- [ ] Real-time collaboration (multiple manufacturers)
- [ ] Augmented reality for assembly guidance

### Phase 3 (Planned)
- [ ] Machine learning for wastage prediction
- [ ] Automated material requests (predictive)
- [ ] Integration with IoT devices (smart scales)
- [ ] Blockchain for supply chain verification

---

## 📊 Performance Metrics

### App Performance
- **Avg Step Completion Time**: Track per step type
- **Photo Capture Rate**: % of steps with photos
- **Material Tracking Accuracy**: Compare actual vs estimated
- **Offline Queue Size**: Monitor pending actions
- **Sync Success Rate**: % of successful syncs

### Manufacturer Efficiency
- **On-time Completion Rate**: % of orders completed by deadline
- **Wastage Rate**: Average wastage per material type
- **Quality Score**: Based on rework/complaints
- **Response Time**: Time to start after assignment

---

## 🆘 Troubleshooting

### Push Notifications Not Working

**Android:**
1. Check `google-services.json` is in correct location
2. Verify FCM is enabled in Firebase Console
3. Check device token is registered in backend
4. Test notification from Firebase Console

**iOS:**
1. Check `GoogleService-Info.plist` is added to Xcode
2. Verify push notification capability enabled
3. Check APNS certificates in Firebase Console

### Offline Sync Failing

1. Check network status using NetInfo
2. Verify API endpoints are correct
3. Check auth token is valid
4. Review queue contents in Redux DevTools
5. Check backend logs for errors

### Photos Not Uploading

1. Verify camera permissions granted
2. Check Cloudinary credentials are set
3. Verify network connection
4. Check photo file size (max 10MB)
5. Review Cloudinary upload logs

### Step Validation Errors

1. Check all checklist items are completed
2. Verify material usage is within limits
3. Check minimum photo requirement (if set)
4. Verify notes length (if required)
5. Review validation config in code

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review code comments in relevant files
3. Check Redux state in DevTools
4. Enable debug logging in development
5. Contact development team with:
   - Device info (OS, model)
   - App version
   - Steps to reproduce
   - Error logs/screenshots

---

## 📝 Code Examples

### Using Offline Queue

```javascript
import { queueStepCompletion } from '../utils/offlineQueue';

// Complete step (handles offline automatically)
const result = await queueStepCompletion(
  orderId,
  stepNumber,
  stepData,
  isRepair
);

if (result.queued) {
  // Action queued for later sync
  Alert.alert('Queued', 'Will sync when online');
} else {
  // Action executed immediately
  Alert.alert('Success', 'Step completed');
}
```

### Listening to Network Changes

```javascript
import NetInfo from '@react-native-community/netinfo';

const unsubscribe = NetInfo.addEventListener(state => {
  console.log('Connection type:', state.type);
  console.log('Is connected?', state.isConnected);
});

// Cleanup
unsubscribe();
```

### Handling Push Notifications

```javascript
import { onForegroundMessage, onNotificationOpenedApp } from '../services/pushNotifications';

// Foreground
const unsubscribeForeground = onForegroundMessage((message) => {
  console.log('Foreground message:', message);
});

// Background/Quit state
onNotificationOpenedApp((message) => {
  console.log('Notification opened app:', message);
  // Navigate to relevant screen
  navigation.navigate('TaskDetail', { orderId: message.data.order_id });
});
```

---

## 🎓 Learning Resources

### React Native
- [Official Docs](https://reactnative.dev/)
- [Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

### Firebase
- [FCM Setup](https://rnfirebase.io/messaging/usage)
- [Testing Notifications](https://firebase.google.com/docs/cloud-messaging/testing-and-troubleshooting)

### Cloudinary
- [React Native Upload](https://cloudinary.com/documentation/react_native_image_and_video_upload)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

---

## 📜 License

This implementation is part of the Ornaaya B2B Jewelry Manufacturing Platform.
© 2026 Ornaaya. All rights reserved.

---

**Last Updated**: January 8, 2026
**Version**: 1.0.0
**Status**: ✅ Phase 1 Complete
