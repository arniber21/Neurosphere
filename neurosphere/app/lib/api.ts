/**
 * API service for interacting with the Neurosphere backend
 */

// When using the proxy in vite.config.ts, we can use relative URLs
// which will be proxied to the backend server
const API_BASE_URL = '';

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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Include cookies for cross-origin requests if needed
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `API Error: ${response.status}` }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
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
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/scans/upload`, {
      method: 'POST',
      // Don't set Content-Type when using FormData - browser will set it with boundary
      headers,
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `Upload Error: ${response.status}` }));
      throw new Error(error.message || `Upload Error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
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

/**
 * Check API health
 */
export async function checkApiHealth() {
  return fetchWithAuth('/api/health', null);
}

/**
 * Generate a heatmap for an existing scan based on its original image
 */
export async function generateHeatmap(token: string | null, imageFile: File) {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/mri/heatmap`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `Heatmap Error: ${response.status}` }));
      throw new Error(error.message || `Heatmap Error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Heatmap generation failed:', error);
    throw error;
  }
} 