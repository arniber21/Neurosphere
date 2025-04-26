# Neurosphere Backend API Requirements

## Overview
This document outlines the backend endpoints required for the Neurosphere frontend to function properly. The backend will handle authentication (via Clerk SDK), CT scan processing, and 3D model generation.

## Authentication Endpoints
Authentication is managed via Clerk, but the backend needs to validate session tokens.

### 1. Validate User Session
- **Endpoint**: `GET /api/auth/validate`
- **Purpose**: Verify user's authentication token
- **Request Headers**: 
  - `Authorization: Bearer {token}`
- **Response**: 
  ```json
  {
    "isAuthenticated": true,
    "userId": "user_123",
    "permissions": ["read:scans", "write:scans"]
  }
  ```

## CT Scan Management

### 2. Upload CT Scan
- **Endpoint**: `POST /api/scans/upload`
- **Purpose**: Upload a new CT scan for processing
- **Request**: Multipart form data
  - `file`: CT scan image file (JPEG, PNG, DICOM)
  - `metadata`: JSON string with additional info
- **Response**:
  ```json
  {
    "scanId": "scan_123",
    "status": "processing",
    "createdAt": "2023-07-01T12:00:00Z",
    "estimatedCompletionTime": "2023-07-01T12:05:00Z"
  }
  ```
- **Notes**: 
  - Should trigger the ML processing pipeline
  - Should handle files up to 50MB
  - Frontend displays a progress indicator while processing

### 3. Get Scan List
- **Endpoint**: `GET /api/scans`
- **Purpose**: Retrieve a list of user's scans
- **Query Parameters**:
  - `status`: Filter by status (optional, e.g., "completed", "processing")
  - `page`: Pagination page number (optional, default: 1)
  - `limit`: Results per page (optional, default: 10)
- **Response**:
  ```json
  {
    "scans": [
      {
        "id": "scan_123",
        "date": "2023-06-15T09:30:00Z",
        "status": "completed",
        "tumorDetected": true,
        "location": "Frontal lobe",
        "size": "2.3cm",
        "thumbnailUrl": "/thumbnails/scan_123.jpg"
      },
      {
        "id": "scan_124",
        "date": "2023-05-22T14:45:00Z",
        "status": "completed",
        "tumorDetected": false
      }
    ],
    "total": 12,
    "page": 1,
    "totalPages": 2
  }
  ```
- **Notes**: Used in the dashboard and scans list pages

### 4. Get Scan Details
- **Endpoint**: `GET /api/scans/{scanId}`
- **Purpose**: Retrieve detailed information about a specific scan
- **Response**:
  ```json
  {
    "id": "scan_123",
    "date": "2023-06-15T09:30:00Z",
    "status": "completed",
    "tumorDetected": true,
    "location": "Frontal lobe",
    "size": "2.3cm",
    "notes": "Tumor detected in the frontal lobe region. Recommended for additional clinical evaluation.",
    "visualizationUrl": "/visualizations/scan_123.html",
    "originalImageUrl": "/images/scan_123.jpg",
    "doctor": "Dr. Smith",
    "createdAt": "2023-06-15T09:28:00Z",
    "updatedAt": "2023-06-15T09:35:00Z"
  }
  ```
- **Notes**: The scan detail page uses this endpoint to populate all scan information

### 5. Check Scan Processing Status
- **Endpoint**: `GET /api/scans/{scanId}/status`
- **Purpose**: Check the current processing status of a scan
- **Response**:
  ```json
  {
    "id": "scan_123",
    "status": "processing",
    "progress": 75,
    "stage": "building_3d_model",
    "estimatedTimeRemaining": 45
  }
  ```
- **Notes**: For real-time updates during scan processing

## 3D Visualization

### 6. Generate 3D Model
- **Endpoint**: `POST /api/scans/{scanId}/visualize`
- **Purpose**: Trigger or regenerate the 3D visualization for a scan
- **Request Body**:
  ```json
  {
    "quality": "high",
    "highlightTumor": true,
    "colorScheme": "standard"
  }
  ```
- **Response**:
  ```json
  {
    "visualizationId": "viz_456",
    "status": "processing",
    "estimatedCompletionTime": "2023-07-01T12:10:00Z"
  }
  ```
- **Notes**: 
  - This endpoint starts the 3D model generation process
  - The ML pipeline should:
    1. Process the CT scan using OpenCV
    2. Identify tumors with PyTorch models
    3. Convert results to a brainrender Actor
    4. Export the scene as an HTML file accessible via URL

### 7. Get Visualization HTML
- **Endpoint**: `GET /api/visualizations/{visualizationId}`
- **Purpose**: Retrieve the HTML file for the 3D brain model
- **Response**: HTML file with embedded 3D visualization
- **Notes**: 
  - The iframe in the scan detail page loads this URL
  - Should include all necessary JavaScript for the 3D model interaction
  - Should highlight tumor locations in the brain

## Analytics and Statistics

### 8. Get User Dashboard Stats
- **Endpoint**: `GET /api/users/stats`
- **Purpose**: Retrieve summary statistics for the user dashboard
- **Response**:
  ```json
  {
    "totalScans": 12,
    "scansThisMonth": 2,
    "tumorsDetected": 4,
    "tumorPercentage": 33,
    "lastScanDate": "2023-06-15T09:30:00Z",
    "lastScanDaysAgo": 14
  }
  ```
- **Notes**: Used for the dashboard statistics cards

## Technical Requirements

1. **Authentication**:
   - Use Clerk Python SDK to verify tokens and user identity
   - All endpoints except auth endpoints should require authentication

2. **File Processing**:
   - Support DICOM, JPEG, and PNG formats for brain scans
   - Implement secure file storage with access controls

3. **ML Pipeline**:
   - Use OpenCV for initial image processing
   - Implement PyTorch models for tumor detection
   - Generate brainrender Actor from detection results
   - Export scene as interactive HTML file

4. **Performance**:
   - Processing time should be under 5 minutes per scan
   - API response times should be under 500ms for non-processing endpoints
   - Support concurrent processing of multiple scans

5. **Security**:
   - Implement proper CORS settings
   - Sanitize all inputs
   - Validate file types and scan for malware
   - Use HTTPS for all communications

## Implementation Timeline Recommendation

1. Auth system with Clerk SDK integration
2. Basic scan upload and storage functionality
3. ML pipeline for tumor detection
4. 3D visualization generation
5. User dashboard statistics and analytics 