# API Testing Checklist for Ornaaya App

## Current API Integration Status

### ✅ Authentication
- **Login API**: `POST /api/common/login`
  - Stores JWT token in AsyncStorage
  - Decodes user info from token
  - Handles success/error responses

### ✅ Dashboard Screen
- **Main Dashboard API**: `GET /api/manufacture/mainPage/data`
  - Fetches total tasks and repairs count
  - Gets today's and week's tasks/repairs
  - **NEW**: Fetches material_assigned data dynamically
  - Material data now shows:
    - Material name, quantity, unit
    - Used quantity and remaining quantity
    - Usage percentage

### ✅ Material Usage Screen
- **Material Usage API**: `GET /api/manufacture/material-usage/:material_id`
  - Fetches detailed material usage when screen opens
  - Shows material breakdown by tasks/orders
  - Displays usage statistics with charts
  - Pull-to-refresh functionality

### ✅ Task Management
- **All Tasks**: `GET /api/manufacture/allTask`
- **Filtered Tasks**: `GET /api/manufacture/allTask?status={status}`
- **Single Task**: `GET /api/manufacture/singleTask/:id`
- **Update Task**: `PUT /api/manufacture/updateTaskStatus/:id`

### ✅ Repair Management
- **All Repairs**: `GET /api/manufacture/allRepair`
- **Filtered Repairs**: `GET /api/manufacture/allRepair?status={status}`
- **Single Repair**: `GET /api/manufacture/singleRepair/:id`
- **Update Repair**: `PUT /api/manufacture/updateRepairStatus/:id`

## How to Test the App

### 1. Login Flow
1. Open the app
2. Enter credentials:
   - Company Key
   - Email/Phone
   - Password
3. Verify token is stored and user navigates to dashboard

### 2. Dashboard Testing
1. After login, dashboard should show:
   - User welcome message
   - Task/Repair counts from API
   - **Dynamic material cards** (Gold, Silver, etc.) from API
   - Today's agenda items
   - Week's agenda items

### 3. Material Usage Testing
1. From Dashboard, tap on any material card (e.g., Gold)
2. Material Usage screen should:
   - Show loading state initially
   - Fetch data from `/api/manufacture/material-usage/{id}`
   - Display material statistics
   - Show usage breakdown by tasks
   - Support pull-to-refresh

### 4. Task/Repair Lists
1. Navigate to Tasks or Repairs tab
2. Should fetch and display list from API
3. Filter buttons should work (All, Pending, In Progress, Completed)
4. Tapping an item should fetch single task/repair details

### 5. API Test Suite
1. Go to Settings → Developer Tools → API Test Suite
2. Run all tests or individual tests
3. Check for:
   - Green checkmarks for successful APIs
   - Response times
   - Error messages for failed APIs

## Common Issues & Solutions

### Token Issues
- If getting 401 errors, check token in AsyncStorage
- Token should be sent as `Bearer {token}` in Authorization header

### Network Issues
- Check BASE_URL is correct: `https://api.ornaaya.com/api/`
- Ensure device has internet connection
- Check for CORS issues (shouldn't be a problem in React Native)

### Data Format Issues
- API responses should have `success: true` and `data` object
- Check console logs for response structure
- Verify field names match (e.g., `material_assigned` not `materialAssigned`)

## Testing Commands

To run the app:
```bash
# iOS
cd App && npx react-native run-ios

# Android
cd App && npx react-native run-android

# Start Metro bundler
cd App && npm start
```

## API Response Examples

### Dashboard Response
```json
{
  "success": true,
  "message": "data fetched Successfully",
  "data": {
    "total_tasks": 1,
    "total_repairs": 0,
    "today_tasks": [],
    "today_repairs": [],
    "week_tasks": [...],
    "week_repairs": [],
    "material_assigned": [
      {
        "material_id": 1,
        "material_name": "Gold",
        "quantity": "100.00",
        "unit": "gram",
        "used_quantity": 0,
        "remaining_quantity": 100,
        "usage_percentage": 0
      }
    ]
  }
}
```

### Material Usage Response
```json
{
  "success": true,
  "data": {
    "material_info": {
      "material_id": 1,
      "material_name": "Gold",
      "quantity": 100,
      "unit": "gram",
      "used_quantity": 25,
      "remaining_quantity": 75
    },
    "usage_breakdown": [
      {
        "order_id": 9,
        "order_title": "Gold Ring",
        "quantity_used": 15,
        "status": "in progress"
      }
    ]
  }
}
```