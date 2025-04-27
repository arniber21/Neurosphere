/**
 * API service for interacting with the Neurosphere backend
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * Generic fetch wrapper with authentication
 */
async function fetchWithAuth(endpoint: string, token: string | null, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    // Include auth token if available
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Include cookies for cross-origin requests if needed
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a list of all scans
 */
export async function getScans(token: string | null, params?: { status?: string; page?: number; limit?: number }) {
  const queryParams = new URLSearchParams();
  
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchWithAuth(`/api/scans${query}`, token);
}

/**
 * Get details for a specific scan
 */
export async function getScanDetails(token: string | null, scanId: string) {
  return fetchWithAuth(`/api/scans/${scanId}`, token);
}

/**
 * Upload a new scan
 */
export async function uploadScan(token: string | null, file: File, metadata?: Record<string, any>) {
  const formData = new FormData();
  formData.append('file', file);
  
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/scans/upload`, {
    method: 'POST',
    // Don't set Content-Type when using FormData - browser will set it with boundary
    headers,
    body: formData,
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Upload Error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Check processing status of a scan
 */
export async function getScanStatus(token: string | null, scanId: string) {
  return fetchWithAuth(`/api/scans/${scanId}/status`, token);
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(token: string | null) {
  return fetchWithAuth('/api/users/stats', token);
}

/**
 * Generate or regenerate 3D visualization
 */
export async function generateVisualization(token: string | null, scanId: string, options?: {
  quality?: 'low' | 'medium' | 'high';
  highlightTumor?: boolean;
  colorScheme?: string;
}) {
  return fetchWithAuth(`/api/scans/${scanId}/visualize`, token, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
} 