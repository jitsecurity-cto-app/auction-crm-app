// API client with fetch wrapper
// Intentionally minimal error handling and no input validation (security vulnerabilities)
// Same as customer-app but for admin use

import { ApiResponse, ApiError } from '@/types';

// Normalize API base URL to ensure it ends with /api (no trailing slash)
function normalizeApiBaseUrl(url: string): string {
  // Remove trailing slashes
  let normalized = url.replace(/\/+$/, '');
  // Ensure it ends with /api
  if (!normalized.endsWith('/api')) {
    // If it doesn't end with /api, check if it's just the base URL
    if (!normalized.includes('/api')) {
      normalized = `${normalized}/api`;
    }
  }
  return normalized;
}

const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
);

// Get auth token from localStorage (intentionally insecure)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

// Set auth token in localStorage (intentionally insecure)
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('auth_token', token);
}

// Remove auth token from localStorage
export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('auth_token');
}

// Generic fetch wrapper with intentional security vulnerabilities
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { body?: unknown; requireAuth?: boolean } = {}
): Promise<T> {
  // Prevent requests to root path (security issue - but we'll log it)
  if (!endpoint || endpoint === '/') {
    console.error('API Request Error: Empty or root endpoint detected', {
      endpoint,
      apiBaseUrl: API_BASE_URL,
    });
    throw new Error('Invalid API endpoint: endpoint cannot be empty or root path');
  }
  
  const token = getAuthToken();
  
  // Intentionally permissive headers (security vulnerability)
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available or if requireAuth is true (no validation)
  if (token || options.requireAuth) {
    const authToken = token || getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  // Intentionally log requests with tokens (security vulnerability)
  if (typeof window !== 'undefined') {
    console.log('API Request:', {
      endpoint,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : null,
    });
  }

  // Handle body - if it's already a string, use it; otherwise stringify
  let requestBody: string | undefined;
  if (options.body !== undefined) {
    requestBody = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${API_BASE_URL}${normalizedEndpoint}`;
    
    // Intentionally log full URL (security vulnerability - exposes internal URLs)
    if (typeof window !== 'undefined') {
      console.log('Full API URL:', fullUrl);
    }
    
    const response = await fetch(fullUrl, {
      method: options.method || 'GET',
      headers,
      body: requestBody,
    });

    // Intentionally verbose error logging (security vulnerability)
    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint,
      });

      throw new Error(errorData.message || errorData.error || 'API request failed');
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    // Intentionally verbose error logging (security vulnerability)
    console.error('API Request Error:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Generic API methods (for flexibility and testing)
export const api = {
  // Generic HTTP methods
  async get<T>(endpoint: string, requireAuth = false): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'GET', requireAuth });
  },

  async post<T>(endpoint: string, body: unknown, requireAuth = false): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: body as BodyInit,
      requireAuth,
    });
  },

  async put<T>(endpoint: string, body: unknown, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body as BodyInit,
      requireAuth,
    });
  },

  async delete<T>(endpoint: string, requireAuth = true): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'DELETE', requireAuth });
  },

  // Auth endpoints
  async login(email: string, password: string) {
    return apiRequest<ApiResponse<any>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async verify() {
    return apiRequest<ApiResponse<any>>('/auth/verify', {
      method: 'POST',
    });
  },

  // Auction endpoints
  async getAuctions(params?: { 
    status?: string; 
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number; 
    offset?: number 
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/auctions?${queryString}` : '/auctions';
    // API returns array directly, not wrapped in { data: [...] }
    return apiRequest<any[]>(endpoint);
  },

  async getAuctionById(id: number | string) {
    // API returns object directly, not wrapped in { data: {...} }
    return apiRequest<any>(`/auctions/${id}`);
  },

  async createAuction(data: {
    title: string;
    description: string;
    starting_price: number;
    end_time: string;
  }) {
    // API returns object directly
    return apiRequest<any>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAuction(id: number | string, data: Partial<any>) {
    // API returns object directly
    return apiRequest<any>(`/auctions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAuction(id: number | string) {
    // API returns object directly
    return apiRequest<any>(`/auctions/${id}`, {
      method: 'DELETE',
    });
  },

  // Bid endpoints
  async getBidsByAuction(auctionId: number | string) {
    // API returns array directly
    return apiRequest<any[]>(`/auctions/${auctionId}/bids`);
  },

  async getAllBids(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/bids?${queryString}` : '/bids';
    // API returns array directly
    return apiRequest<any[]>(endpoint);
  },

  // User endpoints
  async getUsers(params?: { limit?: number; offset?: number; role?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.role) queryParams.append('role', params.role);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    // API returns array directly, not wrapped in { data: [...] }
    return apiRequest<any[]>(endpoint);
  },

  async getUserById(id: string) {
    return apiRequest<any>(`/users/${id}`);
  },

  async updateUser(id: string, data: Partial<any>) {
    return apiRequest<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string) {
    return apiRequest<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard/Stats endpoints
  async getDashboardStats() {
    // This endpoint may not exist yet, but we'll call it
    // If it doesn't exist, we can aggregate from other endpoints
    try {
      return apiRequest<any>('/dashboard/stats');
    } catch {
      // Fallback: return null and let component aggregate
      return null;
    }
  },

  // My Auctions/Sales endpoints
  async getMyAuctions(userId: string) {
    return apiRequest<any[]>(`/users/${userId}/my-auctions`);
  },

  async getMySales(userId: string) {
    return apiRequest<any[]>(`/users/${userId}/my-sales`);
  },

  // Payment status endpoints
  async updatePaymentStatus(bidId: number, paymentStatus: string) {
    return apiRequest<any>(`/bids/${bidId}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
  },

  // Order endpoints
  async getOrders(params?: {
    buyer_id?: string;
    seller_id?: string;
    status?: string;
    payment_status?: string;
    shipping_status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.buyer_id) queryParams.append('buyer_id', params.buyer_id);
    if (params?.seller_id) queryParams.append('seller_id', params.seller_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params?.shipping_status) queryParams.append('shipping_status', params.shipping_status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
    return apiRequest<any[]>(endpoint);
  },

  async getOrderById(id: string) {
    return apiRequest<any>(`/orders/${id}`);
  },

  async updateOrder(id: string, data: Partial<any>) {
    return apiRequest<any>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Auction closure endpoints
  async closeAuction(id: string) {
    return apiRequest<any>(`/auctions/${id}/close`, {
      method: 'POST',
    });
  },

  async closeExpiredAuctions() {
    return apiRequest<any>('/auctions/close-expired', {
      method: 'POST',
    });
  },

  // Workflow endpoints
  async getAuctionsByWorkflow(params?: {
    workflow_state?: string;
    role?: 'seller' | 'buyer';
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.workflow_state) queryParams.append('workflow_state', params.workflow_state);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/auctions/workflow?${queryString}` : '/auctions/workflow';
    try {
      const response = await apiRequest<any>(endpoint);
      // Handle both array and object with data property
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else if (response && response.data) {
        return [response.data];
      }
      return [];
    } catch (error) {
      console.error('getAuctionsByWorkflow error:', error);
      throw error;
    }
  },

  async updateWorkflowState(auctionId: string, workflowState: string) {
    return apiRequest<any>(`/auctions/${auctionId}/workflow-state`, {
      method: 'PUT',
      body: JSON.stringify({ workflow_state: workflowState }),
      requireAuth: true,
    });
  },

  // Dispute endpoints
  async getDisputes(params?: {
    auction_id?: string;
    order_id?: string;
    status?: string;
    filed_by?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.auction_id) queryParams.append('auction_id', params.auction_id);
    if (params?.order_id) queryParams.append('order_id', params.order_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.filed_by) queryParams.append('filed_by', params.filed_by);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/disputes?${queryString}` : '/disputes';
    try {
      const response = await apiRequest<any[]>(endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('getDisputes error:', error);
      throw error;
    }
  },

  async getDisputeById(id: string) {
    return apiRequest<any>(`/disputes/${id}`);
  },

  async createDispute(data: {
    auction_id: string;
    order_id?: string;
    reason: string;
    filed_by_role: 'seller' | 'buyer';
  }) {
    return apiRequest<any>('/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  async updateDispute(id: string, data: Partial<{
    status: string;
    resolution: string;
  }>) {
    return apiRequest<any>(`/disputes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  },

  async resolveDispute(id: string, resolution: string) {
    return apiRequest<any>(`/disputes/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution, status: 'resolved' }),
      requireAuth: true,
    });
  },
};

export default api;

